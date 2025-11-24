"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function checkUser() {
      setMounted(true);
      try {
        const user = await getCurrentUser();
        if (user) {
          if (user.onboardingCompleted) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        } else {
          router.push("/auth/login");
        }
      } catch (error) {
        router.push("/auth/login");
      }
    }
    checkUser();
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}

