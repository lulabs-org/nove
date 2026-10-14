import Alert from 'antd/es/alert';
import Avatar from 'antd/es/avatar';
import Button from 'antd/es/button';
import Col from 'antd/es/col';
import Form from 'antd/es/form';
import Input from 'antd/es/input';
import Popconfirm from 'antd/es/popconfirm';
import Row from 'antd/es/row';
import Skeleton from 'antd/es/skeleton';
import Space from 'antd/es/space';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';
import Upload from 'antd/es/upload';
import message from 'antd/es/message';
import type { UploadProps } from 'antd/es/upload/interface';
import ImgCrop from 'antd-img-crop';
import axios from 'axios';
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { getMe } from '../../auth/api/api';
import { useAuthStore } from '../../auth/model/authStore';
import type { User } from '../../auth/model/types';
import {
  userControllerGetProfile,
  userControllerUpdateProfile,
} from '../../../shared/lib/api/orval/business/user';
import type {
  UpdateProfileDto,
  UserProfileResponseDto,
} from '../../../shared/lib/api/orval/business/schemas';
import { deleteProfileAvatar, uploadProfileAvatar } from './api/profileAvatarApi';
import './ProfilePage.css';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface ProfileFormValues {
  username?: string;
  displayName?: string;
  bio?: string;
}

