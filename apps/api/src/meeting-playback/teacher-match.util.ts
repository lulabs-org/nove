export function teacherKey(name: string): string {
  const compact = name.trim().replace(/\s+/g, '');
  return compact.endsWith('老师') ? compact.slice(0, -2) : compact;
}

export function hostMatchesTeacher(
  hostName: string | null | undefined,
  teacher: string,
): boolean {
  if (!hostName) return false;

  const host = hostName.trim().replace(/\s+/g, '');
  const requested = teacher.trim().replace(/\s+/g, '');
  const key = teacherKey(requested);
  if (!host || !key) return false;

  const hostKey = teacherKey(host);
  if (host === requested || hostKey === key) return true;
  return host.startsWith(key) || hostKey.startsWith(key);
}
