import { test, expect } from '@playwright/test'
import { registerApiMocks } from '../fixtures/apiMocks.js'

test.beforeEach(async ({ page }) => {
  await registerApiMocks(page)
  await page.goto('/')
})

test('searches for a target and updates the target card', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/Stuttgart Hbf/i)
  await searchInput.fill('Stuttgart Hbf')
  await page.getByRole('button', { name: /Ziel finden/i }).click()

  await expect(page.getByText('Aktuelles Ziel')).toBeVisible()
  await expect(page.getByText('Stuttgart Hauptbahnhof')).toBeVisible()
  await expect(page.getByText('Full Remote Parking')).toHaveCount(0)
})

test('filters down to only open parkings', async ({ page }) => {
  await page.getByRole('checkbox', { name: 'Nur offene Parkplätze anzeigen', exact: true }).check()

  await expect(page.getByRole('heading', { name: 'Open Central Garage' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Limited City Parking' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Full Remote Parking' })).toHaveCount(0)
})
