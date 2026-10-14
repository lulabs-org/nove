import axios from 'axios';

type ApiErrorBody = {
  message?: string | string[];
};

export function getLoginErrorMessage(error: unknown): string | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return '登录失败，请稍后重试';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return '登录请求超时，请稍后重试';
  }

  if (!error.response) {
    return '无法连接服务器，请检查网络或稍后重试';
  }

  if (error.response.status >= 500) {
    return null;
  }

  const apiMessage = error.response.data?.message;
  if (Array.isArray(apiMessage)) {
    return apiMessage.join('；');
  }
  if (apiMessage) {
    return apiMessage;
  }

  if (error.response.status === 401) {
    return '用户名或密码错误';
  }
  if (error.response.status === 429) {
    return '登录尝试过于频繁，请稍后再试';
  }

  return '登录失败，请稍后重试';
}
