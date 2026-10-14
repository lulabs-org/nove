import Alert from 'antd/es/alert';
import Col from 'antd/es/col';
import Divider from 'antd/es/divider';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import InputNumber from 'antd/es/input-number';
import Row from 'antd/es/row';
import Select from 'antd/es/select';
import type { StorageConfig } from '../../types';
import { SecretInput } from '../SecretInput';

export function StorageFields({
  form,
}: {
  form: ReturnType<typeof Form.useForm<StorageConfig>>[0];
}) {
  return (
    <Form
      className="integrations-form"
      form={form}
      layout="vertical"
      initialValues={{
        provider: 'OSS',
        region: 'oss-cn-hangzhou',
        signedUrlExpiresSeconds: 600,
      }}
    >
      <Alert
        type="info"
        showIcon
        title="配置对象存储服务。未配置或删除数据库配置时，服务将处于未配置状态。"
      />
      <Divider titlePlacement="start">存储服务商与地域</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="存储服务商"
            name="provider"
            rules={[{ required: true, message: '请选择存储服务商' }]}
          >
            <Select
              options={[
                { label: '阿里云 OSS', value: 'OSS' },
                { label: '腾讯云 COS', value: 'COS' },
                { label: 'AWS S3', value: 'S3' },
                { label: '本地存储 (Local)', value: 'LOCAL' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="地域 (Region)"
            name="region"
            rules={[{ required: true, message: '请输入地域代码' }]}
            tooltip="例如阿里云杭州 oss-cn-hangzhou，北京 oss-cn-beijing"
          >
            <Input placeholder="oss-cn-hangzhou" />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="start">存储桶与访问凭据</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="私有存储桶 (云盘与附件)"
            name="bucket"
            rules={[{ required: true, message: '请输入存储桶名称' }]}
            tooltip="用于云盘文件、会议录音及敏感附件，默认私有读写"
          >
            <Input placeholder="my-private-bucket" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="公共存储桶 (头像与公开媒体)"
            name="publicBucket"
            tooltip="可选。用于用户头像等公开媒体资源。若留空，将自动复用私有存储桶"
          >
            <Input placeholder="留空则复用私有存储桶" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            label="AccessKey ID"
            name="accessKeyId"
            rules={[{ required: true, message: '请输入 AccessKey ID' }]}
          >
            <Input placeholder="LTAI..." />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label="AccessKey Secret"
            name="accessKeySecret"
            tooltip="留空表示保持已保存的密钥不变"
          >
            <SecretInput placeholder="留空表示保持当前密钥不变" />
          </Form.Item>
        </Col>
      </Row>

      <Divider titlePlacement="start">访问地址与时效</Divider>
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Form.Item
            label="公开访问地址 (Base URL)"
            name="publicBaseUrl"
            tooltip="可选。CDN 加速域名或 Bucket 公网访问基地址，如 https://cdn.example.com，末尾请勿包含斜杠"
          >
            <Input placeholder="https://my-bucket.oss-cn-hangzhou.aliyuncs.com" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="签名有效时长（秒）"
            name="signedUrlExpiresSeconds"
            tooltip="用于头像、云盘等临时签名下载 URL，允许 60～3600 秒"
          >
            <InputNumber min={60} max={3600} style={{ width: '100%' }} placeholder="600" />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
