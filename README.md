# Vitta

Vitta é uma plataforma de bem-estar por assinatura: com um único plano, a pessoa acessa academias, esportes, nutrição e psicologia da rede de parceiros, sem depender do benefício da empresa onde trabalha.

**Site no ar:** https://vitta-site-3sal.onrender.com

> A hospedagem gratuita do Render "dorme" após um período sem acessos, então o primeiro carregamento pode demorar alguns segundos.

## O que o site tem

- **Home** com apresentação da proposta, modalidades, planos, comparação entre planos, rede de parceiros e chamada para novos parceiros.
- **Entrar / Criar conta**, com validação no servidor.
- **Cadastro de parceiro** em etapas, para estabelecimentos que querem entrar na rede.
- **Assinatura**: escolha do plano, dados e forma de pagamento (cartão, PIX ou boleto, simulados).
- **Minha VITTA**: área logada com check-in, nutrição, psicologia e histórico, de acordo com o plano.
- **Área administrativa** (login com `admin@vitta.com`): cadastro, edição e remoção de usuários, parceiros e planos.

## Tecnologias

HTML, CSS e JavaScript no front-end, sem frameworks. Node.js e Express no servidor, com `express-validator` para validar os dados recebidos.

## Executar localmente

Requisitos: Node.js LTS e npm.

```bash
npm install
npm start
```

Acesse http://localhost:3000. Para conferir o servidor: http://localhost:3000/api/health.

## Estrutura

```
server.js        entrada do servidor Express
server/          rotas, validações e dados em memória
src/pages/       páginas HTML
src/sections/    seções da Home (HTML + CSS de cada uma)
src/scripts/     JavaScript das páginas
src/styles/      CSS global e das páginas
public/assets/   ícones e imagens
```

## Observações

- Os dados do painel administrativo ficam em memória: começam de uma lista simulada e voltam ao início sempre que o servidor reinicia.
- O login é simulado (qualquer e-mail e senha válidos entram) e o acesso ao painel admin é conferido só pelo e-mail.