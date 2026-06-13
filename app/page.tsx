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
  const [form, setForm] = useState({
    // Personal Information
    fullName: '',
    age: '',
    address: '',
    email: '',
    phone: '',
    avatar: '', // We'll handle avatar separately
    // Professional Summary
    objective: '',
    // Education
    education: '',
    // Work Experience
    experience: '',
    // Hobbies
    hobbies: '',
    // Other Information
    otherInfo: '',
    // Template
    template: 'modern' as Template,
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
    if (!form.fullName || !form.objective || !form.experience) {
      setGenError('Please fill in at least your name, career objective, and work experience.');
      return;
    }
    setGenError('');
    setGenerating(true);
    try {
      // Convert form to the shape expected by generateFullCV (if needed)
      const cvInput: CVGenerationInput = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        location: form.address,
        jobTitle: form.objective, // using objective as job title for prompt
        experience: form.experience,
        education: form.education,
        skills: form.hobbies + ' ' + form.otherInfo, // combine hobbies and other info as skills
        template: form.template,
      };
      const result = await generateFullCV(cvInput);
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
        {/* Form Panel */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Your Details</h2>

          {/* Template Selection */}
          <div>
            <label className={labelClass}>Choose CV Template</label>
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

          {/* Personal Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="25" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Main St, City" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Avatar (URL)</label>
              <input name="avatar" value={form.avatar} onChange={handleChange} placeholder="https://example.com/avatar.jpg" className={inputClass} />
            </div>
          </div>

          {/* Career Objective */}
          <div>
            <label className={labelClass}>Career Objective / Professional Summary *</label>
            <textarea
              name="objective"
              value={form.objective}
              onChange={handleChange}
              rows={3}
              placeholder="I am seeking a position where I can..."
              className={textareaClass}
            />
          </div>

          {/* Education */}
          <div>
            <label className={labelClass}>Education *</label>
            <textarea
              name="education"
              value={form.education}
              onChange={handleChange}
              rows={3}
              placeholder="B.Sc. Computer Science, University of XYZ, 2020"
              className={textareaClass}
            />
          </div>

          {/* Work Experience */}
          <div>
            <label className={labelClass}>Work Experience *</label>
            <textarea
              name="experience"
              value={form.experience}
              onChange={handleChange}
              rows={5}
              placeholder="Software Engineer at ABC Corp (2021–Present)&#10;• Developed features serving 1M users&#10;• Led team of 3 developers"
              className={textareaClass}
            />
          </div>

          {/* Hobbies */}
          <div>
            <label className={labelClass}>Hobbies</label>
            <input name="hobbies" value={form.hobbies} onChange={handleChange} placeholder="Reading, coding, hiking" className={inputClass} />
          </div>

          {/* Other Information */}
          <div>
            <label className={labelClass}>Other Information</label>
            <textarea
              name="otherInfo"
              value={form.otherInfo}
              onChange={handleChange}
              rows={2}
              placeholder="Certifications, languages, awards, etc."
              className={textareaClass}
            />
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

        {/* Preview Panel */}
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

              {/* Download Section */}
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
    </div>
  );
}
