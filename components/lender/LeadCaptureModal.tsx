// components/lender/LeadCaptureModal.tsx
'use client';

import React, { useState } from 'react';
import { CreditTier } from '@/types';
import { TierBadge } from '@/components/ui/TierBadge';

interface LeadCaptureModalProps {
  farmer: {
    farmerId: string;
    name: string;
    primaryCrop: string;
    totalScore: number;
    tier: CreditTier;
  };
  onClose: () => void;
}

export function LeadCaptureModal({ farmer, onClose }: LeadCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !institution.trim()) return;
    setSubmitting(true);
    // Simulate network delay — no real backend for hackathon
    await new Promise(r => setTimeout(r, 900));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-bg-card border border-border-default rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {submitted ? (
          /* ── Success state ── */
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-text-primary">Request Received</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Our team will verify your institution and facilitate an introduction to{' '}
              <span className="font-semibold text-text-primary">{farmer.name}</span> within 24 hours.
              The farmer will be notified and must confirm before any contact details are shared.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-text-primary">Request Farmer Introduction</h2>
              <p className="text-xs text-text-muted">
                The farmer will be notified and must confirm before contact details are released.
              </p>
            </div>

            {/* Farmer summary */}
            <div className="bg-bg-page border border-border-default rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-primary/15 flex items-center justify-center text-accent-primary font-bold text-sm flex-shrink-0">
                {farmer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">{farmer.name}</p>
                <p className="text-xs text-text-muted capitalize">{farmer.primaryCrop} farmer</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <TierBadge tier={farmer.tier} size="sm" />
                <span className="text-xs font-bold text-text-primary">{farmer.totalScore.toFixed(1)}/100</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  placeholder="e.g. Kenya Women Finance Trust"
                  className="w-full bg-bg-page border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Your Institution Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="loans@yourbank.co.ke"
                  className="w-full bg-bg-page border border-border-default rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/40 transition"
                />
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                By submitting, you confirm you are a registered lending institution and agree to
                ShambaLadder's responsible data use terms. Farmer contact details are shared only
                after the farmer confirms the introduction request.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-accent-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  'Request Introduction'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
