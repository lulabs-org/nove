import { useState } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import Popover from 'antd/es/popover';
import Card from 'antd/es/card';
import Button from 'antd/es/button';
import Space from 'antd/es/space';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { StripeOrderSyncModal } from '../../../transactions/orders/components/StripeOrderSyncModal';
import { StripeRefundSyncModal } from '../../../transactions/order-refunds/components/StripeRefundSyncModal';

export function StripeSyncPanel() {
  const { user } = useAuth();
  const [mode, setMode] = useState<'orders' | 'refunds' | null>(null);
  if (!user?.roles.includes('SUPER_ADMIN')) return null;

  const close = () => setMode(null);
  return (
    <Card
      title={
        <Space size={6}>
          <span>数据同步</span>
          <Popover
            trigger={['hover', 'focus', 'click']}
            placement="top"
            content={
              <div className="integrations-secret-help">
                <div className="integrations-help-section">
                  <div className="integrations-help-section-title">同步范围</div>
                  <div>
                    补充历史订单或退款，也可按 Stripe
                    交易编号同步单笔记录。同步范围独立于订单列表的筛选条件。
                  </div>
                </div>
                <div className="integrations-help-section">
                  <div className="integrations-help-section-title">查看结果</div>
                  <div>
                    批量任务提交后将在后台执行，订单和退款列表稍后更新，可返回对应列表刷新查看。
                  </div>
                </div>
              </div>
            }
          >
            <Button
              type="text"
              size="small"
              className="integrations-help-button"
              aria-label="查看数据同步说明"
              icon={<QuestionCircleOutlined />}
            />
          </Popover>
        </Space>
      }
      style={{ marginTop: 24 }}
    >
      <Space wrap>
        <Button onClick={() => setMode('orders')}>同步订单</Button>
        <Button onClick={() => setMode('refunds')}>同步退款</Button>
      </Space>
      <StripeOrderSyncModal open={mode === 'orders'} onCancel={close} onSuccess={close} />
      <StripeRefundSyncModal open={mode === 'refunds'} onCancel={close} onSuccess={close} />
    </Card>
  );
}
