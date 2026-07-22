import { NextResponse } from 'next/server'
import { notifyUser } from '@/lib/notify'

export async function POST(request: Request) {
  const secret = process.env.INTERNAL_API_SECRET
  const auth = request.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { userId, message, subject } = await request.json()
  if (!userId || !message) {
    return NextResponse.json({ error: 'userId and message required' }, { status: 400 })
  }

  await notifyUser(userId, message, subject)
  return NextResponse.json({ ok: true })
}
