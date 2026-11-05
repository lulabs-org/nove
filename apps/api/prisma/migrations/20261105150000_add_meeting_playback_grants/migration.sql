-- CreateEnum
CREATE TYPE "MeetingPlaybackScopeType" AS ENUM ('ORGANIZATION', 'PROJECT', 'HOSTS');

-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "project_id" TEXT;

-- CreateIndex
CREATE INDEX "meetings_project_id_idx" ON "meetings"("project_id");

-- AddForeignKey
ALTER TABLE "meetings"
ADD CONSTRAINT "meetings_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "meeting_playback_grants" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_user_id" TEXT NOT NULL,
    "wecom_platform_user_id" TEXT NOT NULL,
    "scope_type" "MeetingPlaybackScopeType" NOT NULL,
    "project_id" TEXT,
    "bound_api_key_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" VARCHAR(500),
    "granted_by_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "meeting_playback_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_playback_grant_hosts" (
    "id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "host_platform_user_id" TEXT,
    "host_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "meeting_playback_grant_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_playback_grants_org_id_active_idx" ON "meeting_playback_grants"("org_id", "active");

-- CreateIndex
CREATE INDEX "meeting_playback_grants_student_user_id_active_idx" ON "meeting_playback_grants"("student_user_id", "active");

-- CreateIndex
CREATE INDEX "meeting_playback_grants_wecom_platform_user_id_active_idx" ON "meeting_playback_grants"("wecom_platform_user_id", "active");

-- CreateIndex
CREATE INDEX "meeting_playback_grants_project_id_idx" ON "meeting_playback_grants"("project_id");

-- CreateIndex
CREATE INDEX "meeting_playback_grants_bound_api_key_id_idx" ON "meeting_playback_grants"("bound_api_key_id");

-- CreateIndex
CREATE INDEX "meeting_playback_grant_hosts_grant_id_idx" ON "meeting_playback_grant_hosts"("grant_id");

-- CreateIndex
CREATE INDEX "meeting_playback_grant_hosts_host_platform_user_id_idx" ON "meeting_playback_grant_hosts"("host_platform_user_id");

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_org_id_fkey"
FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_student_user_id_fkey"
FOREIGN KEY ("student_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_wecom_platform_user_id_fkey"
FOREIGN KEY ("wecom_platform_user_id") REFERENCES "user_platforms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_project_id_fkey"
FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_bound_api_key_id_fkey"
FOREIGN KEY ("bound_api_key_id") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grants"
ADD CONSTRAINT "meeting_playback_grants_granted_by_id_fkey"
FOREIGN KEY ("granted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grant_hosts"
ADD CONSTRAINT "meeting_playback_grant_hosts_grant_id_fkey"
FOREIGN KEY ("grant_id") REFERENCES "meeting_playback_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_playback_grant_hosts"
ADD CONSTRAINT "meeting_playback_grant_hosts_host_platform_user_id_fkey"
FOREIGN KEY ("host_platform_user_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 回放查询与开通权限。已有超级管理员、管理员、经理和班主任自动挂上开通/查询权限。
INSERT INTO "permissions" (
    "id",
    "name",
    "code",
    "description",
    "resource",
    "action",
    "type",
    "level",
    "sortOrder",
    "active",
    "oauth_delegatable",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        'perm_meeting_playback_read',
        '查看会议回放',
        'meeting-playback:read',
        '查询当前身份被授权的会议回放、纪要摘要与补课引导',
        'meeting-playback',
        'read',
        'API',
        1,
        0,
        true,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'perm_meeting_playback_grant',
        '开通会议回放',
        'meeting-playback:grant',
        '按同学开通、调整或收回会议回放查看权限，并绑定企业微信身份',
        'meeting-playback',
        'grant',
        'API',
        1,
        1,
        true,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'perm_mcp_meeting_playback',
        '使用会议回放补课工具',
        'mcp-tool:meeting-playback',
        'Workbuddy 通过 MCP 按企业微信身份查询授权回放并生成补课引导',
        'mcp-tool',
        'meeting-playback',
        'API',
        1,
        0,
        true,
        false,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "created_at", "updated_at")
SELECT
    substr(md5(r."id" || ':' || p."code"), 1, 32),
    r."id",
    p."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "roles" r
JOIN "permissions" p ON p."code" IN (
    'meeting-playback:read',
    'meeting-playback:grant',
    'mcp-tool:meeting-playback'
)
WHERE r."code" IN ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'HEAD_TEACHER')
  AND r."isDeleted" = false
  AND r."deleted_at" IS NULL
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
