/**
 * Google Generative AI (Gemini) service for CV content generation
 */

let genAI: import('@google/generative-ai').GoogleGenerativeAI | null = null;

async function getGenAI() {
  if (genAI) return genAI;
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_GOOGLE_API_KEY is not configured');
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export interface CVGenerationInput {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle: string;
  experience: string;
  education: string;
  skills: string;
  template?: 'modern' | 'executive' | 'creative';
}

export async function generateCVContent(prompt: string): Promise<string> {
  const ai = await getGenAI();
  const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateFullCV(input: CVGenerationInput): Promise<string> {
  const templateNote =
    input.template === 'executive'
      ? 'Use a formal executive tone with emphasis on leadership and strategic impact.'
      : input.template === 'creative'
      ? 'Use a creative, engaging tone that shows personality and innovation.'
      : 'Use a clean modern professional tone.';

  const prompt = `
You are an expert CV writer. Generate a complete, professional CV in plain text for the following person.
${templateNote}

Name: ${input.fullName}
Email: ${input.email}
${input.phone ? `Phone: ${input.phone}` : ''}
${input.location ? `Location: ${input.location}` : ''}
Job Title: ${input.jobTitle}

Experience:
${input.experience}

Education:
${input.education}

Skills:
${input.skills}

Format the CV with clear sections: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS.
Use bullet points (•) for responsibilities. Be specific, impactful, and results-oriented.
Do not include placeholder text. Only output the CV text, no commentary.
`.trim();

  return generateCVContent(prompt);
}

export async function generateProfessionalSummary(
  jobTitle: string,
  yearsExperience: number,
  keySkills: string[]
): Promise<string> {
  const prompt = `Write a 3-sentence professional summary for a ${jobTitle} with ${yearsExperience} years of experience. Key skills: ${keySkills.join(', ')}. Be specific and impactful. Output only the summary text.`;
  return generateCVContent(prompt);
}
