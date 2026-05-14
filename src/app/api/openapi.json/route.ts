export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getOpenAPISpec } from '@/lib/openapi'

export function GET() {
  return NextResponse.json(getOpenAPISpec())
}
