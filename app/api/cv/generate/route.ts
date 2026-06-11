import { getSupabaseServer } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

async function verifySupabaseToken(token?: string) {
  if (!token) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data as { id?: string }
  } catch (err) {
    console.error('token verify error', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { formData, templateId } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Verify Authorization Bearer token (if provided) and derive server-side user id
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined
    const user = await verifySupabaseToken(token)
    const serverUserId = user?.id || null

    const prompt = `Generate a professional CV with this information:\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nExperience: ${formData.experience}\nEducation: ${formData.education}\nSkills: ${formData.skills}\n\nFormat it as a polished, ATS-friendly resume.`

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent(prompt)
    const cvContent = result.response.text()

    // If we have an authenticated user, decrement free quota atomically.
    if (serverUserId) {
      try {
        const supabaseServer = getSupabaseServer()
        const { data: updatedProfile, error: quotaErr } = await (supabaseServer
          .from('user_profiles') as any)
          .update({})
          .decrement('free_generations_left', 1)
          .eq('id', serverUserId)
          .gt('free_generations_left', 0)
          .select('free_generations_left')
          .single()

        if (quotaErr) {
          console.error('quota update error', quotaErr)
        } else if (!updatedProfile) {
          console.warn('quota not decremented; no available free generations')
        }
      } catch (quotaErr) {
        console.error('quota update error', quotaErr)
      }
    }

    // Save generation record using server-derived user id only
    try {
      const supabaseServer = getSupabaseServer()
      await (supabaseServer.from('cv_generations') as any).insert({
        user_id: serverUserId,
        template_id: templateId || null,
        form_data: formData,
        cv_content: cvContent,
      })
    } catch (dbErr) {
      console.error('DB save error', dbErr)
    }

    return NextResponse.json({ cv: cvContent }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
