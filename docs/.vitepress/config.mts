import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    ignoreDeadLinks: false,
    lang: 'zh-CN',
    title: 'Nove',
    description: 'Nove 统一文档 — 项目、API、Admin 与协作开发指南',

    head: [
      ['link', { rel: 'icon', href: '/logo-light.svg', type: 'image/svg+xml' }],
      ['meta', { name: 'theme-color', content: '#6366f1' }],
    ],

    lastUpdated: true,

    themeConfig: {
      logo: { light: '/logo-light.svg', dark: '/logo-dark.svg', alt: 'Nove' },

      siteTitle: 'Nove',

      nav: [
        { text: '首页', link: '/' },
        {
          text: '项目文档',
          link: '/project/',
          activeMatch: '^/project/',
        },
        {
          text: '工程指南',
          link: '/engineering/',
          activeMatch: '^/engineering/',
        },
        {
          text: 'API 开发',
          activeMatch: '^/developer/api/',
          items: [
            { text: '后端架构', link: '/developer/api/architecture/' },
            { text: '业务模块', link: '/developer/api/modules/' },
            { text: '第三方集成', link: '/developer/api/integrations/' },
            { text: '测试与发布', link: '/developer/api/guides/testing' },
            {
              text: '数据库与迁移',
              link: '/developer/api/guides/database/prisma-setup',
            },
            {
              text: '部署与运维',
              link: '/developer/api/guides/deployment/overview',
            },
          ],
        },
        {
          text: 'Admin 开发',
          link: '/developer/admin/guides/getting-started',
          activeMatch: '^/developer/admin/',
        },
        { text: '用户指南', link: '/user/', activeMatch: '^/user/' },
        {
          text: '规划与提案',
          link: '/roadmap/',
          activeMatch: '^/roadmap/',
        },
      ],

      sidebar: {
        '/project/': [
          {
            text: '项目总览',
            items: [
              { text: '项目文档', link: '/project/' },
              { text: '总览索引', link: '/project/guide/' },
              { text: '项目概述', link: '/project/guide/overview' },
              { text: '项目名称', link: '/project/guide/naming' },
              { text: '需求与范围', link: '/project/guide/requirements' },
              { text: '目标与成功指标', link: '/project/guide/goals' },
              { text: '组织与运营', link: '/project/guide/organization' },
              {
                text: '产品设计理念',
                link: '/project/guide/product-philosophy',
              },
              { text: '数据源接入矩阵', link: '/project/guide/data-sources' },
              { text: '能力状态总览', link: '/project/guide/capabilities' },
            ],
          },
          {
            text: '整体架构与方案',
            items: [
              { text: '架构索引', link: '/project/architecture/' },
              { text: '技术方案总览', link: '/project/architecture/overview' },
              {
                text: '系统架构图集',
                link: '/project/architecture/system-overview',
              },
              { text: '技术白皮书', link: '/project/architecture/whitepaper' },
              {
                text: '数据格式与扩展机制',
                link: '/project/architecture/data-format',
              },
            ],
          },
          {
            text: '权限安全与合作',
            items: [
              { text: '权限安全索引', link: '/project/security/' },
              {
                text: '人机统一权限体系',
                link: '/project/security/permission-system',
              },
              {
                text: '数据与隐私保护白皮书',
                link: '/project/security/privacy-whitepaper',
              },
              { text: '合作方索引', link: '/project/partners/' },
              { text: '陆向谦实验室', link: '/project/partners/lulabs' },
            ],
          },
          {
            text: '路线图与来源',
            items: [
              { text: '项目路线图', link: '/roadmap/project/' },
              {
                text: '文档迁移记录',
                link: '/engineering/migrations/nove-doc',
              },
              { text: '原仓库 README', link: '/project/source-readme' },
            ],
          },
        ],
        '/developer/admin/': [
          {
            text: 'Admin 开发指南',
            items: [
              {
                text: '快速开始',
                link: '/developer/admin/guides/getting-started',
              },
              {
                text: '开发工作流',
                link: '/developer/admin/guides/development-workflow',
              },
              {
                text: '新增业务模块',
                link: '/developer/admin/guides/adding-a-feature',
              },
              { text: '测试与质量', link: '/developer/admin/guides/testing' },
              { text: '部署', link: '/developer/admin/guides/deployment' },
            ],
          },
          {
            text: 'Admin 架构',
            items: [
              {
                text: '架构概览',
                link: '/developer/admin/architecture/overview',
              },
              {
                text: '路由、认证与权限',
                link: '/developer/admin/architecture/routing-auth-permissions',
              },
              {
                text: '数据访问与状态',
                link: '/developer/admin/architecture/data-access',
              },
            ],
          },
          {
            text: '业务模块',
            items: [
              { text: '模块地图', link: '/developer/admin/modules/' },
              {
                text: '组织与交易',
                link: '/developer/admin/modules/organization-and-transactions',
              },
              {
                text: '会议、报告与任务',
                link: '/developer/admin/modules/meetings-reports-tasks',
              },
              {
                text: '治理与设置',
                link: '/developer/admin/modules/governance-and-settings',
              },
            ],
          },
          {
            text: 'Admin 参考',
            items: [
              {
                text: '路由与权限表',
                link: '/developer/admin/reference/routes-and-permissions',
              },
              {
                text: '脚本与环境变量',
                link: '/developer/admin/reference/scripts-and-environment',
              },
            ],
          },
        ],

        '/developer/api/architecture/': [
          {
            text: 'API 后端架构',
            items: [
              { text: '架构索引', link: '/developer/api/architecture/' },
              {
                text: '安全架构与设计参考',
                link: '/developer/api/architecture/security',
              },
              {
                text: '后端运行时架构',
                link: '/developer/api/architecture/overview',
              },
              {
                text: '技术栈与基础设施',
                link: '/developer/api/architecture/tech-stack',
              },
              {
                text: '核心数据流转',
                link: '/developer/api/architecture/data-flow',
              },
              {
                text: '模块全景地图',
                link: '/developer/api/architecture/module-map',
              },
              {
                text: '工程目录结构',
                link: '/developer/api/architecture/project-structure',
              },
            ],
          },
        ],

        '/engineering/': [
          {
            text: '工作区与协作',
            items: [
              { text: '工程指南', link: '/engineering/' },
              {
                text: '同仓契约与交付流程',
                link: '/engineering/monorepo-delivery',
              },
              { text: '工作区脚本', link: '/engineering/scripts' },
              { text: 'Git 协作规范', link: '/engineering/git' },
              { text: '文档维护指南', link: '/engineering/documentation' },
            ],
          },
          {
            text: '迁移记录',
            items: [
              {
                text: 'Admin 工作区迁移',
                link: '/engineering/migrations/admin',
              },
              {
                text: '项目文档迁移',
                link: '/engineering/migrations/nove-doc',
              },
            ],
          },
        ],
        '/developer/api/guides/': [
          {
            text: 'API 测试与发布',
            items: [
              {
                text: 'NestJS 测试规范',
                link: '/developer/api/guides/testing',
              },
              {
                text: 'API 版本与发布',
                link: '/developer/api/guides/version-control',
              },
            ],
          },
          {
            text: '数据库',
            items: [
              {
                text: 'Prisma 配置与迁移',
                link: '/developer/api/guides/database/prisma-setup',
              },
              {
                text: '数据库开发规范',
                link: '/developer/api/guides/database/style-guide',
              },
            ],
          },
          {
            text: '部署与运维',
            items: [
              {
                text: '部署概览',
                link: '/developer/api/guides/deployment/overview',
              },
              {
                text: '生产部署',
                link: '/developer/api/guides/deployment/guide',
              },
            ],
          },
        ],

        '/developer/api/modules/': [
          {
            text: 'API 业务模块',
            items: [{ text: '模块全景索引', link: '/developer/api/modules/' }],
          },
          {
            text: '会议与 AI 纪要',
            collapsed: false,
            items: [
              {
                text: '会议核心 (Meeting)',
                link: '/developer/api/modules/meeting/overview',
              },
              {
                text: '会议组织归属基础',
                link: '/developer/api/modules/meeting/organization-foundation',
              },
              {
                text: '纪要与 AI 总结 (Minute)',
                link: '/developer/api/modules/meeting/minute',
              },
              {
                text: '追踪报告 (Tracking Report)',
                link: '/developer/api/modules/meeting/tracking-report',
              },
            ],
          },
          {
            text: '身份认证与权限 (IAM)',
            collapsed: false,
            items: [
              {
                text: '认证模块概述',
                link: '/developer/api/modules/iam/overview',
              },
              {
                text: '注册与邀请流程',
                link: '/developer/api/modules/iam/registration-flow',
              },
              {
                text: '登出实现机制',
                link: '/developer/api/modules/iam/logout-implementation',
              },
              {
                text: '联系方式换绑审计',
                link: '/developer/api/modules/iam/contact-change-audit',
              },
              {
                text: 'API Key 鉴权体系',
                link: '/developer/api/modules/iam/api-key',
              },
              {
                text: 'OAuth 客户端管理',
                link: '/developer/api/modules/iam/oauth',
              },
              {
                text: '组织与成员管理',
                link: '/developer/api/modules/iam/organization',
              },
            ],
          },
          {
            text: '智能体、项目与文件',
            collapsed: false,
            items: [
              {
                text: '系统技能 (Skill)',
                link: '/developer/api/modules/agent/skill',
              },
              {
                text: '多项目管理 (Project)',
                link: '/developer/api/modules/agent/project',
              },
              {
                text: '云盘与 Minute 文件',
                link: '/developer/api/modules/agent/drive',
              },
              {
                text: 'MCP 协议连接指南',
                link: '/developer/api/modules/agent/mcp',
              },
            ],
          },
          {
            text: '商业与交易结算',
            collapsed: false,
            items: [
              {
                text: '订单与支付结算',
                link: '/developer/api/modules/commerce/overview',
              },
            ],
          },
        ],

        '/developer/api/integrations/': [
          {
            text: 'API 集成与消息通道',
            items: [
              { text: '集成全景索引', link: '/developer/api/integrations/' },
            ],
          },
          {
            text: '服务集成中心',
            collapsed: false,
            items: [
              {
                text: '管理后台配置指南',
                link: '/developer/api/integrations/service-integrations',
              },
              {
                text: '服务集成后端架构',
                link: '/developer/api/integrations/architecture',
              },
            ],
          },
          {
            text: '协同办公平台',
            collapsed: false,
            items: [
              {
                text: '腾讯会议总览',
                link: '/developer/api/integrations/tencent-meeting/overview',
              },
              {
                text: '腾讯会议 Webhook',
                link: '/developer/api/integrations/tencent-meeting/webhook',
              },
              {
                text: '腾讯会议本地测试',
                link: '/developer/api/integrations/tencent-meeting/webhook-testing',
              },
              {
                text: '企业微信与 Hermes',
                link: '/developer/api/integrations/wecom/overview',
              },
              {
                text: '飞书集成总览',
                link: '/developer/api/integrations/lark/overview',
              },
              {
                text: '飞书 Webhook',
                link: '/developer/api/integrations/lark/webhook',
              },
            ],
          },
          {
            text: '邮件与短信',
            collapsed: false,
            items: [
              {
                text: '邮件通知服务 (Mail)',
                link: '/developer/api/integrations/messaging/mail',
              },
              {
                text: '短信基础服务 (SMS)',
                link: '/developer/api/integrations/messaging/sms',
              },
              {
                text: '阿里云短信接入',
                link: '/developer/api/integrations/messaging/aliyun-sms',
              },
            ],
          },
        ],

        '/roadmap/': [
          {
            text: '项目路线图（迁入方案）',
            items: [
              { text: '项目路线图索引', link: '/roadmap/project/' },
              { text: '实施路线图', link: '/roadmap/project/implementation' },
              {
                text: '三年技术与 AI 演进',
                link: '/roadmap/project/evolution',
              },
            ],
          },
          {
            text: '规划与提案（非当前能力）',
            items: [
              { text: '路线图索引', link: '/roadmap/' },
              {
                text: '项目愿景与里程碑',
                link: '/roadmap/project-goals',
              },
              {
                text: '多租户架构演进',
                link: '/roadmap/multi-tenant-architecture',
              },
              {
                text: '会议插件系统设计',
                link: '/roadmap/meeting-plugin-system',
              },
            ],
          },
        ],

        '/user/': [
          {
            text: '用户指南',
            items: [{ text: '文档总览', link: '/user/' }],
          },
          {
            text: '开始使用',
            collapsed: false,
            items: [
              { text: '快速开始', link: '/user/getting-started/quick-start' },
              {
                text: '系统操作指南',
                link: '/user/getting-started/user-guide',
              },
            ],
          },
          {
            text: 'API 接入',
            collapsed: false,
            items: [{ text: 'API 接口文档总览', link: '/user/api/' }],
          },
          {
            text: '帮助与支持',
            collapsed: false,
            items: [
              {
                text: '常见问题解答 (FAQ)',
                link: '/user/faq/common-questions',
              },
            ],
          },
        ],
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/lulabs-org/nove-api' },
      ],

      editLink: {
        pattern: 'https://github.com/lulabs-org/nove-api/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页',
      },

      footer: {
        message: '基于 MIT 协议发布',
        copyright: 'Copyright © 2024-2026 LuLab',
      },

      search: {
        provider: 'local',
        options: {
          locales: {
            root: {
              translations: {
                button: {
                  buttonText: '搜索文档',
                  buttonAriaLabel: '搜索文档',
                },
                modal: {
                  noResultsText: '无法找到相关结果',
                  resetButtonTitle: '清除查询条件',
                  footer: {
                    selectText: '选择',
                    navigateText: '切换',
                  },
                },
              },
            },
          },
        },
      },

      outline: {
        label: '本页目录',
        level: [2, 3],
      },

      docFooter: {
        prev: '上一页',
        next: '下一页',
      },

      langMenuLabel: '多语言',
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '菜单',
      darkModeSwitchLabel: '主题',
      lightModeSwitchTitle: '切换到浅色模式',
      darkModeSwitchTitle: '切换到深色模式',
    },
    vite: {
      build: {
        chunkSizeWarningLimit: 1500,
      },
    },
  }),
);
