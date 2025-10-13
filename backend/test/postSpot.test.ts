import { handler } from '../src/handlers/postSpot';

jest.mock('../src/lib/db', () => {
  return {
    __esModule: true,
    TABLE_SPOTS: 'test-table',
    ddb: { send: jest.fn() }
  };
});

const { ddb } = jest.requireMock('../src/lib/db');

describe('POST /spots', () => {
  it('validates payload', async () => {
    const res = await handler({ body: JSON.stringify({}) } as any);
    expect(res.statusCode).toBe(400);
  });

  it('creates a spot', async () => {
    ddb.send.mockResolvedValueOnce({});
    const payload = {
      name: 'Spot 1',
      lat: 48.5,
      lng: 2.3,
      description: 'Nice place'
    };

    const res = await handler({ body: JSON.stringify(payload) } as any);
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body as string);
    expect(body.name).toBe('Spot 1');
    expect(body.spotId).toBeDefined();
  });
});
