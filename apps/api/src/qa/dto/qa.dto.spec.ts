import { QAGeneratedBy, QATargetType } from '@/generated/prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateQARecordDto } from './create-qa-record.dto';
import { CreateQASessionDto } from './create-qa-session.dto';
import { UpdateQARecordDto } from './update-qa-record.dto';
import { UpdateQASessionDto } from './update-qa-session.dto';

describe('QA DTO validation', () => {
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
      totalTokens: 42,
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

  it('rejects invalid enums, negative tokens, and invalid citation scores', async () => {
    const session = plainToInstance(CreateQASessionDto, {
      title: 'Project Q&A',
      targetType: 'UNKNOWN',
    });
    const record = plainToInstance(CreateQARecordDto, {
      question: 'Q',
      answer: 'A',
      generatedBy: 'ROBOT',
      promptTokens: -1,
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
      expect.arrayContaining(['generatedBy', 'promptTokens', 'citations']),
    );
  });

  it('accepts partial session and record updates', async () => {
    const session = plainToInstance(UpdateQASessionDto, {
      title: 'Renamed session',
    });
    const record = plainToInstance(UpdateQARecordDto, {
      answer: 'Updated answer',
      citations: [],
    });

    await expect(validate(session)).resolves.toHaveLength(0);
    await expect(validate(record)).resolves.toHaveLength(0);
  });
});
