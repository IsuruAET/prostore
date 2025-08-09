import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { OrderItem, ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Order Details",
  description: "Order Details Page",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <OrderDetailsTable
      order={{
        ...order,
        orderItems: order.OrderItem as OrderItem[],
        shippingAddress: order.shippingAddress as ShippingAddress,
      }}
      paypalClientId={(process.env.PAYPAL_CLIENT_ID as string) || "sb"}
    />
  );
};

export default OrderDetailsPage;
