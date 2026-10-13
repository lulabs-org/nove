export const TestConfig = {
  // 数据库配置
  database: {
    test: {
      url:
        process.env.DATABASE_URL_TEST ||
        'postgresql://localhost:5432/lulab_test',
      logging: false,
      synchronize: true,
      dropSchema: true,
    },
    integration: {
      url:
        process.env.DATABASE_URL_INTEGRATION ||
        'postgresql://localhost:5432/lulab_integration',
      logging: false,
      synchronize: true,
    },
  },

  // 外部服务配置
  externalServices: {
    tencentMeeting: {
      mock: true,
      baseUrl: 'https://api.tencentcloudapi.com',
      timeout: 10000,
    },
    lark: {
      mock: true,
      baseUrl: 'https://open.larksuite.com',
      timeout: 10000,
    },
    email: {
      mock: true,
      from: 'test@lulab.com',
    },
  },

  // 测试数据配置
  testData: {
    user: {
      defaultPassword: 'TestPass123!',
      defaultRole: 'USER',
    },
    meeting: {
      defaultDuration: 3600000, // 1小时
      maxParticipants: 100,
    },
  },

  // 性能配置
  performance: {
    maxResponseTime: 5000, // 5秒
    concurrentUsers: 10,
    loadTestDuration: 60000, // 1分钟
  },

  // 重试配置
  retry: {
    maxRetries: 3,
    delay: 1000,
    backoff: 'exponential',
  },

  // 清理配置
  cleanup: {
    enabled: true,
    timeout: 30000,
    strategies: ['database', 'files', 'cache'],
  },

  // 报告配置
  reporting: {
    enabled: true,
    formats: ['json', 'html'],
    outputDir: './test-reports',
  },
};
