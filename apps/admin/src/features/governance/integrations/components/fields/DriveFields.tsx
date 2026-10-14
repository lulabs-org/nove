import Alert from 'antd/es/alert';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import InputNumber from 'antd/es/input-number';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import type { DriveConfig } from '../../types';

export function DriveFields({ form }: { form: ReturnType<typeof Form.useForm<DriveConfig>>[0] }) {
  return (
    <Form
      className="integrations-form"
      form={form}
      layout="vertical"
      initialValues={{
        downloadUrlExpiresSeconds: 600,
        recycleRetentionDays: 30,
        imageMaxMiB: 20,
        documentMaxMiB: 100,
        audioMaxMiB: 2048,
        videoMaxMiB: 20480,
      }}
    >
      <Alert
        type="warning"
        showIcon
        title="危险类型（宏文件、压缩包、脚本、可执行文件）由服务端永久禁止；此处只能在安全白名单内进一步收窄。"
      />
      <Divider titlePlacement="start">文件策略</Divider>
      <Form.Item
        label="允许扩展名"
        name="allowedExtensions"
        tooltip="留空表示启用服务端全部安全白名单"
      >
        <Select mode="tags" tokenSeparators={[',', ' ']} placeholder="例如 .pdf .docx .mp4" />
      </Form.Item>
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Form.Item label="图片上限 MiB" name="imageMaxMiB">
            <InputNumber min={1} max={20} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="文档上限 MiB" name="documentMaxMiB">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="音频上限 MiB" name="audioMaxMiB">
            <InputNumber min={1} max={2048} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12} md={6}>
          <Form.Item label="视频上限 MiB" name="videoMaxMiB">
            <InputNumber min={1} max={20480} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Divider titlePlacement="start">下载与回收站</Divider>
      <Row gutter={16}>
        <Col xs={12}>
          <Form.Item label="下载 URL 有效期（秒）" name="downloadUrlExpiresSeconds">
            <InputNumber min={60} max={3600} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={12}>
          <Form.Item label="回收站保留天数" name="recycleRetentionDays">
            <InputNumber min={1} max={365} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
