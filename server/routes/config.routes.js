import { Router } from 'express';

const router = Router();

// Entrega ao navegador a chave do Google Maps guardada em variável de ambiente
// (no Render: Environment > GOOGLE_MAPS_API_KEY). A chave nunca fica no repositório.
// Ela continua visível no navegador, pois o Google exige isso: a proteção real é
// restringir a chave por site e por API no Google Cloud.
router.get('/', (_req, res) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (!googleMapsApiKey) {
    return res.status(503).json({ message: 'O mapa não está configurado neste ambiente.' });
  }

  res.set('Cache-Control', 'no-store');
  return res.json({ googleMapsApiKey });
});

export default router;
