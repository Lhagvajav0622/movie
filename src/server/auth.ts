import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { headers } from "next/headers";
import { db, schema } from "./db";
import { sendSms, normalizeMnPhone } from "./sms";
import { reserveOtpSend } from "./otp-throttle";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      rateLimit: schema.rateLimit,
    },
  }),
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
    },
  },
  socialProviders: google,
  rateLimit: {
    enabled: true,
    storage: "database",
    // Per-IP limits are loose on purpose (carrier NAT); per-phone limits are in hooks.before.
    customRules: {
      "/phone-number/send-otp": { window: 600, max: 20 },
      "/phone-number/request-password-reset": { window: 600, max: 20 },
      "/sign-in/phone-number": { window: 60, max: 10 },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/phone-number/send-otp" && ctx.path !== "/phone-number/request-password-reset") return;
      const phone = normalizeMnPhone(String(ctx.body?.phoneNumber ?? ""));
      if (!phone) throw new APIError("BAD_REQUEST", { code: "INVALID_PHONE_NUMBER", message: "Invalid phone number" });
      const wait = await reserveOtpSend(phone);
      if (wait) throw new APIError("TOO_MANY_REQUESTS", { code: "TOO_MANY_REQUESTS", message: `Retry in ${wait}s` });
    }),
  },
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      phoneNumberValidator: (p) => normalizeMnPhone(p) !== null,
      sendOTP: ({ phoneNumber, code }) => {
        void sendSms(phoneNumber, `Таны баталгаажуулах код: ${code}`);
      },
      sendPasswordResetOTP: ({ phoneNumber, code }) => {
        void sendSms(phoneNumber, `Нууц үг сэргээх код: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (p) => `${p.replace(/\D/g, "")}@phone.mhub.local`,
        getTempName: (p) => p,
      },
    }),
    nextCookies(),
  ],
});

/** Current session in server components / route handlers, or null. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || (s.user as { role?: string }).role !== "admin") return null;
  return s;
}
