"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const spotsRepo_1 = require("../lib/spotsRepo");
const models_1 = require("../lib/models");
const crypto_1 = require("crypto");
const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
};
const handler = async (event) => {
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const parsed = models_1.SpotCreateSchema.safeParse(body);
        if (!parsed.success) {
            return {
                statusCode: 400,
                headers: cors,
                body: JSON.stringify({ message: 'Invalid payload', errors: parsed.error.issues })
            };
        }
        const now = new Date().toISOString();
        const item = {
            spotId: (0, crypto_1.randomUUID)(),
            createdAt: now,
            status: 'pending',
            ...parsed.data
        };
        await (0, spotsRepo_1.createSpot)(item);
        return {
            statusCode: 201,
            headers: cors,
            body: JSON.stringify(item)
        };
    }
    catch (err) {
        console.error(err);
        return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
    }
};
exports.handler = handler;
