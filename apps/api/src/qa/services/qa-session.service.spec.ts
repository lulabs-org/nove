import { QATargetType } from '@/generated/prisma/client';
import { MinuteService } from '@/minute/services/minute.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { QASessionRepository } from '../repositories';
import { QASessionService } from './qa-session.service';

describe('QASessionService', () => {
  let service: QASessionService;
  let sessions: {
    create: jest.Mock;
    findMany: jest.Mock;
    findById: jest.Mock;
    softDelete: jest.Mock;
  };
  let minuteService: { getById: jest.Mock };
  let prisma: {
    project: { findFirst: jest.Mock };
    driveFile: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    sessions = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      softDelete: jest.fn(),
    };
    minuteService = { getById: jest.fn() };
    prisma = {
      project: { findFirst: jest.fn() },
      driveFile: { findFirst: jest.fn() },
    };
    service = new QASessionService(
      sessions as unknown as QASessionRepository,
      minuteService as unknown as MinuteService,
      prisma as unknown as PrismaService,
    );
  });

  it('requires a signed-in user', () => {
    expect(() => service.requireUserId()).toThrow(ForbiddenException);
  });

  it('rejects a target id for a global session', async () => {
    await expect(
      service.create('org-1', 'user-1', {
        title: 'Global questions',
        targetType: QATargetType.GLOBAL,
        targetId: 'target-1',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('creates a global session without a target', async () => {
    sessions.create.mockResolvedValue({ id: 'session-1' });

    await service.create('org-1', 'user-1', { title: ' General ' });

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        targetType: QATargetType.GLOBAL,
        targetId: null,
        title: 'General',
      }),
    );
  });

  it('requires a target id for a scoped session', async () => {
    await expect(
      service.create('org-1', 'user-1', {
        title: 'Minute questions',
        targetType: QATargetType.MINUTE,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates a minute in the current organization before creating', async () => {
    minuteService.getById.mockResolvedValue({ id: 'minute-1' });
    sessions.create.mockResolvedValue({ id: 'session-1' });

    await service.create('org-1', 'user-1', {
      title: ' Minute Q&A ',
      targetType: QATargetType.MINUTE,
      targetId: 'minute-1',
    });

    expect(minuteService.getById).toHaveBeenCalledWith('minute-1', 'org-1');
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-1',
        userId: 'user-1',
        title: 'Minute Q&A',
        targetId: 'minute-1',
      }),
    );
  });

  it('does not create a project session for another organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create('org-1', 'user-1', {
        title: 'Project questions',
        targetType: QATargetType.PROJECT,
        targetId: 'project-2',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'project-2', orgId: 'org-1', deletedAt: null },
      }),
    );
  });

  it('returns paginated sessions for the current user and organization', async () => {
    sessions.findMany.mockResolvedValue({
      items: [{ id: 'session-1' }],
      total: 5,
    });

    const result = await service.findAll('org-1', 'user-1', {
      page: 2,
      pageSize: 2,
      targetId: ' target-1 ',
    });

    expect(sessions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 'org-1',
        userId: 'user-1',
        skip: 2,
        take: 2,
        targetId: 'target-1',
      }),
    );
    expect(result.totalPages).toBe(3);
  });

  it('throws when a session is not owned by the current user', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(
      service.findById('session-2', 'org-1', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('soft deletes an owned session', async () => {
    sessions.findById.mockResolvedValue({ id: 'session-1' });

    await service.delete('session-1', 'org-1', 'user-1');

    expect(sessions.softDelete).toHaveBeenCalledWith(
      'session-1',
      'org-1',
      'user-1',
    );
  });
});
