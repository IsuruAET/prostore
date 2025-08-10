"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Loader } from "lucide-react";
import { Cart, CartItem } from "@/types";
import { toast } from "sonner";
import { addItemToCart } from "@/lib/actions/cart.actions";
import { useTransition } from "react";
import QuantityController from "./quantity-controller";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addItemToCart(item);

      if (!res?.success) {
        toast.error(res?.message);
        return;
      }

      // Handle success add to cart
      toast.success(res.message as string, {
        action: {
          label: "Go To Cart",
          onClick: () => router.push("/cart"),
        },
      });
    });
  };

  // Check if item is in cart
  const existItem =
    cart && cart.items.find((i) => i.productId === item.productId);

  return existItem ? (
    <QuantityController item={existItem} />
  ) : (
    <Button className="w-full" type="button" onClick={handleAddToCart}>
      {isPending ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}{" "}
      Add To Cart
    </Button>
  );
};

export default AddToCart;
