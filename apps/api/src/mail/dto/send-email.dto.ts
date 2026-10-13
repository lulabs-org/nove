/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-06-27 05:01:10
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 03:31:10
 * @FilePath: /lulab_backend/src/mail/dto/send-email.dto.ts
 * @Description:
 *
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved.
 */

import { IsEmail, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    description: '收件人邮箱地址',
    example: 'recipient@example.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: '抄送邮箱地址列表',
    example: ['cc1@example.com', 'cc2@example.com'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiProperty({
    description: '密送邮箱地址列表',
    example: ['bcc1@example.com', 'bcc2@example.com'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ description: '邮件主题', example: '测试邮件主题' })
  @IsString()
  subject: string;

  @ApiProperty({
    description: '邮件纯文本内容',
    example: '这是邮件的纯文本内容',
  })
  @IsString()
  text: string;

  @ApiProperty({
    description: '邮件HTML内容',
    example: '<h1>这是邮件的HTML内容</h1>',
    required: false,
  })
  @IsOptional()
  @IsString()
  html?: string;
}
