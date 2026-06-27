// lib/farmer-registry/registry-data.ts
// 50 crop-only farmer profiles for the lender marketplace
// All in Kisii Maize Cooperative (coop-kisii-001), Kenya
// Distribution: 8 Trusted | 15 Established | 17 Growing | 10 Seedling

import type { FarmerProfile } from '@/types';

function profile(
  id: string,
  name: string,
  primaryCrop: string,
  farmSizeAcres: number,
  lat: number,
  lng: number,
  fin: {
    mmReg: 'none' | 'irregular' | 'monthly' | 'weekly';
    sgMember: boolean;
    sgReg: 'none' | 'irregular' | 'regular' | null;
    cycles: number;
    outcomes: ('on_time' | 'late' | 'default')[];
  },
  prod: {
    yieldLast: number | null;
    yieldPrev: number | null;
    diversity: number;
    seeds: boolean;
    fertilizer: boolean;
    gps: boolean;
    soilIndex: number | null;
  },
  clim: {
    irrigation: boolean;
    drought: boolean;
    soilCons: boolean;
    storage: boolean;
    insurance: boolean;
  },
  soc: {
    coopSeasons: number;
    offTaker: boolean;
    offTakerSeasons: number;
    repayRate: number | null;
  },
  completeness: number,
  createdAt: string
): FarmerProfile {
  return {
    farmerId: id,
    name,
    location: { latitude: lat, longitude: lng },
    region: 'kenya',
    primaryCrop,
    farmSizeAcres,
    currentSeason: 'Long Rains 2025',
    marketplaceConsent: true,
    financial: {
      mobileMoneyRegularity: fin.mmReg,
      mobileMoneyMonthlyVolume: fin.mmReg === 'weekly' ? 9000 : fin.mmReg === 'monthly' ? 4000 : null,
      savingsGroupMember: fin.sgMember,
      savingsGroupContributionRegularity: fin.sgReg,
      priorInputCreditCycles: fin.cycles,
      priorRepaymentOutcomes: fin.outcomes,
      verificationStatus: {
        mobileMoneyRegularity: 'self_reported',
        savingsGroupMember: 'self_reported',
        priorRepaymentOutcomes: fin.cycles > 0 ? 'verified' : 'missing',
      },
    },
    productivity: {
      yieldLastSeason: prod.yieldLast,
      yieldPreviousSeason: prod.yieldPrev,
      cropDiversity: prod.diversity,
      usesImprovedSeeds: prod.seeds,
      usesFertilizer: prod.fertilizer,
      usesAgrochemicals: false,
      gpsConfirmed: prod.gps,
      farmBoundaryCoordinates: prod.gps
        ? [{ latitude: lat, longitude: lng }, { latitude: lat + 0.001, longitude: lng + 0.001 }]
        : null,
      soilQualityIndex: prod.soilIndex,
      soilDataSource: prod.soilIndex ? 'soilgrids' : null,
      verificationStatus: {
        yieldLastSeason: prod.yieldLast ? 'self_reported' : 'missing',
        gpsConfirmed: prod.gps ? 'verified' : 'missing',
        soilQualityIndex: prod.soilIndex ? 'third_party' : 'missing',
      },
    },
    climate: {
      rainfallIndexLastSeason: 810,
      droughtIndexLastSeason: -0.3,
      climateRiskLevel: 'low',
      hasIrrigationAccess: clim.irrigation,
      usesDroughtTolerantVarieties: clim.drought,
      practisesSoilConservation: clim.soilCons,
      hasPostHarvestStorage: clim.storage,
      hasCropInsurance: clim.insurance,
      verificationStatus: {
        rainfallIndexLastSeason: 'third_party',
        adaptivePractices: 'self_reported',
      },
    },
    social: {
      cooperativeId: 'coop-kisii-001',
      cooperativeName: 'Kisii Maize Cooperative',
      cooperativeMemberSinceSeasons: soc.coopSeasons,
      hasStableOfftaker: soc.offTaker,
      offtakerSeasons: soc.offTakerSeasons,
      peerBenchmark: soc.coopSeasons >= 1
        ? {
            cooperativeId: 'coop-kisii-001',
            cooperativeName: 'Kisii Maize Cooperative',
            peerCount: 23,
            onTimeCount: 19,
            lateCount: 2,
            defaultCount: 2,
            avgPeerTier: 2.4,
            repaymentRate: 0.826,
            displayString: '19 of 23 similar farmers in Kisii Cooperative repaid on time',
            sufficientData: true,
          }
        : null,
      cooperativeRepaymentRate: soc.repayRate,
      verificationStatus: {
        cooperativeMembership: soc.coopSeasons > 0 ? 'verified' : 'missing',
        offtakerRelationship: soc.offTaker ? 'self_reported' : 'missing',
        peerBenchmark: soc.coopSeasons >= 1 ? 'graph_derived' : 'missing',
      },
    },
    completeness: {
      shamboproProfileComplete: completeness >= 76,
      gpsConfirmed: prod.gps,
      entryConsistencyScore: completeness / 100,
      internalConsistencyScore: Math.min(completeness / 100 + 0.05, 1),
      completenessPercentage: completeness,
    },
    createdAt,
    lastUpdatedAt: '2025-04-01T08:00:00Z',
    consentGrantedAt: createdAt,
    sharedProfiles: [],
  };
}

