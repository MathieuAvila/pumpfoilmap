import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE_SPOTS } from './db';
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

export async function listSpots(limit: number): Promise<Spot[]> {
  if (USE_INMEMORY) return listFromMemory(limit);

  const res = await ddb.send(
    new ScanCommand({
      TableName: TABLE_SPOTS,
      Limit: limit
    })
  );
  return (res.Items ?? []) as Spot[];
}

export async function createSpot(spot: Spot): Promise<void> {
  if (USE_INMEMORY) return createInMemory(spot);
  await ddb.send(
    new PutCommand({
      TableName: TABLE_SPOTS,
      Item: spot,
      ConditionExpression: 'attribute_not_exists(spotId)'
    })
  );
}
