const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { price, name } = req.body; 

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: name, // Le nom du pack (ex: Pack Gold)
              },
              unit_amount: price, // Le prix exact envoyé par le bouton
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        shipping_address_collection: {
          allowed_countries: ['FR', 'BE', 'CH', 'LU'], // Zone de livraison
        },
        success_url: `${req.headers.origin}/success.html`,
        cancel_url: `${req.headers.origin}/index.html`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).end('Method Not Allowed');
  }
}
