import { z } from 'zod';

export const SpotCreateSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().max(2000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  accessibility: z.enum(['easy', 'medium', 'hard']).optional(),
  associationId: z.string().optional()
});

export type SpotCreate = z.infer<typeof SpotCreateSchema>;

export const SpotSchema = SpotCreateSchema.extend({
  spotId: z.string(),
  createdAt: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending')
});

export type Spot = z.infer<typeof SpotSchema>;

export type BBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};
