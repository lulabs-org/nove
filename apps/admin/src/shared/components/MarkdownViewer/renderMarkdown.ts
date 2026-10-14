import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function renderMarkdown(content: string): string {
  if (!content) return '';
  return DOMPurify.sanitize(
    marked.parse(content, {
      gfm: true,
      breaks: true,
    }) as string
  );
}
