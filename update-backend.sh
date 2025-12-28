#!/bin/bash
# Script para forçar atualização do backend no Docker Swarm

echo "🔄 Forçando atualização do backend..."

# 1. Atualizar o serviço com a imagem mais recente
docker service update --force --image gulenda/flowstate-backend:latest flowstate_backend

echo "✅ Atualização iniciada!"
echo ""
echo "Para verificar o status:"
echo "  docker service ps flowstate_backend"
echo ""
echo "Para ver os logs:"
echo "  docker service logs -f flowstate_backend"
