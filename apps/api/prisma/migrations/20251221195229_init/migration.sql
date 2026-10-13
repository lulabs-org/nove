-- CreateEnum
CREATE TYPE "LoginLogType" AS ENUM ('USERNAME_PASSWORD', 'EMAIL_PASSWORD', 'EMAIL_CODE', 'PHONE_PASSWORD', 'PHONE_CODE', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "RecordingSource" AS ENUM ('PLATFORM_AUTO', 'USER_MANUAL', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecordingFileType" AS ENUM ('VIDEO', 'AUDIO', 'TRANSCRIPT', 'CHAT');

-- CreateEnum
CREATE TYPE "GenerationMethod" AS ENUM ('AI', 'MANUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('TENCENT_MEETING', 'ZOOM', 'TEAMS', 'DINGTALK', 'FEISHU', 'WEBEX', 'VOOV', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ONE_TIME', 'RECURRING', 'INSTANT', 'SCHEDULED', 'WEBINAR');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('VIDEO', 'AUDIO', 'TRANSCRIPT', 'SUMMARY', 'CHAT', 'SHARED_SCREEN', 'WHITEBOARD', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'TWD', 'SGD', 'AUD', 'CAD');

-- CreateEnum
CREATE TYPE "PermissionType" AS ENUM ('MENU', 'BUTTON', 'API', 'DATA', 'FIELD');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('COURSE', 'MEMBERSHIP', 'CONSULTATION', 'MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('SYSTEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'OSS', 'COS', 'S3');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('ONCE', 'CRON');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('TENCENT_MEETING', 'ZOOM', 'TEAMS', 'DINGTALK', 'FEISHU', 'WEBEX', 'VOOV', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "VerificationCodeType" AS ENUM ('REGISTER', 'LOGIN', 'RESET_PASSWORD');

-- CreateTable
CREATE TABLE "accounts" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "authenticators" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "authenticators_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculums" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "title" VARCHAR(100),
    "description" TEXT,
    "week" INTEGER,
    "topics" JSONB,
    "goals" JSONB,

    CONSTRAINT "curriculums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "target" TEXT NOT NULL,
    "loginType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_send_limits" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "sendCount" INTEGER NOT NULL DEFAULT 1,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_send_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "platform" "MeetingPlatform" NOT NULL,
    "meeting_id" VARCHAR(100) NOT NULL,
    "sub_meeting_id" VARCHAR(100),
    "external_id" VARCHAR(100),
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "meeting_code" VARCHAR(50),
    "type" "MeetingType" NOT NULL DEFAULT 'SCHEDULED',
    "language" VARCHAR(10),
    "tags" TEXT[],
    "created_by_id" TEXT,
    "host_id" TEXT,
    "participantCount" INTEGER,
    "scheduled_start_at" TIMESTAMPTZ(6),
    "scheduled_end_at" TIMESTAMPTZ(6),
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "timezone" VARCHAR(50),
    "hasRecording" BOOLEAN NOT NULL DEFAULT false,
    "recordingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_recordings" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "source" "RecordingSource" NOT NULL DEFAULT 'PLATFORM_AUTO',
    "start_at" TIMESTAMPTZ(6),
    "end_at" TIMESTAMPTZ(6),
    "status" "RecordingStatus" NOT NULL DEFAULT 'RECORDING',
    "recorder_user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "meet_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_recording_files" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "file_object_id" UUID NOT NULL,
    "file_type" "RecordingFileType" NOT NULL DEFAULT 'VIDEO',
    "duration_ms" BIGINT,
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "meet_recording_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_summaries" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(500),
    "content" TEXT NOT NULL,
    "keyPoints" JSONB,
    "actionItems" JSONB,
    "decisions" JSONB,
    "participants" JSONB,
    "generatedBy" "GenerationMethod",
    "aiModel" TEXT,
    "confidence" DOUBLE PRECISION,
    "language" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "parentSummaryId" TEXT,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "tags" TEXT[],
    "meetingId" TEXT NOT NULL,
    "transcriptId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meet_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_participants" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "platformUserId" TEXT,
    "joinTime" TIMESTAMP(3),
    "leftTime" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "instanceId" INTEGER,
    "userRole" INTEGER,
    "sessionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meet_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meet_user_actions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,

    CONSTRAINT "meet_user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "externalOrderData" JSONB,
    "productId" TEXT,
    "productName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "customerPhoneCode" TEXT,
    "userId" TEXT,
    "channelId" INTEGER,
    "currentOwnerId" TEXT,
    "financialCloserId" TEXT,
    "financialClosedAt" TIMESTAMP(3),
    "financialClosed" BOOLEAN NOT NULL DEFAULT false,
    "amount" INTEGER NOT NULL,
    "currency" "Currency",
    "amountCny" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "effectiveDate" DATE,
    "benefitStartDate" DATE,
    "benefitDurationDays" INTEGER,
    "activeDays" INTEGER,
    "benefitDaysRemaining" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" "PermissionType" NOT NULL DEFAULT 'MENU',
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_permission_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_permission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "category" "ProductCategory" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "price" INTEGER,
    "originalPrice" INTEGER,
    "currency" "Currency" NOT NULL DEFAULT 'CNY',
    "durationDays" INTEGER,
    "maxUsers" INTEGER,
    "tags" TEXT[],
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "downloadUrl" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "salesCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "subtitle" VARCHAR(150),
    "category" VARCHAR(50),
    "image" VARCHAR(200),
    "duration" VARCHAR(20),
    "level" VARCHAR(20),
    "max_students" INTEGER,
    "description" TEXT,
    "slug" VARCHAR(50),
    "prerequisites" JSONB,
    "outcomes" JSONB,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_refunds" (
    "id" TEXT NOT NULL,
    "afterSaleCode" TEXT,
    "orderId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "refundChannel" TEXT,
    "approvalUrl" TEXT,
    "createdBy" TEXT,
    "refundAmount" DECIMAL(10,2),
    "refundReason" TEXT,
    "benefitEndedAt" DATE,
    "benefitUsedDays" INTEGER,
    "applicantName" TEXT,
    "isFinancialSettled" BOOLEAN NOT NULL DEFAULT false,
    "financialSettledAt" DATE,
    "financialNote" TEXT,
    "parentId" TEXT,
    "productCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_departments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_data_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_data_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_data_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_data_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "RoleType" NOT NULL DEFAULT 'CUSTOM',
    "level" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_objects" (
    "id" UUID NOT NULL,
    "provider" "StorageProvider" NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "content_type" TEXT,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "checksum_sha256" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobId" TEXT,
    "repeatKey" TEXT,
    "cron" TEXT,
    "runAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "source" TEXT,
    "rawJson" JSONB,
    "language" TEXT NOT NULL DEFAULT 'zh-CN',
    "status" SMALLINT NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recording_id" TEXT,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_paragraphs" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "pid" TEXT NOT NULL,
    "startTimeMs" BIGINT NOT NULL,
    "endTimeMs" BIGINT NOT NULL,
    "speakerId" TEXT,

    CONSTRAINT "transcript_paragraphs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_sentences" (
    "id" TEXT NOT NULL,
    "paragraphId" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "startTimeMs" BIGINT NOT NULL,
    "endTimeMs" BIGINT NOT NULL,
    "text" TEXT,

    CONSTRAINT "transcript_sentences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_words" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "wid" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startTimeMs" BIGINT NOT NULL,
    "endTimeMs" BIGINT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "transcript_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50),
    "password" TEXT,
    "email" VARCHAR(255),
    "emailVerifiedAt" TIMESTAMP(3),
    "countryCode" TEXT,
    "phone" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_platforms" (
    "id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "platform_uuid" TEXT,
    "platform_data" JSONB DEFAULT '{}',
    "user_name" TEXT,
    "email" TEXT,
    "avatar" TEXT,
    "country_code" TEXT,
    "phone" TEXT,
    "phone_hash" TEXT,
    "user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_seen_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_platforms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "VerificationCodeType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "authenticators_credentialID_key" ON "authenticators"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "channels_code_key" ON "channels"("code");

-- CreateIndex
CREATE INDEX "curriculums_project_id_idx" ON "curriculums"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

-- CreateIndex
CREATE INDEX "departments_parentId_idx" ON "departments"("parentId");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_organizationId_active_idx" ON "departments"("organizationId", "active");

-- CreateIndex
CREATE INDEX "departments_parentId_sortOrder_idx" ON "departments"("parentId", "sortOrder");

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_ip_createdAt_idx" ON "login_logs"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "login_logs_target_createdAt_idx" ON "login_logs"("target", "createdAt");

-- CreateIndex
CREATE INDEX "login_logs_success_createdAt_idx" ON "login_logs"("success", "createdAt");

-- CreateIndex
CREATE INDEX "code_send_limits_ip_lastSentAt_idx" ON "code_send_limits"("ip", "lastSentAt");

-- CreateIndex
CREATE INDEX "code_send_limits_target_lastSentAt_idx" ON "code_send_limits"("target", "lastSentAt");

-- CreateIndex
CREATE UNIQUE INDEX "code_send_limits_target_ip_key" ON "code_send_limits"("target", "ip");

-- CreateIndex
CREATE INDEX "meetings_platform_idx" ON "meetings"("platform");

-- CreateIndex
CREATE INDEX "meetings_start_at_idx" ON "meetings"("start_at");

-- CreateIndex
CREATE INDEX "meetings_end_at_idx" ON "meetings"("end_at");

-- CreateIndex
CREATE INDEX "meetings_recordingStatus_idx" ON "meetings"("recordingStatus");

-- CreateIndex
CREATE INDEX "meetings_processingStatus_idx" ON "meetings"("processingStatus");

-- CreateIndex
CREATE INDEX "meetings_tags_idx" ON "meetings"("tags");

-- CreateIndex
CREATE INDEX "meetings_deleted_at_idx" ON "meetings"("deleted_at");

-- CreateIndex
CREATE INDEX "meetings_created_at_idx" ON "meetings"("created_at");

-- CreateIndex
CREATE INDEX "meetings_platform_start_at_idx" ON "meetings"("platform", "start_at");

-- CreateIndex
CREATE INDEX "meetings_host_id_start_at_idx" ON "meetings"("host_id", "start_at");

-- CreateIndex
CREATE INDEX "meetings_created_by_id_start_at_idx" ON "meetings"("created_by_id", "start_at");

-- CreateIndex
CREATE INDEX "meetings_deleted_at_created_at_idx" ON "meetings"("deleted_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_platform_meeting_id_key" ON "meetings"("platform", "meeting_id");

-- CreateIndex
CREATE INDEX "idx_recordings_meeting" ON "meet_recordings"("meeting_id");

-- CreateIndex
CREATE INDEX "idx_recording_files_recording" ON "meet_recording_files"("recording_id");

-- CreateIndex
CREATE INDEX "meet_summaries_meetingId_idx" ON "meet_summaries"("meetingId");

-- CreateIndex
CREATE INDEX "meet_summaries_isLatest_idx" ON "meet_summaries"("isLatest");

-- CreateIndex
CREATE INDEX "meet_summaries_status_idx" ON "meet_summaries"("status");

-- CreateIndex
CREATE INDEX "meet_summaries_createdBy_idx" ON "meet_summaries"("createdBy");

-- CreateIndex
CREATE INDEX "meet_summaries_version_idx" ON "meet_summaries"("version");

-- CreateIndex
CREATE INDEX "meet_summaries_language_idx" ON "meet_summaries"("language");

-- CreateIndex
CREATE INDEX "meet_summaries_reviewedBy_idx" ON "meet_summaries"("reviewedBy");

-- CreateIndex
CREATE INDEX "meet_summaries_meetingId_isLatest_idx" ON "meet_summaries"("meetingId", "isLatest");

-- CreateIndex
CREATE INDEX "meet_summaries_status_createdAt_idx" ON "meet_summaries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "meet_participants_meetingId_idx" ON "meet_participants"("meetingId");

-- CreateIndex
CREATE INDEX "meet_participants_platformUserId_idx" ON "meet_participants"("platformUserId");

-- CreateIndex
CREATE INDEX "idx_actions_user_time" ON "meet_user_actions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_actions_target" ON "meet_user_actions"("target_type", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderCode_key" ON "orders"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_productId_idx" ON "orders"("productId");

-- CreateIndex
CREATE INDEX "orders_channelId_idx" ON "orders"("channelId");

-- CreateIndex
CREATE INDEX "orders_currentOwnerId_idx" ON "orders"("currentOwnerId");

-- CreateIndex
CREATE INDEX "orders_financialClosed_idx" ON "orders"("financialClosed");

-- CreateIndex
CREATE INDEX "orders_paidAt_idx" ON "orders"("paidAt");

-- CreateIndex
CREATE INDEX "orders_effectiveDate_idx" ON "orders"("effectiveDate");

-- CreateIndex
CREATE INDEX "orders_userId_paidAt_idx" ON "orders"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "orders_financialClosed_paidAt_idx" ON "orders"("financialClosed", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "organizations_parentId_idx" ON "organizations"("parentId");

-- CreateIndex
CREATE INDEX "organizations_code_idx" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "organizations_active_idx" ON "organizations"("active");

-- CreateIndex
CREATE INDEX "organizations_parentId_sortOrder_idx" ON "organizations"("parentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "permissions_type_idx" ON "permissions"("type");

-- CreateIndex
CREATE INDEX "permissions_parentId_idx" ON "permissions"("parentId");

-- CreateIndex
CREATE INDEX "permissions_type_active_idx" ON "permissions"("type", "active");

-- CreateIndex
CREATE INDEX "permissions_parentId_sortOrder_idx" ON "permissions"("parentId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "data_permission_rules_code_key" ON "data_permission_rules"("code");

-- CreateIndex
CREATE INDEX "data_permission_rules_code_idx" ON "data_permission_rules"("code");

-- CreateIndex
CREATE INDEX "data_permission_rules_resource_idx" ON "data_permission_rules"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_publishedAt_idx" ON "products"("publishedAt");

-- CreateIndex
CREATE INDEX "products_status_publishedAt_idx" ON "products"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "products_category_status_idx" ON "products"("category", "status");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_jti_key" ON "refresh_tokens"("jti");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_deviceId_userId_idx" ON "refresh_tokens"("deviceId", "userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_revokedAt_idx" ON "refresh_tokens"("revokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "order_refunds_orderId_idx" ON "order_refunds"("orderId");

-- CreateIndex
CREATE INDEX "order_refunds_createdBy_idx" ON "order_refunds"("createdBy");

-- CreateIndex
CREATE INDEX "order_refunds_isFinancialSettled_idx" ON "order_refunds"("isFinancialSettled");

-- CreateIndex
CREATE INDEX "order_refunds_submittedAt_idx" ON "order_refunds"("submittedAt");

-- CreateIndex
CREATE INDEX "order_refunds_isFinancialSettled_submittedAt_idx" ON "order_refunds"("isFinancialSettled", "submittedAt");

-- CreateIndex
CREATE INDEX "user_organizations_userId_idx" ON "user_organizations"("userId");

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_idx" ON "user_organizations"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_userId_organizationId_key" ON "user_organizations"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "user_departments_userId_idx" ON "user_departments"("userId");

-- CreateIndex
CREATE INDEX "user_departments_departmentId_idx" ON "user_departments"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_departments_userId_departmentId_key" ON "user_departments"("userId", "departmentId");

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_permissions_permissionId_idx" ON "user_permissions"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE INDEX "role_data_permissions_roleId_idx" ON "role_data_permissions"("roleId");

-- CreateIndex
CREATE INDEX "role_data_permissions_ruleId_idx" ON "role_data_permissions"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_data_permissions_roleId_ruleId_key" ON "role_data_permissions"("roleId", "ruleId");

-- CreateIndex
CREATE INDEX "user_data_permissions_userId_idx" ON "user_data_permissions"("userId");

-- CreateIndex
CREATE INDEX "user_data_permissions_ruleId_idx" ON "user_data_permissions"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "user_data_permissions_userId_ruleId_key" ON "user_data_permissions"("userId", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_code_idx" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_type_idx" ON "roles"("type");

-- CreateIndex
CREATE INDEX "roles_active_idx" ON "roles"("active");

-- CreateIndex
CREATE INDEX "roles_type_active_idx" ON "roles"("type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "storage_objects_provider_bucket_object_key_key" ON "storage_objects"("provider", "bucket", "object_key");

-- CreateIndex
CREATE INDEX "scheduled_tasks_queueName_idx" ON "scheduled_tasks"("queueName");

-- CreateIndex
CREATE INDEX "scheduled_tasks_type_idx" ON "scheduled_tasks"("type");

-- CreateIndex
CREATE INDEX "scheduled_tasks_status_idx" ON "scheduled_tasks"("status");

-- CreateIndex
CREATE INDEX "transcripts_created_at_idx" ON "transcripts"("created_at");

-- CreateIndex
CREATE INDEX "transcripts_recording_id_idx" ON "transcripts"("recording_id");

-- CreateIndex
CREATE INDEX "transcript_paragraphs_transcriptId_startTimeMs_idx" ON "transcript_paragraphs"("transcriptId", "startTimeMs");

-- CreateIndex
CREATE INDEX "transcript_paragraphs_speakerId_idx" ON "transcript_paragraphs"("speakerId");

-- CreateIndex
CREATE UNIQUE INDEX "transcript_paragraphs_transcriptId_pid_key" ON "transcript_paragraphs"("transcriptId", "pid");

-- CreateIndex
CREATE INDEX "transcript_sentences_startTimeMs_idx" ON "transcript_sentences"("startTimeMs");

-- CreateIndex
CREATE UNIQUE INDEX "transcript_sentences_paragraphId_sid_key" ON "transcript_sentences"("paragraphId", "sid");

-- CreateIndex
CREATE INDEX "transcript_words_text_idx" ON "transcript_words"("text");

-- CreateIndex
CREATE UNIQUE INDEX "transcript_words_sentenceId_wid_key" ON "transcript_words"("sentenceId", "wid");

-- CreateIndex
CREATE UNIQUE INDEX "transcript_words_sentenceId_order_key" ON "transcript_words"("sentenceId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");

-- CreateIndex
CREATE INDEX "users_active_deleted_at_idx" ON "users"("active", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_countryCode_phone_key" ON "users"("countryCode", "phone");

-- CreateIndex
CREATE INDEX "idx_user_platforms_email" ON "user_platforms"("email");

-- CreateIndex
CREATE INDEX "idx_user_platforms_user_id" ON "user_platforms"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_platforms_phone_hash" ON "user_platforms"("phone_hash");

-- CreateIndex
CREATE INDEX "idx_user_platforms_platform" ON "user_platforms"("platform");

-- CreateIndex
CREATE INDEX "idx_user_platforms_user_name" ON "user_platforms"("user_name");

-- CreateIndex
CREATE INDEX "idx_user_platforms_is_active" ON "user_platforms"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_platforms_last_seen_at" ON "user_platforms"("last_seen_at");

-- CreateIndex
CREATE INDEX "idx_user_platforms_platform_uuid" ON "user_platforms"("platform_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_userId_idx" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "verification_codes_target_type_idx" ON "verification_codes"("target", "type");

-- CreateIndex
CREATE INDEX "verification_codes_expiresAt_idx" ON "verification_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "verification_codes_code_idx" ON "verification_codes"("code");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_recordings" ADD CONSTRAINT "meet_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_recordings" ADD CONSTRAINT "meet_recordings_recorder_user_id_fkey" FOREIGN KEY ("recorder_user_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_recording_files" ADD CONSTRAINT "meet_recording_files_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "meet_recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_recording_files" ADD CONSTRAINT "meet_recording_files_file_object_id_fkey" FOREIGN KEY ("file_object_id") REFERENCES "storage_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_parentSummaryId_fkey" FOREIGN KEY ("parentSummaryId") REFERENCES "meet_summaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcripts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_participants" ADD CONSTRAINT "meet_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_participants" ADD CONSTRAINT "meet_participants_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_user_actions" ADD CONSTRAINT "meet_user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_financialCloserId_fkey" FOREIGN KEY ("financialCloserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_refunds" ADD CONSTRAINT "order_refunds_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "order_refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_data_permissions" ADD CONSTRAINT "role_data_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_data_permissions" ADD CONSTRAINT "role_data_permissions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "data_permission_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_data_permissions" ADD CONSTRAINT "user_data_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_data_permissions" ADD CONSTRAINT "user_data_permissions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "data_permission_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "meet_recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_paragraphs" ADD CONSTRAINT "transcript_paragraphs_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_paragraphs" ADD CONSTRAINT "transcript_paragraphs_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "transcripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_sentences" ADD CONSTRAINT "transcript_sentences_paragraphId_fkey" FOREIGN KEY ("paragraphId") REFERENCES "transcript_paragraphs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_words" ADD CONSTRAINT "transcript_words_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "transcript_sentences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_platforms" ADD CONSTRAINT "user_platforms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
