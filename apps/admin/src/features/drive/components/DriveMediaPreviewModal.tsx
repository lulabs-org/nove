import Modal from 'antd/es/modal';
import { DriveMediaPreview } from './DriveMediaPreview';
import { resolvePreviewKind } from '../lib/drivePreview';
import type { DriveNode } from '../model/types';
import './DriveMediaPreviewModal.css';

export interface DriveMediaPreviewModalProps {
  node: DriveNode | null;
  onClose: () => void;
}

export function DriveMediaPreviewModal({ node, onClose }: DriveMediaPreviewModalProps) {
  const kind = resolvePreviewKind(node?.contentType, node?.name);
  // 视频与文档需要更宽的可视区域，图片窄一些观感更好
  const width = kind === 'video' ? 880 : kind === 'pdf' || kind === 'docx' ? 960 : 760;

  return (
    <Modal
      open={Boolean(node)}
      title={node?.name}
      footer={null}
      width={width}
      onCancel={onClose}
      className="drive-preview-modal"
      centered
      // 关闭即销毁，避免残留的错误态影响下一个文件的预览
      destroyOnHidden
    >
      {/* 以 node.id 作 key，切换文件时重置面板内部的失败状态 */}
      <DriveMediaPreview key={node?.id ?? 'empty'} node={node} />
    </Modal>
  );
}
