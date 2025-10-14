import type { Spot } from './models';
import fs from 'node:fs';
import path from 'node:path';

const USE_INMEMORY = process.env.USE_INMEMORY === 'true' || process.env.IS_OFFLINE === 'true';

let memory: Spot[] | null = null;

function loadSeeds(): Spot[] {
  const seedsPath = path.join(process.cwd(), 'seeds', 'spots.json');
  try {
    const raw = fs.readFileSync(seedsPath, 'utf-8');
    const data = JSON.parse(raw);
    return data as Spot[];
  } catch {
    return [];
  }
}

async function listFromMemory(limit: number): Promise<Spot[]> {
  if (!memory) memory = loadSeeds();
  return memory.slice(0, limit);
}

async function createInMemory(spot: Spot): Promise<void> {
  if (!memory) memory = loadSeeds();
  memory.unshift(spot);
}

async function updateStatusInMemory(spotId: string, status: Spot['status']): Promise<Spot | null> {
  if (!memory) memory = loadSeeds();
  const idx = memory.findIndex((s) => s.spotId === spotId);
  if (idx === -1) return null;
  memory[idx] = { ...memory[idx], status } as Spot;
  return memory[idx];
}

export async function listSpots(limit: number): Promise<Spot[]> {
  if (USE_INMEMORY) return listFromMemory(limit);
  const [{ ddb, TABLE_SPOTS }, { ScanCommand }] = await Promise.all([
    import('./db'),
    import('@aws-sdk/lib-dynamodb')
  ]);
  const res = await ddb.send(new ScanCommand({ TableName: TABLE_SPOTS, Limit: limit }));
  return (res.Items ?? []) as Spot[];
}

export async function createSpot(spot: Spot): Promise<void> {
  if (USE_INMEMORY) return createInMemory(spot);
  const [{ ddb, TABLE_SPOTS }, { PutCommand }] = await Promise.all([
    import('./db'),
    import('@aws-sdk/lib-dynamodb')
  ]);
  await ddb.send(
    new PutCommand({
      TableName: TABLE_SPOTS,
      Item: spot,
      ConditionExpression: 'attribute_not_exists(spotId)'
    })
  );
}

export async function updateSpotStatus(spotId: string, status: Spot['status']): Promise<Spot | null> {
  if (USE_INMEMORY) return updateStatusInMemory(spotId, status);
  const [{ ddb, TABLE_SPOTS }, { UpdateCommand }] = await Promise.all([
    import('./db'),
    import('@aws-sdk/lib-dynamodb')
  ]);
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_SPOTS,
      Key: { spotId },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status },
      ReturnValues: 'ALL_NEW'
    })
  );
  return (res.Attributes as Spot) || null;
}