interface DetailItemProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function displayText(value?: string | null) {
  return value && value.trim() ? value : '-';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getProfileName(profile?: UserProfileResponseDto, user?: User | null) {
  return (
    profile?.profile?.name ||
    user?.name ||
    profile?.username ||
    profile?.email ||
    user?.email ||
    '未命名用户'
  );
}

function toFormValues(profile?: UserProfileResponseDto, user?: User | null): ProfileFormValues {
  return {
    username: profile?.username || user?.username || undefined,
    displayName: getProfileName(profile, user),
    bio: profile?.profile?.bio || undefined,
  };
}

function trimOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function trimEditable(value?: string) {
  return value === undefined ? undefined : value.trim();
}

function toUpdatePayload(values: ProfileFormValues): UpdateProfileDto {
  return {
    username: trimOptional(values.username),
    displayName: trimOptional(values.displayName),
    bio: trimEditable(values.bio),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const apiMessage = error.response?.data?.message;
    if (Array.isArray(apiMessage)) return apiMessage.join('；');
    if (apiMessage) return apiMessage;
  }

  return fallback;
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="profile-detail-item">
      <span className="profile-detail-icon">{icon}</span>
      <span className="profile-detail-label">{label}</span>
      <span className="profile-detail-value">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ProfileFormValues>();
  const [editingProfile, setEditingProfile] = useState(false);
  const user = useAuthStore((state) => state.user);
  const profileQueryKey = ['settings-profile', user?.id] as const;

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) => userControllerGetProfile(signal),
  });

  useEffect(() => {
    if (editingProfile && profileQuery.data) {
      form.setFieldsValue(toFormValues(profileQuery.data, user));
    }
  }, [editingProfile, form, profileQuery.data, user]);

  const syncUpdatedProfile = async (updatedProfile: UserProfileResponseDto) => {
    queryClient.setQueryData(profileQueryKey, updatedProfile);
    form.setFieldsValue(toFormValues(updatedProfile, user));

    try {
      const refreshedUser = await getMe();
      useAuthStore.getState().setUser(refreshedUser);
    } catch {
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
    }
  };

  const saveProfileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => userControllerUpdateProfile(toUpdatePayload(values)),
    onSuccess: async (updatedProfile) => {
      await syncUpdatedProfile(updatedProfile);

      message.success('个人资料已保存');
      setEditingProfile(false);
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '保存个人资料失败'));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: uploadProfileAvatar,
    onSuccess: async (updatedProfile) => {
      await syncUpdatedProfile(updatedProfile);
      message.success('头像已更新');
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '头像上传失败'));
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: deleteProfileAvatar,
    onSuccess: async (updatedProfile) => {
      await syncUpdatedProfile(updatedProfile);
      message.success('头像已移除');
    },
    onError: (error) => {
      message.error(getErrorMessage(error, '头像移除失败'));
    },
  });

  const profile = profileQuery.data;
  const displayName = getProfileName(profile, user);
  const avatar = profile?.profile?.avatar || user?.avatar;
  const username = profile?.username || user?.username;
  const phone = profile?.phone
    ? `${profile.countryCode ? `${profile.countryCode} ` : ''}${profile.phone}`
    : '-';

  const startEditing = () => {
    setEditingProfile(true);
  };

  const cancelEditing = () => {
    form.resetFields();
    setEditingProfile(false);
  };

  const validateAvatarFile = (file: File) => {
    const supported = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!supported) {
      message.error('头像仅支持 JPEG、PNG 或 WebP 格式');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('头像文件不能超过 5 MB');
      return false;
    }
    return true;
  };

  const uploadAvatar: UploadProps['customRequest'] = async ({
    file,
    onError,
    onProgress,
    onSuccess,
  }) => {
    try {
      onProgress?.({ percent: 10 });
      const updatedProfile = await uploadAvatarMutation.mutateAsync(file as Blob);
      onProgress?.({ percent: 100 });
      onSuccess?.(updatedProfile);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('头像上传失败'));
    }
  };

  if (profileQuery.isLoading && !profile) {
    return (
      <div className="profile-page">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div className="profile-page">
      {profileQuery.isError ? (
        <Alert
          className="profile-alert"
          type="error"
          showIcon
          message="资料加载失败"
          description={getErrorMessage(profileQuery.error, '无法获取当前用户资料')}
        />
      ) : null}

      <section className="profile-hero">
        <Avatar className="profile-avatar" size={76} src={avatar} icon={<UserOutlined />} />
        <div className="profile-hero-main">
          <Title level={4}>{displayName}</Title>
          <Text className="profile-hero-username" type="secondary">
            {username ? `@${username}` : '设置你的个人资料与联系方式'}
          </Text>
          <Text className="profile-hero-bio" type="secondary">
            {profile?.profile?.bio || '完善个人资料，让协作成员更容易认识你。'}
          </Text>
        </div>
        <Space className="profile-hero-actions" size="small">
          <Button
            icon={<ReloadOutlined />}
            loading={profileQuery.isFetching}
            onClick={() => profileQuery.refetch()}
          >
            刷新
          </Button>
          {!editingProfile ? (
            <Button type="primary" icon={<EditOutlined />} onClick={startEditing}>
              编辑资料
            </Button>
          ) : null}
        </Space>
      </section>

      <div className="profile-content">
        <section className="profile-panel profile-form-panel">
          <div className="profile-section-heading">
            <IdcardOutlined />
            <div>
              <span>{editingProfile ? '编辑个人资料' : '个人资料'}</span>
              <Text type="secondary">
                {editingProfile ? '更新你的公开信息、登录账号与联系方式' : '查看你的个人和账号信息'}
              </Text>
            </div>
          </div>
          {editingProfile ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => saveProfileMutation.mutate(values)}
              requiredMark={false}
            >
              <div className="profile-form-group-heading">
                <span>公开信息</span>
                <Text type="secondary">这些信息会用于系统内的成员识别</Text>
              </div>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="displayName"
                    label="用户昵称"
                    rules={[{ required: true, message: '请输入用户昵称' }]}
                  >
                    <Input placeholder="用于页面顶部和成员列表展示的昵称" maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="头像">
                    <div className="profile-avatar-editor">
                      <Avatar size={56} src={avatar} icon={<UserOutlined />} />
                      <div className="profile-avatar-editor-main">
                        <Space size="small" wrap>
                          <ImgCrop
                            aspect={1}
                            rotationSlider
                            quality={0.92}
                            modalTitle="裁剪头像"
                            modalOk="使用此头像"
                            modalCancel="取消"
                            beforeCrop={(file) => validateAvatarFile(file as File)}
                          >
                            <Upload
                              accept="image/jpeg,image/png,image/webp"
                              showUploadList={false}
                              beforeUpload={(file) => validateAvatarFile(file)}
                              customRequest={uploadAvatar}
                              disabled={
                                uploadAvatarMutation.isPending || deleteAvatarMutation.isPending
                              }
                            >
                              <Button
                                icon={<UploadOutlined />}
                                loading={uploadAvatarMutation.isPending}
                              >
                                上传新头像
                              </Button>
                            </Upload>
                          </ImgCrop>
                          {avatar ? (
                            <Popconfirm
                              title="移除当前头像？"
                              description="移除后将显示系统默认头像。"
                              okText="移除"
                              cancelText="取消"
                              onConfirm={() => deleteAvatarMutation.mutate()}
                            >
                              <Button
                                danger
                                icon={<DeleteOutlined />}
                                loading={deleteAvatarMutation.isPending}
                                disabled={uploadAvatarMutation.isPending}
                              >
                                移除头像
                              </Button>
                            </Popconfirm>
                          ) : null}
                        </Space>
                        <Text type="secondary">
                          支持 JPEG、PNG、WebP，最大 5 MB；裁剪确认后立即生效。
                        </Text>
                      </div>
                    </div>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="bio" label="个人简介">
                    <TextArea
                      placeholder="补充你的职责、协作范围或联系方式说明"
                      rows={3}
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div className="profile-form-group-heading profile-form-group-heading-divided">
                <span>账号与联系方式</span>
                <Text type="secondary">联系方式请在安全设置中验证和换绑</Text>
              </div>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { min: 3, message: '用户名至少3个字符' },
                      {
                        pattern: /^[a-zA-Z0-9_]+$/,
                        message: '用户名只能包含字母、数字和下划线',
                      },
                    ]}
                  >
                    <Input placeholder="例如 yangshiming" maxLength={50} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="安全联系方式">
                    <Space direction="vertical" size={2}>
                      <Text>{displayText(profile?.email)}</Text>
                      <Text type="secondary">{phone}</Text>
                      <Button
                        type="link"
                        className="profile-security-link"
                        href="/settings/security"
                      >
                        前往安全设置修改
                      </Button>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>
              <div className="profile-form-actions">
                <Button onClick={cancelEditing}>取消</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveProfileMutation.isPending}
                >
                  保存资料
                </Button>
              </div>
            </Form>
          ) : (
            <div className="profile-view-groups">
              <section className="profile-view-section">
                <div className="profile-form-group-heading">
                  <span>公开信息</span>
                  <Text type="secondary">用于系统内的成员识别</Text>
                </div>
                <div className="profile-view-list">
                  <DetailItem icon={<UserOutlined />} label="用户昵称" value={displayName} />
                  <DetailItem
                    icon={<IdcardOutlined />}
                    label="个人简介"
                    value={displayText(profile?.profile?.bio)}
                  />
                </div>
              </section>
              <section className="profile-view-section">
                <div className="profile-form-group-heading profile-form-group-heading-divided">
                  <span>账号与联系方式</span>
                  <Text type="secondary">登录、通知与账号找回信息</Text>
                </div>
                <div className="profile-view-list">
                  <DetailItem
                    icon={<UserOutlined />}
                    label="用户名"
                    value={username ? `@${username}` : '-'}
                  />
                  <DetailItem
                    icon={<MailOutlined />}
                    label="邮箱"
                    value={displayText(profile?.email)}
                  />
                  <DetailItem icon={<PhoneOutlined />} label="手机号" value={phone} />
                </div>
              </section>
            </div>
          )}
        </section>

        <aside className="profile-panel profile-side-panel">
          <div className="profile-section-heading">
            <SafetyCertificateOutlined />
            <div>
              <span>账号与安全</span>
              <Text type="secondary">查看账号状态和最近活动</Text>
            </div>
          </div>
          <div className="profile-status-list">
            <DetailItem
              icon={<SafetyCertificateOutlined />}
              label="账号状态"
              value={
                <Tag color={user?.active ? 'green' : 'red'}>
                  {user?.active ? '已启用' : '已停用'}
                </Tag>
              }
            />
            <DetailItem
              icon={<MailOutlined />}
              label="邮箱验证"
              value={
                <Tag color={profile?.emailVerified ? 'green' : 'gold'}>
                  {profile?.emailVerified ? '已验证' : '未验证'}
                </Tag>
              }
            />
            <DetailItem
              icon={<PhoneOutlined />}
              label="手机验证"
              value={
                <Tag color={profile?.phoneVerified ? 'green' : 'gold'}>
                  {profile?.phoneVerified ? '已验证' : '未验证'}
                </Tag>
              }
            />
            <DetailItem
              icon={<ClockCircleOutlined />}
              label="最后登录"
              value={formatDateTime(profile?.lastLoginAt || user?.lastLoginAt)}
            />
            <DetailItem
              icon={<ClockCircleOutlined />}
              label="注册时间"
              value={formatDateTime(profile?.createdAt)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
