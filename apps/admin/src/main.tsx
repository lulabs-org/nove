/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 13:18:53
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 14:37:07
 * @FilePath: /nove-admin/src/main.tsx
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppProviders } from './app/providers/AppProviders';
import { useAuthStore } from './features/auth/model/authStore';

const initializeAuth = async () => {
  await useAuthStore.getState().initialize();
};

initializeAuth().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>
  );
});
