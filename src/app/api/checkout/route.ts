import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artwork_id,
      artwork_title,
      artwork_slug,
      artwork_image,
      print_product_id,
      size_label,
      prodigi_sku,
      frame_color,
      unit_price,
      quantity = 1,
    } = body;

    if (!artwork_id || !print_product_id || !unit_price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blart.ai';

    // Create a pending order in the database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_email: 'pending@checkout.blart.ai', // Updated after Stripe checkout
        customer_name: '',
        shipping_name: 'Pending',
        shipping_line1: 'Pending',
        shipping_city: 'Pending',
        shipping_postal_code: '0000',
        shipping_country_code: 'AU',
        items: [{
          artwork_id,
          artwork_title,
          artwork_image,
          artwork_slug,
          print_product_id,
          size_label,
          prodigi_sku,
          frame_color,
          mount_color: 'white',
          quantity,
          unit_price,
        }],
        subtotal: unit_price * quantity,
        shipping_cost: 1500, // $15 flat
        total: (unit_price * quantity) + 1500,
        currency: 'AUD',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: artwork_title,
              description: `${size_label} — ${frame_color} frame`,
              images: [artwork_image],
            },
            unit_amount: unit_price,
          },
          quantity,
        },
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Worldwide Shipping',
              description: 'Standard shipping via Prodigi print network',
            },
            unit_amount: 1500,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      success_url: `${appUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/artwork/${artwork_slug}`,
      shipping_address_collection: {
        allowed_countries: [
          'AU', 'US', 'GB', 'CA', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL',
          'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'JP',
          'SG', 'HK',
        ],
      },
    });

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
