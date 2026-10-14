import type { TableQueryResult } from '../../shared/hooks/useTableQuery';

export type TaskType = 'ONCE' | 'CRON';

export type TaskStatus = 'PENDING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface ScheduledTask {
  id: string;
  name: string;
  handler: string;
  type: TaskType;
  queueName: string;
  jobId: string | null;
  cron: string | null;
  timezone: string | null;
  runAt: string | null;
  payload: Record<string, unknown>;
  status: TaskStatus;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TaskStatus;
  type?: TaskType;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDir?: 'asc' | 'desc';
}

export type TaskListData = TableQueryResult<ScheduledTask>;

export interface CreateOnceTask {
  name: string;
  handler: string;
  runAt: string;
  payload: Record<string, unknown>;
  jobIdHint?: string;
}

export interface CreateCronTask {
  name: string;
  handler: string;
  cron: string;
  timezone?: string;
  payload: Record<string, unknown>;
}

export interface UpdateTask {
  name?: string;
  handler?: string;
  cron?: string;
  timezone?: string;
  payload?: Record<string, unknown>;
  status?: TaskStatus;
}

export interface RunNowResult {
  jobId: string | number | null;
}
