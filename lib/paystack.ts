/**
 * Paystack payment helpers (client-side)
 */

export interface PaystackOptions {
  email: string;
  /** Amount in kobo (1 NGN = 100 kobo). e.g. ₦5,000 = 500000 */
  amount: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  currency?: string;
}

export function initiatePayment(options: PaystackOptions): void {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!publicKey) {
    console.error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set');
    return;
  }

  loadPaystackScript().then(() => {
    // @ts-expect-error - PaystackPop is injected by Paystack CDN
    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: options.email,
      amount: options.amount,
      currency: options.currency ?? 'NGN',
      ref: options.reference,
      callback: (response: { reference: string }) => {
        options.onSuccess(response.reference);
      },
      onClose: () => {
        options.onClose?.();
      },
    });
    handler.openIframe();
  });
}

export function generateReference(): string {
  return `ABSON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('No window'));
    if (document.getElementById('paystack-script')) return resolve();
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Paystack script failed to load'));
    document.head.appendChild(script);
  });
}
