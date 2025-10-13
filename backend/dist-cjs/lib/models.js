"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotSchema = exports.SpotCreateSchema = void 0;
const zod_1 = require("zod");
exports.SpotCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
    description: zod_1.z.string().max(2000).optional(),
    level: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    accessibility: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    associationId: zod_1.z.string().optional()
});
exports.SpotSchema = exports.SpotCreateSchema.extend({
    spotId: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    status: zod_1.z.enum(['pending', 'approved', 'rejected']).default('pending')
});
