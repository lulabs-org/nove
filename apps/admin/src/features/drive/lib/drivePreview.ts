export type PreviewKind = 'image' | 'video' | 'pdf' | 'docx';

const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_CONTENT_TYPE = 'application/pdf';

/**
 * `preview-url` 的统一 react-query 缓存键。
 * 云盘预览面板与项目封面取的是同一个签名地址，共用键才能复用缓存。
 */
export const DRIVE_PREVIEW_URL_QUERY_KEY = 'drive-preview-url';

/**
 * `preview-url` / `download-url` 的签名地址响应体，与后端 DriveService.createFileUrl 返回一致。
 * contentDisposition 由后端固定给出：预览为 inline，下载为 attachment。
 */
export interface DriveFileUrlResult {
  url: string;
  expiresInSeconds: number;
  contentDisposition: 'inline' | 'attachment';
}

/**
 * 预览面板只允许使用 inline 地址。
 *
 * 图片 / 视频 / PDF 由浏览器直接渲染，`.docx` 由 file-viewer 在本地拉取解析；
 * 三者都只把地址交给元素或 fetch，绝不做 `window.location` 跳转。
 * 一旦后端异常返回 attachment，继续渲染就会出现「点预览却触发下载」的行为，
 * 因此这里直接判定为不可用，由调用方展示错误提示。
 */
export function pickInlinePreviewUrl(result?: DriveFileUrlResult | null): string | null {
  if (!result) return null;
  return result.contentDisposition === 'inline' ? result.url : null;
}

/**
 * 根据 MIME 类型（必要时回退文件名后缀）判断可用的预览方式。
 *
 * 优先使用 contentType；上传链路允许 contentType 为空，此时只有 docx 能靠扩展名兜底识别，
 * 与后端 `isInlinePreviewable` / `isPreviewableDocx` 的规则保持一致（PDF 不兜底-渲染机制完全不同，
 * 因为缺少 contentType 时浏览器也无法内联渲染）。
 * 返回 null 表示该格式不在预览支持范围内，调用方应提示下载查看。
 * 本函数是「能否预览」的唯一判定来源，入口门禁与预览面板共用，避免两处规则漂移。
 */
export function resolvePreviewKind(
  contentType?: string | null,
  fileName?: string | null
): PreviewKind | null {
  if (contentType?.startsWith('image/')) return 'image';
  if (contentType?.startsWith('video/')) return 'video';
  if (contentType === PDF_CONTENT_TYPE) return 'pdf';
  if (contentType === DOCX_CONTENT_TYPE) return 'docx';
  if (!contentType && fileName?.toLowerCase().endsWith('.docx')) return 'docx';
  return null;
}
