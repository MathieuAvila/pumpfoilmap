import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { listSpots } from '../lib/spotsRepo';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS'
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const auth = event.headers?.authorization || event.headers?.Authorization;
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || !auth || auth !== `Bearer ${expected}`) {
      return { statusCode: 401, headers: cors, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
    const size = Math.min(Number(event.queryStringParameters?.size ?? 20), 100);
    const items = await listSpots(1000);
    const pending = items
      .filter((s: any) => s.status === 'pending')
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, size);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ items: pending, count: pending.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
