import { z } from 'zod';

// Base properties common to all spots
const SpotBase = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().max(2000).optional(),
  submittedBy: z.string().min(1),
  imageUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional()
});

// Ponton specific
const PontonCreateSchema = SpotBase.extend({
  type: z.literal('ponton'),
  heightM: z.number().positive(),
  lengthM: z.number().positive(),
  access: z.enum(['autorise', 'tolere']),
  address: z.string().min(1)
});

// Association/group specific
const AssociationCreateSchema = SpotBase.extend({
  type: z.literal('association'),
  url: z.string().url().optional(),
  website: z.string().url().optional() // alias alternative if needed in future
});

export const SpotCreateSchema = z.discriminatedUnion('type', [
  PontonCreateSchema,
  AssociationCreateSchema
]);

export type SpotCreate = z.infer<typeof SpotCreateSchema>;

export const SpotSchema = z.intersection(
  SpotCreateSchema,
  z.object({
    spotId: z.string(),
    createdAt: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']).default('pending')
  })
);

export type Spot = z.infer<typeof SpotSchema>;

export type BBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};
