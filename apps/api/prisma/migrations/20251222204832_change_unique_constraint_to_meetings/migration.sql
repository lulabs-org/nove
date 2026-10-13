/*
  Warnings:

  - A unique constraint covering the columns `[platform,meeting_id,sub_meeting_id]` on the table `meetings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."meetings_platform_meeting_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "meetings_platform_meeting_id_sub_meeting_id_key" ON "meetings"("platform", "meeting_id", "sub_meeting_id");
