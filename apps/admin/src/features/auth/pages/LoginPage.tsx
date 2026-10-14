import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Button from 'antd/es/button';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import message from 'antd/es/message';
import Tabs from 'antd/es/tabs';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { otpControllerSend } from '../../../shared/lib/api/orval/business/auth';
import {
  buildLoginCodeRequest,
  buildLoginRequest,
  parseLoginIdentifier,
} from '../model/loginIdentifier';
import { getLoginErrorMessage } from '../model/loginError';
import './LoginPage.css';

type LoginType = 'password' | 'code';

interface LoginValues {
  account: string;
  password?: string;
  code?: string;
}

const CAPABILITIES = ['身份与权限', '组织数据', '会议智能', '订单数据', 'Agent 接入'];

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<LoginValues>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState<LoginType>('password');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const onFinish = async (values: LoginValues) => {
    setLoading(true);
    try {
      const identifier = parseLoginIdentifier(values.account);
      if (!identifier) return;
      const credential = loginType === 'password' ? values.password! : values.code!;
      await login(buildLoginRequest(identifier, loginType, credential));
      message.success('登录成功');
      const requestedReturnTo = searchParams.get('returnTo');
      const returnTo =
        requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//')
          ? requestedReturnTo
          : '/';
      navigate(returnTo, { replace: true });
    } catch (error) {
      const errorMessage = getLoginErrorMessage(error);
      if (errorMessage) {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    try {
      await form.validateFields(['account']);
    } catch {
      return;
    }
    const identifier = parseLoginIdentifier(form.getFieldValue('account'));
    if (!identifier) return;
    setSendingCode(true);
    try {
      await otpControllerSend(buildLoginCodeRequest(identifier));
      message.success('验证码已发送');
      setCountdown(60);
      const timer = window.setInterval(() => {
        setCountdown((previous) => {
          if (previous <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return previous - 1;
        });
      }, 1000);
    } catch {
      message.error('验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  return (
    <main className="nove-login">
      <section className="nove-login__brand" aria-label="Nove System 产品介绍">
        <div className="nove-login__ambient nove-login__ambient--one" />
        <div className="nove-login__ambient nove-login__ambient--two" />

        <header className="nove-brand-header">
          <div className="nove-mark" aria-hidden="true">
            <span>N</span>
            <i className="nove-mark__dot nove-mark__dot--one" />
            <i className="nove-mark__dot nove-mark__dot--two" />
          </div>
          <div>
            <strong>Nove System</strong>
            <span>Data & Agent Infrastructure</span>
          </div>
        </header>

        <div className="nove-brand-copy">
          <div className="nove-brand-copy__eyebrow">
            <span />
            ENTERPRISE INTELLIGENCE FOUNDATION
          </div>
          <h1>让数据持续产生价值</h1>
          <p>统一承载组织数据，为人与 AI Agent 提供安全、可授权的数据访问与协作基础。</p>
          <div className="nove-capabilities" aria-label="系统能力">
            {CAPABILITIES.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>
        </div>

        <div className="nove-system-map" aria-hidden="true">
          <svg viewBox="0 0 680 250" preserveAspectRatio="none">
            <defs>
              <linearGradient id="connection-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#38bdf8" stopOpacity="0.08" />
                <stop offset="0.55" stopColor="#60a5fa" stopOpacity="0.65" />
                <stop offset="1" stopColor="#2dd4bf" stopOpacity="0.12" />
              </linearGradient>
            </defs>
            <path d="M72 162 C165 154, 178 65, 284 82 S430 190, 612 118" />
            <path d="M72 162 C190 210, 302 194, 390 140 S512 42, 612 118" />
            <path d="M284 82 C330 116, 348 112, 390 140" />
          </svg>
          <span className="system-node system-node--users">身份</span>
          <span className="system-node system-node--products">组织</span>
          <span className="system-node system-node--orders">订单</span>
          <span className="system-node system-node--meetings">会议</span>
          <span className="system-node system-node--tasks">Agent</span>
          <div className="system-core">
            <span>N</span>
            <small>DATA CORE</small>
          </div>
        </div>

        <footer className="nove-brand-footer">
          <span className="nove-status-dot" />
          REST · GraphQL · MCP
          <span className="nove-brand-footer__divider" />
          Human · Agent Access
        </footer>
      </section>

      <section className="nove-login__access">
        <div className="nove-access-status">
          <SafetyCertificateOutlined />
          企业安全访问
        </div>

        <div className="nove-login-panel">
          <div className="nove-mobile-brand">
            <div className="nove-mark" aria-hidden="true">
              <span>N</span>
            </div>
            <strong>Nove System</strong>
          </div>

          <div className="nove-login-heading">
            <span>NOVE DATA CONSOLE</span>
            <h2>进入 Nove</h2>
            <p>登录企业数据与 Agent 管理控制台</p>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            autoComplete="on"
            layout="vertical"
            className="nove-login-form"
          >
            <Tabs
              activeKey={loginType}
              onChange={(key) => setLoginType(key as LoginType)}
              className="nove-login-tabs"
              items={[
                { key: 'password', label: '密码登录' },
                { key: 'code', label: '验证码登录' },
              ]}
            />

            <Form.Item
              name="account"
              label="邮箱或手机号"
              rules={[
                { required: true, message: '请输入邮箱或手机号' },
                {
                  validator: (_, value: string) =>
                    !value || parseLoginIdentifier(value)
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入有效的邮箱或中国大陆手机号')),
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="邮箱或手机号"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            {loginType === 'password' ? (
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  size="large"
                  autoComplete="current-password"
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="code"
                label="验证码"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="请输入 6 位验证码"
                  size="large"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  suffix={
                    <Button
                      type="link"
                      onClick={handleSendCode}
                      loading={sendingCode}
                      disabled={countdown > 0}
                      className="nove-code-button"
                    >
                      {countdown > 0 ? `${countdown} 秒` : '发送验证码'}
                    </Button>
                  }
                />
              </Form.Item>
            )}

            <Form.Item className="nove-login-submit">
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                <span>安全登录</span>
                <ArrowRightOutlined />
              </Button>
            </Form.Item>
          </Form>

          <div className="nove-security-note">
            <SafetyCertificateOutlined />
            <span>
              <strong>数据访问遵循最小权限原则</strong>
              登录后将按组织上下文与 RBAC 权限开放数据和操作
            </span>
          </div>
        </div>

        <footer className="nove-access-footer">
          <span>© 2026 Nove System</span>
          <span>企业级智能数据仓库与 AI Agent 基础设施</span>
        </footer>
      </section>
    </main>
  );
}
