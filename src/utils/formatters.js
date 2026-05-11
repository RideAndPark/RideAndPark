/**
 * Format a number with German locale
 */
export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'k. A.'
  }

  return new Intl.NumberFormat('de-DE').format(value)
}

/**
 * Format a date with German locale
 */
export function formatDate(value) {
  if (!value) {
    return 'unbekannt'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'unbekannt'
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

/**
 * Format refresh interval from seconds to human-readable German string
 */
export function formatRefreshInterval(seconds) {
  const minutes = seconds / 60
  if (minutes === 1) {
    return '1 Minute'
  }
  return `${minutes} Minuten`
}

/**
 * Normalize parking status to German string
 */
export function normalizeStatus(status) {
  const normalized = String(status ?? 'unknown').toLowerCase()

  if (normalized === 'full') {
    return 'voll'
  }

  if (normalized === 'limited') {
    return 'knapp'
  }

  if (normalized === 'open') {
    return 'frei'
  }

  return 'unklar'
}
