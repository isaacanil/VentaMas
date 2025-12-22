#!/bin/bash
# ============================================
# 🧠 Sync local branch -> remote "alt" as "main"
# Objetivo:
#   Mantener el remote ALT limpio y sincronizado con los últimos cambios locales,
#   eliminando ramas remotas anteriores y subiendo la rama actual como 'main'.
#   No modifica ramas locales.
# ============================================

set -e

# --- Colores y emojis para feedback visual ---
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
RED="\033[1;31m"
BLUE="\033[1;34m"
RESET="\033[0m"

echo -e "${BLUE}🚀 Detectando rama actual...${RESET}"
current_branch=$(git symbolic-ref --short HEAD)
echo -e "${GREEN}👉 Rama actual detectada:${RESET} ${YELLOW}$current_branch${RESET}"

# --- Verificar remote alt ---
if ! git remote | grep -q "^alt$"; then
  echo -e "${RED}❌ No se encontró el remote 'alt'.${RESET}"
  echo -e "${YELLOW}👉 Añádelo con:${RESET} git remote add alt <URL-del-repositorio>"
  exit 1
fi

# --- Confirmar acción ---
echo ""
read -p "⚠️  Esto eliminará TODAS las ramas remotas en 'alt' y subirá '$current_branch' como 'main'. ¿Continuar? (y/n): " confirm
if [[ $confirm != "y" ]]; then
  echo -e "${RED}❌ Operación cancelada.${RESET}"
  exit 0
fi

# --- Obtener ramas remotas actuales y eliminarlas ---
echo ""
echo -e "${BLUE}🧹 Eliminando ramas remotas existentes en 'alt'...${RESET}"
git fetch alt --prune >/dev/null 2>&1
for branch in $(git ls-remote --heads alt | awk '{print $2}' | sed 's#refs/heads/##'); do
  echo -e "   🗑️  Eliminando rama remota: ${YELLOW}$branch${RESET}"
  git push alt --delete "$branch" || true
done

# --- Crear rama temporal local ---
temp_branch="__alt_temp_push__"
git branch -f "$temp_branch" "$current_branch"

# --- Subir la rama temporal como 'main' ---
echo ""
echo -e "${BLUE}⬆️  Subiendo '${YELLOW}$current_branch${BLUE}' como 'main' al remote 'alt'...${RESET}"
git push alt "$temp_branch:main" --force

# --- Eliminar rama temporal local ---
git branch -D "$temp_branch" >/dev/null 2>&1

echo ""
echo -e "${GREEN}✅ Proceso completado exitosamente.${RESET}"
echo -e "${GREEN}   • '${YELLOW}$current_branch${GREEN}' se subió como 'main' a 'alt'.${RESET}"
echo -e "${GREEN}   • Todas las ramas remotas previas en 'alt' fueron eliminadas.${RESET}"
echo ""
echo -e "${BLUE}💡 Cuando Codex haya terminado, puedes traer los cambios así:${RESET}"
echo -e "${YELLOW}   git fetch alt main${RESET}"
echo -e "${YELLOW}   git merge alt/main${RESET}"
echo ""
