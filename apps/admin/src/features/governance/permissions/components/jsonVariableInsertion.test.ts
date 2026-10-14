import { describe, expect, it } from 'vitest';
import { insertJsonVariable } from './jsonVariableInsertion';

describe('insertJsonVariable', () => {
  it('quotes a variable inserted outside a JSON string', () => {
    const source = '{"currentOwnerId": }';
    const position = source.indexOf('}');
    expect(insertJsonVariable(source, { start: position, end: position }, '${user.id}').text).toBe(
      '{"currentOwnerId": "${user.id}"}'
    );
  });

  it('does not add duplicate quotes inside a JSON string', () => {
    const source = '{"currentOwnerId": ""}';
    const position = source.lastIndexOf('"');
    expect(insertJsonVariable(source, { start: position, end: position }, '${user.id}').text).toBe(
      '{"currentOwnerId": "${user.id}"}'
    );
  });

  it('replaces the selected content and respects escaped quotes', () => {
    const source = '{"note": "a \\"quote\\"", "currentOwnerId": "old"}';
    const start = source.indexOf('old');
    expect(insertJsonVariable(source, { start, end: start + 3 }, '${user.id}').text).toBe(
      '{"note": "a \\"quote\\"", "currentOwnerId": "${user.id}"}'
    );
  });
});
