CREATE TABLE "package_genres" (
	"package_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "package_genres_package_id_genre_id_pk" PRIMARY KEY("package_id","genre_id")
);
--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "badge" text;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "old_price_mnt" integer;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "highlighted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "all_titles" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "package_genres" ADD CONSTRAINT "package_genres_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_genres" ADD CONSTRAINT "package_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "packages" p SET
  "name" = coalesce((SELECT g."name_mn" FROM "genres" g WHERE g."id" = p."genre_id"), 'Бүх багц'),
  "all_titles" = (p."genre_id" IS NULL),
  "active" = (p."price_mnt" > 0);--> statement-breakpoint
INSERT INTO "package_genres" ("package_id", "genre_id")
  SELECT "id", "genre_id" FROM "packages" WHERE "genre_id" IS NOT NULL ON CONFLICT DO NOTHING;
