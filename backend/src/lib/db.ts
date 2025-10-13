import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const REGION = process.env.AWS_REGION || 'eu-west-3';

export const TABLE_SPOTS = process.env.TABLE_SPOTS as string;

const client = new DynamoDBClient({
  region: REGION,
  endpoint: IS_OFFLINE ? 'http://localhost:8000' : undefined
});

export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});
