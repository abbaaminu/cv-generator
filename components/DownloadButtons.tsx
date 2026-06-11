'use client';

import { useState } from 'react';

interface DownloadButtonsProps {
  /** The plain-text or HTML content of the CV */
  cvContent: string;
  /** The element ID to capture for PDF (e.g. "cv-container") */
  containerId?: string;
  /** Base filename without extension */
  filename?: string;
}

export function DownloadButtons({
  cvContent,
  containerId = 'cv-container',
  filename = 'MyCV',
}: DownloadButtonsProps) {
  const [loading, setLoading] = useState<'pdf' | 'word' | 'excel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePDF() {
    setLoading('pdf');
    setError(null);
    try {
      const { downloadPDF } = await import('@/lib/download');
      await downloadPDF(containerId, `${filename}.pdf`);
    } catch (e) {
      setError('PDF download failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleWord() {
    setLoading('word');
    setError(null);
    try {
      const { downloadWord } = await import('@/lib/download');
      await downloadWord(cvContent, `${filename}.docx`);
    } catch (e) {
      setError('Word download failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function handleExcel() {
    setLoading('excel');
    setError(null);
    try {
      const { downloadExcel } = await import('@/lib/download');
      // Parse simple key: value pairs from CV text into rows
      const rows = cvContent
        .split('\n')
        .filter((line) => line.includes(':'))
        .map((line) => {
          const [key, ...rest] = line.split(':');
          return { Field: key.trim(), Value: rest.join(':').trim() };
        });
      downloadExcel(rows.length ? rows : [{ Field: 'CV Content', Value: cvContent }], `${filename}.xlsx`);
    } catch (e) {
      setError('Excel download failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  const btnBase =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {/* PDF */}
        <button
          onClick={handlePDF}
          disabled={loading !== null}
          className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
          aria-label="Download CV as PDF"
        >
          {loading === 'pdf' ? (
            <Spinner />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 18h12a1 1 0 000-2H4a1 1 0 000 2zm8-10V4H8v4H5l5 5 5-5h-3z" />
            </svg>
          )}
          {loading === 'pdf' ? 'Generating…' : 'Download PDF'}
        </button>

        {/* Word */}
        <button
          onClick={handleWord}
          disabled={loading !== null}
          className={`${btnBase} bg-blue-700 text-white hover:bg-blue-800`}
          aria-label="Download CV as Word document"
        >
          {loading === 'word' ? (
            <Spinner />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 18h12a1 1 0 000-2H4a1 1 0 000 2zm8-10V4H8v4H5l5 5 5-5h-3z" />
            </svg>
          )}
          {loading === 'word' ? 'Generating…' : 'Download Word'}
        </button>

        {/* Excel */}
        <button
          onClick={handleExcel}
          disabled={loading !== null}
          className={`${btnBase} bg-green-700 text-white hover:bg-green-800`}
          aria-label="Download CV as Excel spreadsheet"
        >
          {loading === 'excel' ? (
            <Spinner />
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 18h12a1 1 0 000-2H4a1 1 0 000 2zm8-10V4H8v4H5l5 5 5-5h-3z" />
            </svg>
          )}
          {loading === 'excel' ? 'Generating…' : 'Download Excel'}
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-xs mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

export default DownloadButtons;
