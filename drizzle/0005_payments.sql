ALTER TYPE "public"."order_method" ADD VALUE 'socialpay';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "method" SET DEFAULT 'qpay';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;