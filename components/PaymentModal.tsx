'use client';

import { useState, useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reference: string) => void;
  amount?: number;
  userEmail?: string;
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }
    if (document.getElementById('paystack-script')) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount = 500000,
  userEmail = '',
}: PaymentModalProps) {
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(userEmail);
  }, [userEmail]);

  async function handlePay() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setError('Payment unavailable — missing configuration.');
      return;
    }

    setLoading(true);
    setError('');

    const reference = `ABSON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    try {
      await loadPaystackScript();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email,
        amount,
        currency: 'NGN',
        ref: reference,
        callback: async (response: { reference: string }) => {
          try {
            const res = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            });
            const data = await res.json();
            if (data.status === 'success') {
              onSuccess(response.reference);
              onClose();
            } else {
              setError('Payment verification failed. Contact support.');
            }
          } catch {
            setError('Could not verify payment. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error(err);
      setError('Payment failed to load. Please try again.');
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const amountDisplay = `₦${(amount / 100).toLocaleString()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h2 id="pay-modal-title" className="text-xl font-bold text-gray-900">
            Unlock Premium CV
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            One-time payment · PDF, Word &amp; Excel downloads
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-3">{amountDisplay}</p>
        </div>

        <ul className="text-sm text-gray-600 space-y-2 mb-6">
          {[
            'AI-generated professional content',
            'PDF, Word & Excel downloads',
            'Multiple CV templates',
            'Instant access',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mb-4">
          <label htmlFor="pay-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="pay-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-600 text-xs mb-3" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Opening Paystack…' : `Pay ${amountDisplay} with Paystack`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Secured by{' '}
          <a
            href="https://paystack.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-600"
          >
            Paystack
          </a>
        </p>
      </div>
    </div>
  );
}

export default PaymentModal;
