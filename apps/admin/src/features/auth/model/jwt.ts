/**
 * 浏览器端 JWT 载荷解析（仅读取，不做签名校验）
 */

interface JwtPayload {
  exp?: number;
  sub?: string;
}

/**
 * 解码 JWT Payload 载荷，无法解析时返回 null
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    const decoded = atob(base64);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 检查 JWT Token 是否即将过期（默认剩余不足 60 秒视为即将过期）
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds = 60): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  return payload.exp - Math.floor(Date.now() / 1000) <= thresholdSeconds;
}

/**
 * 读取 JWT 的 sub（用户 ID），无法解析时返回 undefined
 */
export function getTokenSubject(token: string): string | undefined {
  const sub = decodeJwtPayload(token)?.sub;
  return typeof sub === 'string' ? sub : undefined;
}
