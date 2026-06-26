// components/ui/VerificationBadge.tsx
import React from 'react';
import { VerificationStatus } from '@/types';

interface VerificationBadgeProps {
  status: VerificationStatus;
  fieldName?: string;
}

export function VerificationBadge({ status, fieldName }: VerificationBadgeProps) {
  let text = '';
  let bgClass = '';
  let textClass = '';

  switch (status) {
    case 'verified':
      text = '✓ Verified';
      bgClass = 'bg-verified-bg';
      textClass = 'text-verified-text';
      break;
    case 'self_reported':
      text = '○ Self-reported';
      bgClass = 'bg-self-reported-bg';
      textClass = 'text-self-reported-text';
      break;
    case 'third_party':
      // Customize based on fieldName if provided
      if (fieldName === 'soilQualityIndex') {
        text = '◆ SoilGrids';
      } else if (fieldName?.includes('rainfall') || fieldName?.includes('climate') || fieldName?.includes('drought') || fieldName?.includes('rainfallIndexLastSeason') || fieldName?.includes('adaptivePractices')) {
        text = '◆ Open-Meteo';
      } else {
        text = '◆ Third-Party';
      }
      bgClass = 'bg-third-party-bg';
      textClass = 'text-third-party-text';
      break;
    case 'graph_derived':
      text = '◆ Neo4j';
      bgClass = 'bg-info-bg';
      textClass = 'text-info-text';
      break;
    case 'missing':
      text = '! Missing';
      bgClass = 'bg-missing-bg';
      textClass = 'text-missing-text';
      break;
    default:
      return null;
  }

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full border border-black/5 whitespace-nowrap ${bgClass} ${textClass}`}
    >
      {text}
    </span>
  );
}

export default VerificationBadge;
