"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const ProductImages = ({ images }: { images: string[] }) => {
  const [activeImage, setActiveImage] = useState(images[0]);

  return (
    <div className="space-y-4">
      <Image
        src={activeImage}
        alt="Product Image"
        width={1000}
        height={1000}
        className="min-h-[300px] object-cover object-center"
      />
      <div className="flex">
        {images.map((image) => (
          <div
            key={image}
            onClick={() => setActiveImage(image)}
            className={cn(
              "border mr-2 cursor-pointer hover:border-orange-600",
              activeImage === image && "border-orange-500"
            )}
          >
            <Image
              src={image}
              alt="image"
              width={100}
              height={100}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImages;
