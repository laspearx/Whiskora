import { createClient } from '@supabase/supabase-js'

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export async function sendLineMessage(lineUserId: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured')

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE push failed (${res.status}): ${body}`)
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: 'Whiskora <noreply@whiskora.com>',
    to,
    subject,
    html,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
}

/**
 * ส่ง notification ให้ user ตาม channel ที่เลือกไว้ใน settings
 * LINE > email (ตามลำดับ priority)
 */
export async function notifyUser(
  userId: string,
  message: string,
  emailSubject = 'แจ้งเตือนจาก Whiskora',
) {
  const admin = makeAdmin()

  const [profileRes, userRes] = await Promise.all([
    admin.from('profiles').select('notif_line, notif_email, email').eq('id', userId).single(),
    admin.auth.admin.getUserById(userId),
  ])

  if (profileRes.error || !profileRes.data) return
  if (userRes.error || !userRes.data.user) return

  const profile = profileRes.data
  const user = userRes.data.user
  const lineId: string | undefined = user.user_metadata?.line_id
  const realEmail =
    profile.email && !profile.email.includes('@line.whiskora.internal')
      ? profile.email
      : null

  if (profile.notif_line && lineId) {
    await sendLineMessage(lineId, message)
  } else if (profile.notif_email && realEmail) {
    const html = `<p style="font-family:sans-serif;font-size:15px;color:#111;">${message.replace(/\n/g, '<br>')}</p>`
    await sendEmail(realEmail, emailSubject, html)
  }
}
