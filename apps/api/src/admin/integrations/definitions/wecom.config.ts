import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';
import { defineIntegrationConfig } from '../utils';

export class UpdateWecomConfigDto {
  @IsOptional()
  @IsString()
  corpId?: string;

  @IsOptional()
  @IsString()
  corpSecret?: string;

  @IsOptional()
  @IsString()
  webhookToken?: string;

  @IsOptional()
  @IsString()
  encodingAesKey?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  apiBaseUrl?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): string | undefined => {
    if (typeof value !== 'string' || value === '') return undefined;
    return value;
  })
  @IsString()
  @Matches(/^\d+$/)
  agentId?: string;
}

export const wecomConfig = defineIntegrationConfig(UpdateWecomConfigDto, {
  description: 'Enterprise WeChat (WeCom) Integration Configuration',
  defaults: {
    apiBaseUrl: 'https://qyapi.weixin.qq.com',
  },
  required: ['corpId', 'corpSecret'],
  secrets: ['corpSecret', 'webhookToken', 'encodingAesKey'],
});
