"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/features/auth/components/auth-provider";
import { Skeleton } from "@/shared/components/ui/skeleton";


export default function Home() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    router.replace(user ? "/tickets" : "/login");
  }, [isReady, user, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
