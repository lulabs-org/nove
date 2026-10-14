import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { getScope } from './ci-scope.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function fixture() {
  const cwd = mkdtempSync(resolve(tmpdir(), 'nove-ci-scope-'));
  for (const name of [
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'turbo.json',
    'tsconfig.base.json',
    '.prettierrc',
    'apps/api/package.json',
    'apps/admin/package.json',
    'docs/package.json',
    'packages/skills/package.json',
  ]) {
    mkdirSync(dirname(resolve(cwd, name)), { recursive: true });
    copyFileSync(resolve(root, name), resolve(cwd, name));
  }
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '-b', 'main');
  git('config', 'user.email', 'scope-test@example.invalid');
  git('config', 'user.name', 'Scope Test');
  const commit = (file, content = 'changed') => {
    mkdirSync(dirname(resolve(cwd, file)), { recursive: true });
    writeFileSync(resolve(cwd, file), content);
    git('add', '.');
    git('commit', '-qm', 'fixture');
    return git('rev-parse', 'HEAD');
  };
  const base = commit('README.md', 'baseline');
  return {
    cwd,
    base,
    commit,
    cleanup: () => rmSync(cwd, { recursive: true, force: true }),
  };
}

for (const [file, api, admin, docs, skills = false] of [
  ['apps/api/src/example.ts', true, true, false],
  ['apps/admin/src/example.tsx', false, true, false],
  ['docs/guide.md', false, false, true],
  ['docs/developer/admin/guides/getting-started.md', false, false, true],
  ['packages/skills/meeting-summarization/SKILL.md', false, false, false, true],
  ['packages/skills/scripts/check.mjs', false, false, false, true],
  ['.github/workflows/ci.yml', true, true, true, true],
  ['Dockerfile', true, true, true, true],
]) {
  test(`affected scope: ${file}`, () => {
    const f = fixture();
    try {
      const scope = getScope({
        cwd: f.cwd,
        base: f.base,
        head: f.commit(file),
      });
      assert.equal(scope.api, api);
      assert.equal(scope.admin, admin);
      assert.equal(scope.tasks.includes('@nove/admin#test'), admin);
      assert.equal(scope.tasks.includes('@nove/docs#build'), docs);
      assert.equal(scope.tasks.includes('@nove/skills#lint'), skills);
      assert.equal(scope.tasks.includes('@nove/skills#test'), skills);
    } finally {
      f.cleanup();
    }
  });
}

test('PR range includes changes before the last commit, and unchanged ranges skip tasks', () => {
  const f = fixture();
  try {
    f.commit('apps/api/src/example.ts');
    const head = f.commit('docs/guide.md');
    assert.equal(getScope({ cwd: f.cwd, base: f.base, head }).api, true);
    assert.equal(getScope({ cwd: f.cwd, base: head, head }).work, false);
  } finally {
    f.cleanup();
  }
});

test('missing push history falls back to a full run', () => {
  const f = fixture();
  try {
    const scope = getScope({ cwd: f.cwd, base: '0'.repeat(40), head: f.base });
    assert.equal(scope.filter, '');
    assert.equal(scope.api, true);
    assert.equal(scope.admin, true);
    assert.equal(scope.tasks.includes('@nove/skills#lint'), true);
    assert.equal(scope.tasks.includes('@nove/skills#test'), true);
  } finally {
    f.cleanup();
  }
});
