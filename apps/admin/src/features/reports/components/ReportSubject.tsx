import Avatar from 'antd/es/avatar';
import Descriptions from 'antd/es/descriptions';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import type { TrackingTarget, TrackingTargetSummary } from '../model/types';
import { TRACKING_TARGET_TYPE_LABELS } from '../model/types';
import './ReportSubject.css';

const { Text } = Typography;

const TARGET_COLORS = {
  USER: 'blue',
  PLATFORM_USER: 'orange',
  PROJECT: 'purple',
  ORGANIZATION: 'green',
} as const;

export function ReportTargetSummary({
  target,
  size = 'default',
}: {
  target: TrackingTargetSummary;
  size?: 'default' | 'large';
}) {
  return (
    <div className={`report-subject-summary is-${size}`} data-target-type={target.targetType}>
      <Avatar size={size === 'large' ? 48 : 36}>{target.nameSnapshot.slice(0, 1)}</Avatar>
      <div className="report-subject-main">
        <Text className="report-subject-name" ellipsis={{ tooltip: target.nameSnapshot }}>
          {target.nameSnapshot}
        </Text>
        <div className="report-subject-meta">
          <Tag color={TARGET_COLORS[target.targetType]}>
            {TRACKING_TARGET_TYPE_LABELS[target.targetType]}
          </Tag>
        </div>
      </div>
    </div>
  );
}

export function TargetDetails({ target }: { target: TrackingTarget }) {
  return (
    <Descriptions column={1} size="small" className="report-subject-identities">
      <Descriptions.Item label="业务对象 ID">
        <Text copyable>{target.targetId}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="追踪目标 ID">
        <Text copyable>{target.id}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="目标元数据">
        {Object.keys(target.metadata).length ? (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(target.metadata, null, 2)}
          </pre>
        ) : (
          '-'
        )}
      </Descriptions.Item>
    </Descriptions>
  );
}
