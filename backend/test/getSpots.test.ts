import { handler } from '../src/handlers/getSpots';

// Mock db module
jest.mock('../src/lib/db', () => {
  return {
    __esModule: true,
    TABLE_SPOTS: 'test-table',
    ddb: { send: jest.fn() }
  };
});

const { ddb } = jest.requireMock('../src/lib/db');

describe('GET /spots', () => {
  it('returns items and count', async () => {
    ddb.send.mockResolvedValueOnce({
      Items: [
        { spotId: '1', lat: 48.1, lng: -2.1, name: 'A', status: 'approved' },
        { spotId: '2', lat: 49.1, lng: 2.1, name: 'B', status: 'approved' }
      ]
    });

    const res = await handler({ queryStringParameters: null } as any);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.count).toBe(2);
    expect(body.items[0].name).toBe('A');
  });

  it('applies bbox filter', async () => {
    ddb.send.mockResolvedValueOnce({
      Items: [
        { spotId: '1', lat: 48.1, lng: 2.1, name: 'A', status: 'approved' },
        { spotId: '2', lat: 49.1, lng: 10.1, name: 'B', status: 'pending' }
      ]
    });

    const res = await handler({ queryStringParameters: { bbox: '2,48,3,49' } } as any);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body as string);
    expect(body.items.length).toBe(1);
    expect(body.items[0].spotId).toBe('1');
  });
});
