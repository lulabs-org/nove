/*
  Warnings:

  - Made the column `sub_meeting_id` on table `meetings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "meetings" ALTER COLUMN "sub_meeting_id" SET NOT NULL,
ALTER COLUMN "sub_meeting_id" SET DEFAULT '__ROOT__';
