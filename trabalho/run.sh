#!/usr/bin/env bash
# Script para iniciar o servidor local do jogo Explorador Estelar
PORT=${1:-8000}
echo "=========================================================="
echo "  🚀 Explorador Estelar - Computação Gráfica (Three.js)"
echo "  Servidor rodando em: http://localhost:$PORT"
echo "  Pressione Ctrl+C para encerrar"
echo "=========================================================="
python3 -m http.server $PORT
