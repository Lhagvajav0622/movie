import type { PaymentProvider } from "./types";

/** SocialPay (Golomt) — to be implemented after the merchant agreement. Same contract as QPay. */
export const socialpayProvider: PaymentProvider = {
  live: true,
  async createInvoice() {
    throw new Error("SocialPay is not configured yet");
  },
  async isPaid() {
    throw new Error("SocialPay is not configured yet");
  },
};
