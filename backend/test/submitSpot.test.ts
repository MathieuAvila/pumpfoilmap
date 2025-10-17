import { handler } from '../src/handlers/submitSpot';

jest.mock('../src/lib/db', () => {
  return {
    __esModule: true,
    TABLE_SPOTS: 'test-table',
    ddb: { send: jest.fn() }
  };
});

const { ddb } = jest.requireMock('../src/lib/db');

describe('POST /spots/submit', () => {
  it('fails on invalid payload', async () => {
    const res = await handler({ body: JSON.stringify({}) } as any);
    expect(res.statusCode).toBe(400);
  });

  it('accepts valid ponton submission with contact email', async () => {
    ddb.send.mockResolvedValueOnce({});
    const payload = {
      type: 'ponton',
      name: 'New Ponton',
      lat: 42.1,
      lng: 5.2,
      submittedBy: 'alice',
        heightCm: 150,
      lengthM: 8,
      access: 'autorise',
      address: 'Quai Test',
      contactEmail: 'alice@example.com'
    } as const;
    const res = await handler({ body: JSON.stringify(payload) } as any);
    expect(res.statusCode).toBe(202);
    const body = JSON.parse(res.body as string);
    expect(body.spotId).toBeDefined();
    expect(body.status).toBe('pending');
    expect(body.createdAt).toBeDefined();
    // ensure we did not echo sensitive fields unnecessarily
    expect(body.name).toBeUndefined();
  });

  it('accepts association without optional fields', async () => {
    ddb.send.mockResolvedValueOnce({});
    const payload = {
      type: 'association',
      name: 'Assoc',
      lat: 10,
      lng: 11,
      submittedBy: 'bob'
    } as const;
    const res = await handler({ body: JSON.stringify(payload) } as any);
    expect(res.statusCode).toBe(202);
  });
});
