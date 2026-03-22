"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Step = "loading" | "consent" | "invite" | "done";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("loading");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState("");

  const [inviteEmails, setInviteEmails] = useState(["", "", ""]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState("");

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setUserEmail(data.user.email || "");
      setStep("consent");
    });
  }, []);

  const handleConsent = async () => {
    setConsentLoading(true);
    setConsentError("");
    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_consent: marketingConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setConsentError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStep("invite");
    } catch {
      setConsentError("Network error. Please try again.");
    } finally {
      setConsentLoading(false);
    }
  };

  const handleInvite = async (skip = false) => {
    if (skip) {
      setStep("done");
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
      return;
    }

    const validEmails = inviteEmails.filter((e) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    );

    if (validEmails.length === 0) {
      setInviteError("Please enter at least one valid email, or skip.");
      return;
    }

    setInviteLoading(true);
    setInviteError("");

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invites.");
        return;
      }
      setInviteSent(data.invited || validEmails);
      setStep("done");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch {
      setInviteError("Network error. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const updateInviteEmail = (index: number, value: string) => {
    setInviteEmails((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (inviteError) setInviteError("");
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src="/logo-icon.png" alt="Jupiter Tech" width={32} height={32} className="w-8 h-8 rounded-lg object-cover animate-pulse" />
      </div>
    );
  }

  // Done state
  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f0b429"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-lg font-sans font-semibold text-foreground">
            {inviteSent.length > 0 ? "Invites sent!" : "You&apos;re all set!"}
          </h2>
          <p className="text-sm text-zinc-400 font-sans">
            Taking you to the FX News Engine...
          </p>
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/logo-icon.png" alt="Jupiter Tech" width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-sans font-semibold text-foreground tracking-tight">
              Jupiter Tech
            </span>
          </div>
          <p className="font-mono text-sm text-zinc-500">FX News Engine</p>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === "consent" || step === "invite"
                ? "bg-accent"
                : "bg-zinc-800"
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === "invite" ? "bg-accent" : "bg-zinc-800"
            }`}
          />
        </div>

        {/* Step 1: Marketing Consent */}
        {step === "consent" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-sans font-semibold text-foreground mb-2">
                Welcome to the FX News Engine
              </h2>
              <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                Signed in as{" "}
                <span className="text-accent font-mono">{userEmail}</span>.
                Before you dive in, we need a moment.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div>
                <p className="text-sm font-sans font-semibold text-foreground mb-1">
                  Marketing communications
                </p>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                  Jupiter Tech may send you product updates, FX market insights,
                  and news about the platform. You can unsubscribe at any time.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      marketingConsent
                        ? "bg-accent border-accent"
                        : "border-zinc-600 group-hover:border-zinc-400"
                    }`}
                  >
                    {marketingConsent && (
                      <svg
                        width="11"
                        height="9"
                        viewBox="0 0 11 9"
                        fill="none"
                      >
                        <path
                          d="M1 4L4 7.5L10 1"
                          stroke="#0a0a0f"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-sans text-zinc-300 leading-relaxed">
                  I agree to receive marketing emails from Jupiter Tech about
                  the FX News Engine and related products.
                </span>
              </label>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                <span className="text-zinc-400 font-semibold">
                  By continuing
                </span>
                , you agree to our Terms of Service and Privacy Policy. Your
                consent choice, timestamp, and IP address are recorded for
                regulatory compliance.
              </p>
            </div>

            {consentError && (
              <p className="text-sm text-red-400 font-mono">{consentError}</p>
            )}

            <button
              onClick={handleConsent}
              disabled={consentLoading}
              className="w-full py-3 bg-accent text-background font-sans font-semibold text-sm rounded-xl hover:bg-accent-dim transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {consentLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Continue →"
              )}
            </button>
          </div>
        )}

        {/* Step 2: Invite Colleagues */}
        {step === "invite" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-sans font-semibold text-foreground mb-2">
                Invite your colleagues
              </h2>
              <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                Know someone on your desk who&apos;d find this useful? Send them
                access now. This is completely optional.
              </p>
            </div>

            <div className="space-y-3">
              {inviteEmails.map((email, index) => (
                <div key={index} className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateInviteEmail(index, e.target.value)}
                    placeholder={`colleague${index + 1}@theircompany.com`}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-zinc-600 outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300"
                  />
                </div>
              ))}
            </div>

            {inviteError && (
              <p className="text-sm text-red-400 font-mono">{inviteError}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleInvite(false)}
                disabled={inviteLoading}
                className="w-full py-3 bg-accent text-background font-sans font-semibold text-sm rounded-xl hover:bg-accent-dim transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {inviteLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    Sending invites...
                  </span>
                ) : (
                  "Send invites & enter the engine →"
                )}
              </button>

              <button
                onClick={() => handleInvite(true)}
                disabled={inviteLoading}
                className="w-full py-3 bg-transparent text-zinc-500 font-sans text-sm rounded-xl hover:text-zinc-300 transition-colors duration-200"
              >
                Skip for now
              </button>
            </div>

            <p className="text-center text-[11px] text-zinc-700 font-sans">
              Invites are sent from noreply@jupitertech.io · Max 3 colleagues
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
