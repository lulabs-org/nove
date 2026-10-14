/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:29:39
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-24 09:09:58
 * @FilePath: /nove_project/nove-admin/src/shared/lib/api/http.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { authService } from '../../../features/auth/api/service';
import { getDeviceId, getDeviceInfo } from '../../../features/auth/model/device';

type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshTokenResponse = {
  accessToken?: string;
};

let refreshPromise: Promise<string> | null = null;

function setAuthorizationHeader(config: RetryableRequestConfig, token: string) {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
}

function isPublicAuthRequest(config: RetryableRequestConfig) {
  const url = config.url ?? '';

  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/reset-password') ||
    url.includes('/api/auth/refresh-token')
  );
}

function refreshAccessToken() {
  refreshPromise ??= axios
    .post<RefreshTokenResponse>(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
      {
        clientType: 'web',
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
      },
      { withCredentials: true }
    )
    .then((response) => {
      const { accessToken } = response.data;

      if (!accessToken) {
        throw new Error('刷新令牌响应缺少 accessToken');
      }

      authService.setToken(accessToken);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
});

http.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['x-request-id'] = crypto.randomUUID();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as RetryableRequestConfig | undefined;

    if (
      axiosError.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthRequest(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();
        setAuthorizationHeader(originalRequest, accessToken);
        return http(originalRequest);
      } catch (refreshError) {
        authService.removeToken();
        window.dispatchEvent(new Event('auth-unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    if (axiosError.response?.status === 403) {
      message.error('您没有权限执行此操作');
    }

    if (axiosError.response?.status && axiosError.response.status >= 500) {
      message.error('服务器错误，请稍后重试');
      console.error('[Server Error]', {
        url: axiosError.config?.url,
        method: axiosError.config?.method,
        status: axiosError.response.status,
        requestId: axiosError.config?.headers?.['x-request-id'],
        message: axiosError.message,
      });
    }

    return Promise.reject(error);
  }
);
