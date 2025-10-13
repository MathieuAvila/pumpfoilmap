"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddb = exports.TABLE_SPOTS = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const REGION = process.env.AWS_REGION || 'eu-west-3';
exports.TABLE_SPOTS = process.env.TABLE_SPOTS;
const client = new client_dynamodb_1.DynamoDBClient({
    region: REGION,
    endpoint: IS_OFFLINE ? 'http://localhost:8000' : undefined
});
exports.ddb = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true }
});
