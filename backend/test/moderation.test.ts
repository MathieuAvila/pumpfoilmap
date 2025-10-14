import { handler as submitHandler } from '../src/handlers/submitSpot';
import { handler as approveHandler } from '../src/handlers/approveSpot';
import { handler as rejectHandler } from '../src/handlers/rejectSpot';

jest.mock('../src/lib/db', () => {
  return {
    __esModule: true,
    TABLE_SPOTS: 'test-table',
    ddb: { send: jest.fn() }
  };
});

const { ddb } = jest.requireMock('../src/lib/db');

// Simple in-memory side effect imitation for UpdateCommand
// We'll capture spot objects we create and when UpdateCommand is used, mutate them.
let stored: any[] = [];

ddb.send.mockImplementation((cmd: any) => {
  const name = cmd.constructor?.name;
  if (name === 'PutCommand') {
    stored.push(cmd.input.Item);
    return Promise.resolve({});
  }
  if (name === 'UpdateCommand') {
    const id = cmd.input.Key.spotId;
    const s = stored.find((x) => x.spotId === id);
    if (!s) return Promise.resolve({});
    s.status = cmd.input.ExpressionAttributeValues[':s'];
    return Promise.resolve({ Attributes: s });
  }
  if (name === 'ScanCommand') {
    return Promise.resolve({ Items: stored });
  }
  return Promise.resolve({});
});

describe('Moderation flow', () => {
  it('submits then approves a spot', async () => {
    const submitPayload = {
      type: 'association',
      name: 'Assoc 1',
      lat: 1,
      lng: 2,
      submittedBy: 'alice'
    };
    const submitRes = await submitHandler({ body: JSON.stringify(submitPayload) } as any);
    expect(submitRes.statusCode).toBe(202);
    const submitBody = JSON.parse(submitRes.body as string);

    // Approve
    const approveRes = await approveHandler({ pathParameters: { id: submitBody.spotId } } as any);
    expect(approveRes.statusCode).toBe(200);
    const approveBody = JSON.parse(approveRes.body as string);
    expect(approveBody.status).toBe('approved');

    // Reject (should flip to rejected)
    const rejectRes = await rejectHandler({ pathParameters: { id: submitBody.spotId } } as any);
    expect(rejectRes.statusCode).toBe(200);
    const rejectBody = JSON.parse(rejectRes.body as string);
    expect(rejectBody.status).toBe('rejected');
  });
});
