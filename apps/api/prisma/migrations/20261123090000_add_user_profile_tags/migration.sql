-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "idx_user_profile_tags" ON "user_profiles" USING GIN ("tags");
