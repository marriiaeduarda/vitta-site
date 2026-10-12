
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './server/routes/auth.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disponibiliza os arquivos existentes do projeto.
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.redirect('/src/pages/home.html');
});

// Endpoint simples para verificar se o servidor está ativo.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Vitta disponível na porta ${PORT}`);
});