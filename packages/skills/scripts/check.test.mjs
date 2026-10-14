import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { checkSkills } from './check.mjs';

function fixture(t, files) {
  const root = mkdtempSync(resolve(tmpdir(), 'nove-skills-check-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(resolve(root, path, '..'), { recursive: true });
    writeFileSync(resolve(root, path), text);
  }
  return root;
}
const skill = (name, body = '', description = 'Example skill') =>
  `---\nname: ${name}\ndescription: ${description}\n---\n${body}`;

test('accepts folded YAML and linked references after a skill is copied to an installation directory', (t) => {
  const root = fixture(t, {
    'sample/SKILL.md': skill(
      'sample',
      '[Guide](references/guide.md#usage)',
      '>\n  First line\n  second line',
    ),
    'sample/references/guide.md':
      '[Back](../SKILL.md)\n[External](https://example.invalid)\n',
  });
  assert.deepEqual(checkSkills(root), { skills: 1, errors: [] });
});
test('rejects missing descriptions and malformed YAML', (t) => {
  const root = fixture(t, {
    'missing/SKILL.md': '---\nname: missing\n---\n',
    'broken/SKILL.md': '---\nname: [\n---\n',
  });
  const { errors } = checkSkills(root);
  assert.equal(errors.length, 2);
  assert.ok(errors.some((error) => error.includes('description')));
});
test('rejects duplicate names and names that differ from their directories', (t) => {
  const root = fixture(t, {
    'one/SKILL.md': skill('one'),
    'two/SKILL.md': skill('one'),
  });
  const { errors } = checkSkills(root);
  assert.ok(errors.some((error) => error.includes('duplicate name')));
  assert.ok(errors.some((error) => error.includes('match directory')));
});
test('checks links in reference documents and ignores code examples', (t) => {
  const root = fixture(t, {
    'sample/SKILL.md': skill(
      'sample',
      '```md\n[Example](not-a-real-file.md)\n```\n[Guide](references/guide.md)',
    ),
    'sample/references/guide.md': '[Missing](missing.md)',
  });
  const { errors } = checkSkills(root);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /missing relative link missing.md/);
});
test('rejects empty packages and skill directories missing their entrypoint', (t) => {
  const empty = fixture(t, {});
  assert.match(checkSkills(empty).errors[0], /No skill directories/);
  const missing = fixture(t, { 'sample/README.md': '# Missing entrypoint' });
  assert.match(checkSkills(missing).errors[0], /missing SKILL.md/);
});
