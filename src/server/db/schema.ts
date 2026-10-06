import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
  pgEnum,
  bigint,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Auth tables (shape expected by Better Auth + phone-number plugin)   */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Better Auth rate limiter storage (OTP send limits survive across server instances). */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/** Log of SMS codes sent, for per-phone limits (1/min, 5/hour). */
export const otpSends = pgTable(
  "otp_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("otp_sends_phone_created_idx").on(t.phone, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const titleType = pgEnum("title_type", ["series", "film"]);
export const orientation = pgEnum("orientation", ["vertical", "horizontal"]);
export const titleStatus = pgEnum("title_status", ["draft", "published"]);
export const episodeStatus = pgEnum("episode_status", [
  "processing",
  "ready",
  "failed",
]);

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameMn: text("name_mn").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const titles = pgTable(
  "titles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameOriginal: text("name_original"),
    /** Lower-cased "name name_original", written by the app (works for Cyrillic in any DB locale) */
    searchText: text("search_text").notNull().default(""),
    description: text("description"),
    type: titleType("type").notNull().default("film"),
    orientation: orientation("orientation").notNull().default("horizontal"),
    posterUrl: text("poster_url"),
    backdropUrl: text("backdrop_url"),
    year: integer("year"),
    ageRating: text("age_rating"),
    country: text("country"),
    director: text("director"),
    castText: text("cast_text"),
    /** 0 = whole title is free */
    priceMnt: integer("price_mnt").notNull().default(0),
    /** Free preview length; for series counted cumulatively from episode 1 */
    freePreviewSec: integer("free_preview_sec").notNull().default(300),
    isFeatured: boolean("is_featured").notNull().default(false),
    featuredOrder: integer("featured_order").notNull().default(0),
    status: titleStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("titles_status_published_idx").on(t.status, t.publishedAt)],
);

export const titleGenres = pgTable(
  "title_genres",
  {
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.titleId, t.genreId] })],
);

export const episodes = pgTable(
  "episodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    name: text("name"),
    /** R2 key prefix of the HLS package, e.g. "v/<episodeId>" (master.m3u8 inside) */
    videoKey: text("video_key"),
    /** Whole episode as one MP4 in R2 ("v/<id>/full.mp4"); paid viewers only */
    fullMp4Key: text("full_mp4_key"),
    /** Separate free clip ("v/<id>-pv/preview.mp4"); anyone can watch it. A clip without a full version = a free episode */
    previewMp4Key: text("preview_mp4_key"),
    previewDurationSec: integer("preview_duration_sec").notNull().default(0),
    /** Seconds per HLS segment (needed to enforce the free-preview limit) */
    segmentSec: integer("segment_sec").notNull().default(6),
    durationSec: integer("duration_sec").notNull().default(0),
    thumbnailUrl: text("thumbnail_url"),
    status: episodeStatus("status").notNull().default("processing"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("episodes_title_number_uq").on(t.titleId, t.number)],
);

/* ------------------------------------------------------------------ */
/* User activity                                                       */
/* ------------------------------------------------------------------ */

export const savedTitles = pgTable(
  "saved_titles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.titleId] })],
);

export const watchProgress = pgTable(
  "watch_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    episodeId: uuid("episode_id")
      .notNull()
      .references(() => episodes.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    positionSec: integer("position_sec").notNull().default(0),
    durationSec: integer("duration_sec").notNull().default(0),
    completed: boolean("completed").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.episodeId] }),
    index("watch_progress_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Sales: one-off purchase per title, lifetime access                  */
/* ------------------------------------------------------------------ */

export const orderMethod = pgEnum("order_method", ["bank_transfer", "qpay", "socialpay"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "awaiting_review",
  "paid",
  "rejected",
  "expired",
]);
export const purchaseSource = pgEnum("purchase_source", ["order", "admin"]);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Short human-readable order code, e.g. MH4821 (shown at checkout / in admin) */
    code: text("code").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id),
    amountMnt: integer("amount_mnt").notNull(),
    method: orderMethod("method").notNull().default("qpay"),
    /** true when settled by the built-in test provider (no real money moved) */
    isTest: boolean("is_test").notNull().default(false),
    status: orderStatus("status").notNull().default("pending"),
    providerInvoiceId: text("provider_invoice_id").unique(),
    reviewedBy: text("reviewed_by").references(() => user.id),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
  },
  (t) => [index("orders_status_created_idx").on(t.status, t.createdAt)],
);

export const purchases = pgTable(
  "purchases",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    titleId: uuid("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    source: purchaseSource("source").notNull().default("order"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.titleId] })],
);
