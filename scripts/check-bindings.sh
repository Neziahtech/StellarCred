#!/usr/bin/env bash
set -euo pipefail

# Fail when the committed TypeScript binding clients no longer match the
# contracts they are generated from — same idea as the circuit VK freshness
# check in CI.
#
#   cargo build --release --target wasm32v1-none --locked
#   ./scripts/check-bindings.sh
#
# A client that is missing an entrypoint is only incomplete, but one generated
# from a stale ABI typechecks while failing at runtime, so drift is blocking.

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for wasm in proof_registry issuer_registry; do
  if [ ! -f "$ROOT/target/wasm32v1-none/release/$wasm.wasm" ]; then
    echo "Error: $wasm.wasm not found — run 'cargo build --release --target wasm32v1-none --locked' first." >&2
    exit 1
  fi
done

# Normalise away the two things that are not ABI drift: the `networks`
# constant (stamped from the environment, so its presence varies) and
# blank-line/EOF noise around it. Then only real method and type changes
# remain, which `diff -B` would still report.
normalise() {
  tr -d '\r' | perl -0pe '
    s/export const networks = \{\r?\n.*?^\} as const\r?\n+//sm;
    s/\n*\z/\n/;
  '
}

COMMITTED="$(mktemp -d)"
for pkg in proof-registry issuer-registry; do
  mkdir -p "$COMMITTED/$pkg"
  cp "$ROOT/frontend/packages/$pkg/src/index.ts" "$COMMITTED/$pkg/raw.ts"
done

NEXT_PUBLIC_PROOF_REGISTRY_ID="" NEXT_PUBLIC_ISSUER_REGISTRY_ID="" \
  bash "$ROOT/scripts/gen-bindings.sh" >/dev/null

FAILED=0
for pkg in proof-registry issuer-registry; do
  cp "$ROOT/frontend/packages/$pkg/src/index.ts" "$COMMITTED/$pkg/g.ts"
  normalise < "$COMMITTED/$pkg/raw.ts" > "$COMMITTED/$pkg/c.n.ts"
  normalise < "$COMMITTED/$pkg/g.ts" > "$COMMITTED/$pkg/g.n.ts"
  if diff -u -B "$COMMITTED/$pkg/c.n.ts" "$COMMITTED/$pkg/g.n.ts" > "$COMMITTED/$pkg.diff" 2>&1; then
    echo "  OK — $pkg matches the contract ABI"
  else
    echo "::error::$pkg is stale — its methods/types no longer match the contract ABI"
    echo "--- first changes in frontend/packages/$pkg/src/index.ts ---"
    grep -v "^[+-]$" "$COMMITTED/$pkg.diff" | head -40
    echo "Run 'cargo build --release --target wasm32v1-none --locked && ./scripts/gen-bindings.sh' and commit the result."
    FAILED=1
  fi
done

# Regeneration rewrote the packages without the `networks` stamp; put the
# files back byte-for-byte as they were before a check that only reports.
for pkg in proof-registry issuer-registry; do
  cp "$COMMITTED/$pkg/raw.ts" "$ROOT/frontend/packages/$pkg/src/index.ts"
done

rm -rf "$COMMITTED"
exit "$FAILED"
