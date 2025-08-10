"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions";
import { CartItem } from "@/types";

interface QuantityControllerProps {
  item: CartItem;
  className?: string;
}

const QuantityController = ({
  item,
  className = "",
}: QuantityControllerProps) => {
  const [isAdding, startAddTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleAdd = () => {
    startAddTransition(async () => {
      const res = await addItemToCart(item);
      if (res.success) {
        // Show success toast with "Go To Cart" action if not on cart page
        if (pathname !== "/cart") {
          toast.success(res.message as string, {
            action: {
              label: "Go To Cart",
              onClick: () => router.push("/cart"),
            },
          });
        }
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleRemove = () => {
    startRemoveTransition(async () => {
      const res = await removeItemFromCart(item.productId);
      if (res.success) {
        // Show success toast if not on cart page
        if (pathname !== "/cart") toast.success(res.message as string);
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        disabled={isRemoving}
        variant="outline"
        type="button"
        onClick={handleRemove}
        size="sm"
      >
        {isRemoving ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </Button>

      <span className="min-w-[2rem] text-center font-medium">{item.qty}</span>

      <Button
        disabled={isAdding}
        variant="outline"
        type="button"
        onClick={handleAdd}
        size="sm"
      >
        {isAdding ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default QuantityController;
