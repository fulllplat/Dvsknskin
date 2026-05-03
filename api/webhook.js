const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Désactive le parseur auto de Vercel (indispensable pour la sécurité Stripe)
exports.config = {
  api: { bodyParser: false },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // 1. Récupération de la requête brute
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);
  const sig = req.headers['stripe-signature'];

  let event;

  // 2. Vérification de la signature (La sécurité est ici)
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Erreur de signature :", err.message);
    return res.status(400).send(`Erreur Webhook : ${err.message}`);
  }

  // 3. Envoi à GoShippro uniquement si la signature est valide
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
    } catch (e) {
      console.error("Erreur GoShippro:", e);
    }
  }
  res.status(200).json({ received: true });
};
