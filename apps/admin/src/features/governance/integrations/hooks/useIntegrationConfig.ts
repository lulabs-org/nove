import Form from 'antd/es/form';
import message from 'antd/es/message';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../shared/hooks/useAuth';
import { PERMISSIONS } from '../../../../shared/utils/permissions';
import { integrationsApi } from '../api/integrationsApi';
import {
  buildAiConfigPayload,
  buildLarkConfigPayload,
  buildMailConfigPayload,
  buildStorageConfigPayload,
  buildStripeConfigPayload,
  buildTencentMeetingConfigPayload,
  buildWechatShopConfigPayload,
  buildWecomConfigPayload,
} from '../lib/configPayload';
import type {
  AiConfig,
  AliyunSmsConfig,
  IntegrationDetail,
  IntegrationSummary,
  DriveConfig,
  FileScanningConfig,
  LarkConfig,
  MailConfig,
  IntegrationConfigMap,
  IntegrationModule,
  StorageConfig,
  StripeConfig,
  TencentMeetingConfig,
  TestIntegrationResult,
  WechatShopConfig,
  WecomConfig,
} from '../types';
import { MODULE_META } from '../moduleRegistry';

export function useIntegrationConfig() {
  const { checkPermission } = useAuth();
  const canWrite = checkPermission(PERMISSIONS.SYSTEM.CONFIG_WRITE);
  const [activeModule, setActiveModule] = useState<IntegrationModule>('mail');
  const [editingModule, setEditingModule] = useState<IntegrationModule | null>(null);
  const [summaries, setSummaries] = useState<IntegrationSummary[]>([]);
  const [details, setDetails] = useState<
    Partial<{ [M in IntegrationModule]: IntegrationDetail<IntegrationConfigMap[M]> }>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testResults, setTestResults] = useState<
    Partial<Record<IntegrationModule, TestIntegrationResult>>
  >({});

  const [mailForm] = Form.useForm<MailConfig>();
  const [aiForm] = Form.useForm<AiConfig>();
  const [tencentForm] = Form.useForm<TencentMeetingConfig>();
  const [larkForm] = Form.useForm<LarkConfig>();
  const [wechatForm] = Form.useForm<WechatShopConfig>();
  const [wecomForm] = Form.useForm<WecomConfig>();
  const [storageForm] = Form.useForm<StorageConfig>();
  const [driveForm] = Form.useForm<DriveConfig>();
  const [fileScanningForm] = Form.useForm<FileScanningConfig>();
  const [stripeForm] = Form.useForm<StripeConfig>();
  const [aliyunSmsForm] = Form.useForm<AliyunSmsConfig>();

  const summaryMap = useMemo(
    () => new Map(summaries.map((summary) => [summary.module, summary])),
    [summaries]
  );

  const setFormValue = useCallback(
    (module: IntegrationModule, value: IntegrationConfigMap[IntegrationModule]) => {
      if (module === 'mail') mailForm.setFieldsValue(value as MailConfig);
      if (module === 'ai') aiForm.setFieldsValue(value as AiConfig);
      if (module === 'tencent-meeting') tencentForm.setFieldsValue(value as TencentMeetingConfig);
      if (module === 'lark') larkForm.setFieldsValue(value as LarkConfig);
      if (module === 'wechat-shop') wechatForm.setFieldsValue(value as WechatShopConfig);
      if (module === 'wecom') wecomForm.setFieldsValue(value as WecomConfig);
      if (module === 'storage') storageForm.setFieldsValue(value as StorageConfig);
      if (module === 'drive') driveForm.setFieldsValue(value as DriveConfig);
      if (module === 'file-scanning') fileScanningForm.setFieldsValue(value as FileScanningConfig);
      if (module === 'stripe') stripeForm.setFieldsValue(value as StripeConfig);
      if (module === 'aliyun-sms') aliyunSmsForm.setFieldsValue(value as AliyunSmsConfig);
    },
    [
      aiForm,
      aliyunSmsForm,
      driveForm,
      fileScanningForm,
      larkForm,
      mailForm,
      storageForm,
      stripeForm,
      tencentForm,
      wechatForm,
      wecomForm,
    ]
  );

  const loadSummaries = useCallback(async () => {
    try {
      setSummaries(await integrationsApi.list());
    } catch {
      message.error('加载服务配置状态失败');
    }
  }, []);

  const loadConfig = useCallback(async (module: IntegrationModule) => {
    setLoading(true);
    try {
      const detail = await integrationsApi.get(module);
      setDetails((current) => ({ ...current, [module]: detail }));
    } catch {
      message.error(`加载${MODULE_META[module].label}配置失败`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canWrite || editingModule === null) return;
    const detail = details[editingModule];
    if (detail) setFormValue(editingModule, detail.value);
  }, [canWrite, details, editingModule, setFormValue]);

  useEffect(() => {
    void loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    void loadConfig(activeModule);
  }, [activeModule, loadConfig]);

  const getValues = async (module: IntegrationModule) => {
    switch (module) {
      case 'mail':
        return buildMailConfigPayload(await mailForm.validateFields());
      case 'ai':
        return buildAiConfigPayload(await aiForm.validateFields());
      case 'tencent-meeting':
        return buildTencentMeetingConfigPayload(await tencentForm.validateFields());
      case 'lark':
        return buildLarkConfigPayload(await larkForm.validateFields());
      case 'wechat-shop':
        return buildWechatShopConfigPayload(await wechatForm.validateFields());
      case 'wecom':
        return buildWecomConfigPayload(await wecomForm.validateFields());
      case 'storage':
        return buildStorageConfigPayload(await storageForm.validateFields());
      case 'drive':
        return driveForm.validateFields();
      case 'file-scanning':
        return fileScanningForm.validateFields();
      case 'stripe':
        return buildStripeConfigPayload(await stripeForm.validateFields());
      case 'aliyun-sms':
        return aliyunSmsForm.validateFields();
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const values = await getValues(activeModule);
      const result = await integrationsApi.update(activeModule, values);
      if (result.restartRequired) message.warning(result.message);
      else message.success(result.message);
      await Promise.all([loadConfig(activeModule), loadSummaries()]);
      setEditingModule(null);
    } catch (error) {
      if (error instanceof Error) message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  const testConfig = async () => {
    setTesting(true);
    try {
      const values = await getValues(activeModule);
      const result = await integrationsApi.test(activeModule, values);
      setTestResults((current) => ({ ...current, [activeModule]: result }));
    } catch (error) {
      if (error instanceof Error) message.error('测试配置失败');
    } finally {
      setTesting(false);
    }
  };

  const deleteConfig = async () => {
    setDeleting(true);
    try {
      const result = await integrationsApi.remove(activeModule);
      if (result.restartRequired) message.warning(result.message);
      else message.success(result.message);
      setTestResults((current) => ({ ...current, [activeModule]: undefined }));
      await Promise.all([loadConfig(activeModule), loadSummaries()]);
      setEditingModule(null);
    } catch {
      message.error('删除配置失败');
    } finally {
      setDeleting(false);
    }
  };

  return {
    canWrite,
    activeModule,
    setActiveModule,
    editingModule,
    setEditingModule,
    details,
    loading,
    saving,
    testing,
    deleting,
    testResults,
    summaryMap,
    loadConfig,
    loadSummaries,
    saveConfig,
    testConfig,
    deleteConfig,
    mailForm,
    aiForm,
    tencentForm,
    larkForm,
    wechatForm,
    wecomForm,
    storageForm,
    driveForm,
    fileScanningForm,
    stripeForm,
    aliyunSmsForm,
  };
}
