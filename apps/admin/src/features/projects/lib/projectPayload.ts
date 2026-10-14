import type { Dayjs } from 'dayjs';
import type { CreateProject, ProjectLevel, ProjectStatus } from '../types';

export interface ProjectFormValues {
  title: string;
  subtitle?: string;
  category?: string;
  image?: string;
  description?: string;
  level: ProjectLevel;
  duration?: string;
  maxStudents?: number;
  prerequisites?: Array<{ value?: string }>;
  outcomes?: Array<{ value?: string }>;
  tags?: string[];
  ownerId?: string;
  productId?: string;
  status: ProjectStatus;
  sortOrder: number;
  isFeatured: boolean;
  startDate?: Dayjs;
  endDate?: Dayjs;
  enrollDeadline?: Dayjs;
  metadataText?: string;
}

const nullableText = (value?: string): string | null => value?.trim() || null;

const stringList = (items?: Array<{ value?: string }>): string[] => [
  ...new Set(items?.map((item) => item.value?.trim()).filter(Boolean) as string[]),
];

export function parseProjectMetadata(value?: string): Record<string, unknown> {
  if (!value?.trim()) return {};
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('扩展元数据必须是 JSON 对象');
  }
  return parsed as Record<string, unknown>;
}

export function buildProjectPayload(values: ProjectFormValues): CreateProject {
  return {
    title: values.title.trim(),
    subtitle: nullableText(values.subtitle),
    category: nullableText(values.category),
    image: nullableText(values.image),
    description: nullableText(values.description),
    level: values.level,
    duration: nullableText(values.duration),
    maxStudents: values.maxStudents ?? null,
    prerequisites: stringList(values.prerequisites),
    outcomes: stringList(values.outcomes),
    tags: [...new Set((values.tags ?? []).map((tag) => tag.trim()).filter(Boolean))],
    ownerId: values.ownerId ?? null,
    productId: values.productId ?? null,
    status: values.status,
    sortOrder: values.sortOrder,
    isFeatured: values.isFeatured,
    startDate: values.startDate?.toISOString() ?? null,
    endDate: values.endDate?.toISOString() ?? null,
    enrollDeadline: values.enrollDeadline?.toISOString() ?? null,
    metadata: parseProjectMetadata(values.metadataText),
  };
}
