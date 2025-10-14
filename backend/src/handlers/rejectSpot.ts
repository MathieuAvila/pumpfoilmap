import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { updateSpotStatus } from '../lib/spotsRepo';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const spotId = event.pathParameters?.id;
    if (!spotId) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ message: 'Missing id' }) };
    }
    const updated = await updateSpotStatus(spotId, 'rejected');
    if (!updated) {
      return { statusCode: 404, headers: cors, body: JSON.stringify({ message: 'Not found' }) };
    }
    return { statusCode: 200, headers: cors, body: JSON.stringify({ spotId: updated.spotId, status: updated.status }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
