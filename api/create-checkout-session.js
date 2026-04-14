const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Création de la session de paiement Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Sérum Anti-Repousse DivaSkin',
                images: ['https://ton-site.vercel.app/image-du-produit.jpg'], // Optionnel : lien vers la photo du flacon
              },
              unit_amount: 2990, // Le prix en centimes (29.90€)
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        shipping_address_collection: {
          allowed_countries: ['FR', 'BE', 'CH'], // Pays autorisés pour la livraison
        },
        success_url: `${req.headers.origin}/success.html`,
        cancel_url: `${req.headers.origin}/index.html`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
