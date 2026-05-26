import { test, expect } from '@playwright/test'
import { registerApiMocks } from '../fixtures/apiMocks.js'

test.beforeEach(async ({ page }) => {
  await registerApiMocks(page)
})

test('renders the application shell with mocked parking data', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Finde verfuegbare Parkplaetze/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Suche' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Trefferliste' })).toBeVisible()

  await expect(page.getByRole('button', { name: /Open Central Garage/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Limited City Parking/i })).toBeVisible()
  await expect(page.getByText('24/7')).toBeVisible()
  await expect(page.getByText('mock')).toBeVisible()
})
