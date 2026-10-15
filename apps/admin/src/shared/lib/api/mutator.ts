/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:30:08
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @FilePath: /nove-admin/src/shared/lib/api/mutator.ts
 * @Description: Orval 自定义 Axios 实例与请求客户端 (合并自 http 与 mutator)
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { authService } from '../../../features/auth/api/service';
import { getDeviceId, getDeviceInfo } from '../../../features/auth/model/device';

/* -------------------------------------------------------------------------- */
/*                                1. 类型定义                                  */
/* -------------------------------------------------------------------------- */

export type RetryableRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

export type RefreshTokenResponse = {
  accessToken?: string;
};

/* -------------------------------------------------------------------------- */
/*                                2. 常量配置                                  */
/* -------------------------------------------------------------------------- */

export const REQUEST_TIMEOUT = 15000;
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
export const AUTH_UNAUTHORIZED_EVENT = 'auth-unauthorized';

export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh-token',
} as const;

const PUBLIC_AUTH_PATHS: readonly string[] = Object.values(AUTH_ENDPOINTS);

/* -------------------------------------------------------------------------- */
/*                                3. 辅助函数                                  */
/* -------------------------------------------------------------------------- */

/**
 * 生成全局唯一的请求追踪 ID，优先使用 crypto.randomUUID，非安全上下文回退到随机字符串
 */
function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 判断当前请求是否属于公开认证接口（无需附加 Token 或无需 401 自动重试）
 */
export function isPublicAuthRequest(config?: RetryableRequestConfig): boolean {
  const url = config?.url ?? '';
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

/**
 * 统一设置 Authorization 请求头
 */
function setAuthorizationHeader(config: RetryableRequestConfig, token: string): void {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
}

let isNotifyingUnauthorized = false;

/**
 * 集中触发未授权认证失效逻辑，并防止高频并发请求造成重复事件风暴
 */
function notifyUnauthorized(): void {
  authService.removeToken();

  if (typeof window === 'undefined' || isNotifyingUnauthorized) {
    return;
  }

  isNotifyingUnauthorized = true;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));

  setTimeout(() => {
    isNotifyingUnauthorized = false;
  }, 1000);
}

/* -------------------------------------------------------------------------- */
/*                                4. HTTP 客户端                               */
/* -------------------------------------------------------------------------- */

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/*                                5. Token 刷新机制                           */
/* -------------------------------------------------------------------------- */

let refreshPromise: Promise<string> | null = null;

/**
 * 单例互斥刷新 AccessToken，确保并发 401 时仅发起一次刷新网络请求
 */
function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = http
      .post<RefreshTokenResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        clientType: 'web',
        deviceId: getDeviceId(),
        deviceInfo: getDeviceInfo(),
      })
      .then((response) => {
        const { accessToken } = response.data;

        if (!accessToken) {
          throw new Error('刷新令牌响应缺少 accessToken');
        }

        authService.setToken(accessToken);
        return accessToken;
      })
      .catch((error) => {
        notifyUnauthorized();
        return Promise.reject(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/* -------------------------------------------------------------------------- */
/*                                6. 拦截器配置                                */
/* -------------------------------------------------------------------------- */

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 非公开接口自动注入 Token
    if (!isPublicAuthRequest(config)) {
      const token = authService.getToken();
      if (token) {
        setAuthorizationHeader(config, token);
      }
    }

    // 注入请求追踪 ID（保留调用方显式指定的 ID）
    config.headers = config.headers ?? {};
    if (!config.headers.get('x-request-id')) {
      config.headers['x-request-id'] = generateRequestId();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 忽略用户或组件卸载引起的主动取消请求
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as RetryableRequestConfig | undefined;

    // 401 未授权处理
    if (axiosError.response?.status === 401 && !isPublicAuthRequest(originalRequest)) {
      // 首次 401：尝试刷新 Token 并重试请求
      if (originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const accessToken = await refreshAccessToken();
          setAuthorizationHeader(originalRequest, accessToken);
          return http(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // 重试后依然 401，说明凭证确实已失效，广播登出事件
      notifyUnauthorized();
      return Promise.reject(error);
    }

    // 403 权限不足提示
    if (axiosError.response?.status === 403) {
      message.error('您没有权限执行此操作');
    }

    // 5xx 服务端异常统一提示与日志追踪
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      message.error('服务器错误，请稍后重试');
      console.error('[Server Error]', {
        url: axiosError.config?.url,
        method: axiosError.config?.method?.toUpperCase(),
        status: axiosError.response.status,
        requestId: axiosError.config?.headers?.['x-request-id'],
        message: axiosError.message,
      });
    }

    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/*                                7. 请求适配器                                 */
/* -------------------------------------------------------------------------- */

/**
 * Orval 自定义 Axios 请求适配器 (遵循 Orval 官方规范)
 * 支持第二参数 options 透传，统一解包返回 response.data
 */
export const mutator = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return http({
    ...config,
    ...options,
  }).then(({ data }) => data);
};

// 供 Orval 及 React Query 推断精确类型
export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
