import type { Metadata } from "next";
import { ResetFlow } from "@/components/auth/ResetFlow";

export const metadata: Metadata = { title: "Нууц үг сэргээх" };

export default function ResetPasswordPage() {
  return <ResetFlow />;
}
