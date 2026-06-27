import neo4j, { Driver, Record as Neo4jRecord } from 'neo4j-driver';

const globalForNeo4j = global as unknown as {
  neo4jDriver?: Driver;
};

function getDriver() {
  if (globalForNeo4j.neo4jDriver) return globalForNeo4j.neo4jDriver;

  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error(
      'Neo4j driver credentials missing. Please configure NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in your environment variables.'
    );
  }

  // Aura Free has a strict limit on active connections.
  // Configure driver with connection pool properties to prevent socket exhaustion.
  const newDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionPoolSize: 5,
    connectionTimeout: 10000, // 10s timeout instead of 60s
  });

  globalForNeo4j.neo4jDriver = newDriver;
  return newDriver;
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
  if (globalForNeo4j.neo4jDriver) {
    await globalForNeo4j.neo4jDriver.close();
    delete globalForNeo4j.neo4jDriver;
  }
}
