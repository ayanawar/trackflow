import type { NextRequest } from 'next/server'

const LOCAL_APP_URL = 'http://localhost:3000'

function normalizeBaseUrl(value?: string | null) {
  const url = value?.trim()
  if (!url) return null

  const withProtocol = /^https?:\/\//i.test(url)
    ? url
    : url.startsWith('localhost') || url.startsWith('127.0.0.1')
      ? `http://${url}`
      : `https://${url}`

  return withProtocol.replace(/\/+$/, '')
}

function isLocalUrl(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url)
}

function getRequestBaseUrl(req?: NextRequest) {
  const forwardedHost = req?.headers.get('x-forwarded-host')
  const host = forwardedHost ?? req?.headers.get('host')
  if (host) {
    const forwardedProto = req?.headers.get('x-forwarded-proto')
    const protocol = forwardedProto ?? (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')
    return normalizeBaseUrl(`${protocol}://${host}`)
  }

  return normalizeBaseUrl(req?.nextUrl.origin)
}

export function getAppBaseUrl(req?: NextRequest) {
  const configuredCandidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ].map(normalizeBaseUrl).filter((url): url is string => Boolean(url))

  const liveConfigured = configuredCandidates.find(url => !isLocalUrl(url))
  if (liveConfigured) return liveConfigured

  const requestBaseUrl = getRequestBaseUrl(req)
  if (requestBaseUrl && !isLocalUrl(requestBaseUrl)) return requestBaseUrl

  const localConfigured = configuredCandidates[0]
  if (localConfigured) return localConfigured

  if (requestBaseUrl) return requestBaseUrl

  return LOCAL_APP_URL
}

export function buildAppUrl(path: string, baseUrl?: string) {
  const base = normalizeBaseUrl(baseUrl) ?? getAppBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}
