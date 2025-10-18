// In-memory repo tests for deleting and updating spots
process.env.USE_INMEMORY = 'true';
process.env.ADMIN_TOKEN = 'dev';

import { handler as submitHandler } from '../src/handlers/submitSpot';
import { handler as adminUpdate } from '../src/handlers/adminUpdateSpot';
import { handler as adminDelete } from '../src/handlers/adminDeleteSpot';
import { handler as listSpots } from '../src/handlers/adminListSpots';

describe('Admin update and delete', () => {
  it('updates fields and deletes a spot', async () => {
  const submitPayload = { type: 'association', name: 'DelMe', lat: 1.1, lng: 2.2, submittedBy: 'qa' };
    const sub = await submitHandler({ body: JSON.stringify(submitPayload) } as any);
  expect(sub.statusCode).toBe(202);
    const { spotId } = JSON.parse(sub.body as string);

    // Update name and description
    const upd = await adminUpdate({
      headers: { Authorization: 'Bearer dev' } as any,
      pathParameters: { id: spotId },
      body: JSON.stringify({ name: 'Updated', description: 'ok' })
    } as any);
    expect(upd.statusCode).toBe(200);
    const upBody = JSON.parse(upd.body as string);
    expect(upBody.name).toBe('Updated');

    // List all and ensure present
    const lst = await listSpots({ headers: { Authorization: 'Bearer dev' } } as any);
    expect(lst.statusCode).toBe(200);
    const listBody = JSON.parse(lst.body as string);
    const ids: string[] = listBody.items.map((s: any) => s.spotId);
    expect(ids).toContain(spotId);

    // Delete it
    const del = await adminDelete({ headers: { Authorization: 'Bearer dev' } as any, pathParameters: { id: spotId } } as any);
    expect([200,204]).toContain(del.statusCode);

    // List should no longer contain it
    const lst2 = await listSpots({ headers: { Authorization: 'Bearer dev' } } as any);
    const body2 = JSON.parse(lst2.body as string);
    const ids2: string[] = body2.items.map((s: any) => s.spotId);
    expect(ids2).not.toContain(spotId);
  });
});
