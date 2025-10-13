import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLE_SPOTS } from '../lib/db';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SpotCreateSchema } from '../lib/models';
import { randomUUID } from 'crypto';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
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
    const item = {
      spotId: randomUUID(),
      createdAt: now,
      status: 'pending',
      ...parsed.data
    };

    await ddb.send(
      new PutCommand({
        TableName: TABLE_SPOTS,
        Item: item,
        ConditionExpression: 'attribute_not_exists(spotId)'
      })
    );

    return {
      statusCode: 201,
      headers: cors,
      body: JSON.stringify(item)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
  }
};
