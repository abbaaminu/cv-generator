import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { formData, templateId } = await request.json()

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `Write a tailored cover letter for this applicant:
Name: ${formData.name}
Role: ${formData.role || 'the applied role'}
Experience: ${formData.experience}

Make it professional and concise.`

    const result = await model.generateContent(prompt)
    const coverLetter = result.response.text()

    // Optional: Save to Supabase if user is authenticated
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
      const { data: { user } } = await supabase.auth.getUser(token)

      if (user) {
        await supabase.from('cover_generations').insert({
          user_id: user.id,
          template_id: templateId,
          form_data: formData,
          cover_content: coverLetter,
        })
      }
    }

    return NextResponse.json({ cover: coverLetter })
  } catch (error: any) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    )
  }
}
