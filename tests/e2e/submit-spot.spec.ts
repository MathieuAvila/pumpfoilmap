import { test, expect } from '@playwright/test';

test.describe('Soumission d\'une proposition', () => {
  test('3/ soumission formulaire ponton minimal', async ({ page }) => {
    await page.goto('/');
    // Ouvrir formulaire
    await page.getByText('+ Spot').click();
    await page.getByText('ponton').click();
    // Choisir coords sur la carte (ouvre mode picking)
  await page.locator('[data-testid="btn-choose-on-map"]').click();
  // Attendre l'injection des helpers map et simuler
  await page.waitForFunction(() => (window as any).PFM_TEST?.pickAt, null, { timeout: 10_000 });
    // Simuler un click test util
    await page.evaluate(() => {
      // @ts-ignore
      window.PFM_TEST?.pickAt(2.35, 48.85);
    });
    // Revenir automatiquement au formulaire (picking=false) -> lat/lon affichés
    await expect(page.locator('text=Lat: 48.85000  Lon: 2.35000')).toBeVisible();
    // Remplir champs
    await page.getByPlaceholder('Nom').fill('Ponton Test Auto');
    await page.getByPlaceholder('Soumis par').fill('playwright');
  await page.getByPlaceholder('Hauteur (cm)').fill('300');
    await page.getByPlaceholder('Longueur (m)').fill('10');
    await page.getByPlaceholder('Adresse').fill('Quai Test 75000');
    await page.getByPlaceholder('Description').fill('Spot inséré via test e2e');
      // Soumettre -> backend local peut ne pas être dispo, on accepte échec contrôlé
      await page.locator('[data-testid="btn-submit-spot"]').click();
      // Attendre un indicateur d'état: Envoi… OU message de résultat
      try { await expect(page.getByText('Envoi…')).toBeVisible({ timeout: 2000 }); } catch {}
      await Promise.race([
        page.waitForSelector('text=Erreur:', { timeout: 15000 }),
        page.waitForSelector('text=✅ Spot soumis', { timeout: 15000 })
      ]);
  });
});
