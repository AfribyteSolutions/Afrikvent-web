"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mwakwaAuth } from "@/lib/mwakwaBackend";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finish = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get("error") || params.get("error_description");
        if (errorParam) throw new Error(errorParam);
        const user = await mwakwaAuth.me();
        if (user) {
          if (!user.account_type) await mwakwaAuth.updateMe({ account_type: "attendee", is_active: true });
          router.replace("/");
          return;
        }
        router.replace("/");
      } catch (err) {
        setError((err as Error).message || "Authentication failed");
        setTimeout(() => router.replace("/"), 2000);
      }
    };
    finish();
  }, [router]);

  return <div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="bg-white rounded-xl shadow p-8 text-center"><p className={error ? "text-red-600" : "text-gray-700"}>{error || "Completing sign in..."}</p></div></div>;
}
