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
import { getDeviceId, getDeviceInfo } from '../../../features/auth/model/device';
import { isTokenExpiringSoon } from '../../../features/auth/model/jwt';
import {
  getAccessToken,
  getSessionEpoch,
  isCurrentSession,
  isSessionChangedError,
  refreshSession,
  removeSession,
} from '../../../features/auth/model/session';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** 请求发起时的会话编号；调用方自带 Authorization 的请求不记录 */
    sessionEpoch?: number;
  }
}

/* -------------------------------------------------------------------------- */
/*                                1. 常量配置                                  */
/* -------------------------------------------------------------------------- */

const REQUEST_TIMEOUT = 15000;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh-token',
} as const;

const PUBLIC_AUTH_PATHS: readonly string[] = Object.values(AUTH_ENDPOINTS);

/* -------------------------------------------------------------------------- */
/*                                2. 辅助函数                                  */
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
function isPublicAuthRequest(config?: AxiosRequestConfig): boolean {
  const url = config?.url ?? '';
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
}

/**
 * 统一设置 Authorization 请求头
 */
function setAuthorizationHeader(config: AxiosRequestConfig, token: string): void {
  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
}

/**
 * 结束请求发起时所属的会话；会话已变化（例如已切换账号）时忽略，避免误伤新会话
 */
function endSessionIfCurrent(epoch: number | undefined): void {
  if (epoch !== undefined && isCurrentSession(epoch)) {
    removeSession();
  }
}

/**
 * 网络中断或超时（没有收到响应）属于可重试错误，不应因此退出登录
 */
function isRetryableNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response && !axios.isCancel(error);
}

/* -------------------------------------------------------------------------- */
/*                                3. HTTP 客户端                               */
/* -------------------------------------------------------------------------- */

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/*                                4. Token 刷新机制                           */
/* -------------------------------------------------------------------------- */

/**
 * 通过会话内核刷新 AccessToken（同标签页去重、跨标签页互斥）
 */
function refreshAccessToken(): Promise<string> {
  return refreshSession(async () => {
    const response = await http.post<{ accessToken?: string }>(AUTH_ENDPOINTS.REFRESH_TOKEN, {
      clientType: 'web',
      deviceId: getDeviceId(),
      deviceInfo: getDeviceInfo(),
    });
    const { accessToken } = response.data;

    if (!accessToken) {
      throw new Error('刷新令牌响应缺少 accessToken');
    }

    return accessToken;
  });
}

/* -------------------------------------------------------------------------- */
/*                                5. 拦截器配置                                */
/* -------------------------------------------------------------------------- */

// 请求拦截器：主动前置续期（Token 即将过期时静默换票）
http.interceptors.request.use(
  async (config) => {
    // 非公开接口自动注入 Token（并在即将过期时主动静默换票）
    // 调用方显式携带 Authorization（例如登录后用新 token 拉取用户）时不做处理
    if (!isPublicAuthRequest(config) && !config.headers?.has('Authorization')) {
      const sessionEpoch = getSessionEpoch();
      let token = getAccessToken();

      if (token && isTokenExpiringSoon(token)) {
        try {
          token = await refreshAccessToken();
        } catch (error) {
          if (!isSessionChangedError(error) && !isRetryableNetworkError(error)) {
            endSessionIfCurrent(sessionEpoch);
          }
          return Promise.reject(error instanceof Error ? error : new Error('Token refresh failed'));
        }
      }

      if (token) {
        config.sessionEpoch = sessionEpoch;
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

// 响应拦截器：纯净的全局 UI 异常通知与未授权登出
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // 忽略用户或组件卸载引起的主动取消请求
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const axiosError = error as AxiosError;

    // 401 未授权处理（非公开接口直接触发登出，无需重试）
    if (axiosError.response?.status === 401 && !isPublicAuthRequest(axiosError.config)) {
      endSessionIfCurrent(axiosError.config?.sessionEpoch);
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
/*                                6. 请求适配器                                 */
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
