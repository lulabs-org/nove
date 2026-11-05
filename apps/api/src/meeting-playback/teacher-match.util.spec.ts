import { hostMatchesTeacher } from './teacher-match.util';

describe('hostMatchesTeacher', () => {
  it('matches a teacher title to the same host and a longer name', () => {
    expect(hostMatchesTeacher('张老师', '张老师')).toBe(true);
    expect(hostMatchesTeacher('张伟', '张老师')).toBe(true);
    expect(hostMatchesTeacher('张伟老师', '张老师')).toBe(true);
  });

  it('does not match a different teacher or a name that only contains the character', () => {
    expect(hostMatchesTeacher('叶老师', '张老师')).toBe(false);
    expect(hostMatchesTeacher('李张', '张老师')).toBe(false);
    expect(hostMatchesTeacher('小张', '张老师')).toBe(false);
  });

  it('keeps a two-character teacher name from matching another surname', () => {
    expect(hostMatchesTeacher('张三', '张三老师')).toBe(true);
    expect(hostMatchesTeacher('张伟', '张三老师')).toBe(false);
  });
});
