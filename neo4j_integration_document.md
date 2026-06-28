# ShambaLadder: Neo4j Integration Document

This document explains how Neo4j is utilized in the ShambaLadder agricultural credit scoring and lead generation platform. 

---

## 1. Solution Overview

ShambaLadder is a secure lead generation marketplace that connects financial institutions with credit-worthy smallholder farmers in East Africa. Because traditional credit histories do not exist for most smallholders, ShambaLadder aggregates alternative data points: weather patterns, soil productivity, mobile money logs, and cooperative networks. 

Neo4j is the central database that models and evaluates alternative social capital. By analyzing a farmer's cooperative membership and mapping the credit behaviors of their immediate peers (similar crops, same cooperative, historical loan repayment rates), the system generates cooperative credit signals that de-risk the profiles for lenders.

---

## 2. Graph Model Schema

Our graph database consists of three discrete node labels and two primary relationship types:

### Node Labels
*   **Farmer:** Represents individual smallholders.
    *   `farmerId` (String, Unique ID)
    *   `name` (String)
    *   `primaryCrop` (String, e.g., Maize, Beans, Tomato)
    *   `farmSizeAcres` (Float)
    *   `currentTier` (Integer, credit risk ranking 1 to 4)
    *   `profileJson` (String, complete serialized metrics snapshot)
*   **Cooperative:** Represents regional agricultural farming cooperatives.
    *   `name` (String, e.g., Kisii Maize Cooperative)
*   **Region:** Represents geographical county divisions.
    *   `name` (String, e.g., Kisii, Kakamega)

### Relationship Types
*   **MEMBER_OF:** Connects a `Farmer` to a `Cooperative`. This relationship carries peer trust attributes:
    *   `repaymentOutcome` (String: "on_time" or "delayed")
    *   `tenureSeasons` (Integer, representing how many seasons the farmer has participated)
*   **LOCATED_IN:** Connects a `Farmer` to a `Region`.

---

## 3. Core Cypher Queries

### Query A: Dynamic Data Ingest (Write Pipeline)
When a farmer uploads a Shambapro monthly report, the system parses the file and executes this write query to upsert the farmer node, cooperative node, and their cooperative relationship in a single transaction:

```cypher
MERGE (f:Farmer {farmerId: $farmerId})
SET f.name = $name, 
    f.primaryCrop = $primaryCrop, 
    f.farmSizeAcres = $farmSizeAcres, 
    f.currentTier = $currentTier, 
    f.profileJson = $profileJson
MERGE (c:Cooperative {name: $cooperativeName})
MERGE (f)-[r:MEMBER_OF]->(c)
SET r.repaymentOutcome = $repaymentOutcome, 
    r.tenureSeasons = $tenureSeasons
```

### Query B: Cooperative Peer Benchmarking (Read Pipeline)
To generate the Peer Benchmark indicator displayed to lenders on the scorecard, this query traverses the cooperative graph. It analyzes the historical performance of peers in the same cooperative who grow the same crop:

```cypher
MATCH (f:Farmer {farmerId: $farmerId})-[:MEMBER_OF]->(c:Cooperative)
MATCH (peer:Farmer)-[m:MEMBER_OF]->(c)
WHERE peer.farmerId <> f.farmerId AND peer.primaryCrop = f.primaryCrop
RETURN 
  c.name AS CooperativeName,
  count(peer) AS SimilarPeerCount,
  sum(case when m.repaymentOutcome = 'on_time' then 1 else 0 end) AS PaidOnTimeCount,
  avg(peer.currentTier) AS AveragePeerTier
```

### Query C: Database Verification (Official Count Query)
This query is run live to verify database loading and confirm that both node count and relationship count are greater than zero:

```cypher
MATCH (n)
WITH count(n) AS Nodes
OPTIONAL MATCH ()-[r]->()
RETURN Nodes, count(r) AS Relationships;
```

---

## 4. Why Neo4j was Chosen over Relational Databases

1.  **Traversing Cooperative Trust Networks:** Traditional databases require nested SQL join statements across multiple join tables to analyze peer cooperative metrics. Neo4j processes these multi-hop relationships in memory, achieving sub-millisecond execution speeds.
2.  **Flexible Schema Evolution:** Agricultural data profiles vary by crop, country, and cooperative structure. Storing the primary indicators on the node while maintaining a complete, serialized profile payload inside `profileJson` allows ShambaLadder to accommodate changing crop parameters without schema migrations.
3.  **Real-Time Lead Derisking:** Lenders can adjust weights and instantly re-score farmers because peer benchmark statistics are calculated dynamically using direct pointer lookups, avoiding batch calculations or stale databases.
