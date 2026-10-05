"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMn, isValidMnDigits, toE164 } from "@/lib/auth-errors";
import { Button, Field, OtpInput, PhoneInput, TextInput } from "@/components/ui/form";

export function ResetFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidMnDigits(phone)) return setError("8 оронтой утасны дугаар оруулна уу.");
    setLoading(true);
    try {
      if (step === "phone") {
        const { error } = await authClient.phoneNumber.requestPasswordReset({ phoneNumber: toE164(phone) });
        if (error) return setError(authErrorMn(error));
        setStep("reset");
        return;
      }
      if (code.length !== 6) return setError("6 оронтой код оруулна уу.");
      if (password.length < 8) return setError("Нууц үг 8-аас доошгүй тэмдэгттэй байна.");
      const { error } = await authClient.phoneNumber.resetPassword({
        phoneNumber: toE164(phone),
        otp: code,
        newPassword: password,
      });
      if (error) return setError(authErrorMn(error));
      const signIn = await authClient.signIn.phoneNumber({ phoneNumber: toE164(phone), password });
      if (signIn.error) return router.replace("/login");
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="mb-6 text-center text-body font-semibold">Нууц үг сэргээх</p>

      {step === "phone" ? (
        <Field label="Утас" required>
          <PhoneInput value={phone} onChange={setPhone} autoFocus />
        </Field>
      ) : (
        <>
          <Field label={`+976 ${phone} дугаарт илгээсэн код`}>
            <OtpInput value={code} onChange={setCode} />
          </Field>
          <Field label="Шинэ нууц үг" required>
            <TextInput
              type="password"
              autoComplete="new-password"
              placeholder="8-аас доошгүй тэмдэгт"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </>
      )}

      {error && <p className="text-body-2 text-danger">{error}</p>}

      <Button type="submit" loading={loading}>
        {step === "phone" ? "Код авах" : "Нууц үг солих"}
      </Button>
      <p className="text-center text-body-2 text-fg-muted">
        <Link href="/login" className="hover:text-fg">
          ← Нэвтрэх рүү буцах
        </Link>
      </p>
    </form>
  );
}
