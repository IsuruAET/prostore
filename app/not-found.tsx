"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/logo";

const NotFoundPage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Logo size={48} showText={false} priority={false} href="/" className="" />
      <div className="p-6 w-1/3 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">Not Found</h1>
        <p className="text-destructive">
          The page you are looking for does not exist.
        </p>
        <Button
          variant="outline"
          className="mt-4 ml-2"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
