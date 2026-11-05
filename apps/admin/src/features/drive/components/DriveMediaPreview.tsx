import { useQuery } from '@tanstack/react-query';
import FileViewer from '@file-viewer/react';
import officePreset from '@file-viewer/preset-office';
import Spin from 'antd/es/spin';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { driveApi } from '../api/driveApi';
import {
  DRIVE_PREVIEW_URL_QUERY_KEY,
  pickInlinePreviewUrl,
  resolvePreviewKind,
} from '../lib/drivePreview';
import type { PreviewKind } from '../lib/drivePreview';
import type { DriveNode } from '../model/types';
import './DriveMediaPreview.css';

/**
 * 预览失败时的提示文案。
 * 四类预览都是先向接口要一个 inline 签名地址，取地址失败（无权限、格式不支持等）
 * 的原因由接口给出，优先透出；地址拿到后的渲染失败只能靠元素自身报错，
 * 拿不到接口文案，只能给通用提示。
 */
function previewErrorText(error: unknown, kind: PreviewKind | null): string {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
  }
  if (kind === 'pdf' || kind === 'docx') return '文档预览失败，可下载后查看';
  return '媒体预览加载失败，请稍后重试';
}

export interface DriveMediaPreviewProps {
  node: DriveNode | null;
}

/**
 * 图片 / 视频 / PDF / Word 文档在线预览面板。
 * 图片、视频和 PDF 直接用 inline 签名地址交给浏览器内联渲染；
 * docx 由 @file-viewer/react 在浏览器本地拉取并解析，内容不经过第三方服务；
 * 原文件只被读取、不被修改，任何情况下都不做页面跳转（跳转只属于显式下载）。
 * 调用方在切换 node 时请传入 key（如 key={node.id}），以便重置失败态。
 */
export function DriveMediaPreview({ node }: DriveMediaPreviewProps) {
  const [mediaFailed, setMediaFailed] = useState(false);
  const fileId = node?.fileId ?? null;
  const kind = resolvePreviewKind(node?.contentType, node?.name);
  const isDocument = kind === 'docx';

  const query = useQuery({
    queryKey: [DRIVE_PREVIEW_URL_QUERY_KEY, fileId],
    enabled: Boolean(fileId) && Boolean(kind),
    // 后端签名有效期 10 分钟，这里取 8 分钟，避免复用已过期的地址
    staleTime: 8 * 60 * 1000,
    queryFn: () => driveApi.createPreviewUrl(fileId!),
  });

  if (!kind) {
    return <span className="drive-preview-hint">该格式暂不支持在线预览，可下载后查看</span>;
  }

  // 预览只接受 inline 地址：若错拿到 attachment（用错接口或后端规则漂移），
  // 宁可提示失败也不能把用户带进一次下载跳转
  const url = pickInlinePreviewUrl(query.data);
  const dispositionRejected = Boolean(query.data) && !url;
  const failed = query.isError || mediaFailed || dispositionRejected;
  const viewerUrl = !query.isLoading && !failed ? url : null;
  // 只有真正在渲染文档时才切到定高容器；加载中与错误态仍走外层的居中布局
  const showingDocument = isDocument && Boolean(viewerUrl);

  return (
    <div
      className={
        showingDocument ? 'drive-preview-body drive-preview-body--document' : 'drive-preview-body'
      }
    >
      {query.isLoading && (
        <div className="drive-preview-loading">
          <Spin />
          {isDocument && <span className="drive-preview-hint">正在本地解析文档，请稍候…</span>}
        </div>
      )}
      {!query.isLoading && failed && (
        <span className="drive-preview-error">
          {dispositionRejected
            ? '预览地址不可用，可重新打开预览或下载后查看'
            : previewErrorText(query.error, kind)}
        </span>
      )}
      {!query.isLoading && !failed && viewerUrl && kind === 'image' && (
        <img
          className="drive-preview-image"
          src={viewerUrl}
          alt={node?.name ?? '图片预览'}
          onError={() => setMediaFailed(true)}
        />
      )}
      {!query.isLoading && !failed && viewerUrl && kind === 'video' && (
        <video
          className="drive-preview-video"
          src={viewerUrl}
          controls
          onError={() => setMediaFailed(true)}
        />
      )}
      {!query.isLoading && !failed && viewerUrl && kind === 'pdf' && (
        // pdf 由浏览器内联渲染，直接内嵌签名地址，不经过任何第三方服务
        <iframe className="drive-preview-pdf" src={viewerUrl} title={node?.name ?? 'PDF 预览'} />
      )}
      {!query.isLoading && !failed && viewerUrl && kind === 'docx' && (
        // docx 交给 @file-viewer 在浏览器本地渲染（officePreset 提供 Word 能力），
        // 不走微软 Office Web Viewer，私有化 / 内网部署同样可用。
        // 组件自带内联 height:100%，容器高度必须由 drive-preview-body--document 确定为定值，
        // 否则宿主会按内容撑高并被 flex 居中顶出可视区（详见 CSS 注释）
        <FileViewer
          className="drive-preview-docx"
          url={viewerUrl}
          filename={node?.name}
          options={{ preset: officePreset, rendererMode: 'replace' }}
        />
      )}
    </div>
  );
}
