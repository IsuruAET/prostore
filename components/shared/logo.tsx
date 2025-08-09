"use client";

import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

interface LogoProps {
  size?: number;
  showText?: boolean;
  priority?: boolean;
  href?: string;
  className?: string;
}

const Logo = ({
  size = 48,
  showText = false,
  priority = false,
  href = "/",
  className = "flex-start",
}: LogoProps) => {
  const logoImage = (
    <Image
      src="/images/logo.svg"
      alt={`${APP_NAME} logo`}
      width={size}
      height={size}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      className="flex-shrink-0"
    />
  );

  const content = (
    <div className={className}>
      {logoImage}
      {showText && (
        <span className="hidden lg:block font-bold text-2xl ml-3">
          {APP_NAME}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {logoImage}
        {showText && (
          <span className="hidden lg:block font-bold text-2xl ml-3">
            {APP_NAME}
          </span>
        )}
      </Link>
    );
  }

  return content;
};

export default Logo;
