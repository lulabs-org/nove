export interface TextSelection {
  start: number;
  end: number;
}

function isInsideJsonString(text: string, position: number): boolean {
  let inside = false;
  let escaped = false;
  for (let index = 0; index < position; index++) {
    const character = text[index];
    if (escaped) {
      escaped = false;
    } else if (character === '\\' && inside) {
      escaped = true;
    } else if (character === '"') {
      inside = !inside;
    }
  }
  return inside;
}

export function insertJsonVariable(
  text: string,
  selection: TextSelection,
  variable: string
): { text: string; cursor: number } {
  const start = Math.max(0, Math.min(selection.start, text.length));
  const end = Math.max(start, Math.min(selection.end, text.length));
  const token = isInsideJsonString(text, start) ? variable : JSON.stringify(variable);
  return {
    text: `${text.slice(0, start)}${token}${text.slice(end)}`,
    cursor: start + token.length,
  };
}
