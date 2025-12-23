# 🚀 Deploy na VPS - Passo a Passo Completo

## 📋 Pré-requisitos

- ✅ VPS com Ubuntu/Debian
- ✅ Docker e Docker Compose instalados
- ✅ Portainer instalado
- ✅ Traefik configurado (opcional, para HTTPS)
- ✅ DNS `tasks.loopmind.cloud` apontando para o IP da VPS

---

## 🎯 Método 1: Via Portainer (RECOMENDADO - Mais Fácil)

### Passo 1: Preparar Supabase

1. Acesse: https://ncbmjkhoplgyfgxeqhmo.supabase.co
2. Faça login no Supabase
3. Vá em **SQL Editor**
4. Cole o SQL do arquivo `supabase-schema.sql` (todo o conteúdo)
5. Clique em **Run** ou pressione **Ctrl+Enter**
6. Aguarde mensagem de sucesso

### Passo 2: Configurar GitHub Actions

#### 2.1. Docker Hub - Criar Conta e Token

1. Acesse: https://hub.docker.com
2. Crie uma conta ou faça login
3. Vá em **Account Settings** → **Security** → **New Access Token**
4. Copie o token gerado

#### 2.3. Configurar Secrets no GitHub
1. Vá em: https://github.com/guilhermerodrigues-10/tasks
2. **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**

Adicione 4 secrets:

**Secret 1:**
```
Name: DOCKERHUB_USERNAME
Value: seu_usuario_dockerhub
```

**Secret 2:**
```
Name: DOCKERHUB_TOKEN
Value: seu_token_dockerhub
```

**Secret 3:**
```
Name: VITE_SUPABASE_URL
Value: https://ncbmjkhoplgyfgxeqhmo.supabase.co
```

**Secret 4:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYm1qa2hvcGxneWZneGVxaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzMwMzgsImV4cCI6MjA4MTA0OTAzOH0.t6_KI2oF6u7jmFwu8R_Av16vcBe5qgUTYgr9p1u4Ux4
```

#### 2.4. Executar Build Manual (primeira vez)
1. Vá em: https://github.com/guilhermerodrigues-10/tasks/actions
2. Clique em **"Build and Push Docker Image"**
3. Clique em **"Run workflow"** → **"Run workflow"**
4. Aguarde 5-10 minutos até aparecer ✅ verde

### Passo 3: Deploy no Portainer

#### 3.1. Acessar Portainer
1. Acesse seu Portainer: `http://IP-DA-VPS:9000`
2. Faça login

#### 3.2. Criar Stack
1. Menu lateral → **Stacks**
2. Clique em **Add stack**
3. **Name**: `flowstate`
4. **Build method**: Escolha **Web editor**

#### 3.3. Cole o Docker Compose

**Se você TEM Traefik configurado** (com HTTPS automático):

```yaml
version: '3.8'

services:
  app:
    image: gulenda/flowstate:latest
    container_name: flowstate-app
    restart: always
    networks:
      - traefik-public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.flowstate.rule=Host(`tasks.loopmind.cloud`)"
      - "traefik.http.routers.flowstate.entrypoints=websecure"
      - "traefik.http.routers.flowstate.tls.certresolver=letsencrypt"
      - "traefik.http.services.flowstate.loadbalancer.server.port=80"
      - "traefik.http.routers.flowstate-http.rule=Host(`tasks.loopmind.cloud`)"
      - "traefik.http.routers.flowstate-http.entrypoints=web"
      - "traefik.http.routers.flowstate-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
    environment:
      - NODE_ENV=production

networks:
  traefik-public:
    external: true
```

**Se você NÃO tem Traefik** (acesso direto pela porta):

```yaml
version: '3.8'

services:
  app:
    image: gulenda/flowstate:latest
    container_name: flowstate-app
    restart: always
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
```

#### 3.4. Deploy
1. Role para baixo
2. Clique em **Deploy the stack**
3. Aguarde alguns segundos (a imagem já está pronta!)

### Passo 4: Verificar Deploy

