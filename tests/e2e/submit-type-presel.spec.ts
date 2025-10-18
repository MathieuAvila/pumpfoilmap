import { test, expect } from '@playwright/test';

test.describe('Pré-sélection du type via les nouveaux boutons', () => {
  test('Proposer un nouveau ponton affiche les champs ponton et pas le champ url', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('btn-add-ponton').click();

    // Champs spécifiques ponton visibles
    await expect(page.getByPlaceholder('Hauteur (cm)')).toBeVisible();
    await expect(page.getByPlaceholder('Longueur (m)')).toBeVisible();
    await expect(page.getByPlaceholder('Adresse')).toBeVisible();
    // Choix d'accès présents
    await expect(page.getByText('autorise')).toBeVisible();
    await expect(page.getByText('tolere')).toBeVisible();

    // Champ association absent
    await expect(page.getByPlaceholder('Site (url)')).toHaveCount(0);
  });

  test('Proposer une nouvelle association affiche url et cache les champs ponton', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('btn-add-association').click();

    // Champ association visible
    await expect(page.getByPlaceholder('Site (url)')).toBeVisible();

    // Champs ponton absents
    await expect(page.getByPlaceholder('Hauteur (cm)')).toHaveCount(0);
    await expect(page.getByPlaceholder('Longueur (m)')).toHaveCount(0);
    await expect(page.getByPlaceholder('Adresse')).toHaveCount(0);
  });
});
