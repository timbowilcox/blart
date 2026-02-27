import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrder as createProdigiOrder } from '@/lib/prodigi';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error('No order_id in session metadata');
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    // Get the order
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get shipping details from Stripe
    const shippingDetails = session.shipping_details;
    const customerEmail = session.customer_details?.email || '';

    // Update order with payment and shipping info
    await supabaseAdmin
      .from('orders')
      .update({
        customer_email: customerEmail,
        customer_name: session.customer_details?.name || '',
        shipping_name: shippingDetails?.name || '',
        shipping_line1: shippingDetails?.address?.line1 || '',
        shipping_line2: shippingDetails?.address?.line2 || null,
        shipping_city: shippingDetails?.address?.city || '',
        shipping_state: shippingDetails?.address?.state || null,
        shipping_postal_code: shippingDetails?.address?.postal_code || '',
        shipping_country_code: shippingDetails?.address?.country || 'AU',
        shipping_phone: session.customer_details?.phone || null,
        stripe_payment_intent_id: session.payment_intent as string,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Submit order to Prodigi
    try {
      const items = order.items as any[];
      const prodigiItems = items.map((item: any) => ({
        merchantReference: `blart-${order.order_number}-${item.artwork_id}`,
        sku: item.prodigi_sku,
        copies: item.quantity,
        sizing: 'fillPrintArea' as const,
        attributes: {
          color: item.frame_color,
        },
        assets: [{
          printArea: 'default',
          url: item.artwork_image, // The high-res artwork URL
        }],
        recipientCost: {
          amount: (item.unit_price / 100).toFixed(2),
          currency: 'AUD',
        },
      }));

      const prodigiResponse = await createProdigiOrder({
        merchantReference: order.order_number,
        shippingMethod: 'Standard',
        recipient: {
          name: shippingDetails?.name || '',
          email: customerEmail,
          phoneNumber: session.customer_details?.phone || undefined,
          address: {
            line1: shippingDetails?.address?.line1 || '',
            line2: shippingDetails?.address?.line2 || undefined,
            postalOrZipCode: shippingDetails?.address?.postal_code || '',
            countryCode: shippingDetails?.address?.country || 'AU',
            townOrCity: shippingDetails?.address?.city || '',
            stateOrCounty: shippingDetails?.address?.state || undefined,
          },
        },
        items: prodigiItems,
        metadata: {
          blart_order_id: orderId,
          blart_order_number: order.order_number,
        },
      });

      // Update order with Prodigi info
      await supabaseAdmin
        .from('orders')
        .update({
          prodigi_order_id: prodigiResponse.order?.id,
          prodigi_status: prodigiResponse.order?.status?.stage,
          fulfillment_status: 'submitted',
        })
        .eq('id', orderId);

      // Increment order count for each artwork
      for (const item of items) {
        await supabaseAdmin.rpc('increment_artwork_stat', {
          artwork_uuid: item.artwork_id,
          stat_name: 'order',
        });
      }
    } catch (prodigiError: any) {
      console.error('Prodigi order submission failed:', prodigiError);
      // Order is paid but Prodigi failed - flag for manual review
      await supabaseAdmin
        .from('orders')
        .update({
          fulfillment_status: 'pending',
          prodigi_status: `ERROR: ${prodigiError.message}`,
        })
        .eq('id', orderId);
    }
  }

  return NextResponse.json({ received: true });
}
