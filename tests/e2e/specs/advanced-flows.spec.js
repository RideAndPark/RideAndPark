import { test, expect } from '@playwright/test'
import { registerApiMocks } from '../fixtures/apiMocks.js'

test('shows non-realtime parkings after disabling the realtime filter', async ({ page }) => {
  await registerApiMocks(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Full Remote Parking' })).toHaveCount(0)
  await page.getByRole('checkbox', { name: /Nur Echtzeitdaten anzeigen/i }).uncheck()

  await expect(page.getByRole('heading', { name: 'Full Remote Parking' })).toBeVisible()
})

test('shows a user-facing error when geocoding fails', async ({ page }) => {
  await registerApiMocks(page, { geocodeStatus: 404 })
  await page.goto('/')

  await page.getByPlaceholder(/Stuttgart Hbf/i).fill('Unbekanntes Ziel')
  await page.getByRole('button', { name: /Ziel finden/i }).click()

  await expect(page.getByText(/Geocoding fehlgeschlagen \(404\)/i)).toBeVisible()
})

test('shows a user-facing error when parking data cannot be loaded', async ({ page }) => {
  await registerApiMocks(page, { parkingsStatus: 500 })
  await page.goto('/')

  await expect(page.getByText(/API-Fehler 500/i)).toBeVisible()
})
