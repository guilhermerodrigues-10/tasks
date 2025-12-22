# 🚀 Deploy em tasks.loopmind.cloud

## 📋 Pré-requisitos

1. ✅ DNS apontado: `tasks.loopmind.cloud` → IP do servidor
2. ✅ Traefik configurado no servidor (porta 80 e 443)
3. ✅ Network `traefik-public` criada

---

## 🔧 Método 1: Com Traefik (HTTPS Automático - RECOMENDADO)

### No Portainer:

1. **Stacks** → **Add stack**
2. **Nome**: `flowstate`
3. **Build method**: **Web editor**
4. Cole o conteúdo de: `docker-compose-traefik.yml`
5. **Environment variables**:
   ```
   VITE_SUPABASE_URL=https://ncbmjkhoplgyfgxeqhmo.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jYm1qa2hvcGxneWZneGVxaG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzMwMzgsImV4cCI6MjA4MTA0OTAzOH0.t6_KI2oF6u7jmFwu8R_Av16vcBe5qgUTYgr9p1u4Ux4
   ```
6. **Deploy the stack**

### URL de Acesso:
✅ **https://tasks.loopmind.cloud**

O Traefik vai:
- Gerar certificado SSL automaticamente (Let's Encrypt)
- Redirecionar HTTP → HTTPS automaticamente
- Gerenciar o roteamento

---

## 🔧 Método 2: Sem Traefik (Porta Direta)

Se você NÃO tem Traefik configurado:

1. **Stacks** → **Add stack**
2. **Nome**: `flowstate`
3. **Build method**: **Web editor**
4. Cole o conteúdo de: `PORTAINER-WEB-EDITOR.yml`
5. **Environment variables**: (mesmas de cima)
6. **Deploy the stack**

### URL de Acesso:
⚠️ **http://tasks.loopmind.cloud:3000**

Você precisará configurar um reverse proxy manualmente ou usar a porta 3000.

---

## 🌐 Verificar DNS

Antes do deploy, certifique-se que o DNS está correto:

```bash
# No terminal
nslookup tasks.loopmind.cloud
# ou
ping tasks.loopmind.cloud
```

Deve retornar o IP do seu servidor.

---

## ✅ Checklist de Deploy

- [ ] DNS `tasks.loopmind.cloud` apontando para o servidor
- [ ] SQL executado no Supabase (arquivo `supabase-schema.sql`)
- [ ] Variáveis de ambiente configuradas no Portainer
- [ ] Network `traefik-public` existe (se usando Traefik)
- [ ] Deploy realizado
- [ ] Aguardar build (5-10 minutos)
- [ ] Acessar https://tasks.loopmind.cloud
- [ ] Criar conta e testar!

---

## 🆘 Troubleshooting

### "502 Bad Gateway"
→ Container ainda está fazendo build. Aguarde alguns minutos.

### "Certificate error"
→ Aguarde alguns minutos. Let's Encrypt está gerando o certificado.

### "Cannot connect to Supabase"
→ Verifique se as variáveis de ambiente estão corretas
→ Verifique se executou o SQL no Supabase

### DNS não resolve
→ Verifique configuração do DNS
→ Aguarde propagação (pode levar até 24h, geralmente minutos)

---

**Domínio**: tasks.loopmind.cloud
**Porta Interna**: 80 (nginx)
**Porta Externa**: 443 (HTTPS via Traefik) ou 3000 (sem Traefik)
**Repositório**: https://github.com/guilhermerodrigues-10/tasks
