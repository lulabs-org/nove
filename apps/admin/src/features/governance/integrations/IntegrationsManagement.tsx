import Menu from 'antd/es/menu';
import { useAuth } from '../../../shared/hooks/useAuth';
import { WechatShopSyncPanel } from './components/WechatShopSyncPanel';
import { StripeSyncPanel } from './components/StripeSyncPanel';
import { ReadonlyConfigView } from './components/ReadonlyConfigView';
import type { IntegrationModule } from './types';
import { useIntegrationConfig } from './hooks/useIntegrationConfig';
import { buildIntegrationMenu } from './moduleRegistry';
import { ConfigPanel } from './components/ConfigPanel';
import { MailFields } from './components/fields/MailFields';
import { AiFields } from './components/fields/AiFields';
import { TencentMeetingFields } from './components/fields/TencentMeetingFields';
import { LarkFields } from './components/fields/LarkFields';
import { WechatShopFields } from './components/fields/WechatShopFields';
import { WecomFields } from './components/fields/WecomFields';
import { DriveFields } from './components/fields/DriveFields';
import { FileScanningFields } from './components/fields/FileScanningFields';
import { StorageFields } from './components/fields/StorageFields';
import { StripeFields } from './components/fields/StripeFields';
import { AliyunSmsFields } from './components/fields/AliyunSmsFields';
import './IntegrationsManagement.css';

export function IntegrationsManagement() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN') ?? false;
  const {
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
  } = useIntegrationConfig();
  const menuItems = buildIntegrationMenu(summaryMap, isSuperAdmin);
  const isEditing = canWrite && editingModule === activeModule;

  return (
    <div className="integrations-page">
      <aside className="integrations-sidebar">
        <Menu
          mode="inline"
          selectedKeys={[activeModule]}
          items={menuItems}
          onSelect={({ key }) => {
            setEditingModule(null);
            setActiveModule(key as IntegrationModule);
          }}
        />
      </aside>
      <main className="integrations-content">
        <ConfigPanel
          module={activeModule}
          summary={summaryMap.get(activeModule) ?? details[activeModule]}
          loading={loading}
          saving={saving}
          testing={testing}
          deleting={deleting}
          canWrite={canWrite}
          isEditing={isEditing}
          testResult={testResults[activeModule]}
          onRefresh={() => void Promise.all([loadConfig(activeModule), loadSummaries()])}
          onEdit={() => setEditingModule(activeModule)}
          onCancelEdit={() => setEditingModule(null)}
          onSave={() => void saveConfig()}
          onTest={() => void testConfig()}
          onDelete={() => void deleteConfig()}
        >
          {isEditing ? (
            <>
              {activeModule === 'mail' && (
                <MailFields
                  form={mailForm}
                  onBrandLogoChanged={() =>
                    Promise.all([loadConfig('mail'), loadSummaries()]).then(() => undefined)
                  }
                />
              )}
              {activeModule === 'ai' && <AiFields form={aiForm} />}
              {activeModule === 'tencent-meeting' && <TencentMeetingFields form={tencentForm} />}
              {activeModule === 'lark' && <LarkFields form={larkForm} />}
              {activeModule === 'wechat-shop' && <WechatShopFields form={wechatForm} />}
              {activeModule === 'wecom' && <WecomFields form={wecomForm} />}
              {activeModule === 'storage' && <StorageFields form={storageForm} />}
              {activeModule === 'drive' && <DriveFields form={driveForm} />}
              {activeModule === 'file-scanning' && <FileScanningFields form={fileScanningForm} />}
              {activeModule === 'stripe' && <StripeFields form={stripeForm} />}
              {activeModule === 'aliyun-sms' && <AliyunSmsFields form={aliyunSmsForm} />}
            </>
          ) : (
            <ReadonlyConfigView module={activeModule} value={details[activeModule]?.value} />
          )}
        </ConfigPanel>
        {activeModule === 'stripe' && <StripeSyncPanel />}
        {activeModule === 'wechat-shop' && <WechatShopSyncPanel />}
      </main>
    </div>
  );
}
