import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed — Blart',
  robots: { index: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;
  let order = null;

  if (sessionId) {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();
    order = data;
  }

  return (
    <div className="pt-32 pb-20 px-6 md:px-10 max-w-2xl mx-auto text-center">
      {/* Confirmation Icon */}
      <div className="w-16 h-16 rounded-full border-2 border-blart-black flex items-center justify-center mx-auto mb-8 animate-scale-in">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="font-display text-heading mb-4 animate-slide-up">
        Order Confirmed
      </h1>

      {order ? (
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <p className="text-blart-dim mb-8 max-w-md mx-auto">
            Thank you for your order. Your framed print will be produced and shipped by our print partner.
          </p>

          <div className="bg-blart-cream rounded-lg p-8 text-left space-y-4 mb-10">
            <div className="flex justify-between items-center border-b border-blart-stone/50 pb-3">
              <span className="text-sm text-blart-dim uppercase tracking-wider">Order</span>
              <span className="font-mono text-sm">{order.order_number}</span>
            </div>

            <div className="flex justify-between items-center border-b border-blart-stone/50 pb-3">
              <span className="text-sm text-blart-dim uppercase tracking-wider">Status</span>
              <span className="text-sm capitalize">{order.fulfillment_status}</span>
            </div>

            {order.items && Array.isArray(order.items) && order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center border-b border-blart-stone/50 pb-3">
                <div>
                  <p className="text-sm font-medium">{item.artwork_title}</p>
                  <p className="text-xs text-blart-dim">{item.size_label} — {item.frame_color} frame</p>
                </div>
                <span className="font-mono text-sm">
                  ${(item.unit_price / 100).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="flex justify-between items-center border-b border-blart-stone/50 pb-3">
              <span className="text-sm text-blart-dim">Shipping</span>
              <span className="font-mono text-sm">
                ${(order.shipping_cost / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-medium uppercase tracking-wider">Total</span>
              <span className="font-mono font-medium">
                ${(order.total / 100).toFixed(2)} {order.currency}
              </span>
            </div>
          </div>

          <p className="text-sm text-blart-dim mb-6">
            A confirmation email has been sent to <span className="text-blart-black">{order.customer_email}</span>
          </p>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <p className="text-blart-dim mb-8 max-w-md mx-auto">
            Your order has been placed successfully. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
        <Link
          href="/gallery"
          className="text-sm tracking-wider uppercase text-blart-dim hover:text-blart-black transition-colors"
        >
          Continue Browsing
        </Link>
        <Link
          href="/"
          className="text-sm tracking-wider uppercase text-blart-dim hover:text-blart-black transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
