// scripts/seed-neo4j.ts
// Run with: npx tsx scripts/seed-neo4j.ts

import { loadEnvConfig } from '@next/env';
// Load environment variables from .env.local
loadEnvConfig(process.cwd());

import { runQuery, closeDriver } from '../lib/neo4j/client';
import { SYNTHETIC_FARMERS } from './neo4j-seed-data';

async function seed() {
  console.log('Starting Neo4j seed process...');

  // 1. Clear existing database nodes and relationships
  console.log('Clearing old Farmer, Cooperative, and Region nodes...');
  await runQuery(`
    MATCH (f:Farmer) DETACH DELETE f
  `, {});
  await runQuery(`
    MATCH (c:Cooperative) DETACH DELETE c
  `, {});
  await runQuery(`
    MATCH (r:Region) DETACH DELETE r
  `, {});

  // 2. Create Cooperative
  console.log('Creating Kisii Cooperative...');
  await runQuery(`
    MERGE (c:Cooperative {
      cooperativeId: 'coop-kisii-001',
      name: 'Kisii Maize Cooperative',
      region: 'kisii',
      country: 'kenya',
      avgRepaymentRate: 0.70
    })
  `, {});

  // 3. Create Region
  console.log('Creating Kisii Region...');
  await runQuery(`
    MERGE (r:Region {
      regionId: 'region-kisii',
      name: 'Kisii',
      country: 'kenya'
    })
  `, {});

  // 4. Create Cooperative-Region Relationship
  await runQuery(`
    MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
    MATCH (r:Region {regionId: 'region-kisii'})
    MERGE (c)-[:LOCATED_IN]->(r)
  `, {});

  // 5. Seed 50 Synthetic Farmers
  console.log(`Seeding ${SYNTHETIC_FARMERS.length} synthetic farmers...`);
  for (const farmer of SYNTHETIC_FARMERS) {
    await runQuery(`
      CREATE (f:Farmer {
        farmerId: $farmerId,
        name: $name,
        primaryCrop: $primaryCrop,
        farmSizeAcres: $farmSizeAcres,
        currentTier: $currentTier,
        region: $region
      })
    `, farmer as unknown as Record<string, unknown>);

    await runQuery(`
      MATCH (f:Farmer {farmerId: $farmerId})
      MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
      MERGE (f)-[m:MEMBER_OF]->(c)
      SET m.tenureSeasons = $tenureSeasons,
          m.repaymentOutcome = $repaymentOutcome
    `, {
      farmerId: farmer.farmerId,
      tenureSeasons: farmer.tenureSeasons,
      repaymentOutcome: farmer.repaymentOutcome,
    });
  }

  // 6. Merge Demo Farmers
  console.log('Seeding the 3 demo farmers...');
  
  // Demo Farmer 1: Wanjiku Kamau
  await runQuery(`
    MERGE (f:Farmer {farmerId: 'demo-wanjiku-001'})
    SET f.name = 'Wanjiku Kamau',
        f.primaryCrop = 'maize',
        f.farmSizeAcres = 2.5,
        f.currentTier = 2,
        f.region = 'kisii'
    WITH f
    MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
    MERGE (f)-[m:MEMBER_OF]->(c)
    SET m.tenureSeasons = 2,
        m.repaymentOutcome = null
  `, {});

  // Demo Farmer 2: Joseph Omondi
  await runQuery(`
    MERGE (f:Farmer {farmerId: 'demo-joseph-001'})
    SET f.name = 'Joseph Omondi',
        f.primaryCrop = 'maize',
        f.farmSizeAcres = 3.0,
        f.currentTier = 4,
        f.region = 'kisii'
    WITH f
    MATCH (c:Cooperative {cooperativeId: 'coop-kisii-001'})
    MERGE (f)-[m:MEMBER_OF]->(c)
    SET m.tenureSeasons = 4,
        m.repaymentOutcome = 'on_time'
  `, {});

  // Demo Farmer 3: Amina Hassan (Beans, no cooperative membership)
  await runQuery(`
    MERGE (f:Farmer {farmerId: 'demo-amina-001'})
    SET f.name = 'Amina Hassan',
        f.primaryCrop = 'beans',
        f.farmSizeAcres = 1.5,
        f.currentTier = 1,
        f.region = 'kisii'
  `, {});

  console.log('Database seeded successfully.');
}

seed()
  .then(async () => {
    await closeDriver();
    console.log('Seeding complete. Connection closed.');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seeding failed:', err);
    await closeDriver();
    process.exit(1);
  });
