export const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.body.read',
].join(' ')

export function getGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_FIT_CLIENT_ID!,
    redirect_uri:  `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google-fit/callback`,
    response_type: 'code',
    scope:         GOOGLE_FIT_SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_FIT_CLIENT_ID!,
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google-fit/callback`,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed')
  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string
  }>
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_FIT_CLIENT_ID!,
      client_secret: process.env.GOOGLE_FIT_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json() as Promise<{ access_token: string; expires_in: number }>
}

// Fetch last 7 days of aggregated data from Google Fit
export async function fetchFitData(accessToken: string, targetDate: string) {
  const date = new Date(targetDate)
  const startMs = date.setHours(0, 0, 0, 0)
  const endMs   = new Date(targetDate).setHours(23, 59, 59, 999)

  const body = {
    aggregateBy: [
      { dataTypeName: 'com.google.step_count.delta',      dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps' },
      { dataTypeName: 'com.google.sleep.segment' },
      { dataTypeName: 'com.google.heart_rate.bpm' },
      { dataTypeName: 'com.google.weight' },
    ],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis: startMs,
    endTimeMillis:   endMs,
  }

  const res = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Fit API error: ${err}`)
  }

  const data = await res.json()
  return parseFitData(data)
}

type FitSnapshot = {
  steps:       number | null
  sleep_hours: number | null
  heart_rate:  number | null
  weight_kg:   number | null
}

function parseFitData(raw: any): FitSnapshot {
  let steps:      number | null = null
  let sleepMs:    number        = 0
  let heartRates: number[]      = []
  let weight:     number | null = null

  for (const bucket of raw.bucket ?? []) {
    for (const dataset of bucket.dataset ?? []) {
      const type = dataset.dataSourceId || ''

      for (const point of dataset.point ?? []) {
        // Steps
        if (type.includes('step_count')) {
          const val = point.value?.[0]?.intVal ?? 0
          steps = (steps ?? 0) + val
        }

        // Sleep — sum all sleep segment durations (types 1=awake excluded, 2-8 = sleep stages)
        if (dataset.dataSourceId?.includes('sleep') || type === '') {
          const segType = point.value?.[0]?.intVal
          if (segType && segType >= 2) {
            const dur = (Number(point.endTimeNanos) - Number(point.startTimeNanos)) / 1e6
            sleepMs += dur
          }
        }

        // Heart rate
        if (type.includes('heart_rate')) {
          const val = point.value?.[0]?.fpVal
          if (val) heartRates.push(val)
        }

        // Weight
        if (type.includes('weight')) {
          const val = point.value?.[0]?.fpVal
          if (val) weight = Math.round(val * 10) / 10
        }
      }
    }
  }

  return {
    steps,
    sleep_hours: sleepMs > 0 ? Math.round((sleepMs / 3_600_000) * 10) / 10 : null,
    heart_rate:  heartRates.length > 0 ? Math.round(heartRates.reduce((a, b) => a + b) / heartRates.length) : null,
    weight_kg:   weight,
  }
}
