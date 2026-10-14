/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2026-01-07 07:30:35
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2026-01-07 21:44:30
 * @FilePath: /nove-admin/orval.config.ts
 * @Description:
 *
 * Copyright (c) 2026 by LuLab-Team, All Rights Reserved.
 */

import { defineConfig } from 'orval';
import { config } from 'dotenv';

config({ quiet: true });

export const clientConfig = {
  noveApi: {
    input: {
      target: process.env.ORVAL_API_TARGET || './openapi.snapshot.json',
    },
    output: {
      mode: 'tags' as const,
      target: 'src/shared/lib/api/orval/business/index.ts',
      schemas: 'src/shared/lib/api/orval/business/schemas',
      client: 'react-query' as const,
      prettier: true,
      override: {
        mutator: {
          path: 'src/shared/lib/api/mutator.ts',
          name: 'mutator',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
};

export default defineConfig(clientConfig);
