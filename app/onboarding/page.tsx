"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import TermsContent from "@/components/TermsContent";

type Step = "loading" | "consent" | "profile" | "invite" | "done";

const GEOGRAPHIES = [
  "UK & Ireland",
  "Western Europe",
  "Eastern Europe",
  "Middle East & North Africa",
  "Sub-Saharan Africa",
  "South & Southeast Asia",
  "East Asia & Pacific",
  "North America",
  "Latin America & Caribbean",
  "Central Asia",
  "Global / Multi-region",
];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("loading");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showMarketingNudge, setShowMarketingNudge] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState("");

  const [position, setPosition] = useState("");
  const [geography, setGeography] = useState("");
  const [biggestBottleneck, setBiggestBottleneck] = useState("");
  const [geoOpen, setGeoOpen] = useState(false);

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

  const handleContinue = () => {
    if (!marketingConsent) {
      setShowMarketingNudge(true);
      return;
    }
    setStep("profile");
  };

  const profileComplete = position.trim() && geography && biggestBottleneck.trim();

  const handleProfileSubmit = async () => {
    setConsentLoading(true);
    setConsentError("");
    try {
      const res = await fetch("/api/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketing_consent: marketingConsent,
          position: position.trim(),
          geography,
          biggest_bottleneck: biggestBottleneck.trim(),
        }),
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
        <img src="/logo.png" alt="Jupiter Tech" width={32} height={32} className="w-8 h-8 rounded-lg object-cover animate-pulse" />
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
            <img src="/logo.png" alt="Jupiter Tech" width={48} height={48} className="w-12 h-12 rounded-xl object-cover" />
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
              step === "consent" || step === "profile" || step === "invite"
                ? "bg-accent"
                : "bg-zinc-800"
            }`}
          />
          <div
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              step === "profile" || step === "invite"
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

        {/* Step 1: Consent */}
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
              {/* Terms & Conditions checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      termsAccepted
                        ? "bg-accent border-accent"
                        : "border-zinc-600 group-hover:border-zinc-400"
                    }`}
                  >
                    {termsAccepted && (
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
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTerms(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                  >
                    Terms &amp; Conditions
                  </button>
                </span>
              </label>

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Marketing communications */}
              <div>
                <p className="text-sm font-sans font-semibold text-foreground mb-1">
                  Marketing communications
                </p>
                <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                  Jupiter Tech may send you product updates, broker workflow tips,
                  and early access to new platform features. You can unsubscribe at any time.
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
                  I agree to receive emails from Jupiter Tech about the broker
                  operating system and new workflow releases.
                </span>
              </label>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                <span className="text-zinc-400 font-semibold">
                  By continuing
                </span>
                , you confirm your consent choices above. Your choices,
                timestamp, and IP address are recorded for regulatory
                compliance.
              </p>
            </div>

            {consentError && (
              <p className="text-sm text-red-400 font-mono">{consentError}</p>
            )}

            <button
              onClick={handleContinue}
              disabled={consentLoading || !termsAccepted}
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

        {/* Marketing nudge popup */}
        {showMarketingNudge && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMarketingNudge(false)}
            />
            <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm font-sans text-zinc-300 leading-relaxed">
                We get it — nobody loves marketing emails. But this is how we
                keep the FX News Engine free for your team. A small ask for
                unlimited AI-powered content, no?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMarketingConsent(true);
                    setShowMarketingNudge(false);
                    setStep("profile");
                  }}
                  className="w-full py-2.5 bg-accent text-background font-sans font-semibold text-sm rounded-xl hover:bg-accent-dim transition-colors duration-200"
                >
                  Fair enough, sign me up
                </button>
                <button
                  onClick={() => setShowMarketingNudge(false)}
                  className="w-full py-2.5 bg-transparent text-zinc-500 font-sans text-sm rounded-xl hover:text-zinc-300 transition-colors duration-200"
                >
                  Let me think about it
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions modal */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowTerms(false)}
            />
            <div className="relative bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
                <h2 className="text-lg font-sans font-semibold text-foreground">
                  Terms &amp; Conditions
                </h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-800 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto p-6">
                <TermsContent />
              </div>

              {/* Modal footer */}
              <div className="p-6 pt-4 border-t border-border">
                <button
                  onClick={() => setShowTerms(false)}
                  className="w-full py-3 bg-accent text-background font-sans font-semibold text-sm rounded-xl hover:bg-accent-dim transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-sans font-semibold text-foreground mb-2">
                Tell us about you
              </h2>
              <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                Helps us tailor the experience to your role and region.
              </p>
            </div>

            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-sans font-medium text-zinc-300 mb-1.5">
                  Your position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Head of Marketing"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-sans text-foreground placeholder:text-zinc-600 outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300"
                />
              </div>

              {/* Geography */}
              <div>
                <label className="block text-sm font-sans font-medium text-zinc-300 mb-1.5">
                  Main geography served
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setGeoOpen(!geoOpen)}
                    className={`w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-sans text-left outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300 flex items-center justify-between ${
                      geography ? "text-foreground" : "text-zinc-600"
                    }`}
                  >
                    {geography || "Select your region"}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-zinc-500 transition-transform duration-200 ${geoOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {geoOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
                      <div className="max-h-56 overflow-y-auto">
                        {GEOGRAPHIES.map((geo) => (
                          <button
                            key={geo}
                            type="button"
                            onClick={() => {
                              setGeography(geo);
                              setGeoOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-sm font-sans text-left transition-colors ${
                              geography === geo
                                ? "bg-accent/10 text-accent"
                                : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            {geo}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Biggest Bottleneck */}
              <div>
                <label className="block text-sm font-sans font-medium text-zinc-300 mb-1.5">
                  Biggest operational bottleneck
                </label>
                <textarea
                  value={biggestBottleneck}
                  onChange={(e) => setBiggestBottleneck(e.target.value)}
                  placeholder="e.g. Manual processes eating up 10+ hours a week across the team..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-sans text-foreground placeholder:text-zinc-600 outline-none focus:border-accent/50 focus:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300 resize-none"
                />
              </div>
            </div>

            {consentError && (
              <p className="text-sm text-red-400 font-mono">{consentError}</p>
            )}

            <button
              onClick={handleProfileSubmit}
              disabled={consentLoading || !profileComplete}
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

        {/* Step 3: Invite Colleagues */}
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
