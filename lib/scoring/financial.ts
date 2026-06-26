// lib/scoring/financial.ts — Financial Behaviour dimension scorer
// Dimension 1, Default weight: 0.30
// Source of truth: scoring-engine.md

import type { FinancialInputs, DimensionScore, VerificationFlag } from '@/types';

// ---------------------------------------------------------------------------
// Sub-scorers (exported for unit testing)
// ---------------------------------------------------------------------------

export function mobileMoneyScore(regularity: FinancialInputs['mobileMoneyRegularity']): number {
  switch (regularity) {
    case 'none':      return 0;
    case 'irregular': return 8;
    case 'monthly':   return 18;
    case 'weekly':    return 25;
  }
}

export function savingsGroupScore(
  regularity: FinancialInputs['savingsGroupContributionRegularity']
): number {
  switch (regularity) {
    case null:
    case 'none':      return 0;
    case 'irregular': return 4;
    case 'regular':   return 10;
  }
}

export function cycleScore(cycles: number): number {
  if (cycles === 0) return 0;
  if (cycles === 1) return 12;
  if (cycles === 2) return 20;
  return 25; // 3+
}

export function repaymentScore(
  outcomes: ('on_time' | 'late' | 'default')[],
  cycles: number
): number {
  if (cycles === 0) return 0;

  const onTimeCount  = outcomes.filter(o => o === 'on_time').length;
  const lateCount    = outcomes.filter(o => o === 'late').length;
  const total        = cycles;
  const repaymentRate = (onTimeCount + lateCount * 0.5) / total;
  return repaymentRate * 25;
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

export function calculateFinancialScore(
  inputs: FinancialInputs,
  weight: number
): DimensionScore {
  const rawScore = Math.min(
    100,
    mobileMoneyScore(inputs.mobileMoneyRegularity) +
    (inputs.savingsGroupMember ? 15 : 0) +
    savingsGroupScore(inputs.savingsGroupContributionRegularity) +
    cycleScore(inputs.priorInputCreditCycles) +
    repaymentScore(inputs.priorRepaymentOutcomes, inputs.priorInputCreditCycles)
  );

  const missingFields: string[] = [];
  if (inputs.mobileMoneyRegularity === 'none')    missingFields.push('Mobile money activity');
  if (!inputs.savingsGroupMember)                  missingFields.push('Savings group membership');
  if (inputs.priorInputCreditCycles === 0)         missingFields.push('Input credit history');

  const verificationFlags: VerificationFlag[] = [
    {
      field: 'mobileMoneyRegularity',
      status: inputs.verificationStatus.mobileMoneyRegularity,
      source: 'Farmer self-reported',
    },
    {
      field: 'savingsGroupMember',
      status: inputs.verificationStatus.savingsGroupMember,
      source: 'Farmer self-reported',
    },
    {
      field: 'priorRepaymentOutcomes',
      status: inputs.verificationStatus.priorRepaymentOutcomes,
      source: 'Cooperative records',
    },
  ];

  // Flag default outcomes for lender
  const hasDefault = inputs.priorRepaymentOutcomes.includes('default');
  if (hasDefault) {
    verificationFlags.push({
      field: 'priorRepaymentOutcomes',
      status: inputs.verificationStatus.priorRepaymentOutcomes,
      source: 'Cooperative records',
      note: '⚠ One or more default outcomes recorded',
    });
  }

  const weightedScore = rawScore * weight;

  return {
    dimension: 'financial_behaviour',
    rawScore,
    weight,
    weightedScore,
    completenessMultiplier: 1, // applied by composite calculator
    adjustedScore: weightedScore,
    missingFields,
    verificationFlags,
  };
}
