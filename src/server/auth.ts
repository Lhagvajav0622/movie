import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db, schema } from "./db";
import { sendSms, normalizeMnPhone } from "./sms";

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
    customRules: {
      "/phone-number/send-otp": { window: 60, max: 1 },
      "/phone-number/request-password-reset": { window: 60, max: 1 },
    },
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
