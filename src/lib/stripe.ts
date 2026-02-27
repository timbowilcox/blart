import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export interface CheckoutItem {
  artworkTitle: string;
  sizeLabel: string;
  frameColor: string;
  quantity: number;
  priceInCents: number;
  imageUrl: string;
}

export async function createCheckoutSession({
  items,
  orderId,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  items: CheckoutItem[];
  orderId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: 'aud',
      product_data: {
        name: item.artworkTitle,
        description: `${item.sizeLabel} — ${item.frameColor} frame`,
        images: [item.imageUrl],
      },
      unit_amount: item.priceInCents,
    },
    quantity: item.quantity,
  }));

  // Add shipping as a line item
  lineItems.push({
    price_data: {
      currency: 'aud',
      product_data: {
        name: 'Worldwide Shipping',
        description: 'Standard shipping via Prodigi print network',
      },
      unit_amount: 1500, // $15 flat rate shipping
    },
    quantity: 1,
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    customer_email: customerEmail,
    metadata: {
      order_id: orderId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    shipping_address_collection: {
      allowed_countries: [
        'AU', 'US', 'GB', 'CA', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL',
        'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'JP',
        'SG', 'HK',
      ],
    },
  });

  return session;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
