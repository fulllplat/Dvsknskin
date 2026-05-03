const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  // On récupère dynamiquement le prix et le nom envoyés par ton index.html
  const { price, name } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH'] },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: name || 'Sérum DivaSkin',
          },
          unit_amount: price, // Applique le vrai prix (ex: 100 pour 1€)
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://dvsknskin.vercel.app/success.html',
      cancel_url: 'https://dvsknskin.vercel.app/index.html',
    });
    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Erreur Stripe :", err.message);
    res.status(500).json({ error: err.message });
  }
};
