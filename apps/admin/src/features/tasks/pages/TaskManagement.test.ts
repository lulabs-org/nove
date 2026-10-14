import { describe, expect, it } from 'vitest';
import { buildHandlerPayload, type TaskHandlerPayloadValues } from '../lib/taskPayload';

function taskValues(overrides: Partial<TaskHandlerPayloadValues>): TaskHandlerPayloadValues {
  return {
    handler: 'migrate_phone_hashes',
    ...overrides,
  };
}

describe('buildHandlerPayload', () => {
  it('builds the order-to-user linking payload', () => {
    expect(
      buildHandlerPayload(
        taskValues({
          handler: 'link_orders_to_users_by_phone',
          orderLinkBatchSize: 800,
        })
      )
    ).toEqual({ batchSize: 800 });
  });

  it('uses the default batch size for order linking', () => {
    expect(buildHandlerPayload(taskValues({ handler: 'link_orders_to_users_by_phone' }))).toEqual({
      batchSize: 500,
    });
  });
});
