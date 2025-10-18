import { test, expect } from '@playwright/test';

test.describe('Validation formulaire soumission', () => {
  test('affiche erreurs requis et les retire après correction', async ({ page }) => {
  await page.goto('/');
  // Ouvrir formulaire (nouveau bouton)
  await page.getByTestId('btn-add-ponton').click();
    // Type par défaut: ponton

    // 1) Tentative de soumission vide -> erreurs
    await page.locator('[data-testid="btn-submit-spot"]').click();
    await expect(page.getByTestId('error-name')).toBeVisible();
    await expect(page.getByTestId('error-submittedBy')).toBeVisible();
    await expect(page.getByTestId('error-latlng')).toBeVisible();
  await expect(page.getByTestId('error-heightCm')).toBeVisible();
    await expect(page.getByTestId('error-lengthM')).toBeVisible();
    await expect(page.getByTestId('error-address')).toBeVisible();

    // 2) Mettre des valeurs invalides pour formats
    await page.locator('[data-testid="input-imageUrl"]').fill('not-a-url');
    await page.locator('[data-testid="input-contactEmail"]').fill('invalid');
    await page.locator('[data-testid="btn-submit-spot"]').click();
    await expect(page.getByTestId('error-imageUrl')).toBeVisible();
    await expect(page.getByTestId('error-contactEmail')).toBeVisible();

    // 3) Corriger tous les champs
    await page.locator('[data-testid="input-name"]').fill('Ponton Validé');
    await page.locator('[data-testid="input-submittedBy"]').fill('playwright');
  await page.locator('[data-testid="input-heightCm"]').fill('200');
    await page.locator('[data-testid="input-lengthM"]').fill('5');
    await page.locator('[data-testid="input-address"]').fill('Quai Test');
    await page.locator('[data-testid="input-imageUrl"]').fill('https://example.com/img.jpg');
    await page.locator('[data-testid="input-contactEmail"]').fill('user@example.com');

    // Coords via helper
  await page.locator('[data-testid="btn-choose-on-map"]').click();
    await page.waitForFunction(() => (window as any).PFM_TEST?.pickAt, null, { timeout: 10000 });
    await page.evaluate(() => {
      // @ts-ignore
      window.PFM_TEST.pickAt(2.35, 48.85);
    });

    // Erreurs doivent disparaître après nouvelle tentative
    await page.locator('[data-testid="btn-submit-spot"]').click();
    await expect(page.getByTestId('error-name')).toHaveCount(0);
    await expect(page.getByTestId('error-submittedBy')).toHaveCount(0);
    await expect(page.getByTestId('error-latlng')).toHaveCount(0);
  await expect(page.getByTestId('error-heightCm')).toHaveCount(0);
    await expect(page.getByTestId('error-lengthM')).toHaveCount(0);
    await expect(page.getByTestId('error-address')).toHaveCount(0);
    await expect(page.getByTestId('error-imageUrl')).toHaveCount(0);
    await expect(page.getByTestId('error-contactEmail')).toHaveCount(0);

    // On ne force pas un succès réseau ici; on attend un message de résultat (succès ou erreur)
    try { await expect(page.getByText('Envoi…')).toBeVisible({ timeout: 2000 }); } catch {}
    await Promise.race([
      page.waitForSelector('text=Erreur:', { timeout: 15000 }),
      page.waitForSelector('text=✅ Spot soumis', { timeout: 15000 })
    ]);
  });
});
