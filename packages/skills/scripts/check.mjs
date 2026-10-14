import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

export function checkSkills(root = packageRoot) {
  const errors = [];
  const names = new Set();
  const skills = readdirSync(root, { withFileTypes: true }).filter(
    (entry) =>
      entry.isDirectory() &&
      !['node_modules', 'scripts'].includes(entry.name) &&
      !entry.name.startsWith('.'),
  );
  if (!skills.length) errors.push('No skill directories found');
  for (const entry of skills) {
    const directory = resolve(root, entry.name);
    const file = resolve(directory, 'SKILL.md');
    if (!existsSync(file)) {
      errors.push(`${entry.name}: missing SKILL.md`);
      continue;
    }
    const content = readFileSync(file, 'utf8');
    const header = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    try {
      if (!header) throw new Error('missing YAML frontmatter');
      const metadata = parse(header[1]);
      if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
        throw new Error('frontmatter must be a mapping');
      for (const key of ['name', 'description']) {
        if (typeof metadata[key] !== 'string' || !metadata[key].trim())
          errors.push(`${entry.name}: missing or invalid ${key}`);
      }
      if (typeof metadata.name === 'string') {
        if (
          !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) ||
          metadata.name.length > 64
        )
          errors.push(`${entry.name}: invalid skill name`);
        if (metadata.name !== entry.name)
          errors.push(`${entry.name}: name must match directory`);
        if (names.has(metadata.name))
          errors.push(`${entry.name}: duplicate name ${metadata.name}`);
        names.add(metadata.name);
      }
    } catch (error) {
      errors.push(`${entry.name}: ${error.message}`);
    }
    for (const markdown of markdownFiles(directory)) {
      // Validate inline relative Markdown links, ignoring examples in fenced code.
      const text = readFileSync(markdown, 'utf8').replace(
        /^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm,
        '',
      );
      for (const match of text.matchAll(
        /\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+"[^"]*")?\)/g,
      )) {
        const href = match[1];
        if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(href)) continue;
        try {
          const target = decodeURIComponent(href.split(/[?#]/)[0]);
          if (!existsSync(resolve(dirname(markdown), target)))
            errors.push(
              `${entry.name}/${basename(markdown)}: missing relative link ${href}`,
            );
        } catch {
          errors.push(
            `${entry.name}/${basename(markdown)}: invalid relative link ${href}`,
          );
        }
      }
    }
  }
  return { skills: skills.length, errors };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = checkSkills();
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      `Validated ${result.skills} skills: frontmatter, unique names, and relative inline links.`,
    );
  }
}
