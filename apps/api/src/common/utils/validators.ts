/**
 * 校验邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 校验中国大陆手机号（简单校验）
 */
export function isValidCnPhone(phone: string): boolean {
  const phoneRegex = /^[1-9]\d{10}$/;
  return phoneRegex.test(phone);
}

/**
 * 校验密码强度：至少包含1个小写字母、1个大写字母、1个数字
 * 不负责长度校验（长度可在业务层单独处理）
 */
export function isStrongPassword(password: string): boolean {
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
}
