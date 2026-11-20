import { PermissionGuard } from '@/admin/permission/guards/permission.guard';
import { PermService } from '@/admin/permission/services/permission.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { QARecordController, QASessionController } from '@/qa/controllers';
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
  const memberId = `qa-e2e-member-${suffix}`;
  const readerId = `qa-e2e-reader-${suffix}`;
  const outsiderId = `qa-e2e-outsider-${suffix}`;
  const foreignOrgId = `qa-e2e-foreign-${suffix}`;
  const users = [userId, memberId, readerId, outsiderId];
  const allowed = (actor: string, permission: string) =>
    users.includes(actor) &&
    (actor !== readerId || permission.endsWith(':read'));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [QASessionController, QARecordController],
      providers: [
        PermissionGuard,
        {
          provide: PermService,
          useValue: {
            hasAnyPermission: (actor: string, permissions: string[]) =>
              Promise.resolve(
                permissions.some((permission) => allowed(actor, permission)),
              ),
            hasAllPermissions: (actor: string, permissions: string[]) =>
              Promise.resolve(
                permissions.every((permission) => allowed(actor, permission)),
              ),
          },
        },
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
      const actor =
        typeof req.headers['x-test-user'] === 'string'
          ? req.headers['x-test-user']
          : userId;
      req.authContext = {
        authMethod: 'jwt',
        userId: actor,
        orgId: actor === outsiderId ? foreignOrgId : orgId,
        permissions: [],
      };
      next();
    });
    app.useGlobalGuards(moduleRef.get(PermissionGuard));
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
    await prisma.user.createMany({
      data: users.map((id) => ({ id, username: id, active: true })),
    });
    await prisma.org.create({
      data: { id: orgId, name: 'QA E2E Org', code: orgId },
    });
    await prisma.org.create({
      data: {
        id: foreignOrgId,
        name: 'Foreign QA E2E Org',
        code: foreignOrgId,
      },
    });
    await prisma.orgMember.createMany({
      data: users.map((id) => ({
        orgId: id === outsiderId ? foreignOrgId : orgId,
        userId: id,
      })),
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.qASession.deleteMany({
        where: { orgId: { in: [orgId, foreignOrgId] } },
      });
      await prisma.orgMember.deleteMany({
        where: { orgId: { in: [orgId, foreignOrgId] } },
      });
      await prisma.org.deleteMany({
        where: { id: { in: [orgId, foreignOrgId] } },
      });
      await prisma.user.deleteMany({ where: { id: { in: users } } });
    }
    await app.close();
  });

  it('shares datasets across members while enforcing organization and operation permissions', async () => {
    const created = await request(httpServer)
      .post('/api/v1/qa/sessions')
      .send({ title: 'Shared knowledge' })
      .expect(201);
    const sessionId = readRequiredId(created.body as unknown);
    const base = `/api/v1/qa/sessions/${sessionId}`;
    const listed = await request(httpServer)
      .get('/api/v1/qa/sessions')
      .set('x-test-user', memberId)
      .query({ keyword: 'Shared' })
      .expect(200);
    expect(readItems(listed.body as unknown)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: sessionId, userId }),
      ]),
    );
    await request(httpServer)
      .get(`${base}/metadata`)
      .set('x-test-user', readerId)
      .expect(200);
    await request(httpServer)
      .patch(base)
      .set('x-test-user', readerId)
      .send({ title: 'Forbidden' })
      .expect(403);
    await request(httpServer)
      .patch(base)
      .set('x-test-user', memberId)
      .send({ title: 'Shared edit' })
      .expect(200);
    await request(httpServer)
      .get(`${base}/metadata`)
      .set('x-test-user', outsiderId)
      .expect(404);
    await request(httpServer)
      .patch(base)
      .set('x-test-user', outsiderId)
      .send({ title: 'Foreign' })
      .expect(404);
    await request(httpServer)
      .delete(base)
      .set('x-test-user', outsiderId)
      .expect(404);
    await request(httpServer)
      .post(`${base}/records`)
      .set('x-test-user', outsiderId)
      .send({ question: 'Q', answer: 'A' })
      .expect(404);

    const oldDate = new Date('2000-01-01T00:00:00Z');
    await prisma.qASession.update({
      where: { id: sessionId },
      data: { updatedAt: oldDate },
    });
    const recordResponse = await request(httpServer)
      .post(`${base}/records`)
      .set('x-test-user', memberId)
      .send({ question: 'Shared Q', answer: 'Shared A', generatedBy: 'HUMAN' })
      .expect(201);
    const recordId = readRequiredId(recordResponse.body as unknown);
    const stored = await prisma.qASession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    expect(stored.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    expect(stored.userId).toBe(userId);
    await request(httpServer)
      .patch(`/api/v1/qa/records/${recordId}`)
      .set('x-test-user', readerId)
      .send({ answer: 'Forbidden' })
      .expect(403);
    await request(httpServer)
      .patch(`/api/v1/qa/records/${recordId}`)
      .set('x-test-user', outsiderId)
      .send({ answer: 'Foreign' })
      .expect(404);
    const foreignRecords = await request(httpServer)
      .get(`${base}/records`)
      .set('x-test-user', outsiderId)
      .expect(200);
    expect(readItems(foreignRecords.body as unknown)).toEqual([]);
    await request(httpServer)
      .patch(`/api/v1/qa/records/${recordId}`)
      .set('x-test-user', memberId)
      .send({ answer: 'Updated by coworker' })
      .expect(200);
    await request(httpServer)
      .patch(`/api/v1/qa/records/${recordId}`)
      .send({ question: null })
      .expect(400);
    await request(httpServer)
      .post(`${base}/records`)
      .send({ question: '   ', answer: '   ' })
      .expect(400);
    await request(httpServer)
      .delete(base)
      .set('x-test-user', memberId)
      .expect(204);
    await request(httpServer)
      .get(`${base}/metadata`)
      .set('x-test-user', readerId)
      .expect(404);
    const hiddenRecords = await request(httpServer)
      .get(`${base}/records`)
      .expect(200);
    expect(readItems(hiddenRecords.body as unknown)).toEqual([]);
  });

  it('creates, edits, finds, and deletes sessions and records', async () => {
    const sessionResponse = await request(httpServer)
      .post('/api/v1/qa/sessions')
      .send({
        title: '产品会议问答',
        targetType: 'GLOBAL',
        metadata: { source: 'e2e' },
      })
      .expect(201);
    const sessionId = readRequiredId(sessionResponse.body as unknown);

    await request(httpServer)
      .patch(`/api/v1/qa/sessions/${sessionId}`)
      .send({ title: '产品发布问答' })
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toEqual(
          expect.objectContaining({ id: sessionId, title: '产品发布问答' }),
        );
      });

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

    await request(httpServer)
      .patch(`/api/v1/qa/records/${recordId}`)
      .send({
        answer: '会议确认系统将在 10 月 31 日上线。',
        citations: [],
      })
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toEqual(
          expect.objectContaining({
            id: recordId,
            answer: '会议确认系统将在 10 月 31 日上线。',
            citations: [],
          }),
        );
      });

    const listResponse = await request(httpServer)
      .get(`/api/v1/qa/sessions/${sessionId}/records`)
      .query({ keyword: '10 月 31 日' })
      .expect(200);

    expect(readItems(listResponse.body as unknown)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: recordId,
          session: { id: sessionId, title: '产品发布问答' },
        }),
      ]),
    );

    const otherSessionResponse = await request(httpServer)
      .post('/api/v1/qa/sessions')
      .send({ title: '其他数据集', targetType: 'GLOBAL' })
      .expect(201);
    const otherSessionId = readRequiredId(otherSessionResponse.body as unknown);
    const otherRecords = await request(httpServer)
      .get(`/api/v1/qa/sessions/${otherSessionId}/records`)
      .query({ keyword: '10 月 31 日' })
      .expect(200);
    expect(readItems(otherRecords.body as unknown)).toEqual([]);
    await request(httpServer).get('/api/v1/qa/records').expect(404);

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

    await request(httpServer)
      .post(`/api/v1/qa/records/${recordId}/feedback`)
      .send({ rating: null })
      .expect(201)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toEqual(
          expect.objectContaining({ id: recordId, rating: null }),
        );
      });

    await request(httpServer)
      .delete(`/api/v1/qa/records/${recordId}`)
      .expect(204);

    const emptyListResponse = await request(httpServer)
      .get(`/api/v1/qa/sessions/${sessionId}/records`)
      .expect(200);
    expect(readItems(emptyListResponse.body as unknown)).toHaveLength(0);

    await request(httpServer)
      .delete(`/api/v1/qa/sessions/${sessionId}`)
      .expect(204);
    await request(httpServer)
      .get(`/api/v1/qa/sessions/${sessionId}`)
      .expect(404);
  });
});