export const FARMER_REGISTRY: FarmerProfile[] = [

  // ── TRUSTED TIER (8 farmers — score 80–95) ──────────────────────────────
  profile('reg-001', 'Joseph Kamau Mwangi', 'maize', 4.5, -0.6480, 37.2510,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 880, yieldPrev: 820, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 82 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 3, repayRate: 0.82 },
    95, '2023-03-01T08:00:00Z'),

  profile('reg-002', 'Grace Nyambura Gitau', 'maize', 3.8, -0.6510, 37.2480,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 820, yieldPrev: 780, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 79 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: true },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 3, repayRate: 0.82 },
    98, '2023-01-15T08:00:00Z'),

  profile('reg-003', 'David Kipchoge Rotich', 'coffee', 5.0, -0.6390, 37.2610,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','late'] },
    { yieldLast: 920, yieldPrev: 860, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 85 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 4, repayRate: 0.82 },
    92, '2022-10-01T08:00:00Z'),

  profile('reg-004', 'Faith Chebet Korir', 'coffee', 4.2, -0.6420, 37.2590,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 860, yieldPrev: 800, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 78 },
    { irrigation: true, drought: true, soilCons: true, storage: false, insurance: true },
    { coopSeasons: 5, offTaker: true, offTakerSeasons: 4, repayRate: 0.82 },
    93, '2022-08-01T08:00:00Z'),

  profile('reg-005', 'Samuel Omondi Otieno', 'tea', 6.0, -0.6350, 37.2640,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 1050, yieldPrev: 980, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 88 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: true },
    { coopSeasons: 5, offTaker: true, offTakerSeasons: 5, repayRate: 0.82 },
    100, '2022-06-01T08:00:00Z'),

  profile('reg-006', 'Rose Achieng Oloo', 'tea', 5.5, -0.6360, 37.2630,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 980, yieldPrev: 920, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 84 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 3, repayRate: 0.82 },
    96, '2022-09-01T08:00:00Z'),

  profile('reg-007', 'Peter Mutua Musyoka', 'maize', 4.0, -0.6470, 37.2530,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','on_time','on_time'] },
    { yieldLast: 810, yieldPrev: 770, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 80 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 3, repayRate: 0.82 },
    94, '2023-02-01T08:00:00Z'),

  profile('reg-008', 'Caroline Moraa Nyamweya', 'maize', 3.5, -0.6500, 37.2550,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 3, outcomes: ['on_time','late','on_time'] },
    { yieldLast: 780, yieldPrev: 730, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 76 },
    { irrigation: true, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 4, offTaker: true, offTakerSeasons: 2, repayRate: 0.82 },
    91, '2023-04-01T08:00:00Z'),

  // ── ESTABLISHED TIER (15 farmers — score 60–79) ─────────────────────────
  profile('reg-009', 'James Njoroge Mureithi', 'maize', 3.0, -0.6600, 37.2600,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 720, yieldPrev: 680, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 72 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    85, '2023-06-01T08:00:00Z'),

  profile('reg-010', 'Agnes Njeri Muthoni', 'maize', 2.8, -0.6620, 37.2580,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 700, yieldPrev: 650, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 70 },
    { irrigation: true, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 3, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    82, '2023-07-01T08:00:00Z'),

  profile('reg-011', 'Charles Kiplagat Sang', 'maize', 3.2, -0.6580, 37.2620,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','late'] },
    { yieldLast: 680, yieldPrev: 640, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 71 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    88, '2023-05-01T08:00:00Z'),

  profile('reg-012', 'Tabitha Wangui Njuguna', 'beans', 2.5, -0.6640, 37.2560,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 520, yieldPrev: 480, diversity: 2, seeds: true, fertilizer: true, gps: false, soilIndex: 68 },
    { irrigation: true, drought: true, soilCons: false, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    84, '2023-08-01T08:00:00Z'),

  profile('reg-013', 'Francis Gitau Njuguna', 'beans', 2.2, -0.6660, 37.2540,
    { mmReg: 'weekly', sgMember: true, sgReg: 'irregular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 480, yieldPrev: 450, diversity: 2, seeds: true, fertilizer: false, gps: true, soilIndex: 65 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 2, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    80, '2023-09-01T08:00:00Z'),

  profile('reg-014', 'Joyce Adhiambo Otieno', 'beans', 2.0, -0.6680, 37.2520,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 460, yieldPrev: 430, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 67 },
    { irrigation: true, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    83, '2023-10-01T08:00:00Z'),

  profile('reg-015', 'Benjamin Cheruiyot Ruto', 'beans', 2.5, -0.6700, 37.2500,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 500, yieldPrev: 460, diversity: 2, seeds: true, fertilizer: true, gps: false, soilIndex: 69 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 1, repayRate: 0.70 },
    79, '2023-11-01T08:00:00Z'),

  profile('reg-016', 'Lydia Zawadi Mwangi', 'tomato', 1.8, -0.6720, 37.2480,
    { mmReg: 'weekly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 1200, yieldPrev: 1100, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 73 },
    { irrigation: true, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    81, '2023-12-01T08:00:00Z'),

  profile('reg-017', 'Harrison Kiprotich Mutai', 'tomato', 2.0, -0.6740, 37.2460,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','late'] },
    { yieldLast: 1100, yieldPrev: 1050, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 71 },
    { irrigation: true, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: true, offTakerSeasons: 1, repayRate: 0.70 },
    80, '2024-01-01T08:00:00Z'),

  profile('reg-018', 'Esther Akoth Atieno', 'tomato', 1.5, -0.6760, 37.2440,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 980, yieldPrev: 920, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 70 },
    { irrigation: true, drought: true, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    78, '2024-02-01T08:00:00Z'),

  profile('reg-019', 'Martin Otieno Odhiambo', 'maize', 3.5, -0.6560, 37.2640,
    { mmReg: 'monthly', sgMember: true, sgReg: 'irregular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 660, yieldPrev: 610, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 68 },
    { irrigation: false, drought: true, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    82, '2024-03-01T08:00:00Z'),

  profile('reg-020', 'Vivian Nafula Wafula', 'maize', 2.8, -0.6540, 37.2660,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 640, yieldPrev: 600, diversity: 2, seeds: true, fertilizer: false, gps: true, soilIndex: 66 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 1, repayRate: 0.70 },
    84, '2024-04-01T08:00:00Z'),

  profile('reg-021', 'Collins Kiplangat Bett', 'maize', 4.0, -0.6520, 37.2680,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 2, outcomes: ['on_time','on_time'] },
    { yieldLast: 710, yieldPrev: 660, diversity: 3, seeds: true, fertilizer: true, gps: true, soilIndex: 74 },
    { irrigation: true, drought: false, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 3, offTaker: true, offTakerSeasons: 2, repayRate: 0.70 },
    83, '2024-05-01T08:00:00Z'),

  profile('reg-022', 'Dorcas Mumbi Kamande', 'maize', 2.5, -0.6490, 37.2700,
    { mmReg: 'weekly', sgMember: true, sgReg: 'irregular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 620, yieldPrev: 580, diversity: 2, seeds: true, fertilizer: true, gps: false, soilIndex: 69 },
    { irrigation: false, drought: true, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    80, '2024-06-01T08:00:00Z'),

  profile('reg-023', 'Edwin Ngugi Waweru', 'maize', 3.0, -0.6460, 37.2720,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 640, yieldPrev: null, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 70 },
    { irrigation: false, drought: false, soilCons: true, storage: true, insurance: false },
    { coopSeasons: 2, offTaker: true, offTakerSeasons: 1, repayRate: 0.70 },
    82, '2024-07-01T08:00:00Z'),

  // ── GROWING TIER (17 farmers — score 40–59) ──────────────────────────────
  profile('reg-024', 'Wanjiku Kamau', 'maize', 2.5, -0.6698, 37.2655,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 0, outcomes: [] },
    { yieldLast: 680, yieldPrev: 620, diversity: 2, seeds: true, fertilizer: true, gps: false, soilIndex: 72 },
    { irrigation: false, drought: true, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    75, '2025-01-01T08:00:00Z'),

  profile('reg-025', 'Emmah Cherotich Siele', 'maize', 2.0, -0.6750, 37.2600,
    { mmReg: 'monthly', sgMember: true, sgReg: 'irregular', cycles: 1, outcomes: ['late'] },
    { yieldLast: 580, yieldPrev: 550, diversity: 2, seeds: true, fertilizer: false, gps: false, soilIndex: 64 },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    68, '2025-01-15T08:00:00Z'),

  profile('reg-026', 'Paul Mwangi Kariuki', 'maize', 2.2, -0.6800, 37.2560,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 560, yieldPrev: 520, diversity: 1, seeds: true, fertilizer: true, gps: false, soilIndex: 62 },
    { irrigation: false, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    65, '2025-02-01T08:00:00Z'),

  profile('reg-027', 'Irene Kerubo Onchonga', 'maize', 1.8, -0.6830, 37.2520,
    { mmReg: 'monthly', sgMember: true, sgReg: 'irregular', cycles: 0, outcomes: [] },
    { yieldLast: 540, yieldPrev: 510, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: 61 },
    { irrigation: false, drought: true, soilCons: false, storage: true, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    70, '2025-02-15T08:00:00Z'),

  profile('reg-028', 'Dennis Kiptoo Cheruiyot', 'maize', 2.5, -0.6860, 37.2480,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 600, yieldPrev: null, diversity: 2, seeds: false, fertilizer: true, gps: false, soilIndex: 65 },
    { irrigation: false, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: true, offTakerSeasons: 1, repayRate: 0.70 },
    72, '2025-03-01T08:00:00Z'),

  profile('reg-029', 'Salome Atieno Odour', 'maize', 1.5, -0.6890, 37.2440,
    { mmReg: 'irregular', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 520, yieldPrev: 490, diversity: 2, seeds: true, fertilizer: true, gps: false, soilIndex: 63 },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    71, '2025-03-15T08:00:00Z'),

  profile('reg-030', 'Patrick Njoroge Kiarie', 'maize', 3.0, -0.6920, 37.2400,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 580, yieldPrev: 550, diversity: 2, seeds: true, fertilizer: true, gps: true, soilIndex: 60 },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    68, '2025-03-20T08:00:00Z'),

  profile('reg-031', 'Lucy Waweru Gacheru', 'sorghum', 2.0, -0.6560, 37.2580,
    { mmReg: 'irregular', sgMember: true, sgReg: 'irregular', cycles: 1, outcomes: ['late'] },
    { yieldLast: 420, yieldPrev: 400, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: 58 },
    { irrigation: false, drought: true, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    66, '2025-02-10T08:00:00Z'),

  profile('reg-032', 'Moses Ayieko Onyango', 'sorghum', 1.5, -0.6580, 37.2540,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 380, yieldPrev: 360, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: 56 },
    { irrigation: false, drought: true, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    64, '2025-02-20T08:00:00Z'),

  profile('reg-033', 'Hannah Awino Adhiambo', 'sorghum', 2.5, -0.6600, 37.2500,
    { mmReg: 'monthly', sgMember: true, sgReg: 'irregular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 440, yieldPrev: null, diversity: 2, seeds: false, fertilizer: false, gps: false, soilIndex: 55 },
    { irrigation: false, drought: true, soilCons: false, storage: true, insurance: false },
    { coopSeasons: 2, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    67, '2025-02-25T08:00:00Z'),

  profile('reg-034', 'Victor Ndegwa Mugo', 'sorghum', 2.0, -0.6620, 37.2460,
    { mmReg: 'irregular', sgMember: true, sgReg: 'irregular', cycles: 0, outcomes: [] },
    { yieldLast: 400, yieldPrev: 380, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: 57 },
    { irrigation: false, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    62, '2025-03-05T08:00:00Z'),

  profile('reg-035', 'Ann Nekesa Simiyu', 'beans', 1.5, -0.6640, 37.2420,
    { mmReg: 'monthly', sgMember: true, sgReg: 'regular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 380, yieldPrev: 350, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: 59 },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    65, '2025-03-10T08:00:00Z'),

  profile('reg-036', 'Simon Njenga Karanja', 'beans', 2.0, -0.6660, 37.2380,
    { mmReg: 'irregular', sgMember: true, sgReg: 'regular', cycles: 0, outcomes: [] },
    { yieldLast: 360, yieldPrev: null, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: 58 },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    63, '2025-03-15T08:00:00Z'),

  profile('reg-037', 'Mercy Chemutai Letting', 'beans', 1.2, -0.6680, 37.2340,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 1, outcomes: ['late'] },
    { yieldLast: 320, yieldPrev: 300, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: 55 },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    61, '2025-03-20T08:00:00Z'),

  profile('reg-038', 'Alfred Odhiambo Aseto', 'maize', 2.8, -0.6700, 37.2300,
    { mmReg: 'monthly', sgMember: true, sgReg: 'irregular', cycles: 1, outcomes: ['on_time'] },
    { yieldLast: 560, yieldPrev: 530, diversity: 2, seeds: true, fertilizer: false, gps: false, soilIndex: 61 },
    { irrigation: false, drought: false, soilCons: true, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    69, '2025-03-25T08:00:00Z'),

  profile('reg-039', 'Joyce Moraa Bosibori', 'maize', 2.0, -0.6720, 37.2260,
    { mmReg: 'irregular', sgMember: true, sgReg: 'regular', cycles: 0, outcomes: [] },
    { yieldLast: 520, yieldPrev: 490, diversity: 1, seeds: false, fertilizer: true, gps: false, soilIndex: 60 },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    65, '2025-04-01T08:00:00Z'),

  profile('reg-040', 'Philip Gachigi Muriuki', 'maize', 1.8, -0.6740, 37.2220,
    { mmReg: 'monthly', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 500, yieldPrev: null, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: 62 },
    { irrigation: false, drought: false, soilCons: false, storage: true, insurance: false },
    { coopSeasons: 1, offTaker: false, offTakerSeasons: 0, repayRate: 0.70 },
    62, '2025-04-05T08:00:00Z'),

  // ── SEEDLING TIER (10 farmers — score 20–39) ────────────────────────────
  profile('reg-041', 'Amina Hassan Aden', 'beans', 1.5, -0.6550, 37.2500,
    { mmReg: 'none', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 280, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: 60 },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    40, '2025-04-10T08:00:00Z'),

  profile('reg-042', 'George Wafula Barasa', 'maize', 1.0, -0.6570, 37.2460,
    { mmReg: 'irregular', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 300, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    35, '2025-04-12T08:00:00Z'),

  profile('reg-043', 'Priscilla Auma Were', 'maize', 1.2, -0.6590, 37.2420,
    { mmReg: 'none', sgMember: true, sgReg: 'irregular', cycles: 0, outcomes: [] },
    { yieldLast: 320, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    38, '2025-04-14T08:00:00Z'),

  profile('reg-044', 'Isaac Kamwenja Gathu', 'maize', 1.5, -0.6610, 37.2380,
    { mmReg: 'irregular', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 340, yieldPrev: null, diversity: 1, seeds: true, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    40, '2025-04-15T08:00:00Z'),

  profile('reg-045', 'Teresia Njoki Kariuki', 'maize', 1.0, -0.6630, 37.2340,
    { mmReg: 'none', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 260, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    30, '2025-04-17T08:00:00Z'),

  profile('reg-046', 'Kevin Ouma Ochieng', 'maize', 1.2, -0.6650, 37.2300,
    { mmReg: 'irregular', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: null, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    25, '2025-04-18T08:00:00Z'),

  profile('reg-047', 'Susan Njambi Maina', 'beans', 1.0, -0.6670, 37.2260,
    { mmReg: 'none', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 200, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    28, '2025-04-19T08:00:00Z'),

  profile('reg-048', 'Robert Masinde Wanyama', 'beans', 1.5, -0.6690, 37.2220,
    { mmReg: 'irregular', sgMember: true, sgReg: 'irregular', cycles: 0, outcomes: [] },
    { yieldLast: 240, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: true, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    42, '2025-04-20T08:00:00Z'),

  profile('reg-049', 'Jane Akinyi Odongo', 'tomato', 0.8, -0.6710, 37.2180,
    { mmReg: 'none', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 600, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    32, '2025-04-21T08:00:00Z'),

  profile('reg-050', 'Michael Nabende Namukasa', 'tomato', 1.0, -0.6730, 37.2140,
    { mmReg: 'irregular', sgMember: false, sgReg: null, cycles: 0, outcomes: [] },
    { yieldLast: 550, yieldPrev: null, diversity: 1, seeds: false, fertilizer: false, gps: false, soilIndex: null },
    { irrigation: false, drought: false, soilCons: false, storage: false, insurance: false },
    { coopSeasons: 0, offTaker: false, offTakerSeasons: 0, repayRate: null },
    30, '2025-04-22T08:00:00Z'),
];
