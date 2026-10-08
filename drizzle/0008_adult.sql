ALTER TABLE "titles" ADD COLUMN "is_adult" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
INSERT INTO "genres" ("name_mn", "slug", "sort_order") VALUES ('+18', 'adult', 8) ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
UPDATE "titles" SET "is_adult" = true WHERE "search_text" LIKE '%хойд аав%';
--> statement-breakpoint
INSERT INTO "title_genres" ("title_id", "genre_id") SELECT t."id", g."id" FROM "titles" t, "genres" g WHERE t."is_adult" AND g."slug" = 'adult' ON CONFLICT DO NOTHING;
