// @ts-ignore -- Detox types are resolved by runner
import { device, element, by, expect } from 'detox';

describe('PumpfoilMap (Android)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, permissions: { notifications: 'YES', location: 'inuse' } });
  });

  it('shows the add buttons on the map screen', async () => {
    // Wait a bit for initial loading to settle
    await new Promise((r) => setTimeout(r, 2000));
    await expect(element(by.id('btn-add-ponton'))).toBeVisible();
    await expect(element(by.id('btn-add-association'))).toBeVisible();
  });
});
