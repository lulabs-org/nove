import { describe, it, expect } from 'vitest';

describe('Example Vitest Test', () => {
  it('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });

  it('should check if string contains substring', () => {
    const text = 'Hello World';
    expect(text).toContain('World');
  });
});
