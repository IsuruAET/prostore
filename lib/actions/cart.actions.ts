"use server";

import { cookies } from "next/headers";
import { CartItem } from "@/types";
import {
  convertToJSObject,
  formatErrors,
  roundTo2DecimalPlaces,
} from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = roundTo2DecimalPlaces(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
  );
  const shippingPrice = roundTo2DecimalPlaces(itemsPrice > 100 ? 0 : 10);
  const taxPrice = roundTo2DecimalPlaces(itemsPrice * 0.15);
  const totalPrice = roundTo2DecimalPlaces(
    itemsPrice + shippingPrice + taxPrice
  );
  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export const addItemToCart = async (data: CartItem) => {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Parse and validate data
    const item = cartItemSchema.parse(data);

    // Find product in database
    const product = await prisma.product.findFirst({
      where: {
        id: item.productId,
      },
    });

    if (!product) throw new Error("Product not found");

    if (!cart) {
      // Create new cart
      const newCart = insertCartSchema.parse({
        userId,
        items: [item],
        sessionCartId,
        ...calcPrice([item]),
      });

      // Add to database
      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    } else {
      // Check if item already in cart
      const existItem = (cart.items as CartItem[]).find(
        (i) => i.productId === item.productId
      );
      if (existItem) {
        // Check stock
        if (existItem.qty + item.qty > product.stock) {
          throw new Error("Not enough stock");
        }

        // Increase the quantity
        (cart.items as CartItem[]).find(
          (i) => i.productId === item.productId
        )!.qty = existItem.qty + 1;
      } else {
        // If item does not exist, add it
        // check stock
        if (1 > product.stock) {
          throw new Error("Not enough stock");
        }

        // Add item to cart
        cart.items.push(item);
      }

      // Update cart
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items as CartItem[],
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} ${
          existItem ? "quantity updated" : "added"
        } to cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatErrors(error),
    };
  }
};

export const getMyCart = async () => {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) throw new Error("Cart session not found");

  // Get session and user ID
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  // Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });

  if (!cart) return undefined;

  // Convert decimal and return
  return convertToJSObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
};

export async function removeItemFromCart(productId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
      },
    });

    if (!product) throw new Error("Product not found");

    // Get user cart
    const cart = await getMyCart();

    if (!cart) throw new Error("Cart not found");

    // Check if item exists in cart
    const existItem = (cart.items as CartItem[]).find(
      (i) => i.productId === productId
    );

    if (!existItem) throw new Error("Item not found in cart");

    // Check if only one item in cart
    if (existItem.qty === 1) {
      // Remove item from cart
      cart.items = (cart.items as CartItem[]).filter(
        (i) => i.productId !== existItem.productId
      );
    } else {
      // Decrease quantity
      (cart.items as CartItem[]).find(
        (i) => i.productId === existItem.productId
      )!.qty = existItem.qty - 1;
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as CartItem[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatErrors(error),
    };
  }
}
