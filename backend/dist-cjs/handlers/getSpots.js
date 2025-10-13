"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const spotsRepo_1 = require("../lib/spotsRepo");
const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
};
function parseBBox(bboxStr) {
    if (!bboxStr)
        return;
    const parts = bboxStr.split(',').map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n)))
        return;
    const [minLng, minLat, maxLng, maxLat] = parts;
    return { minLng, minLat, maxLng, maxLat };
}
const handler = async (event) => {
    try {
        const limit = Math.min(Number(event.queryStringParameters?.limit ?? 50), 200);
        const bbox = parseBBox(event.queryStringParameters?.bbox);
        let items = (await (0, spotsRepo_1.listSpots)(limit));
        if (bbox) {
            items = items.filter((s) => s.lng >= bbox.minLng &&
                s.lng <= bbox.maxLng &&
                s.lat >= bbox.minLat &&
                s.lat <= bbox.maxLat);
        }
        return {
            statusCode: 200,
            headers: cors,
            body: JSON.stringify({ items, count: items.length })
        };
    }
    catch (err) {
        console.error(err);
        return { statusCode: 500, headers: cors, body: JSON.stringify({ message: 'Internal error' }) };
    }
};
exports.handler = handler;
