import Card from 'antd/es/card';
import Collapse from 'antd/es/collapse';
import Descriptions from 'antd/es/descriptions';
import Divider from 'antd/es/divider';
import Drawer from 'antd/es/drawer';
import Spin from 'antd/es/spin';
import Table from 'antd/es/table';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { trackingReportApi } from '../api/trackingReportApi';
import {
  TRACKING_CADENCE_LABELS,
  TRACKING_REPORT_TYPE_LABELS,
  TRACKING_SOURCE_TYPE_LABELS,
} from '../model/types';
import type { TrackingReportSource } from '../model/types';
import { ReportTargetSummary, TargetDetails } from './ReportSubject';
import './TrackingReportDetail.css';

const { Text } = Typography;

export function TrackingReportDetail({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['tracking-reports', id],
    queryFn: () => trackingReportApi.getById(id!),
    enabled: Boolean(id),
  });
  const reportContentHtml = report
    ? DOMPurify.sanitize(marked.parse(report.content, { gfm: true }) as string)
    : '';

  return (
    <Drawer title="追踪报告详情" open={Boolean(id)} onClose={onClose} size={760} destroyOnHidden>
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      )}
      {report && !isLoading && (
        <div className="tracking-report-detail">
          <Card size="small" className="tracking-report-subject-card">
            <ReportTargetSummary target={report.target} size="large" />
            <Divider />
            <TargetDetails target={report.target} />
          </Card>

          <Descriptions title="报告信息" bordered column={2} size="small">
            <Descriptions.Item label="报告类型">
              {TRACKING_REPORT_TYPE_LABELS[report.trackingType]}
            </Descriptions.Item>
            <Descriptions.Item label="周期单位">
              {TRACKING_CADENCE_LABELS[report.cadence]}
            </Descriptions.Item>
            <Descriptions.Item label="周期标识">{report.periodKey ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="时区">{report.timezone}</Descriptions.Item>
            <Descriptions.Item label="周期开始">
              {new Date(report.periodStart).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="周期结束（不含）">
              {new Date(report.periodEnd).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="生成方式">
              {report.generatedBy ? <Tag>{report.generatedBy}</Tag> : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="AI 模型">{report.aiModel ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(report.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {new Date(report.updatedAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>

          <Collapse
            className="tracking-report-content"
            defaultActiveKey={['content', 'sources']}
            items={[
              {
                key: 'content',
                label: '报告内容',
                children: (
                  <div
                    className="tracking-report-markdown"
                    dangerouslySetInnerHTML={{ __html: reportContentHtml }}
                  />
                ),
              },
              {
                key: 'sources',
                label: `引用来源（${report.sourceCount}）`,
                children: report.sources.length ? (
                  <Table<TrackingReportSource>
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={report.sources}
                    columns={[
                      {
                        title: '类型',
                        dataIndex: 'sourceType',
                        width: 110,
                        render: (value: TrackingReportSource['sourceType']) =>
                          TRACKING_SOURCE_TYPE_LABELS[value] ?? value,
                      },
                      {
                        title: '来源 ID',
                        dataIndex: 'sourceId',
                        render: (value: string) => <Text copyable>{value}</Text>,
                      },
                      {
                        title: '元数据',
                        dataIndex: 'metadata',
                        render: (value: Record<string, unknown>) =>
                          Object.keys(value).length ? JSON.stringify(value) : '-',
                      },
                    ]}
                  />
                ) : (
                  '暂无引用来源'
                ),
              },
            ]}
          />
        </div>
      )}
    </Drawer>
  );
}
