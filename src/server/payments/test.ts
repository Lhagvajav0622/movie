import type { PaymentProvider } from "./types";

/** Test provider: nothing real happens. The checkout modal's "pay" button calls /test-pay. */
export const testProvider: PaymentProvider = {
  live: false,
  async createInvoice(o) {
    return { invoiceId: `test_${o.code}` };
  },
  async isPaid() {
    return false; // settled explicitly by POST /api/orders/:id/test-pay
  },
};
