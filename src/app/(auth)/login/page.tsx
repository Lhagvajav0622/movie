import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { googleEnabled, safeNext } from "@/lib/redirect";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} googleEnabled={googleEnabled()} />;
}
