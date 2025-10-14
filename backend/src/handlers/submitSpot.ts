import { randomUUID } from 'crypto';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { SpotCreateSchema } from '../lib/models';
import { createSpot } from '../lib/spotsRepo';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const parsed = SpotCreateSchema.safeParse(body);
    if (!parsed.success) {
      return {
        statusCode: 400,
        headers: cors,
        body: JSON.stringify({ message: 'Invalid payload', errors: parsed.error.issues })
      };
    }

    const now = new Date().toISOString();
    const spot = {
      spotId: randomUUID(),
      createdAt: now,
      status: 'pending' as const,
      ...parsed.data
    };

    await createSpot(spot as any);

    // Return minimal info to submitter plus moderation status
    return {
      statusCode: 202,
      headers: cors,
      body: JSON.stringify({
        spotId: spot.spotId,
        status: spot.status,
        createdAt: spot.createdAt
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
