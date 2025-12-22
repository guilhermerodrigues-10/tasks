# 🚀 Deploy Automático via GitHub Actions

Este método faz build automático no GitHub e publica no Docker Hub sempre que você fizer push.

## 📋 Configuração Inicial (Fazer UMA VEZ)

### 1️⃣ Criar conta no Docker Hub

1. Acesse: https://hub.docker.com
2. Crie uma conta (se não tiver)
3. Username: `guilhermerodrigues10` (ou seu username)

### 2️⃣ Criar Access Token no Docker Hub

1. Login no Docker Hub
2. Account Settings → Security → New Access Token
3. Nome: `github-actions`
4. Permissões: `Read, Write, Delete`
5. **Copie o token** (você só verá uma vez!)

### 3️⃣ Configurar Secrets no GitHub

1. Vá no seu repositório: https://github.com/guilhermerodrigues-10/tasks
2. Settings → Secrets and variables → Actions → New repository secret

Adicione 4 secrets:

**Secret 1:**
- Name: `DOCKERHUB_USERNAME`
- Value: `guilhermerodrigues10`

**Secret 2:**
- Name: `DOCKERHUB_TOKEN`
- Value: (cole o token que copiou)

**Secret 3:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://ncbmjkhoplgyfgxeqhmo.supabase.co`

**Secret 4:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYm1qa2hvcGxneWZneGVxaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzMwMzgsImV4cCI6MjA4MTA0OTAzOH0.t6_KI2oF6u7jmFwu8R_Av16vcBe5qgUTYgr9p1u4Ux4`

---

## 🎯 Como Funciona

### Build Automático

Toda vez que você fizer `git push`:
1. GitHub Actions detecta o push
2. Faz build da aplicação
3. Cria imagem Docker com suas credenciais Supabase
4. Publica no Docker Hub como `guilhermerodrigues10/flowstate:latest`

### Primeiro Build Manual

Após configurar os secrets:

1. Vá em: https://github.com/guilhermerodrigues-10/tasks/actions
2. Clique em "Build and Push Docker Image"
3. Clique em "Run workflow" → "Run workflow"
4. Aguarde o build terminar (~5-10 min)
5. Verifique se apareceu verde ✅

---

## 📦 Deploy no Portainer

Agora que a imagem está no Docker Hub, o deploy é MUITO SIMPLES:

### No Portainer:

1. **Stacks** → **Add stack**
2. **Nome**: `flowstate`
3. **Build method**: **Web editor**
4. Cole este conteúdo:

```yaml
version: '3.8'

services:
  app:
    image: guilhermerodrigues10/flowstate:latest
    container_name: flowstate-app
    restart: always
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.flowstate.rule=Host(\`tasks.loopmind.cloud\`)"
      - "traefik.http.routers.flowstate.entrypoints=websecure"
      - "traefik.http.routers.flowstate.tls.certresolver=letsencrypt"
      - "traefik.http.services.flowstate.loadbalancer.server.port=80"
      - "traefik.http.routers.flowstate-http.rule=Host(\`tasks.loopmind.cloud\`)"
      - "traefik.http.routers.flowstate-http.entrypoints=web"
      - "traefik.http.routers.flowstate-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
    environment:
      - NODE_ENV=production

networks:
  traefik-public:
    external: true
```

5. **Deploy the stack**

### ⏱️ Deploy é INSTANTÂNEO!

Como a imagem já está pronta no Docker Hub, não precisa fazer build!
- Sem build = Deploy em segundos ⚡
- A aplicação já tem as credenciais Supabase embutidas

---

## 🔄 Atualizar a Aplicação

Sempre que você quiser atualizar:

1. Faça suas alterações no código
2. `git add .`
3. `git commit -m "suas alterações"`
4. `git push`
5. GitHub Actions faz build automaticamente
6. No Portainer: Stack → flowstate → Update the stack → Pull latest image

---

## ✅ Vantagens deste Método

- ✅ Build automático no GitHub (não consome recursos do servidor)
- ✅ Deploy instantâneo (imagem já pronta)
- ✅ Credenciais Supabase seguras (nos secrets do GitHub)
- ✅ Versionamento automático (cada commit = nova imagem)
- ✅ Fácil de atualizar (só fazer push)

---

## 🆘 Troubleshooting

### Build falhou no GitHub Actions
→ Verifique se os 4 secrets estão configurados corretamente

### Imagem não aparece no Docker Hub
→ Verifique se o DOCKERHUB_TOKEN está correto
→ Verifique se o username está correto

### Deploy no Portainer dá erro
→ Verifique se a imagem existe: https://hub.docker.com/r/guilhermerodrigues10/flowstate

---

## 🌐 Acesso Final

**URL**: https://tasks.loopmind.cloud

Depois do primeiro build, você tem deploy automático! 🎉
