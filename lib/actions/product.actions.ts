"use server";

import { LATEST_PRODUCTS_LIMIT } from "../constants";
import { prisma } from "../../db/prisma";
import { convertToJSObject } from "../utils";

// Get latest products
export const getLatestProducts = async () => {
  const products = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: "desc" },
  });

  return convertToJSObject(products);
};

// Get single product by slug
export const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findFirst({
    where: { slug },
  });

  return convertToJSObject(product);
};
