"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMn, isValidMnDigits, toE164 } from "@/lib/auth-errors";
import { Button, Field, OtpInput, PhoneInput, TextInput } from "@/components/ui/form";

type Step = "phone" | "code" | "password" | "name";
const steps: Step[] = ["phone", "code", "password", "name"];
const titles: Record<Step, string> = {
  phone: "Бүртгүүлэх",
  code: "Дугаар баталгаажуулах",
  password: "Нууц үг үүсгэх",
  name: "Таны нэр",
};

export function SignupFlow({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: toE164(phone) });
    if (error) throw error;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (step === "phone") {
        if (!isValidMnDigits(phone)) return setError("8 оронтой утасны дугаар оруулна уу.");
        await sendCode();
        setStep("code");
      } else if (step === "code") {
        if (code.length !== 6) return setError("6 оронтой код оруулна уу.");
        // Verifying creates the account (if new) and signs the user in.
        const { error } = await authClient.phoneNumber.verify({ phoneNumber: toE164(phone), code });
        if (error) return setError(authErrorMn(error));
        setStep("password");
      } else if (step === "password") {
        if (password.length < 8) return setError("Нууц үг 8-аас доошгүй тэмдэгттэй байна.");
        if (password !== password2) return setError("Нууц үг таарахгүй байна.");
        const res = await fetch("/api/me/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: password }),
        });
        if (!res.ok) return setError(authErrorMn(await res.json().catch(() => null)));
        setStep("name");
      } else {
        const trimmed = name.trim();
        if (trimmed.length < 2) return setError("Нэрээ оруулна уу.");
        const { error } = await authClient.updateUser({ name: trimmed });
        if (error) return setError(authErrorMn(error));
        router.replace(next);
        router.refresh();
      }
    } catch (err) {
      setError(authErrorMn(err as { code?: string; message?: string; status?: number }));
    } finally {
      setLoading(false);
    }
  }

  const idx = steps.indexOf(step);

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="mb-6 text-center">
        <p className="text-body font-semibold">{titles[step]}</p>
        <div className="mx-auto mt-3 flex w-32 gap-1.5">
          {steps.map((s, i) => (
            <span key={s} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-brand-500" : "bg-stroke"}`} />
          ))}
        </div>
      </div>

      {step === "phone" && (
        <Field label="Утас" required>
          <PhoneInput value={phone} onChange={setPhone} autoFocus />
        </Field>
      )}

      {step === "code" && (
        <>
          <Field label={`+976 ${phone} дугаарт илгээсэн 6 оронтой код`}>
            <OtpInput value={code} onChange={setCode} />
          </Field>
          <button
            type="button"
            className="text-caption text-fg-muted hover:text-fg"
            onClick={async () => {
              setError(null);
              try {
                await sendCode();
              } catch (err) {
                setError(authErrorMn(err as { code?: string }));
              }
            }}
          >
            Код дахин авах
          </button>
        </>
      )}

      {step === "password" && (
        <>
          <Field label="Нууц үг" required>
            <TextInput
              type="password"
              autoComplete="new-password"
              placeholder="8-аас доошгүй тэмдэгт"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Нууц үг давтах" required>
            <TextInput
              type="password"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </Field>
        </>
      )}

      {step === "name" && (
        <Field label="Нэр" required>
          <TextInput
            autoComplete="name"
            placeholder="Таны нэр"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
      )}

      {error && <p className="text-body-2 text-danger">{error}</p>}

      <Button type="submit" loading={loading}>
        {step === "phone" ? "Код авах" : step === "name" ? "Дуусгах" : "Үргэлжлүүлэх"}
      </Button>

      {step === "phone" && (
        <p className="text-center text-body-2 text-fg-muted">
          Бүртгэлтэй юу?{" "}
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand-300 hover:underline">
            Нэвтрэх
          </Link>
        </p>
      )}
    </form>
  );
}
