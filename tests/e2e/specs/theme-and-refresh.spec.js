import { test, expect } from '@playwright/test'
import { registerApiMocks } from '../fixtures/apiMocks.js'

test.beforeEach(async ({ page }) => {
  await registerApiMocks(page)
})

test('changes the map theme and persists it across reloads', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Kartenstil ändern/i }).click()
  await page.getByRole('button', { name: 'Satellite' }).click()

  const storedTheme = await page.evaluate(() => window.localStorage.getItem('mapTheme'))
  expect(storedTheme).toBe('esriWorldImagery')

  await page.reload()

  const persistedTheme = await page.evaluate(() => window.localStorage.getItem('mapTheme'))
  expect(persistedTheme).toBe('esriWorldImagery')
})

test('allows manually refreshing the parking view', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /Open Central Garage/i })).toBeVisible()
  await page.getByRole('button', { name: /Jetzt aktualisieren/i }).click()
  await expect(page.getByRole('button', { name: /Open Central Garage/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Limited City Parking/i })).toBeVisible()
})
