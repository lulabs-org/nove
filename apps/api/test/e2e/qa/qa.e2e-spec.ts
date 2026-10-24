import { PrismaService } from '@/prisma/prisma.service';
import { PrismaModule } from '@/prisma/prisma.module';
import {
  QAFeedbackController,
  QARecordController,
  QASessionController,
} from '@/qa/controllers';
import { QARecordRepository, QASessionRepository } from '@/qa/repositories';
import {
  QAFeedbackService,
  QARecordService,
  QASessionService,
} from '@/qa/services';
import { MinuteService } from '@/minute/services/minute.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import type { Server } from 'http';
import * as request from 'supertest';

function readRequiredId(body: unknown): string {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('id' in body) ||
    typeof body.id !== 'string'
  ) {
    throw new Error('Expected response body to contain a string id');
  }
  return body.id;
}

function readItems(body: unknown): unknown[] {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('items' in body) ||
    !Array.isArray(body.items)
  ) {
    throw new Error('Expected response body to contain an items array');
  }
  return body.items;
}

describe('QA data hub (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  const suffix = Date.now().toString();
  const userId = `qa-e2e-user-${suffix}`;
  const orgId = `qa-e2e-org-${suffix}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [
        QASessionController,
        QARecordController,
        QAFeedbackController,
      ],
      providers: [
        QASessionService,
        QARecordService,
        QAFeedbackService,
        QASessionRepository,
        QARecordRepository,
        {
          provide: MinuteService,
          useValue: { getById: jest.fn() },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.authContext = {
        authMethod: 'jwt',
        userId,
        orgId,
        permissions: [],
      };
      next();
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    httpServer = app.getHttpServer() as Server;

    prisma = app.get(PrismaService);
    await prisma.user.create({
      data: { id: userId, username: userId, active: true },
    });
    await prisma.org.create({
      data: { id: orgId, name: 'QA E2E Org', code: orgId },
    });
    await prisma.orgMember.create({ data: { orgId, userId } });
  });

  afterAll(async () => {
    await prisma.qASession.deleteMany({ where: { orgId } });
    await prisma.orgMember.deleteMany({ where: { orgId, userId } });
    await prisma.org.deleteMany({ where: { id: orgId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });

  it('creates a session, stores and finds a record, then submits feedback', async () => {
    const sessionResponse = await request(httpServer)
      .post('/api/v1/qa/sessions')
      .send({
        title: '产品会议问答',
        targetType: 'GLOBAL',
        metadata: { source: 'e2e' },
      })
      .expect(201);
    const sessionId = readRequiredId(sessionResponse.body as unknown);

    const recordResponse = await request(httpServer)
      .post(`/api/v1/qa/sessions/${sessionId}/records`)
      .send({
        question: '本次会议确定了什么上线时间？',
        answer: '会议决定系统将在 10 月 30 日上线。',
        generatedBy: 'AI',
        citations: [
          {
            sourceType: 'transcript',
            sourceId: 'demo-minute-1',
            snippet: '系统最终定于 10 月 30 日上线。',
            relevanceScore: 0.96,
          },
        ],
      })
      .expect(201);
    const recordId = readRequiredId(recordResponse.body as unknown);

    const listResponse = await request(httpServer)
      .get('/api/v1/qa/records')
      .query({ keyword: '10 月 30 日' })
      .expect(200);

    expect(readItems(listResponse.body as unknown)).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: recordId })]),
    );

    const feedbackResponse = await request(httpServer)
      .post(`/api/v1/qa/records/${recordId}/feedback`)
      .send({
        rating: 'LIKE',
        reason: '回答准确',
        comment: '答案与会议原文一致',
      })
      .expect(201);

    expect(feedbackResponse.body as unknown).toEqual(
      expect.objectContaining({
        id: recordId,
        rating: 'LIKE',
        feedbackReason: '回答准确',
        feedbackComment: '答案与会议原文一致',
      }),
    );
  });
});
