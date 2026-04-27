const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH'] },
      line_items: [{
        price: 'price_1TQ8MGGtOXg2ogwK2xMnFwwf', 
        quantity: 1,
      }],
      mode: 'payment',
      // On met ton adresse exacte ici au lieu de la laisser deviner
      success_url: 'https://dvsknskin.vercel.app/success.html',
      cancel_url: 'https://dvsknskin.vercel.app/index.html',
    });
    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Erreur Stripe :", err.message);
    res.status(500).json({ error: err.message });
  }
};
