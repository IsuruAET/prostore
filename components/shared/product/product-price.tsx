import { cn } from "@/lib/utils";

const ProductPrice = ({
  price,
  className,
}: {
  price: string;
  className?: string;
}) => {
  // Ensure two decimal places
  const formattedPrice = parseFloat(price).toFixed(2);

  // Get the int and float parts
  const [intPart, floatPart] = formattedPrice.split(".");

  return (
    <p className={cn("text-2xl", className)}>
      <span className="text-xs align-super">$</span>
      {intPart}
      <span className="text-xs align-super">{floatPart}</span>
    </p>
  );
};

export default ProductPrice;
