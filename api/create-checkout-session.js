const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required', // Obligatoire pour GoShippro
      shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH'] }, // Récupère l'adresse
      line_items: [{
        price: 'price_1TQ8MGGtOXg2ogwK2xMnFwwf', // Ton nouveau prix 29,99€
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/index.html`,
    });
    res.status(200).json({ id: session.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
