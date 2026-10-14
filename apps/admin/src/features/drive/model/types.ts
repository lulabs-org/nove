export interface DriveSpace {
  id: string;
  name: string;
  type: 'PERSONAL' | 'ORG' | 'SYSTEM_UNASSIGNED';
  orgId: string | null;
}

export interface DriveNode {
  id: string;
  spaceId: string;
  parentId: string | null;
  type: 'FILE' | 'FOLDER';
  name: string;
  inheritAcl: boolean;
  fileId: string | null;
  contentType: string | null;
  sizeBytes: string | null;
  fileStatus: 'VERIFYING' | 'ACTIVE' | 'REJECTED' | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriveNodePage {
  items: DriveNode[];
  nextCursor: string | null;
}

export interface UploadSession {
  id: string;
  expiresAt: string;
  recommendedPartSizeBytes: number;
  requiresMalwareScan: boolean;
}

export interface MinuteDriveFile {
  id: string;
  minuteId: string;
  fileType: string;
  durationMs: string | null;
  resolution: string | null;
  fileId: string;
  nodeId: string | null;
  name: string;
  contentType: string | null;
  sizeBytes: string | null;
  status: string | null;
  createdAt: string;
}
