// scripts/seed-neo4j.ts
// Run with: npx tsx scripts/seed-neo4j.ts

import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

import { runQuery, closeDriver } from '../lib/neo4j/client';
import { saveFarmerToGraph } from '../lib/neo4j/farmers';
import { FARMER_REGISTRY } from '../lib/farmer-registry/registry-data';
import type { FarmerProfile } from '../types';

async function seed() {
  console.log('Starting Neo4j seed process...');

  // 1. Clear existing database nodes and relationships
  console.log('Clearing old Farmer, Cooperative, and Region nodes...');
  await runQuery('MATCH (f:Farmer) DETACH DELETE f', {});
  await runQuery('MATCH (c:Cooperative) DETACH DELETE c', {});
  await runQuery('MATCH (r:Region) DETACH DELETE r', {});

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

  // 5. Seed 50 Registry Farmers (fully structured)
  console.log(`Seeding ${FARMER_REGISTRY.length} registry farmers...`);
  for (const farmer of FARMER_REGISTRY) {
    await saveFarmerToGraph(farmer);
  }

  // 6. Merge Demo Farmers (fully structured)
  console.log('Seeding the 3 demo farmers...');
  const demoDir = path.join(process.cwd(), 'public', 'demo-data');
  const demoFiles = ['wanjiku.json', 'joseph.json', 'amina.json'];

  for (const file of demoFiles) {
    const raw = fs.readFileSync(path.join(demoDir, file), 'utf-8');
    const profile = JSON.parse(raw) as FarmerProfile;
    await saveFarmerToGraph(profile);
  }

  // 7. Map repayment outcomes for peer benchmark calculations
  console.log('Mapping relationship repayment properties for benchmark calculations...');
  for (const farmer of FARMER_REGISTRY) {
    if (farmer.financial.priorRepaymentOutcomes.length > 0) {
      // Set the repayment outcome on the MEMBER_OF relationship
      await runQuery(`
        MATCH (f:Farmer {farmerId: $farmerId})-[m:MEMBER_OF]->(c:Cooperative)
        SET m.repaymentOutcome = $outcome
      `, {
        farmerId: farmer.farmerId,
        outcome: farmer.financial.priorRepaymentOutcomes[0] // use first repayment outcome as baseline
      });
    }
  }

  // Set Joseph's repayment outcome explicitly
  await runQuery(`
    MATCH (f:Farmer {farmerId: 'demo-joseph-001'})-[m:MEMBER_OF]->(c:Cooperative)
    SET m.repaymentOutcome = 'on_time'
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
