import { listSpots } from '../lib/spotsRepo';
import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import type { BBox } from '../lib/models';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

function parseBBox(bboxStr?: string): BBox | undefined {
  if (!bboxStr) return;
  const parts = bboxStr.split(',').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return;
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const limit = Math.min(Number(event.queryStringParameters?.limit ?? 50), 200);
    const bbox = parseBBox(event.queryStringParameters?.bbox);

  let items = (await listSpots(limit)) as any[];

  // Only expose approved spots publicly
  items = items.filter((s) => s.status === 'approved');

    if (bbox) {
      items = items.filter(
        (s) =>
          s.lng >= bbox.minLng &&
          s.lng <= bbox.maxLng &&
          s.lat >= bbox.minLat &&
          s.lat <= bbox.maxLat
      );
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ items, count: items.length })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
