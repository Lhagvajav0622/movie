export type PayMethod = "qpay" | "socialpay";

export type Invoice = {
  /** Provider-side invoice id (stored in orders.provider_invoice_id) */
  invoiceId: string;
  /** Live providers: QR image (base64 PNG) / payload and bank-app deep links to show the buyer */
  qrText?: string;
  qrImage?: string;
  /** Bank / wallet app links, e.g. { name: "Khan bank", link: "khanbank://..." } */
  links?: { name: string; description?: string; link: string }[];
};

/**
 * A payment provider creates an invoice for an order and later reports whether it was paid.
 * Real QPay / SocialPay implement this interface; the built-in "test" provider fakes it.
 */
export interface PaymentProvider {
  readonly live: boolean;
  /** false when the provider is not set up (missing credentials / not implemented yet) */
  available(): boolean;
  createInvoice(o: { code: string; amountMnt: number; description: string }): Promise<Invoice>;
  /** Ask the provider if the invoice has been paid in full (used for polling and webhooks). Never trusts the buyer. */
  isPaid(invoiceId: string, amountMnt: number): Promise<boolean>;
}
