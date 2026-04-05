import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Join Ristoka",
  description:
    "Sign up for Ristoka to access wholesale products at the best prices. Connect with verified suppliers and order via WhatsApp.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
