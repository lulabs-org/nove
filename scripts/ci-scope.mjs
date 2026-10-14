import { appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tasks = ['lint', 'lint:prisma', 'format:check', 'test', 'build'];

export function getScope({ base, head, cwd = root }) {
  let filter;
  // A missing/initial-push base must validate everything, never silently skip CI.
  if (
    [base, head].every(
      (sha) => /^[a-f0-9]{40}$/.test(sha || '') && !/^0+$/.test(sha),
    )
  ) {
    try {
      const mergeBase = execFileSync('git', ['merge-base', base, head], {
        cwd,
        encoding: 'utf8',
      }).trim();
      filter = `--filter=...[${mergeBase}...${head}]`;
    } catch {
      // Shallow/missing history is a conservative full run.
    }
  }
  const readPlan = (extraFilters = []) =>
    JSON.parse(
      execFileSync(
        resolve(root, 'node_modules/.bin/turbo'),
        [
          'run',
          ...tasks,
          ...(filter ? [filter] : []),
          ...extraFilters,
          '--dry=json',
          '--skip-infer',
        ],
        { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      ),
    ).tasks.map((task) => task.taskId);
  let ids = readPlan();
  const api = ids.includes('@nove/api#test');
  // Admin consumes the API contract through task edges, not package imports.
  // Explicitly include the consumer: Git-range package filters alone miss it.
  if (filter && api) ids = readPlan(['--filter=@nove/admin']);
  return {
    filter: filter || '',
    work: ids.length > 0,
    api,
    includeAdmin: Boolean(filter && api),
    admin: ids.includes('@nove/admin#build'),
    tasks: ids,
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const scope = getScope({
    base: process.env.BASE_SHA,
    head: process.env.HEAD_SHA,
  });
  console.log(JSON.stringify(scope, null, 2));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(scope)
        .filter(([key]) => key !== 'tasks')
        .map(([key, value]) => `${key}=${value}\n`)
        .join(''),
    );
  }
}
