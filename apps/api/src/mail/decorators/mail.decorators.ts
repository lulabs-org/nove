/*
 * @Author: 杨仕明 shiming.y@qq.com
 * @Date: 2025-10-03 03:50:00
 * @LastEditors: 杨仕明 shiming.y@qq.com
 * @LastEditTime: 2025-10-03 04:50:00
 * @FilePath: /lulab_backend/src/mail/decorators/mail.decorators.ts
 * @Description: Mail module Swagger decorators
 *
 * Copyright (c) 2025 by LuLab-Team, All Rights Reserved.
 */

import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiProduces,
  ApiConsumes,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SendEmailDto } from '@/mail/dto/send-email.dto';

export const ApiSendEmailDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '发送邮件',
      description:
        '发送邮件到指定收件人，支持纯文本和HTML格式，可添加抄送和密送收件人。',
      tags: ['Mail'],
    }),
    ApiConsumes('application/json'),
    ApiProduces('application/json'),
    ApiResponse({
      status: 200,
      description: '邮件发送成功，返回消息ID',
      schema: {
        example: {
          statusCode: 200,
          message: '邮件发送成功',
          data: {
            messageId: 'message-123456',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: '邮件发送失败',
      schema: {
        example: {
          statusCode: 400,
          message: '邮件发送失败',
          error: 'Invalid email address',
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: '服务器内部错误',
      schema: {
        example: {
          statusCode: 500,
          message: '服务器内部错误',
          error: 'Internal server error',
        },
      },
    }),
    ApiBody({
      type: SendEmailDto,
      description: '邮件发送请求参数',
      examples: {
        basic_email: {
          summary: '基础邮件',
          description: '发送简单的纯文本邮件',
          value: {
            to: 'recipient@example.com',
            subject: '测试邮件主题',
            text: '这是邮件的纯文本内容',
          },
        },
        html_email: {
          summary: 'HTML邮件',
          description: '发送HTML格式的邮件',
          value: {
            to: 'recipient@example.com',
            subject: 'HTML邮件主题',
            text: '这是邮件的纯文本内容',
            html: '<h1>这是邮件的HTML内容</h1><p>包含富文本格式</p>',
          },
        },
        email_with_cc: {
          summary: '带抄送的邮件',
          description: '发送带抄送收件人的邮件',
          value: {
            to: 'primary@example.com',
            cc: ['cc1@example.com', 'cc2@example.com'],
            subject: '带抄送的邮件',
            text: '这封邮件发送给主要收件人，并抄送给其他人',
          },
        },
        email_with_bcc: {
          summary: '带密送的邮件',
          description: '发送带密送收件人的邮件',
          value: {
            to: 'primary@example.com',
            bcc: ['bcc1@example.com', 'bcc2@example.com'],
            subject: '带密送的邮件',
            text: '这封邮件发送给主要收件人，并密送给其他人',
          },
        },
      },
    }),
    ApiHeader({
      name: 'Content-Type',
      description: '请求内容类型',
      required: true,
      schema: {
        type: 'string',
        default: 'application/json',
      },
    }),
  );

export const ApiVerifyConnectionDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '验证SMTP连接',
      description: '验证邮件服务器SMTP连接状态，检查邮件服务是否可用。',
      tags: ['Mail'],
    }),
    ApiProduces('application/json'),
    ApiResponse({
      status: 200,
      description: 'SMTP连接验证结果',
      schema: {
        example: {
          statusCode: 200,
          message: 'SMTP连接正常',
          data: {
            connected: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'SMTP连接失败',
      schema: {
        example: {
          statusCode: 200,
          message: 'SMTP连接失败',
          data: {
            connected: false,
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: '验证连接时发生错误',
      schema: {
        example: {
          statusCode: 500,
          message: '验证连接时发生错误',
          error: 'Connection timeout',
        },
      },
    }),
  );
