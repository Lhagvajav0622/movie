/** Maps Better Auth error codes/messages to Mongolian text. */
export function authErrorMn(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!err) return "Алдаа гарлаа. Дахин оролдоно уу.";
  const code = (err.code ?? "").toUpperCase();
  const msg = (err.message ?? "").toLowerCase();
  if (err.status === 429 || code.includes("TOO_MANY")) return "Хэт олон оролдлого. Түр хүлээгээд дахин оролдоно уу.";
  if (code.includes("INVALID_PHONE_NUMBER_OR_PASSWORD") || msg.includes("invalid phone number or password"))
    return "Утасны дугаар эсвэл нууц үг буруу байна.";
  if (code.includes("OTP_EXPIRED") || msg.includes("expired")) return "Кодын хугацаа дууссан. Шинэ код авна уу.";
  if (code.includes("INVALID_OTP") || msg.includes("invalid otp") || msg.includes("invalid code"))
    return "Код буруу байна.";
  if (code.includes("TOO_MANY_ATTEMPTS")) return "Олон удаа буруу оруулсан. Шинэ код авна уу.";
  if (code.includes("INVALID_PHONE_NUMBER") || msg.includes("invalid phone")) return "Утасны дугаар буруу байна.";
  if (code.includes("PASSWORD_TOO_SHORT")) return "Нууц үг хэт богино байна (8-аас доошгүй тэмдэгт).";
  if (code.includes("USER_NOT_FOUND")) return "Энэ дугаараар бүртгэл олдсонгүй.";
  return "Алдаа гарлаа. Дахин оролдоно уу.";
}

export const toE164 = (digits: string) => `+976${digits}`;
export const isValidMnDigits = (digits: string) => /^[6-9]\d{7}$/.test(digits);
