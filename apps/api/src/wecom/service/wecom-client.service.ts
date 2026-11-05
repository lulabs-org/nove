import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { IntegrationsService } from '@/admin/integrations';
import { SingleOrgContextService } from '@/admin/org';
import { WecomExternalContactResponse } from '../types';
import { WecomTokenService } from './wecom-token.service';

@Injectable()
export class WecomClientService {
  private readonly logger = new Logger(WecomClientService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly wecomTokenService: WecomTokenService,
    private readonly integrationsService: IntegrationsService,
    private readonly orgContext: SingleOrgContextService,
  ) {}

  private async getApiBaseUrl(): Promise<string> {
    const { value } = await this.integrationsService.getEffectiveConfig(
      this.orgContext.getOrgId(),
      'wecom',
    );
    return String(value.apiBaseUrl ?? 'https://qyapi.weixin.qq.com');
  }

  /**
   * 获取客户详情
   * https://developer.work.weixin.qq.com/document/path/92114
   *
   * @param externalUserId 外部联系人的userid
   * @param cursor 分页 cursor（当跟进人多于500人时需要）
   */
  async getExternalContact(
    externalUserId: string,
    cursor?: string,
  ): Promise<WecomExternalContactResponse> {
    const accessToken = await this.wecomTokenService.getAccessToken();
    const baseUrl = await this.getApiBaseUrl();

    const { data } = await firstValueFrom(
      this.httpService.get<WecomExternalContactResponse>(
        `${baseUrl}/cgi-bin/externalcontact/get`,
        {
          params: {
            access_token: accessToken,
            external_userid: externalUserId,
            cursor,
          },
        },
      ),
    ).catch((e: AxiosError) => {
      this.logger.error('WeCom API error (getExternalContact):', e.message);
      throw new ServiceUnavailableException(
        `WeCom API request failed: ${e.response?.status}`,
      );
    });

    if (data.errcode !== 0) {
      this.logger.error(
        `WeCom API error (getExternalContact): ${data.errcode} ${data.errmsg}`,
      );
      throw new ServiceUnavailableException(
        `WeCom API error: ${data.errcode} ${data.errmsg}`,
      );
    }

    return data;
  }

  /**
   * 给 Workbuddy 会话中的同学发送文本回复。
   * 未配置 agentId 时不发送，避免在缺少企业微信应用凭据时反复重试。
   */
  async sendWorkbuddyText(
    toUser: string,
    content: string,
  ): Promise<{ sent: boolean; reason?: string }> {
    let agentId = '';
    try {
      const { value } = await this.integrationsService.getEffectiveConfig(
        this.orgContext.getOrgId(),
        'wecom',
      );
      agentId = String(value.agentId ?? '').trim();
    } catch (error) {
      this.logger.warn(
        `Workbuddy reply skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { sent: false, reason: '企业微信配置不可用' };
    }

    if (!/^\d+$/.test(agentId)) {
      this.logger.warn('Workbuddy agentId 未配置，跳过企业微信回复');
      return { sent: false, reason: 'Workbuddy agentId 未配置' };
    }

    const accessToken = await this.wecomTokenService.getAccessToken();
    const baseUrl = await this.getApiBaseUrl();
    const { data } = await firstValueFrom(
      this.httpService.post<{ errcode: number; errmsg: string }>(
        `${baseUrl}/cgi-bin/message/send`,
        {
          touser: toUser,
          msgtype: 'text',
          agentid: Number(agentId),
          text: { content: truncateUtf8(content, 2048) },
        },
        { params: { access_token: accessToken } },
      ),
    ).catch((error: AxiosError) => {
      this.logger.error('WeCom API error (sendWorkbuddyText):', error.message);
      throw new ServiceUnavailableException(
        `WeCom API request failed: ${error.response?.status}`,
      );
    });

    if (data.errcode !== 0) {
      this.logger.error(
        `Workbuddy reply failed: ${data.errcode} ${data.errmsg}`,
      );
      return { sent: false, reason: data.errmsg };
    }

    return { sent: true };
  }
}

function truncateUtf8(content: string, maxBytes: number): string {
  if (Buffer.byteLength(content) <= maxBytes) return content;
  let size = 0;
  let result = '';
  for (const char of content) {
    const next = size + Buffer.byteLength(char);
    if (next > maxBytes) break;
    result += char;
    size = next;
  }
  return result;
}
