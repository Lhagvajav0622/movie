ALTER TABLE "episodes" ADD COLUMN "video_key" text;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "segment_sec" integer DEFAULT 6 NOT NULL;