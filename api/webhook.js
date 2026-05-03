const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 1. OBLIGATOIRE : On dit à Vercel de ne PAS transformer le message
export const config = {
  api: {
    bodyParser: false,
  },
};

// 2. Fonction pour lire le message brut
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => { resolve(body); });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);
  let event;

  try {
    // 3. On vérifie la signature de sécurité avec le message brut
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Erreur de signature :", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 4. Si le paiement est réussi, on envoie à GoShippro
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      await fetch('https://api.goshippro.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOSHIPPRO_TOKEN.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret_key: process.env.GOSHIPPRO_SECRET.trim(),
          order: {
            customer_name: session.customer_details?.name || "Client",
            customer_email: session.customer_details?.email || "",
            address: session.shipping_details?.address?.line1 || "Adresse non fournie",
            city: session.shipping_details?.address?.city || "",
            zip: session.shipping_details?.address?.postal_code || "",
            country: session.shipping_details?.address?.country || "FR",
            product: "Sérum DivaSkin"
          }
        })
      });
      console.log("Succès : Commande envoyée à GoShippro !");
    } catch (e) {
      console.error("Erreur GoShippro:", e);
    }
  }
  
  res.status(200).json({ received: true });
}
