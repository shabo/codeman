#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF_HELP'
Codeman installer 🤖

USAGE
  install.sh [--repo URL] [--ref REF] [--install-dir DIR] [--bin-dir DIR] [--zshrc PATH]
  install.sh --local [--install-dir DIR] [--bin-dir DIR] [--zshrc PATH]
  install.sh --help

OPTIONS
  --repo URL         Git repository URL (default from CODEMAN_REPO_URL)
  --ref REF          Branch/tag to install (default: main)
  --install-dir DIR  Where Codeman is stored (default: ~/.local/share/codeman)
  --bin-dir DIR      Where `codeman` symlink is placed (default: ~/bin)
  --zshrc PATH       zsh rc file (default: ~/.zshrc)
  --local            Install from current checkout (used by `codeman upgrade`)
  --no-zsh           Skip zsh wiring
  --help             Show this message

ONE-LINER EXAMPLE
  curl -fsSL https://raw.githubusercontent.com/shabo/codeman/main/install.sh | bash -s -- --repo https://github.com/shabo/codeman.git
EOF_HELP
}

log() {
  printf '%s\n' "$*"
}

DEFAULT_REPO_URL="https://github.com/shabo/codeman.git"
REPO_URL="${CODEMAN_REPO_URL:-$DEFAULT_REPO_URL}"
REF="${CODEMAN_REF:-main}"
INSTALL_DIR="${CODEMAN_INSTALL_DIR:-$HOME/.local/share/codeman}"
BIN_DIR="${CODEMAN_BIN_DIR:-$HOME/bin}"
ZSHRC="${CODEMAN_ZSHRC:-$HOME/.zshrc}"
LOCAL=0
NO_ZSH=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || { echo "Missing value for --repo" >&2; exit 2; }
      REPO_URL="$2"
      shift 2
      ;;
    --ref)
      [ "$#" -ge 2 ] || { echo "Missing value for --ref" >&2; exit 2; }
      REF="$2"
      shift 2
      ;;
    --install-dir)
      [ "$#" -ge 2 ] || { echo "Missing value for --install-dir" >&2; exit 2; }
      INSTALL_DIR="$2"
      shift 2
      ;;
    --bin-dir)
      [ "$#" -ge 2 ] || { echo "Missing value for --bin-dir" >&2; exit 2; }
      BIN_DIR="$2"
      shift 2
      ;;
    --zshrc)
      [ "$#" -ge 2 ] || { echo "Missing value for --zshrc" >&2; exit 2; }
      ZSHRC="$2"
      shift 2
      ;;
    --local)
      LOCAL=1
      shift
      ;;
    --no-zsh)
      NO_ZSH=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

mkdir -p "$BIN_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"

src_dir=""
tmp_dir=""
cleanup() {
  [ -n "$tmp_dir" ] && rm -rf "$tmp_dir"
}
trap cleanup EXIT

if [ "$LOCAL" -eq 1 ]; then
  src_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  log "📦 Installing from local checkout: $src_dir"
else
  if ! command -v git >/dev/null 2>&1; then
    echo "git is required for install" >&2
    exit 1
  fi
  tmp_dir="$(mktemp -d)"
  log "📥 Cloning $REPO_URL ($REF) ..."
  git clone --depth 1 --branch "$REF" "$REPO_URL" "$tmp_dir/Codeman"
  src_dir="$tmp_dir/Codeman"
fi

if [ "$src_dir" != "$INSTALL_DIR" ]; then
  rm -rf "$INSTALL_DIR"
  cp -R "$src_dir" "$INSTALL_DIR"
fi

chmod +x "$INSTALL_DIR/bin/codeman" "$INSTALL_DIR/bin/codeman-install" "$INSTALL_DIR/install.sh"
ln -sfn "$INSTALL_DIR/bin/codeman" "$BIN_DIR/codeman"
ln -sfn "$INSTALL_DIR/bin/codeman-install" "$BIN_DIR/codeman-install"

if [ "$NO_ZSH" -eq 0 ]; then
  "$INSTALL_DIR/bin/codeman-install" --zshrc "$ZSHRC" --bin-dir "$BIN_DIR"
fi

log "✅ Codeman installed"
log "   launcher: $BIN_DIR/codeman"
log "   home:     $INSTALL_DIR"
log "   version:  $(tr -d '[:space:]' < "$INSTALL_DIR/VERSION")"
log ""
log "Next: source \"$ZSHRC\" && codeman help"
