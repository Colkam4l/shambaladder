// app/share/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FarmerProfile, CompositeScore, ExplanationResponse } from '@/types';

export default function ShareProfile() {
  const router = useRouter();

  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [score, setScore] = useState<CompositeScore | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Flow step state: 1 = Consent, 2 = Generated Link
  const [step, setStep] = useState<1 | 2>(1);
  const [lenderName, setLenderName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const farmerId = localStorage.getItem('activeFarmerId');
    const profileJson = localStorage.getItem('activeProfile');
    const scoreJson = localStorage.getItem('activeScore');
    const explanationJson = localStorage.getItem('activeExplanation');

    if (!farmerId || !profileJson || !scoreJson || !explanationJson) {
      router.replace('/demo');
      return;
    }

    setProfile(JSON.parse(profileJson));
    setScore(JSON.parse(scoreJson));
    setExplanation(JSON.parse(explanationJson));
    setLoadingData(false);
  }, [router]);

  if (loadingData || !profile || !score || !explanation) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-sm text-text-secondary font-medium">Loading share options...</p>
        </div>
      </div>
    );
  }

  const handleGenerateShare = async () => {
    try {
      setGenerating(true);
      setError(null);

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId: profile.farmerId,
          lenderName: lenderName || null,
          scoreSnapshot: score,
          explanationSnapshot: explanation,
          profileSnapshot: profile,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate share link.');
      }

      const data = await res.json();
      setShareUrl(data.shareUrl);
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not generate the share link. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-page text-text-primary font-sans px-4 py-8 md:px-8">
      <div className="max-w-[540px] mx-auto flex flex-col gap-6">
        
        {/* Back navigation */}
        <Link href={`/demo/${profile.farmerId}`} className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors flex items-center gap-1 self-start">
          ← Back to Dashboard
        </Link>

        {error && (
          <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-xl text-center font-semibold text-sm">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: Consent Review */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight">
                Share your credit profile
              </h1>
              <p className="text-sm text-text-secondary font-medium">
                You control who sees your data. Review the sharing consent below.
              </p>
            </div>

            {/* Consent Card */}
            <div className="bg-bg-card border border-border-default rounded-xl overflow-hidden shadow-sm divide-y divide-border-default">
              <div className="p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  The lender WILL see:
                </h3>
                <ul className="text-sm space-y-2.5 text-text-primary font-medium">
                  <li className="flex items-center gap-2.5">
                    <span className="text-success-text flex-shrink-0">✓</span>
                    <span>Your credit score and tier</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-success-text flex-shrink-0">✓</span>
                    <span>Score breakdown across all five dimensions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-success-text flex-shrink-0">✓</span>
                    <span>Verification status for each data field</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-success-text flex-shrink-0">✓</span>
                    <span>Peer repayment context from your cooperative</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                  The lender WILL NOT see:
                </h3>
                <ul className="text-sm space-y-2.5 text-text-secondary font-medium">
                  <li className="flex items-center gap-2.5">
                    <span className="text-error-text flex-shrink-0">✗</span>
                    <span>Your mobile money account details</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-error-text flex-shrink-0">✗</span>
                    <span>Your cooperative login credentials</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="text-error-text flex-shrink-0">✗</span>
                    <span>Any data field you have not provided</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label htmlFor="lenderName" className="text-xs font-bold text-text-secondary uppercase tracking-wider block">
                Lender or institution name (optional)
              </label>
              <input
                id="lenderName"
                type="text"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                placeholder="e.g. Kisii SACCO"
                className="w-full h-11 px-3.5 bg-bg-card border border-border-default hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent rounded-lg text-sm text-text-primary transition-all outline-none"
              />
            </div>

            <button
              onClick={handleGenerateShare}
              disabled={generating}
              className="w-full h-11 bg-accent hover:bg-accent-hover active:bg-accent-active disabled:bg-accent/50 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {generating ? 'Generating Link...' : 'Generate share link'}
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Link Generated */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1 text-center">
              <span className="text-4xl">🚀</span>
              <h1 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight mt-2">
                Your profile is ready to share
              </h1>
              <p className="text-sm text-text-secondary font-medium">
                Copy the link below or show the QR code to your loan officer.
              </p>
            </div>

            {/* Share link copy panel */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 h-11 px-3.5 bg-bg-inset border border-border-default rounded-lg text-xs font-mono text-text-secondary outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="h-11 px-5 bg-accent hover:bg-accent-hover active:bg-accent-active text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center min-w-[85px] cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-bg-card border border-border-default rounded-xl p-6 shadow-sm flex flex-col items-center justify-center gap-3">
              <div className="h-44 w-44 bg-bg-inset rounded-lg border border-dashed border-border-strong flex flex-col items-center justify-center p-4">
                {/* QR Code mockup */}
                <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full opacity-60">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${(i * 3 + 7) % 2 === 0 ? 'bg-text-primary' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[11px] font-bold text-text-tertiary tracking-wider uppercase">
                QR Code Profile Snapshot
              </span>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed text-center font-normal">
              This link shows a static snapshot of your score as of today. You can revoke access at any time.
            </p>

            <Link href={`/demo/${profile.farmerId}`} className="block text-center mt-4">
              <button className="h-11 px-6 border border-border-strong text-text-primary hover:bg-bg-inset font-semibold text-sm rounded-lg transition-colors cursor-pointer w-full">
                Return to Dashboard
              </button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
