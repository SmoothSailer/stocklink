import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRetailerProfile, checkBnplEligibility } from "../actions";
import AccountClient from "./account-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const retailer = await getRetailerProfile();

  if (!retailer) {
    redirect("/login");
  }

  const bnplEligibility = await checkBnplEligibility();

  return <AccountClient retailer={retailer} bnplEligibility={bnplEligibility} />;
}
