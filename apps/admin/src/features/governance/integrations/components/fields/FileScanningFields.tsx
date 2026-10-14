import Alert from 'antd/es/alert';
import Col from 'antd/es/col';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import type { FileScanningConfig } from '../../types';

export function FileScanningFields({
  form,
}: {
  form: ReturnType<typeof Form.useForm<FileScanningConfig>>[0];
}) {
  const scanProvider = Form.useWatch('malwareScanProvider', form);

  return (
    <Form
      className="integrations-form"
      form={form}
      layout="vertical"
      initialValues={{
        aliyunSasRegionId: 'cn-beijing',
        scanTimeoutMs: 300000,
        scanPollIntervalMs: 3000,
        clamAvPort: 3310,
        clamAvTimeoutMs: 600000,
      }}
    >
      <Form.Item label="扫描服务" name="malwareScanProvider" extra="未指定时跟随服务端配置。">
        <Select
          placeholder="跟随服务端配置"
          options={[
            { label: '阿里云安全中心', value: 'ALIYUN_SAS' },
            { label: 'ClamAV', value: 'CLAMAV' },
          ]}
        />
      </Form.Item>
      <Row gutter={16} style={{ display: scanProvider === 'ALIYUN_SAS' ? undefined : 'none' }}>
        <Col xs={24}>
          <Alert type="info" showIcon title="阿里云扫描单文件上限为 100 MiB。" />
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label="阿里云地域" name="aliyunSasRegionId">
            <Input placeholder="cn-beijing" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="扫描超时（毫秒）" name="scanTimeoutMs">
            <InputNumber min={30000} max={1800000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="轮询间隔（毫秒）" name="scanPollIntervalMs">
            <InputNumber min={1000} max={30000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16} style={{ display: scanProvider === 'CLAMAV' ? undefined : 'none' }}>
        <Col xs={24} md={12}>
          <Form.Item label="ClamAV 主机" name="clamAvHost">
            <Input placeholder="clamav.internal" />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="ClamAV 端口" name="clamAvPort">
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="扫描超时（毫秒）" name="clamAvTimeoutMs">
            <InputNumber min={1000} max={3600000} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
