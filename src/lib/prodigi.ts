const PRODIGI_BASE_URL = process.env.PRODIGI_ENVIRONMENT === 'live'
  ? 'https://api.prodigi.com/v4.0'
  : 'https://api.sandbox.prodigi.com/v4.0';

const headers = {
  'X-API-Key': process.env.PRODIGI_API_KEY!,
  'Content-Type': 'application/json',
};

export interface ProdigiQuoteRequest {
  sku: string;
  copies: number;
  attributes: Record<string, string>;
  destinationCountryCode: string;
  shippingMethod?: 'Budget' | 'Standard' | 'Express';
}

export interface ProdigiOrderRequest {
  merchantReference: string;
  shippingMethod: string;
  recipient: {
    name: string;
    email?: string;
    phoneNumber?: string;
    address: {
      line1: string;
      line2?: string;
      postalOrZipCode: string;
      countryCode: string;
      townOrCity: string;
      stateOrCounty?: string;
    };
  };
  items: {
    merchantReference?: string;
    sku: string;
    copies: number;
    sizing: 'fillPrintArea' | 'fitPrintArea';
    attributes: Record<string, string>;
    assets: { printArea: string; url: string }[];
    recipientCost?: { amount: string; currency: string };
  }[];
  metadata?: Record<string, string>;
}

export async function getQuote(items: ProdigiQuoteRequest[]) {
  const body = {
    shippingMethod: 'Standard',
    destinationCountryCode: items[0]?.destinationCountryCode || 'AU',
    items: items.map(item => ({
      sku: item.sku,
      copies: item.copies,
      attributes: item.attributes,
      assets: [{ printArea: 'default' }],
    })),
  };

  const res = await fetch(`${PRODIGI_BASE_URL}/Quotes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Prodigi quote error: ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function createOrder(order: ProdigiOrderRequest) {
  const res = await fetch(`${PRODIGI_BASE_URL}/Orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Prodigi order error: ${JSON.stringify(error)}`);
  }

  return res.json();
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${PRODIGI_BASE_URL}/Orders/${orderId}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Prodigi get order error: ${res.statusText}`);
  }

  return res.json();
}

export async function getProductDetails(sku: string) {
  const res = await fetch(`${PRODIGI_BASE_URL}/Products/${sku}`, {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Prodigi product details error: ${res.statusText}`);
  }

  return res.json();
}
