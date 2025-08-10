"use server";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { convertToJSObject, formatErrors } from "@/lib/utils";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { CartItem, ShippingAddress, PaymentResult, OrderItem } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "../constants";

// Create Order and Order Items
export async function createOrder() {
  try {
    const session = await auth();
    if (!session) throw new Error("User is not authenticated");

    const cart = await getMyCart();
    const userId = session?.user?.id;
    if (!userId) throw new Error("User is not found");

    const user = await getUserById(userId);
    if (!user) throw new Error("User is not found");

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your cart is empty",
        redirectTo: "/cart",
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: "No shipping address found",
        redirectTo: "/shipping-address",
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: "No payment method found",
        redirectTo: "/payment-method",
      };
    }

    // Create the Order object
    const order = insertOrderSchema.parse({
      userId,
      shippingAddress: user.address as ShippingAddress,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });

    // Create a transaction to create order and order items in database
    const newOrderId = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: order,
      });

      // Create order items from the cart items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: {
            ...item,
            price: item.price,
            orderId: newOrder.id,
          },
        });
      }

      // Clear the cart
      await tx.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items: [],
          itemsPrice: 0,
          shippingPrice: 0,
          taxPrice: 0,
          totalPrice: 0,
        },
      });

      return newOrder.id;
    });

    if (!newOrderId) throw new Error("Order is not created");

    return {
      success: true,
      message: "Order created successfully",
      redirectTo: `/order/${newOrderId}`,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { success: false, message: formatErrors(error) };
  }
}

// Get Order by Id
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      OrderItem: true,
      user: { select: { name: true, email: true } },
    },
  });

  return convertToJSObject(data);
}

// Create new paypal order
export async function createPayPalOrder(orderId: string) {
  try {
    // Get order form database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (order) {
      // Create a paypal order
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

      // Update order with paypal order id
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          paymentResult: {
            id: paypalOrder.id,
            email_address: "",
            status: "",
            pricePaid: 0,
          },
        },
      });

      return {
        success: true,
        message: "Item order created successfully",
        data: paypalOrder.id,
      };
    } else {
      throw new Error("Order is not found");
    }
  } catch (error) {
    return { success: false, message: formatErrors(error) };
  }
}

// Approve paypal order and update order to paid
export async function approvePayPalOrder(
  orderId: string,
  data: { orderId: string }
) {
  try {
    // Get order form database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
    });

    if (!order) throw new Error("Order is not found");

    const captureData = await paypal.capturePayment(data.orderId);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== "COMPLETED"
    ) {
      throw new Error("Error in Paypal payment");
    }

    // Update order to paid
    await updateOrderToPaid({
      orderId,
      paymentResult: {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid:
          captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      },
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Order paid successfully",
      redirectTo: `/order/${orderId}`,
    };
  } catch (error) {
    return { success: false, message: formatErrors(error) };
  }
}

// Update order to paid
export async function updateOrderToPaid({
  orderId,
  paymentResult,
}: {
  orderId: string;
  paymentResult?: PaymentResult;
}) {
  try {
    // Get order form database
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
      },
      include: {
        OrderItem: true,
      },
    });

    if (!order) throw new Error("Order is not found");

    if (order.isPaid) throw new Error("Order is already paid");

    // Transaction to update order and account for product stock
    await prisma.$transaction(async (tx) => {
      // Iterate over products and update stock
      for (const item of order.OrderItem as OrderItem[]) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Set the order to paid
      await tx.order.update({
        where: { id: orderId },
        data: { isPaid: true, paidAt: new Date(), paymentResult },
      });
    });

    // Get updated order after transaction
    const updatedOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        OrderItem: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!updatedOrder) throw new Error("Order not found");
  } catch (error) {
    return { success: false, message: formatErrors(error) };
  }
}

// Get user's orders
export async function getMyOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const session = await auth();
  if (!session) throw new Error("User is not authorized");

  const data = await prisma.order.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session?.user?.id },
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}
