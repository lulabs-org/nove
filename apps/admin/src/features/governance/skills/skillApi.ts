import { mutator } from '../../../shared/lib/api/mutator';

export type SkillCategory = 'MEETING' | 'SPEAKER' | 'TASK' | 'REPORT' | 'GENERAL';
export type SkillStatus = 'ACTIVE' | 'DISABLED' | 'DEPRECATED';

export interface Skill {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: SkillCategory;
  status: SkillStatus;
  currentVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillVersion {
  id: string;
  version: string;
  changelog: string | null;
  sizeBytes: string;
  checksumSha256: string | null;
  createdAt: string;
}

export interface SkillDetail extends Skill {
  versions: SkillVersion[];
}
export interface SkillPage {
  items: Skill[];
  total: number;
  page: number;
  pageSize: number;
}

const base = '/api/v1/skills';
const path = (id: string) => `${base}/${encodeURIComponent(id)}`;
const versionPath = (id: string, version: string) =>
  `${path(id)}/versions/${encodeURIComponent(version)}`;

export const skillApi = {
  list: (params: {
    page: number;
    pageSize: number;
    keyword?: string;
    category?: SkillCategory;
    status?: SkillStatus;
  }) => mutator<SkillPage>({ url: base, method: 'GET', params }),
  get: (id: string) => mutator<SkillDetail>({ url: path(id), method: 'GET' }),
  upload: (file: File, version: string, changelog?: string, id?: string) => {
    const data = new FormData();
    data.append('file', file);
    data.append('version', version);
    if (changelog) data.append('changelog', changelog);
    return mutator<Skill | SkillVersion>({
      url: id ? `${path(id)}/versions` : `${base}/import-zip`,
      method: 'POST',
      data,
    });
  },
  update: (
    id: string,
    data: Partial<Pick<Skill, 'name' | 'description' | 'category' | 'status'>>
  ) => mutator<Skill>({ url: path(id), method: 'PATCH', data }),
  activate: (id: string, version: string) =>
    mutator<Skill>({ url: `${versionPath(id, version)}/activate`, method: 'POST' }),
  deleteVersion: (id: string, version: string) =>
    mutator<void>({ url: versionPath(id, version), method: 'DELETE' }),
  delete: (id: string) => mutator<void>({ url: path(id), method: 'DELETE' }),
  download: (id: string, version: string) =>
    mutator<Blob>({
      url: `${versionPath(id, version)}/download`,
      method: 'GET',
      responseType: 'blob',
    }),
};
