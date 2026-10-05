export type PayMethod = "qpay" | "socialpay";

export type Invoice = {
  /** Provider-side invoice id (stored in orders.provider_invoice_id) */
  invoiceId: string;
  /** Live providers: QR image/payload and bank-app deep links to show the buyer */
  qrText?: string;
  deeplink?: string;
};

/**
 * A payment provider creates an invoice for an order and later reports whether it was paid.
 * Real QPay / SocialPay implement this interface; the built-in "test" provider fakes it.
 */
export interface PaymentProvider {
  readonly live: boolean;
  createInvoice(o: { code: string; amountMnt: number; description: string }): Promise<Invoice>;
  /** Ask the provider if the invoice has been paid (used for polling and webhooks). */
  isPaid(invoiceId: string): Promise<boolean>;
}
