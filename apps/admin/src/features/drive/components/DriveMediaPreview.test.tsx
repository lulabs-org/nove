import { describe, expect, it } from 'vitest';
import { pickInlinePreviewUrl, resolvePreviewKind } from '../lib/drivePreview';

const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

describe('resolvePreviewKind', () => {
  it('resolves image, video and PDF content types', () => {
    expect(resolvePreviewKind('image/png', 'photo.png')).toBe('image');
    expect(resolvePreviewKind('video/mp4', 'clip.mp4')).toBe('video');
    expect(resolvePreviewKind('application/pdf', 'report.pdf')).toBe('pdf');
  });

  it('resolves docx by content type or file extension', () => {
    expect(resolvePreviewKind(DOCX_CONTENT_TYPE, 'invoice.docx')).toBe('docx');
    expect(resolvePreviewKind(null, 'invoice.docx')).toBe('docx');
    expect(resolvePreviewKind(undefined, 'INVOICE.DOCX')).toBe('docx');
  });

  it('returns null for unsupported formats', () => {
    expect(resolvePreviewKind(null, null)).toBeNull();
    expect(resolvePreviewKind('', 'sheet.xlsx')).toBeNull();
    expect(resolvePreviewKind('application/vnd.ms-excel', 'legacy.xls')).toBeNull();
  });

  it('does not fall back to the extension for PDF, matching the backend whitelist', () => {
    expect(resolvePreviewKind(null, 'report.pdf')).toBeNull();
  });
});

describe('pickInlinePreviewUrl', () => {
  it('accepts the inline signed url used by preview', () => {
    expect(
      pickInlinePreviewUrl({
        url: 'https://signed.example.com/report.pdf?signature=1',
        expiresInSeconds: 600,
        contentDisposition: 'inline',
      })
    ).toBe('https://signed.example.com/report.pdf?signature=1');
  });

  it('rejects attachment urls so preview never turns into a download', () => {
    expect(
      pickInlinePreviewUrl({
        url: 'https://signed.example.com/report.pdf?signature=1',
        expiresInSeconds: 600,
        contentDisposition: 'attachment',
      })
    ).toBeNull();
  });

  it('returns null before the signed url is available', () => {
    expect(pickInlinePreviewUrl(undefined)).toBeNull();
    expect(pickInlinePreviewUrl(null)).toBeNull();
  });
});
