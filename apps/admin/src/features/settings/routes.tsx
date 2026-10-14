import { BankOutlined } from '@ant-design/icons';
import { menuGroup } from '../../shared/utils/routes';
import { organizationInfoRoutes } from './organization-info';

export const settingsRoutes = menuGroup('/settings', '企业设置', <BankOutlined />, [
  ...organizationInfoRoutes,
]);
