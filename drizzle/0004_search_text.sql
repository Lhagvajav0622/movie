ALTER TABLE "titles" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "titles" SET "search_text" = lower("name" || ' ' || coalesce("name_original", ''));
