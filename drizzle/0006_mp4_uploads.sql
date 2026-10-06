ALTER TABLE "episodes" ADD COLUMN "full_mp4_key" text;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "preview_mp4_key" text;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "preview_duration_sec" integer DEFAULT 0 NOT NULL;