"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function hasOnboardedCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith("jt_ob=1"));
}

export default function AuthCallback() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    const handleAuth = async () => {
      // Check for PKCE code in query params
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          window.location.href = hasOnboardedCookie() ? "/" : "/onboarding";
          return;
        }
        console.error("[Auth] Code exchange failed:", exchangeError.message);
      }

      // Check if session exists (hash fragment auto-detected by SSR client)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = hasOnboardedCookie() ? "/" : "/onboarding";
        return;
      }

      // Wait briefly for hash fragment processing
      await new Promise((r) => setTimeout(r, 1500));
      const { data: retryData } = await supabase.auth.getSession();
      if (retryData.session) {
        window.location.href = hasOnboardedCookie() ? "/" : "/onboarding";
        return;
      }

      setError(true);
      setTimeout(() => {
        window.location.href = "/login?error=invalid_link";
      }, 2000);
    };

    handleAuth();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
        <div className="text-center">
          <p className="text-sm text-red-400 font-mono mb-2">
            Link expired or invalid
          </p>
          <p className="text-xs text-zinc-500 font-mono">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
      <div className="text-center space-y-3">
        <img src="/logo-icon.png" alt="Jupiter Tech" width={32} height={32} className="w-8 h-8 mx-auto rounded-lg object-cover animate-pulse" />
        <p className="text-sm text-zinc-400 font-mono">Signing you in...</p>
      </div>
    </div>
  );
}
