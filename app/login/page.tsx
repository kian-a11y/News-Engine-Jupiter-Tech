"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "loading" | "email" | "magic-link-sent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
          <img src="/logo-icon.png" alt="Jupiter Tech" width={32} height={32} className="w-8 h-8 rounded-lg object-cover animate-pulse" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        window.location.href = "/";
      } else {
        const urlError = searchParams.get("error");
        if (urlError === "invalid_link") {
          setError("Your magic link has expired or is invalid. Please request a new one.");
        }
        setStep("email");
      }
    });
  }, [supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Block free/personal email providers — work emails only
    const blockedDomains = [
      "gmail.com", "googlemail.com",
      "yahoo.com", "yahoo.co.uk", "ymail.com",
      "hotmail.com", "hotmail.co.uk", "live.com", "outlook.com", "msn.com",
      "aol.com", "icloud.com", "me.com", "mac.com",
      "protonmail.com", "proton.me",
      "zoho.com", "mail.com", "gmx.com", "gmx.net",
      "yandex.com", "tutanota.com", "fastmail.com",
    ];
    const domain = email.split("@")[1]?.toLowerCase();
    if (blockedDomains.includes(domain)) {
      setError("FX News Engine is built for broker teams. Please use your company email to get started.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setStep("magic-link-sent");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
        <img src="/logo-icon.png" alt="Jupiter Tech" width={32} height={32} className="w-8 h-8 rounded-lg object-cover animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo-icon.png" alt="Jupiter Tech" width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-sans font-semibold text-foreground tracking-tight">
              Jupiter Tech
            </span>
          </div>
          <p className="font-mono text-sm text-zinc-500">FX News Engine</p>
          <div className="mt-4 space-y-2">
            <p className="text-sm text-zinc-400 font-sans leading-relaxed max-w-sm mx-auto">
              Turn today&#39;s FX and macro news into ready-to-publish content for your traders — briefs, social posts, risk alerts, and more.
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-600">
              <span>300+ instruments</span>
              <span className="text-zinc-700">·</span>
              <span>17 news sources</span>
              <span className="text-zinc-700">·</span>
              <span>Real-time data</span>
            </div>
          </div>
        </div>

        {step === "email" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-sans font-semibold text-foreground mb-1">
                Sign in to continue
              </h2>
              <p className="text-sm text-zinc-500 font-sans">
                Enter your work email to access the FX News Engine.
              </p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              placeholder="you@yourcompany.com"
              required
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-zinc-600 outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300"
            />

            {error && (
              <p className="text-sm text-red-400 font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.includes("@")}
              className="w-full py-3 bg-accent text-background font-sans font-semibold text-sm rounded-xl hover:bg-accent-dim transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Sending link..." : "Continue"}
            </button>
          </form>
        )}

        {step === "magic-link-sent" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-lg font-sans font-semibold text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-zinc-400 font-sans">
              We&apos;ve sent a magic link to{" "}
              <span className="text-accent font-mono">{email}</span>.
              <br />
              Click the link to sign in.
            </p>
            <button
              onClick={() => setStep("email")}
              className="text-sm text-zinc-500 hover:text-accent font-mono transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}

        <div className="text-center mt-8 space-y-2">
          <p className="text-[11px] text-zinc-700 font-sans">
            Powered by Jupiter Tech
          </p>
          <a
            href="https://calendly.com/kian-jupitertech/cfd-ai-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-zinc-600 hover:text-accent font-sans transition-colors"
          >
            Want AI-powered content for your brokerage? Let&apos;s talk →
          </a>
        </div>
      </div>
    </div>
  );
}
