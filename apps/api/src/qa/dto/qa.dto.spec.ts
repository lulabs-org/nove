import { QAGeneratedBy, QATargetType } from '@/generated/prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQARecordDto } from './create-qa-record.dto';
import { CreateQASessionDto } from './create-qa-session.dto';
import { UpdateQARecordDto } from './update-qa-record.dto';
import { UpdateQASessionDto } from './update-qa-session.dto';

describe('QA DTO validation', () => {
  it.each(['', '   ', null])(
    'rejects empty or null record content: %p',
    async (value) => {
      for (const Dto of [CreateQARecordDto, UpdateQARecordDto]) {
        const errors = await validate(
          plainToInstance(Dto, { question: value, answer: value }),
        );
        expect(errors.map((error) => error.property)).toEqual(
          expect.arrayContaining(['question', 'answer']),
        );
      }
      const errors = await validate(
        plainToInstance(UpdateQASessionDto, { title: value }),
      );
      expect(errors.map((error) => error.property)).toContain('title');
    },
  );

  it('rejects null collections, metadata, source and destination on partial updates', async () => {
    const errors = await validate(
      plainToInstance(UpdateQARecordDto, {
        citations: null,
        metadata: null,
        generatedBy: null,
        sessionId: null,
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'citations',
        'metadata',
        'generatedBy',
        'sessionId',
      ]),
    );
  });

  it('accepts valid session and nested record input', async () => {
    const session = plainToInstance(CreateQASessionDto, {
      title: 'Project Q&A',
      targetType: QATargetType.PROJECT,
      targetId: 'project-1',
    });
    const record = plainToInstance(CreateQARecordDto, {
      question: 'What changed?',
      answer: 'The release date changed.',
      generatedBy: QAGeneratedBy.AI,
      citations: [
        {
          sourceType: 'drive_file',
          sourceId: 'file-1',
          snippet: 'The release date is October 30.',
          relevanceScore: 0.9,
        },
      ],
    });

    await expect(validate(session)).resolves.toHaveLength(0);
    await expect(validate(record)).resolves.toHaveLength(0);
  });

  it('rejects invalid enums and invalid citation scores', async () => {
    const session = plainToInstance(CreateQASessionDto, {
      title: 'Project Q&A',
      targetType: 'UNKNOWN',
    });
    const record = plainToInstance(CreateQARecordDto, {
      question: 'Q',
      answer: 'A',
      generatedBy: 'ROBOT',
      citations: [
        {
          sourceType: 'drive_file',
          sourceId: 'file-1',
          snippet: 'text',
          relevanceScore: 2,
        },
      ],
    });

    expect((await validate(session)).map((error) => error.property)).toContain(
      'targetType',
    );
    expect((await validate(record)).map((error) => error.property)).toEqual(
      expect.arrayContaining(['generatedBy', 'citations']),
    );
  });

  it('accepts partial session and record updates', async () => {
    const session = plainToInstance(UpdateQASessionDto, {
      title: 'Renamed session',
    });
    const record = plainToInstance(UpdateQARecordDto, {
      answer: 'Updated answer',
      sessionId: 'session-2',
      citations: [],
    });

    await expect(validate(session)).resolves.toHaveLength(0);
    await expect(validate(record)).resolves.toHaveLength(0);
  });
});
