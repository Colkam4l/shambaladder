export interface SeedFarmer {
  farmerId: string;
  name: string;
  primaryCrop: string;
  farmSizeAcres: number;
  currentTier: number;
  region: string;
  tenureSeasons: number;
  repaymentOutcome: 'on_time' | 'late' | 'default' | null;
}

export const SYNTHETIC_FARMERS: SeedFarmer[] = [];

// Helper to generate the 50 synthetic farmers according to the precise required distribution
function generateSyntheticFarmers() {
  let idCounter = 1;

  // 1. 22 In-Range Completed Cycle Farmers (size between 1.0 and 4.0, e.g. 2.0 or 3.0)
  // 18 on_time
  for (let i = 0; i < 18; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer InRange OnTime ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 2.0 + (i % 5) * 0.2, // size between 2.0 and 2.8
      currentTier: 2 + (i % 3), // tiers 2, 3, 4
      region: 'kisii',
      tenureSeasons: 2 + (i % 3),
      repaymentOutcome: 'on_time',
    });
  }

  // 2 late in-range
  for (let i = 0; i < 2; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer InRange Late ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 2.1 + i * 0.3, // size 2.1, 2.4
      currentTier: 2,
      region: 'kisii',
      tenureSeasons: 2,
      repaymentOutcome: 'late',
    });
  }

  // 2 default in-range
  for (let i = 0; i < 2; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer InRange Default ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 2.2 + i * 0.3, // size 2.2, 2.5
      currentTier: 1,
      region: 'kisii',
      tenureSeasons: 1,
      repaymentOutcome: 'default',
    });
  }

  // 2. 18 Out-of-Range Completed Cycle Farmers (size >= 4.0 or <= 1.0, e.g., 4.2 to 4.8)
  // 10 on_time out-of-range
  for (let i = 0; i < 10; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer OutRange OnTime ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 4.2 + (i % 4) * 0.2, // size 4.2, 4.4, 4.6, 4.8
      currentTier: 3,
      region: 'kisii',
      tenureSeasons: 3,
      repaymentOutcome: 'on_time',
    });
  }

  // 2 late out-of-range
  for (let i = 0; i < 2; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer OutRange Late ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 4.5,
      currentTier: 2,
      region: 'kisii',
      tenureSeasons: 2,
      repaymentOutcome: 'late',
    });
  }

  // 6 default out-of-range
  for (let i = 0; i < 6; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer OutRange Default ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 4.6 + (i % 3) * 0.1, // size 4.6, 4.7, 4.8
      currentTier: 1,
      region: 'kisii',
      tenureSeasons: 1,
      repaymentOutcome: 'default',
    });
  }

  // 3. 10 Farmers with null repayment outcome (5 in-range, 5 out-of-range)
  // 5 null in-range
  for (let i = 0; i < 5; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer InRange Null ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 2.0 + i * 0.2,
      currentTier: 1,
      region: 'kisii',
      tenureSeasons: 1,
      repaymentOutcome: null,
    });
  }

  // 5 null out-of-range
  for (let i = 0; i < 5; i++) {
    SYNTHETIC_FARMERS.push({
      farmerId: `synth-farmer-${idCounter++}`,
      name: `Farmer OutRange Null ${i + 1}`,
      primaryCrop: 'maize',
      farmSizeAcres: 4.5 + i * 0.1,
      currentTier: 1,
      region: 'kisii',
      tenureSeasons: 1,
      repaymentOutcome: null,
    });
  }
}

generateSyntheticFarmers();
