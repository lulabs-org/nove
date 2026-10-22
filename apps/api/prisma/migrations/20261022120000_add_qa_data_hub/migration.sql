CREATE TYPE "QATargetType" AS ENUM ('MINUTE', 'DRIVE_FILE', 'PROJECT', 'GLOBAL');
CREATE TYPE "QAGeneratedBy" AS ENUM ('AI', 'HUMAN', 'SYSTEM');
CREATE TYPE "QAFeedbackRating" AS ENUM ('LIKE', 'DISLIKE');

CREATE TABLE "qa_sessions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "target_type" "QATargetType" NOT NULL DEFAULT 'GLOBAL',
    "target_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "qa_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qa_records" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "generated_by" "QAGeneratedBy" NOT NULL DEFAULT 'AI',
    "ai_model" VARCHAR(100),
    "prompt_tokens" INTEGER,
    "completion_tokens" INTEGER,
    "total_tokens" INTEGER,
    "latency_ms" INTEGER,
    "rating" "QAFeedbackRating",
    "feedback_reason" VARCHAR(50),
    "feedback_comment" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "qa_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qa_citations" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "source_type" VARCHAR(50) NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" VARCHAR(200),
    "location" VARCHAR(100),
    "snippet" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qa_citations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qa_sessions_org_id_user_id_idx" ON "qa_sessions"("org_id", "user_id");
CREATE INDEX "qa_sessions_target_type_target_id_idx" ON "qa_sessions"("target_type", "target_id");
CREATE INDEX "qa_records_session_id_created_at_idx" ON "qa_records"("session_id", "created_at");
CREATE INDEX "qa_citations_record_id_idx" ON "qa_citations"("record_id");
CREATE INDEX "qa_citations_source_type_source_id_idx" ON "qa_citations"("source_type", "source_id");

ALTER TABLE "qa_sessions" ADD CONSTRAINT "qa_sessions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qa_sessions" ADD CONSTRAINT "qa_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "qa_records" ADD CONSTRAINT "qa_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "qa_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qa_citations" ADD CONSTRAINT "qa_citations_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "qa_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
