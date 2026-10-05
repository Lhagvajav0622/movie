import type { Metadata } from "next";
import { SignupFlow } from "@/components/auth/SignupFlow";
import { safeNext } from "@/lib/redirect";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  return <SignupFlow next={safeNext(next)} />;
}
