"use server";

import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { convertToJSObject, formatErrors } from "@/lib/utils";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { CartItem, ShippingAddress } from "@/types";

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
