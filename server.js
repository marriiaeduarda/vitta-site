import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './server/routes/auth.routes.js';
import partnersRoutes from './server/routes/partner.routes.js';
import adminRoutes from './server/routes/admin.routes.js';
import configRoutes from './server/routes/config.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interpreta JSON e formulários enviados ao backend.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Publica apenas os arquivos do frontend necessários ao navegador.
// Isso evita expor server.js, package.json e o código do backend como arquivos estáticos.
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.redirect('/src/pages/home.html');
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Recurso não encontrado.' });
});

// Erros inesperados (ex.: JSON malformado) também respondem em JSON, sem expor detalhes internos.
app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'O corpo da requisição não é um JSON válido.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Vitta disponível na porta ${PORT}`);
});
