const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let event;

    try {
      // 1. On vérifie que ça vient bien de Stripe
      event = req.body; 

      // 2. Si le paiement est réussi
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // 3. On envoie l'ordre à GoShippro
        const goshipproResponse = await fetch('https://api.goshippro.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GOSHIPPRO_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secret_key: process.env.GOSHIPPRO_SECRET,
            order: {
              customer_name: session.customer_details.name,
              customer_email: session.customer_details.email,
              address: session.shipping_details.address.line1,
              city: session.shipping_details.address.city,
              zip: session.shipping_details.address.postal_code,
              country: session.shipping_details.address.country,
              product: "Sérum DivaSkin"
            }
          })
        });

        console.log("Commande envoyée à GoShippro !");
      }

      res.json({ received: true });
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
