import neo4j, { Driver, Record as Neo4jRecord } from 'neo4j-driver';

let driver: Driver | null = null;

function getDriver() {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error(
      'Neo4j driver credentials missing. Please configure NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your environment variables.'
    );
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

export async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown>
): Promise<T[]> {
  const d = getDriver();
  const session = d.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r: Neo4jRecord) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
