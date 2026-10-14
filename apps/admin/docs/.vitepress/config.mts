import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: 'Nove Admin',
  description: 'Nove Admin 开发与维护文档',
  cleanUrls: true,
  ignoreDeadLinks: false,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '架构', link: '/architecture/overview' },
      { text: '模块', link: '/modules/' },
      { text: '参考', link: '/reference/routes-and-permissions' },
    ],
    sidebar: [
      {
        text: '项目指南',
        items: [
          { text: '文档首页', link: '/' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '开发工作流', link: '/guide/development-workflow' },
          { text: '新增业务模块', link: '/guide/adding-a-feature' },
          { text: '测试与质量', link: '/guide/testing' },
          { text: '部署', link: '/guide/deployment' },
        ],
      },
      {
        text: '系统架构',
        items: [
          { text: '架构概览', link: '/architecture/overview' },
          { text: '路由、认证与权限', link: '/architecture/routing-auth-permissions' },
          { text: '数据访问与状态', link: '/architecture/data-access' },
        ],
      },
      {
        text: '业务模块',
        items: [
          { text: '模块地图', link: '/modules/' },
          { text: '组织与交易', link: '/modules/organization-and-transactions' },
          { text: '会议、报告与任务', link: '/modules/meetings-reports-tasks' },
          { text: '治理与设置', link: '/modules/governance-and-settings' },
        ],
      },
      {
        text: '参考',
        items: [
          { text: '路由与权限表', link: '/reference/routes-and-permissions' },
          { text: '脚本与环境变量', link: '/reference/scripts-and-environment' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lulabs-org/nove-api/tree/main/apps/admin' },
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新' },
  },
});
