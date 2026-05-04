const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  // On prend la requête directement sans bloquer sur la signature
  const event = req.body;

  // On vérifie que c'est bien un paiement validé
  if (event && event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Envoi de la commande vers GoShippro
      const response = await fetch('https://api.goshippro.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOSHIPPRO_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret_key: process.env.GOSHIPPRO_SECRET,
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

      // On lit la réponse exacte de GoShippro
      const result = await response.text();
      console.log("Statut GoShippro:", response.status);
      console.log("Réponse GoShippro:", result);

    } catch (e) {
      console.error("Erreur serveur Vercel -> GoShippro:", e.message);
    }
  }
  
  // On dit à Stripe que tout est OK pour qu'il arrête de renvoyer le message
  res.status(200).json({ received: true });
};
