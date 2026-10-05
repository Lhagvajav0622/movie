"use client";
import { forwardRef } from "react";

/* Small form primitives shared by auth, profile and admin screens. */

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-body-2 font-medium text-fg-muted">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-caption text-danger">{error}</span>}
    </label>
  );
}

const inputCls =
  "h-12 w-full rounded-lg border border-stroke bg-surface px-3 text-body text-fg placeholder:text-fg-subtle outline-none focus:border-brand-400";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...props }, ref) {
    return <input ref={ref} {...props} className={`${inputCls} ${className}`} />;
  },
);

/** Mongolian mobile number: fixed +976 prefix, 8 digits. Value is digits only. */
export function PhoneInput({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex h-12 items-center rounded-lg border border-stroke bg-surface focus-within:border-brand-400">
      <span className="pl-3 pr-2 text-body text-fg-muted">+976</span>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        placeholder="Дугаараа оруулна уу"
        value={value}
        maxLength={8}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        className="h-full flex-1 bg-transparent pr-3 text-body tracking-wider outline-none placeholder:tracking-normal placeholder:text-fg-subtle"
      />
    </div>
  );
}

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      autoFocus
      maxLength={6}
      placeholder="••••••"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className={`${inputCls} text-center text-2xl tracking-[0.6em]`}
    />
  );
}

export function Button({
  variant = "primary",
  loading,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}) {
  const v =
    variant === "primary"
      ? "bg-brand-500 text-white hover:bg-brand-400"
      : variant === "secondary"
        ? "bg-[#e6e1ff] text-brand-500 hover:bg-white"
        : "bg-transparent text-fg-muted hover:text-fg";
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`flex h-12 w-full items-center justify-center rounded-lg text-body-2 font-semibold transition disabled:opacity-50 ${v} ${className}`}
    >
      {loading ? "Түр хүлээнэ үү…" : children}
    </button>
  );
}

/** Shown only while no SMS provider is configured: the server returns the code for testing. */
export function DevCodeNotice({ code }: { code: string | null }) {
  if (!code) return null;
  return (
    <p className="rounded-lg border border-brand-400/40 bg-brand-500/10 px-3 py-2 text-body-2 text-brand-100">
      Туршилтын горим: таны код <b className="tracking-widest text-white">{code}</b>
    </p>
  );
}

/** Reads the demo code from a Better Auth response, if present. */
export function readDevCode(data: unknown): string | null {
  const c = (data as { devCode?: unknown } | null)?.devCode;
  return typeof c === "string" ? c : null;
}
