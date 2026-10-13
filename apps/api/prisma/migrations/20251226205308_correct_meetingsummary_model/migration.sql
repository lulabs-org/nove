/*
  Warnings:

  - You are about to drop the column `actionItems` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `aiModel` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `generatedBy` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `isLatest` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `keyPoints` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `meetingId` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `parentSummaryId` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `processingTime` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptId` on the `meet_summaries` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `meet_summaries` table. All the data in the column will be lost.
  - Added the required column `meeting_id` to the `meet_summaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `meet_summaries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."meet_summaries" DROP CONSTRAINT "meet_summaries_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."meet_summaries" DROP CONSTRAINT "meet_summaries_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."meet_summaries" DROP CONSTRAINT "meet_summaries_parentSummaryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."meet_summaries" DROP CONSTRAINT "meet_summaries_reviewedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."meet_summaries" DROP CONSTRAINT "meet_summaries_transcriptId_fkey";

-- DropIndex
DROP INDEX "public"."meet_summaries_createdBy_idx";

-- DropIndex
DROP INDEX "public"."meet_summaries_isLatest_idx";

-- DropIndex
DROP INDEX "public"."meet_summaries_meetingId_idx";

-- DropIndex
DROP INDEX "public"."meet_summaries_meetingId_isLatest_idx";

-- DropIndex
DROP INDEX "public"."meet_summaries_reviewedBy_idx";

-- DropIndex
DROP INDEX "public"."meet_summaries_status_createdAt_idx";

-- AlterTable
ALTER TABLE "meet_recordings" ADD COLUMN     "external_id" VARCHAR(100),
ADD COLUMN     "metadata" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "meet_summaries" DROP COLUMN "actionItems",
DROP COLUMN "aiModel",
DROP COLUMN "createdAt",
DROP COLUMN "createdBy",
DROP COLUMN "deletedAt",
DROP COLUMN "errorMessage",
DROP COLUMN "generatedBy",
DROP COLUMN "isLatest",
DROP COLUMN "keyPoints",
DROP COLUMN "meetingId",
DROP COLUMN "parentSummaryId",
DROP COLUMN "processingTime",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "tags",
DROP COLUMN "transcriptId",
DROP COLUMN "updatedAt",
ADD COLUMN     "action_items" JSONB,
ADD COLUMN     "ai_minutes" JSONB,
ADD COLUMN     "ai_model" TEXT,
ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "approved_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_id" TEXT,
ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "generated_by" "GenerationMethod",
ADD COLUMN     "golden_quotes" JSONB,
ADD COLUMN     "is_latest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "key_points" JSONB,
ADD COLUMN     "keywords" TEXT[],
ADD COLUMN     "meeting_id" TEXT NOT NULL,
ADD COLUMN     "parent_summary_id" TEXT,
ADD COLUMN     "processing_time" INTEGER,
ADD COLUMN     "recording_id" TEXT,
ADD COLUMN     "transcript_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL;

-- AlterTable
ALTER TABLE "user_platforms" ADD COLUMN     "external_id" VARCHAR(100);

-- CreateIndex
CREATE INDEX "idx_meeting_summary_meeting" ON "meet_summaries"("meeting_id");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_is_latest" ON "meet_summaries"("is_latest");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_created_id" ON "meet_summaries"("created_id");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_parent_summary" ON "meet_summaries"("parent_summary_id");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_approved_id" ON "meet_summaries"("approved_id");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_meeting_latest" ON "meet_summaries"("meeting_id", "is_latest");

-- CreateIndex
CREATE INDEX "idx_meeting_summary_status_created" ON "meet_summaries"("status", "created_at");

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_created_id_fkey" FOREIGN KEY ("created_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_approved_id_fkey" FOREIGN KEY ("approved_id") REFERENCES "user_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_parent_summary_id_fkey" FOREIGN KEY ("parent_summary_id") REFERENCES "meet_summaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_transcript_id_fkey" FOREIGN KEY ("transcript_id") REFERENCES "transcripts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meet_summaries" ADD CONSTRAINT "meet_summaries_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "meet_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "meet_summaries_language_idx" RENAME TO "idx_meeting_summary_language";

-- RenameIndex
ALTER INDEX "meet_summaries_status_idx" RENAME TO "idx_meeting_summary_status";

-- RenameIndex
ALTER INDEX "meet_summaries_version_idx" RENAME TO "idx_meeting_summary_version";
