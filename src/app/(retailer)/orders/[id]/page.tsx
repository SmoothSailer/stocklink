import type { Metadata } from "next";
import Link from "next/link";
import { getOrderById } from "../../actions";
import OrderDetailClient from "./order-detail-client";

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: false },
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const result = await getOrderById(id);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-5xl">📋</span>
        <p className="mt-3 text-lg font-semibold">Order not found</p>
        <Link
          href="/orders"
          className="mt-2 text-sm text-primary hover:underline"
        >
          View all orders
        </Link>
      </div>
    );
  }

  return (
    <OrderDetailClient
      order={result.order}
      items={result.items}
      statusHistory={result.statusHistory}
      bnplPlan={result.bnplPlan}
    />
  );
}
