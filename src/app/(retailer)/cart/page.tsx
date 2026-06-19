import type { Metadata } from "next";
import CartClient from "./cart-client";
import { checkBnplEligibility } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your cart — review items and checkout",
};

export default async function CartPage() {
  const bnplEligibility = await checkBnplEligibility();

  return <CartClient bnplEligibility={bnplEligibility} />;
}
