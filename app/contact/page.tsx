'use client';

import { useState } from 'react';
import { DownloadButtons } from '@/components/DownloadButtons';
import { PaymentModal } from '@/components/PaymentModal';
import { generateFullCV, type CVGenerationInput } from '@/lib/gemini';

type Template = 'modern' | 'executive' | 'creative';

const TEMPLATE_LABELS: Record<Template, string> = {
  modern: '🎯 Modern',
  executive: '💼 Executive',
  creative: '🎨 Creative',
};

export default function HomePage() {
  const [form, setForm] = useState<CVGenerationInput>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    jobTitle: '',
    experience: '',
    education: '',
    skills: '',
    template: 'modern',
  });

  const [cvContent, setCvContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleGenerate() {
    if (!form.fullName || !form.jobTitle || !form.experience) {
      setGenError('Please fill in at least your name, job title, and experience.');
      return;
    }
    setGenError('');
    setGenerating(true);
    try {
      const result = await generateFullCV(form);
      setCvContent(result);
    } catch (e) {
      console.error(e);
      setGenError('AI generation failed. Please check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadAttempt() {
    if (!isPaid) {
      setShowPayment(true);
      return;
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const textareaClass = `${inputClass} resize-none`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          ✨ AI-Powered
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">
          ABSON CV Genius
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Build a professional CV in minutes. Download as PDF, Word, or Excel.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ─── Form Panel ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Your Details</h2>

          {/* Template */}
          <div>
            <label className={labelClass}>Template</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TEMPLATE_LABELS) as Template[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((p) => ({ ...p, template: t }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.template === t
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {TEMPLATE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@email.com" className={inputClass} />
            </div>
          </div>

          {/* Phone + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+234 800 000 0000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Lagos, Nigeria" className={inputClass} />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className={labelClass}>Job Title / Role *</label>
            <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Senior Software Engineer" className={inputClass} />
          </div>

          {/* Experience */}
          <div>
            <label className={labelClass}>Work Experience *</label>
            <textarea
              name="experience"
              value={form.experience}
              onChange={handleChange}
              rows={4}
              placeholder="Company: Acme Corp (2020–Present)&#10;Role: Backend Developer&#10;• Built REST APIs serving 100k users&#10;• Led a team of 5 engineers"
              className={textareaClass}
            />
          </div>

          {/* Education */}
          <div>
            <label className={labelClass}>Education</label>
            <textarea name="education" value={form.education} onChange={handleChange} rows={2} placeholder="BSc Computer Science, ABU Zaria, 2019" className={textareaClass} />
          </div>

          {/* Skills */}
          <div>
            <label className={labelClass}>Skills</label>
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, Node.js, Python, PostgreSQL, AWS" className={inputClass} />
          </div>

          {genError && <p className="text-red-600 text-sm">{genError}</p>}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating CV…
              </>
            ) : (
              '✨ Generate CV with AI'
            )}
          </button>
        </section>

        {/* ─── Preview Panel ─── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">CV Preview</h2>
            {cvContent && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                ✓ Ready
              </span>
            )}
          </div>

          {cvContent ? (
            <>
              <div
                id="cv-container"
                className="flex-1 bg-gray-50 rounded-xl p-5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed border border-gray-200 overflow-y-auto max-h-[520px] font-mono"
              >
                {cvContent}
              </div>

              {/* Download */}
              <div>
                {isPaid ? (
                  <>
                    <p className="text-xs text-gray-500 mb-3">✅ Premium unlocked — download in any format</p>
                    <DownloadButtons
                      cvContent={cvContent}
                      containerId="cv-container"
                      filename={`${form.fullName.replace(/\s+/g, '_') || 'MyCV'}`}
                    />
                  </>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-800 mb-1">🔒 Unlock Downloads</p>
                    <p className="text-xs text-amber-600 mb-3">
                      Pay once to download as PDF, Word, or Excel.
                    </p>
                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full bg-amber-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                    >
                      Unlock for ₦5,000
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📄</div>
              <p className="font-medium text-gray-500">Your CV will appear here</p>
              <p className="text-sm mt-1">Fill in your details and click Generate</p>
            </div>
          )}
        </section>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={(ref) => {
          console.log('Payment successful:', ref);
          setIsPaid(true);
        }}
        userEmail={form.email}
        amount={500000}
      />

      {/* Unused ref to suppress TS warning */}
      <span style={{ display: 'none' }} onClick={handleDownloadAttempt} />
    </div>
  );
}
