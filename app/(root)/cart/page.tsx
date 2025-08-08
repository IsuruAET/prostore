import { getMyCart } from "@/lib/actions/cart.actions";
import CartTable from "./cart-table";

export const metadata = {
  title: "Shopping Cart",
  description: "Shopping Cart page",
};

const CartPage = async () => {
  const cart = await getMyCart();

  return (
    <>
      <CartTable cart={cart} />
    </>
  );
};

export default CartPage;