1. Vá em **Containers** no Portainer
2. Procure por `flowstate-app`
3. Status deve estar **running** (verde)

### Passo 5: Acessar Aplicação

**Com Traefik:**
- ✅ https://tasks.loopmind.cloud

**Sem Traefik:**
- ✅ http://tasks.loopmind.cloud:3000
- ou http://IP-DA-VPS:3000

### Passo 6: Criar Conta e Testar

1. Acesse a URL
2. Clique em **"Não tem conta? Cadastre-se"**
3. Digite email e senha
4. Clique em **"Criar Conta"**
5. Faça login
6. Comece a usar! 🎉

---

## 🎯 Método 2: Via SSH (Terminal)

Se preferir fazer via linha de comando:

### Passo 1: Conectar na VPS

```bash
ssh usuario@IP-DA-VPS
```

### Passo 2: Criar diretório do projeto

```bash
mkdir -p ~/flowstate
cd ~/flowstate
```

### Passo 3: Criar docker-compose.yml

```bash
nano docker-compose.yml
```

Cole o conteúdo (com ou sem Traefik, como mostrado acima)

Salve: `Ctrl+O` → `Enter` → `Ctrl+X`

### Passo 4: Fazer Pull da imagem

```bash
docker pull gulenda/flowstate:latest
```

### Passo 5: Subir o container

```bash
docker-compose up -d
```

### Passo 6: Verificar logs

```bash
docker logs -f flowstate-app
```

---

## 🔄 Como Atualizar a Aplicação

Quando você fizer alterações no código:

### Opção A: Via Portainer (Fácil)

1. Faça suas alterações no código local
2. `git add .`
3. `git commit -m "suas alterações"`
4. `git push origin master`
5. GitHub Actions faz build automaticamente (~5 min)
6. No Portainer:
   - Vá em **Stacks** → `flowstate`
   - Clique em **Update the stack**
   - Marque **Pull latest image**
   - Clique em **Update**

### Opção B: Via SSH

```bash
cd ~/flowstate
docker-compose pull
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to Supabase"
→ Verifique se executou o SQL no Supabase
→ Verifique se o GitHub Actions rodou com sucesso
→ Verifique se a imagem tem as credenciais corretas

### Erro: "502 Bad Gateway"
→ Container ainda está iniciando, aguarde 30 segundos
→ Verifique logs: `docker logs flowstate-app`

### Erro: "Network traefik-public not found"
→ Você não tem Traefik configurado
→ Use o docker-compose SEM Traefik (com porta 3000)

### Erro: "DNS não resolve"
→ Verifique se o DNS está apontando corretamente
→ Teste: `ping tasks.loopmind.cloud`
→ Aguarde propagação do DNS (até 24h)

### Container não inicia
```bash
# Ver logs
docker logs flowstate-app

# Verificar status
docker ps -a | grep flowstate

# Reiniciar
docker restart flowstate-app
```

---

## ✅ Checklist Final

- [ ] SQL executado no Supabase
- [ ] 4 Secrets configurados no GitHub
- [ ] Build do GitHub Actions completado (✅ verde)
- [ ] Imagem disponível no Docker Hub
- [ ] DNS apontando para VPS
- [ ] Stack criada no Portainer
- [ ] Container rodando (verde)
- [ ] Aplicação acessível via browser
- [ ] Conta criada e login funcionando
- [ ] Dados salvando corretamente

---

## 📊 Informações Importantes

**Repositório GitHub:** https://github.com/guilhermerodrigues-10/tasks

**Imagem Docker Hub:** gulenda/flowstate:latest

**Supabase URL:** https://ncbmjkhoplgyfgxeqhmo.supabase.co

**Domínio:** tasks.loopmind.cloud

**Porta (sem Traefik):** 3000

**Porta interna do container:** 80

---

## 🎉 Pronto!

Agora você tem:
- ✅ Build automático no GitHub
- ✅ Deploy instantâneo (imagem pronta)
- ✅ HTTPS automático (se usar Traefik)
- ✅ Fácil de atualizar (só fazer push)

**Bom uso do FlowState!** 🚀
