#!/usr/bin/env bash
set -euo pipefail

# Regenerate the committed TypeScript binding clients from the built contract
# WASMs:
#
#   cargo build --release --target wasm32v1-none --locked
#   ./scripts/gen-bindings.sh
#
# The frontend (and the SDK's ProofRegistry reads) import these clients, so
# they have to track the contract surface. ./scripts/check-bindings.sh runs the
# same generation and fails when the committed files differ — CI enforces that,
# mirroring the circuit VK freshness check.
#
# Contract IDs (NEXT_PUBLIC_PROOF_REGISTRY_ID / NEXT_PUBLIC_ISSUER_REGISTRY_ID,
# exported by deploy.sh after a deployment) are stamped into the generated
# `networks` constant for the network named by NETWORK (default: testnet).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_DIR="$ROOT/target/wasm32v1-none/release"
NETWORK="${NETWORK:-testnet}"

case "$NETWORK" in
  pubnet|mainnet)
    NETWORK="$NETWORK"; NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015" ;;
  futurenet)
    NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022" ;;
  standalone)
    NETWORK_PASSPHRASE="Standalone Network ; February 2017" ;;
  *)
    NETWORK="testnet"; NETWORK_PASSPHRASE="Test SDF Network ; September 2015" ;;
esac

if ! command -v stellar >/dev/null 2>&1; then
  echo "Error: the stellar CLI is required (see CONTRIBUTING.md prerequisites)." >&2
  exit 1
fi

# The CLI only writes `networks` when it is pointed at a deployed contract, so
# the constant is spliced in here to keep generation offline and reproducible.
inject_networks() {
  local file="$1" contract_id="$2"
  [ -n "$contract_id" ] || return 0
  local tmp
  tmp="$(mktemp)"
  awk -v id="$contract_id" -v net="$NETWORK" -v pp="$NETWORK_PASSPHRASE" '
    { print }
    !done && /^\}$/ {
      done = 1
      print ""
      print "export const networks = {"
      print "  " net ": {"
      print "    networkPassphrase: \"" pp "\","
      print "    contractId: \"" id "\","
      print "  }"
      print "} as const"
    }
  ' "$file" > "$tmp" && mv "$tmp" "$file"
}

gen_one() {
  local wasm="$1" pkg="$2" contract_id="$3"
  if [ ! -f "$wasm" ]; then
    echo "Error: $wasm not found — run 'cargo build --release --target wasm32v1-none --locked'." >&2
    exit 1
  fi

  local out tmp
  out="$ROOT/frontend/packages/$pkg"
  tmp="$(mktemp -d)"
  echo "Generating bindings for $pkg from $(basename "$wasm")..."
  stellar contract bindings typescript --wasm "$wasm" --output-dir "$tmp/$pkg" --overwrite

  # The CLI emits unused Timepoint/Duration imports that break against the
  # stellar-sdk version this repo pins.
  perl -pi -e 's/Timepoint,//g; s/Duration,//g' "$tmp/$pkg/src/index.ts"
  inject_networks "$tmp/$pkg/src/index.ts" "$contract_id"

  # Only src/index.ts is committed output of the ABI: the generated
  # package.json, tsconfig and README are maintained in-tree. The CLI writes
  # CRLF on Windows; the repo stores LF, so normalise for reproducibility.
  cp "$tmp/$pkg/src/index.ts" "$out/src/index.ts"
  sed -i 's/\r$//' "$out/src/index.ts"
  rm -rf "$tmp"
}

gen_one "$WASM_DIR/proof_registry.wasm" proof-registry "${NEXT_PUBLIC_PROOF_REGISTRY_ID:-}"
gen_one "$WASM_DIR/issuer_registry.wasm" issuer-registry "${NEXT_PUBLIC_ISSUER_REGISTRY_ID:-}"

echo "Done generating bindings."
