import type { PaymentProvider } from "./types";

/**
 * QPay (merchant.qpay.mn) — to be implemented once the merchant contract is signed.
 * Needs QPAY_BASE_URL, QPAY_USERNAME, QPAY_PASSWORD, QPAY_INVOICE_CODE.
 * Flow: POST /v2/auth/token → POST /v2/invoice (callback_url → /api/payments/qpay/callback)
 *       → show qr_text + urls → POST /v2/payment/check { object_type: "INVOICE", object_id }.
 */
export const qpayProvider: PaymentProvider = {
  live: true,
  async createInvoice() {
    throw new Error("QPay is not configured yet");
  },
  async isPaid() {
    throw new Error("QPay is not configured yet");
  },
};
