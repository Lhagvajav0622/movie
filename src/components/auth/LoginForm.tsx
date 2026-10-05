"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMn, isValidMnDigits, toE164 } from "@/lib/auth-errors";
import { Button, DevCodeNotice, Field, OtpInput, PhoneInput, TextInput, readDevCode } from "@/components/ui/form";

type Mode = "password" | "otp-phone" | "otp-code";

export function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  const done = () => {
    router.replace(next);
    router.refresh();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidMnDigits(phone)) return setError("8 оронтой утасны дугаар оруулна уу.");
    setLoading(true);
    try {
      if (mode === "password") {
        const { error } = await authClient.signIn.phoneNumber({ phoneNumber: toE164(phone), password });
        if (error) return setError(authErrorMn(error));
        return done();
      }
      if (mode === "otp-phone") {
        const { data, error } = await authClient.phoneNumber.sendOtp({ phoneNumber: toE164(phone) });
        if (error) return setError(authErrorMn(error));
        const dc = readDevCode(data);
        setDevCode(dc);
        if (dc) setCode(dc);
        return setMode("otp-code");
      }
      const { error } = await authClient.phoneNumber.verify({ phoneNumber: toE164(phone), code });
      if (error) return setError(authErrorMn(error));
      done();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="mb-6 text-center text-body-2 text-fg-muted">Дараагийн дуртай киногоо эндээс ол</p>

      {mode !== "otp-code" && (
        <Field label="Утас" required>
          <PhoneInput value={phone} onChange={setPhone} autoFocus />
        </Field>
      )}

      {mode === "password" && (
        <Field label="Нууц үг" required>
          <TextInput
            type="password"
            autoComplete="current-password"
            placeholder="Та нууц үгээ оруулна уу"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      )}

      {mode === "otp-code" && (
        <Field label={`+976 ${phone} дугаарт илгээсэн 6 оронтой код`}>
          <OtpInput value={code} onChange={setCode} />
        </Field>
      )}
      {mode === "otp-code" && <DevCodeNotice code={devCode} />}

      <div className="flex justify-between text-caption text-fg-muted">
        <Link href="/reset-password" className="hover:text-fg">
          Нууц үг мартсан
        </Link>
        <button
          type="button"
          className="hover:text-fg"
          onClick={() => {
            setError(null);
            setCode("");
            setMode(mode === "password" ? "otp-phone" : "password");
          }}
        >
          {mode === "password" ? "Нэг удаагийн нууц үг ашиглах" : "Нууц үгээр нэвтрэх"}
        </button>
      </div>

      {error && <p className="text-body-2 text-danger">{error}</p>}

      <Button type="submit" loading={loading}>
        {mode === "otp-phone" ? "Код авах" : "Нэвтрэх"}
      </Button>
      <Button type="button" variant="secondary" onClick={() => router.push(`/signup?next=${encodeURIComponent(next)}`)}>
        Бүртгүүлэх
      </Button>

      {googleEnabled && (
        <Button
          type="button"
          variant="ghost"
          className="border border-stroke"
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
        >
          Google-ээр нэвтрэх
        </Button>
      )}
    </form>
  );
}
