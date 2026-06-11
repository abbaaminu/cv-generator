import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference || typeof reference !== 'string') {
      return NextResponse.json(
        { status: 'error', message: 'Invalid reference' },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY is not set');
      return NextResponse.json(
        { status: 'error', message: 'Payment verification unavailable' },
        { status: 500 }
      );
    }

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!paystackRes.ok) {
      return NextResponse.json(
        { status: 'error', message: 'Paystack API error' },
        { status: paystackRes.status }
      );
    }

    const data = await paystackRes.json();

    if (data.data?.status === 'success') {
      // TODO: save to database, unlock features, etc.
      return NextResponse.json({
        status: 'success',
        reference: data.data.reference,
        amount: data.data.amount,
        email: data.data.customer?.email,
      });
    }

    return NextResponse.json(
      { status: 'failed', message: 'Payment was not successful' },
      { status: 402 }
    );
  } catch (error) {
    console.error('Paystack verify error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
