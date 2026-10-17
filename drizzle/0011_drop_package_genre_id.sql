ALTER TABLE "packages" DROP CONSTRAINT "packages_genre_id_unique";--> statement-breakpoint
ALTER TABLE "packages" DROP CONSTRAINT "packages_genre_id_genres_id_fk";
--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN "genre_id";