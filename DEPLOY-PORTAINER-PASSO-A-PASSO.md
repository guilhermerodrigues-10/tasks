# 🚀 Deploy no Portainer - Passo a Passo

## ⚠️ Solução para o erro "reference not found"

Existem 3 formas de resolver. Escolha a que preferir:

---

## 📝 Método 1: Web Editor (RECOMENDADO - Mais Fácil)

1. No Portainer, vá em **Stacks** → **Add stack**
2. Nome: `flowstate`
3. Escolha **"Web editor"**
4. Cole o conteúdo do arquivo `PORTAINER-WEB-EDITOR.yml` (está na raiz do projeto)
5. Role para baixo até **"Environment variables"**
6. Adicione as variáveis (copie do arquivo `PORTAINER-ENV.txt`):
   ```
   VITE_SUPABASE_URL=https://ncbmjkhoplgyfgxeqhmo.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYm1qa2hvcGxneWZneGVxaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzMwMzgsImV4cCI6MjA4MTA0OTAzOH0.t6_KI2oF6u7jmFwu8R_Av16vcBe5qgUTYgr9p1u4Ux4
   ```
7. Clique em **"Deploy the stack"**

---

## 🔧 Método 2: Repository com Branch Especificada

1. No Portainer, vá em **Stacks** → **Add stack**
2. Nome: `flowstate`
3. Escolha **"Repository"**
4. Preencha:
   - **Repository URL**: `https://github.com/guilhermerodrigues-10/tasks`
   - **Repository reference**: `refs/heads/master` ← **IMPORTANTE!**
   - **Compose path**: `docker-compose.yml`
5. Adicione as Environment variables (do arquivo `PORTAINER-ENV.txt`)
6. Clique em **"Deploy the stack"**

---

## 🐳 Método 3: Build Local e Push para Docker Hub (Avançado)

Se os métodos acima não funcionarem, você pode:

1. Fazer build local da imagem
2. Fazer push para o Docker Hub
3. Usar a imagem pronta no Portainer

**Passo 1: Build e Push**
```bash
# Login no Docker Hub
docker login

# Build da imagem
docker build \
  --build-arg VITE_SUPABASE_URL=https://ncbmjkhoplgyfgxeqhmo.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYm1qa2hvcGxneWZneGVxaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzMwMzgsImV4cCI6MjA4MTA0OTAzOH0.t6_KI2oF6u7jmFwu8R_Av16vcBe5qgUTYgr9p1u4Ux4 \
  -t seu-usuario-dockerhub/flowstate:latest .

# Push para Docker Hub
docker push seu-usuario-dockerhub/flowstate:latest
```

**Passo 2: Deploy no Portainer**
```yaml
version: '3.8'

services:
  app:
    image: seu-usuario-dockerhub/flowstate:latest
    container_name: flowstate-app
    restart: always
    ports:
      - "3000:80"
```

---

## ✅ Verificação

Após o deploy:
1. Aguarde o build terminar (pode levar 5-10 minutos)
2. Acesse: `http://seu-servidor:3000`
3. Crie sua conta na tela de login
4. Comece a usar o FlowState! 🎉

---

## 🆘 Problemas Comuns

### "reference not found"
→ Use o Método 1 (Web Editor) ou especifique `refs/heads/master` no Método 2

### "Build failed"
→ Verifique se as variáveis de ambiente estão corretas

### "Cannot connect to Supabase"
→ Verifique se executou o SQL no Supabase (arquivo `supabase-schema.sql`)

---

**Repositório**: https://github.com/guilhermerodrigues-10/tasks
**Branch**: master
**Porta**: 3000
