import type { PayMethod, PaymentProvider } from "./types";
import { qpayProvider } from "./qpay";
import { socialpayProvider } from "./socialpay";
import { testProvider } from "./test";

/**
 * PAYMENT_MODE=test (default) → every method uses the fake provider, buyers confirm with one click.
 * PAYMENT_MODE=live          → real QPay / SocialPay; the test-pay endpoint is disabled (403).
 * Set PAYMENT_MODE=live before real launch.
 */
export function paymentMode(): "test" | "live" {
  return process.env.PAYMENT_MODE === "live" ? "live" : "test";
}

export function providerFor(method: PayMethod): PaymentProvider {
  if (paymentMode() === "test") return testProvider;
  return method === "qpay" ? qpayProvider : socialpayProvider;
}

export type { PayMethod } from "./types";
