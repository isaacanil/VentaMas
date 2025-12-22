#!/usr/bin/env bash
set -euo pipefail

# ==== Ajustes rápidos ====
DELAY="${DELAY:-20}"  # segundos antes de mostrar el diálogo
PENDING_SCRIPT="${PENDING_SCRIPT:-$HOME/scripts/resumen_pendientes.sh}"
PENDING_DIR="${PENDING_DIR:-$HOME/Documentos/VentaMas/pending}"
ALWAYS_ASK="${ALWAYS_ASK:-0}"  # 1 = preguntar SIEMPRE, 0 = una vez por sesión
# =========================

REAL_CODE="$(command -v code-insiders || echo /usr/bin/code-insiders)"
MARKER="${XDG_RUNTIME_DIR:-/run/user/$UID}/vscode_insiders_prompt_shown"

# 1) Lanza Code Insiders normal, sin bloquear
"$REAL_CODE" "$@" & disown

# 2) Evita repetir en la misma sesión (a menos que ALWAYS_ASK=1)
if [[ "$ALWAYS_ASK" != "1" ]] && [[ -f "$MARKER" ]]; then
  exit 0
fi

# 3) Espera un poco
sleep "$DELAY"

# 4) Notificación pasiva (opcional)
if command -v notify-send >/dev/null 2>&1; then
  notify-send "VentaMas" "¿Ver el resumen de notas pendientes?" --urgency=low || true
fi

# 5) Diálogo con botones
if command -v zenity >/dev/null 2>&1; then
  if zenity --question \
        --title="VentaMas" \
        --text="¿Ver el resumen de notas pendientes ahora?" \
        --ok-label="Sí, mostrar" --cancel-label="No, luego"; then

    if [[ -x "$PENDING_SCRIPT" ]]; then
      # Ejecuta tu script y muestra el resultado en una ventana
      output="$("$PENDING_SCRIPT" "$PENDING_DIR" 2>&1 || true)"
      # Escapar mínimo para zenity
      zenity --info --title="Resumen de notas" --width=720 --height=520 \
        --text="$(printf '%s' "$output" | sed 's/&/&amp;/g; s/</\&lt;/g')" || true
    else
      zenity --warning --title="VentaMas" \
        --text="No encontré el script o no es ejecutable:\n$PENDING_SCRIPT" || true
    fi
  fi
fi

# 6) Marca que ya se mostró
if [[ "$ALWAYS_ASK" != "1" ]]; then
  : > "$MARKER"
fi
