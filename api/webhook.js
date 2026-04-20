const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      await fetch('https://api.goshippro.com/v1/orders', {
        method: 'POST',
        headers: {
          // Le .trim() nettoie les espaces invisibles qui bloquent Vercel
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
