import {
  tasksControllerCreateCron,
  tasksControllerCreateOnce,
  tasksControllerList,
  tasksControllerPause,
  tasksControllerRemove,
  tasksControllerResume,
  tasksControllerRunNow,
  tasksControllerUpdate,
} from '../../../shared/lib/api/orval/business/tasks';
import type {
  CreateCronTask,
  CreateOnceTask,
  RunNowResult,
  ScheduledTask,
  TaskListData,
  TaskListParams,
  UpdateTask,
} from '../types';

interface RawTaskList {
  items?: ScheduledTask[];
  data?: ScheduledTask[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export const taskApi = {
  list: async (params: TaskListParams): Promise<TaskListData> => {
    const result = (await tasksControllerList(params)) as RawTaskList;

    return {
      data: result.items ?? result.data ?? [],
      total: result.total ?? 0,
      page: result.page ?? params.page ?? 1,
      pageSize: result.pageSize ?? params.pageSize ?? 10,
    };
  },

  createOnce: (data: CreateOnceTask): Promise<ScheduledTask> => {
    return tasksControllerCreateOnce(
      data as unknown as Record<string, unknown>
    ) as unknown as Promise<ScheduledTask>;
  },

  createCron: (data: CreateCronTask): Promise<ScheduledTask> => {
    return tasksControllerCreateCron(
      data as unknown as Record<string, unknown>
    ) as unknown as Promise<ScheduledTask>;
  },

  update: (id: string, data: UpdateTask): Promise<ScheduledTask> => {
    return tasksControllerUpdate(
      id,
      data as unknown as Record<string, unknown>
    ) as unknown as Promise<ScheduledTask>;
  },

  delete: (id: string): Promise<void> => {
    return tasksControllerRemove(id).then(() => undefined);
  },

  pauseQueue: (): Promise<{ ok: true }> => {
    return tasksControllerPause() as Promise<{ ok: true }>;
  },

  resumeQueue: (): Promise<{ ok: true }> => {
    return tasksControllerResume() as Promise<{ ok: true }>;
  },

  runNow: (id: string): Promise<RunNowResult> => {
    return tasksControllerRunNow(id) as unknown as Promise<RunNowResult>;
  },
};
