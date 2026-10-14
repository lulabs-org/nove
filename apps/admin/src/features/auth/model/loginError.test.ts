import { describe, expect, it } from 'vitest';
import { getLoginErrorMessage } from './loginError';

function axiosError(options: { code?: string; status?: number; message?: string | string[] }) {
  const response =
    options.status === undefined
      ? undefined
      : {
          status: options.status,
          data: options.message === undefined ? {} : { message: options.message },
        };

  return {
    isAxiosError: true,
    code: options.code,
    response,
  };
}

describe('login error messages', () => {
  it('surfaces safe backend messages', () => {
    expect(getLoginErrorMessage(axiosError({ status: 401, message: '用户名或密码错误' }))).toBe(
      '用户名或密码错误'
    );
    expect(
      getLoginErrorMessage(axiosError({ status: 429, message: '登录失败次数过多，请15分钟后再试' }))
    ).toBe('登录失败次数过多，请15分钟后再试');
  });

  it('joins validation messages', () => {
    expect(
      getLoginErrorMessage(axiosError({ status: 400, message: ['邮箱格式不正确', '密码不能为空'] }))
    ).toBe('邮箱格式不正确；密码不能为空');
  });

  it('distinguishes timeout and connection failures', () => {
    expect(getLoginErrorMessage(axiosError({ code: 'ECONNABORTED' }))).toBe(
      '登录请求超时，请稍后重试'
    );
    expect(getLoginErrorMessage(axiosError({}))).toBe('无法连接服务器，请检查网络或稍后重试');
  });

  it('does not duplicate the global server-error message', () => {
    expect(
      getLoginErrorMessage(axiosError({ status: 500, message: 'internal detail' }))
    ).toBeNull();
  });

  it('falls back for unknown errors', () => {
    expect(getLoginErrorMessage(new Error('unexpected'))).toBe('登录失败，请稍后重试');
    expect(getLoginErrorMessage(axiosError({ status: 401 }))).toBe('用户名或密码错误');
  });
});
