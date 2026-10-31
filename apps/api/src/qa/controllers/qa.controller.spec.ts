/* eslint-disable @typescript-eslint/unbound-method */
import { PERMISSIONS_KEY } from '@/admin/permission/decorators/permissions.decorator';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { QAFeedbackController } from './qa-feedback.controller';
import { QAMinuteShortcutController } from './qa-minute-shortcut.controller';
import { QARecordController } from './qa-record.controller';
import { QASessionController } from './qa-session.controller';

describe('QA controller contracts', () => {
  it('publishes the required route groups', () => {
    expect(Reflect.getMetadata(PATH_METADATA, QASessionController)).toBe(
      'api/v1/qa/sessions',
    );
    expect(Reflect.getMetadata(PATH_METADATA, QARecordController)).toBe(
      'api/v1/qa',
    );
    expect(Reflect.getMetadata(PATH_METADATA, QAFeedbackController)).toBe(
      'api/v1/qa/records',
    );
    expect(Reflect.getMetadata(PATH_METADATA, QAMinuteShortcutController)).toBe(
      'api/v1/minutes',
    );
  });

  it.each([
    [
      QASessionController.prototype.create,
      '/',
      RequestMethod.POST,
      'qa:session:create',
    ],
    [
      QASessionController.prototype.findAll,
      '/',
      RequestMethod.GET,
      'qa:session:read',
    ],
    [
      QASessionController.prototype.findById,
      ':id',
      RequestMethod.GET,
      'qa:session:read',
    ],
    [
      QASessionController.prototype.delete,
      ':id',
      RequestMethod.DELETE,
      'qa:session:delete',
    ],
    [
      QASessionController.prototype.update,
      ':id',
      RequestMethod.PATCH,
      'qa:session:update',
    ],
    [
      QARecordController.prototype.create,
      'sessions/:sessionId/records',
      RequestMethod.POST,
      'qa:record:create',
    ],
    [
      QARecordController.prototype.createBatch,
      'records/batch',
      RequestMethod.POST,
      'qa:record:create',
    ],
    [
      QARecordController.prototype.findAll,
      'records',
      RequestMethod.GET,
      'qa:record:read',
    ],
    [
      QARecordController.prototype.update,
      'records/:recordId',
      RequestMethod.PATCH,
      'qa:record:update',
    ],
    [
      QARecordController.prototype.delete,
      'records/:recordId',
      RequestMethod.DELETE,
      'qa:record:delete',
    ],
    [
      QAFeedbackController.prototype.submit,
      ':recordId/feedback',
      RequestMethod.POST,
      'qa:feedback:create',
    ],
    [
      QAMinuteShortcutController.prototype.findByMinute,
      ':minuteId/qa-records',
      RequestMethod.GET,
      'qa:record:read',
    ],
  ] as const)(
    'documents route and permission metadata',
    (handler, path, method, permission) => {
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method);
      expect(Reflect.getMetadata(PERMISSIONS_KEY, handler)).toEqual([
        permission,
      ]);
    },
  );
});
