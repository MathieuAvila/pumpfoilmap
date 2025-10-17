import type { APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { SpotSchema, type Spot } from '../lib/models';
import { updateSpotFields } from '../lib/spotsRepo';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'PATCH,OPTIONS'
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
    const spotId = event.pathParameters?.id;
    if (!spotId) return { statusCode: 400, headers: cors, body: JSON.stringify({ message: 'Missing id' }) };
    const body = event.body ? JSON.parse(event.body) : {};
    // Partial validation: merge with current stored spot is done in repo; here we only whitelist fields
  const allowed = ['name','lat','lng','description','imageUrl','contactEmail','heightCm','lengthM','access','address','url','website','type','status','moderationNote'] as const;
    const patch: any = {};
    for (const k of allowed) if (k in body) patch[k] = body[k];
    const updated = await updateSpotFields(spotId, patch);
    if (!updated) return { statusCode: 404, headers: cors, body: JSON.stringify({ message: 'Not found' }) };
    return { statusCode: 200, headers: cors, body: JSON.stringify(updated) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
