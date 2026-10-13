/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-09-23 06:15:34
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-01 19:25:45
 * @FilePath: /lulab_backend/src/auth/decorators/public.decorator.ts
 * @Description: 公共路由装饰器，用于标记路由为公共路由，无需认证即可访问
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
