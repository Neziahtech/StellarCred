import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  
  
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CB246P3C2HBJVK7U5B5JLOLBCG6E73OXVXTXGR46X3IYC5EO64YFYAKC",
  }
} as const




export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"IssuerNotFound"},
  3: {message:"MetadataTooLong"},
  /**
   * The caller is not the holder of the role required by this function.
   */
  4: {message:"RoleNotHeld"},
  /**
   * `revoke_role` named an address that is not the current holder of the role.
   */
  5: {message:"RoleHolderMismatch"},
  /**
   * The key is not part of this issuer's live key set: it was never
   * registered, or its validity window has already closed.
   */
  6: {message:"KeyNotFound"},
  /**
   * The key was already emergency-revoked, so revoking it again is a no-op.
   */
  7: {message:"KeyAlreadyRevoked"},
  /**
   * `rotate_issuer_key` was asked to install a key that is still in the
   * issuer's key set. Re-using a retired key would revive the credentials
   * signed with it.
   */
  8: {message:"KeyAlreadyRetired"},
  /**
   * The issuer already retains `MAX_RETIRED_KEYS` keys that are still inside
   * their validity windows; wait for one to expire before rotating again.
   */
  9: {message:"KeyHistoryFull"},
  /**
   * The requested validity window is empty (already closed) or longer than
   * `MAX_KEY_RETENTION_SECS`.
   */
  10: {message:"InvalidKeyWindow"},
  /**
   * `rotate_issuer_key` was asked to install the key that is already current.
   */
  11: {message:"KeyAlreadyCurrent"},
  /**
   * `register_issuer` tried to change the pubkey of an existing issuer.
   * Use `rotate_issuer_key` so outstanding credentials keep verifying.
   */
  12: {message:"KeyChangeRequiresRotation"}
}


export interface Issuer {
  /**
 * Credential types this issuer is trusted to attest.
 */
credential_types: Array<string>;
  /**
 * secp256k1 public key (x || y, 32 bytes each) the issuer signs credentials
 * with. A proof carries this key as a public input; ProofRegistry checks it
 * matches this registered value, so a proof can only pass if a registered
 * issuer actually signed the credential commitment.
 */
pubkey: Buffer;
  revoked: boolean;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Roles", values: void} | {tag: "Issuer", values: readonly [string]} | {tag: "RetiredKeys", values: readonly [string]} | {tag: "CurrentKeyRevoked", values: readonly [string]} | {tag: "IssuerList", values: void} | {tag: "IssuerMetadata", values: readonly [string]} | {tag: "IssuerCount", values: void};


/**
 * One entry of an issuer's key set.
 * 
 * The current signing key is reported by [`IssuerRegistry::get_issuer_keys`]
 * as the first entry with `retired_at == 0` and `valid_until == 0`; retired
 * keys follow, oldest first. Retired entries are pruned once their validity
 * window closes, so a long-lived issuer's history stays bounded.
 */
export interface IssuerKey {
  /**
 * secp256k1 public key (x || y, 32 bytes each).
 */
pubkey: Buffer;
  /**
 * Ledger timestamp at which the key stopped being the issuer's current
 * signing key. 0 while the key is still current.
 */
retired_at: u64;
  /**
 * Set by `revoke_issuer_key`. A revoked key never validates again,
 * regardless of `valid_until` — that is the difference between rotation
 * (windowed) and revocation (immediate).
 */
revoked: boolean;
  /**
 * Ledger timestamp from which the key stops validating submissions. 0
 * while the key is current (the current key has no scheduled expiry).
 */
valid_until: u64;
}


export interface IssuerMetadata {
  logo: Option<string>;
  name: Option<string>;
  url: Option<string>;
}


/**
 * Payload emitted when an issuer is revoked.
 * Topics: ("iss_reg", "revoked")
 */
export interface EventIssuerRevoked {
  /**
 * The address of the revoked issuer.
 */
issuer: string;
}


/**
 * Payload emitted when an issuer's signing key is emergency-revoked.
 * Topics: ("iss_reg", "key_revk")
 */
export interface EventIssuerKeyRevoked {
  /**
 * The issuer whose key set changed.
 */
issuer: string;
  /**
 * The key that was killed.
 */
pubkey: Buffer;
  /**
 * Ledger timestamp at which the revocation took effect.
 */
revoked_at: u64;
  /**
 * True when the revoked key was the issuer's current signing key (no new
 * credentials can be issued until the admin rotates to a new one); false
 * when it was a retired key still inside its validity window.
 */
was_current: boolean;
}


/**
 * Payload emitted when an issuer's signing key is rotated.
 * Topics: ("iss_reg", "key_rot")
 */
export interface EventIssuerKeyRotated {
  /**
 * The issuer whose key set changed.
 */
issuer: string;
  /**
 * The key that is current from now on.
 */
new_pubkey: Buffer;
  /**
 * Ledger timestamp after which `old_pubkey` stops validating submissions
 * (inclusive: the key is still valid at exactly this timestamp).
 * Already-revoked keys are recorded as history only, so this field is the
 * requested window even when the old key is dead regardless.
 */
old_key_valid_until: u64;
  /**
 * The key that stopped being the current signing key.
 */
old_pubkey: Buffer;
}


/**
 * Payload emitted when an issuer is registered or updated.
 * Topics: ("iss_reg", "register")
 */
export interface EventIssuerRegistered {
  /**
 * The address of the newly registered issuer.
 */
issuer: string;
  /**
 * The issuer's secp256k1 public key (x || y, 32 bytes each).
 */
pubkey: Buffer;
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the contract version as an encoded u32.
   * Encoding: (major * 1000000) + (minor * 1000) + patch
   * Example: 1.2.3 -> 1002003
   */
  version: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a has_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * True iff `address` currently holds `role`.
   */
  has_role: ({role, address}: {role: string, address: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Full on-chain record for a registered issuer.
   */
  get_issuer: ({issuer_id}: {issuer_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Issuer>>

  /**
   * Construct and simulate a grant_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Assign `address` as the holder of `role`, replacing any previous holder.
   * Root-admin only. Use this to delegate or rotate a role's key — e.g. hand
   * the `admin` role to an operations key, or prepare an `issuer-manager`
   * role for finer-grained issuer governance.
   */
  grant_role: ({role, address}: {role: string, address: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_issuers transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * All registered issuer addresses (including revoked).
   * 
   * # Warning
   * This returns the full list in a single Vec. For production deployments
   * with a large number of issuers, prefer [`get_issuers_page`] to bound
   * the per-call read footprint and avoid hitting Soroban resource limits.
   */
  get_issuers: (options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a revoke_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Remove `address` as the holder of `role`. Root-admin only.
   * 
   * The named address must be the current holder (revoking a different
   * address is a no-op risk, so it is rejected with `RoleHolderMismatch`
   * instead). A role with no holder is simply unassigned — no one can act
   * under it until it is granted again.
   */
  revoke_role: ({role, address}: {role: string, address: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a issuer_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Total number of registered issuers (including revoked).
   * Use this together with [`get_issuers_page`] to iterate the full set
   * without loading it all at once.
   */
  issuer_count: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a revoke_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mark an issuer as revoked. Admin-role only. Existing proofs are not affected
   * here — revocation propagates through `is_valid_issuer` checks.
   */
  revoke_issuer: ({issuer_id}: {issuer_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_issuer_keys transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * The issuer's full key set: the current signing key first, then retired
   * keys oldest-first. Empty vector for an unknown issuer.
   * 
   * The current key is reported with `retired_at == 0`, `valid_until == 0`
   * (it has no scheduled expiry) and `revoked` set when the current key was
   * emergency-revoked. Retired keys past their window are pruned by the next
   * rotation, so the list is live keys plus recent history.
   */
  get_issuer_keys: ({issuer_id}: {issuer_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<IssuerKey>>>

  /**
   * Construct and simulate a is_valid_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * True iff `issuer_id` is registered, not revoked, and trusted for
   * `credential_type`.
   * 
   * A false result also covers an issuer whose current signing key was
   * emergency-revoked: it cannot issue anything until an admin rotates it to
   * a new key. Use [`is_valid_issuer_key`] to check a specific proof's key.
   */
  is_valid_issuer: ({issuer_id, credential_type}: {issuer_id: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a register_issuer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Register (or overwrite) a trusted issuer. Admin-only.
   * Register (or overwrite) a trusted issuer. Admin-role only.
   */
  register_issuer: ({issuer_id, pubkey, credential_types}: {issuer_id: string, pubkey: Buffer, credential_types: Array<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_issuers_page transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Paginated read of registered issuer addresses (including revoked).
   * 
   * Returns up to `limit` addresses starting at zero-based index `start`.
   * `limit` is capped at 20 to bound the per-call read footprint; passing a
   * larger value silently uses 20 instead.
   * 
   * Use [`issuer_count`] to determine how many pages are needed:
   * ```text
   * pages = ceil(issuer_count() / limit)
   * ```
   */
  get_issuers_page: ({start, limit}: {start: u32, limit: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Array<string>>>

  /**
   * Construct and simulate a get_issuer_pubkey transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Look up an issuer's credential-signing public key (secp256k1 x || y).
   * 
   * This is the *current* signing key only. To check the key carried by a
   * proof — which may have been signed by a retired key that is still inside
   * its validity window — use [`is_valid_issuer_key`].
   */
  get_issuer_pubkey: ({issuer_id}: {issuer_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Buffer>>

  /**
   * Construct and simulate a revoke_issuer_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Emergency-revoke one of an issuer's signing keys. Admin-role only.
   * 
   * Unlike rotation, revocation is immediate and ignores the key's validity
   * window: proofs signed by the key stop verifying on the next ledger, and
   * if the current key is revoked the issuer cannot issue at all
   * (`is_valid_issuer` returns false) until an admin rotates it to a new key.
   * Retiring a key normally and then discovering it was compromised is the
   * exact case this exists for.
   */
  revoke_issuer_key: ({issuer_id, pubkey}: {issuer_id: string, pubkey: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a rotate_issuer_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Rotate an issuer's signing key. Admin-role only.
   * 
   * The current key is retired with a validity window that stays open
   * through `old_key_valid_until` (inclusive), and `new_pubkey` becomes the
   * key used for new issuance. Credentials signed by the old key therefore
   * keep verifying until they reach their natural expiry — rotation alone
   * never invalidates outstanding credentials.
   * 
   * `old_key_valid_until` must lie in `(now, now + MAX_KEY_RETENTION_SECS]`;
   * set it to the latest expiry among the issuer's outstanding credentials.
   * Retired keys are pruned once their window closes, so an issuer can rotate
   * repeatedly over its lifetime.
   * 
   * If the old key was emergency-revoked, rotating installs the replacement
   * and the revoked key stays dead in the history. To kill a key
   * immediately instead, use [`revoke_issuer_key`].
   */
  rotate_issuer_key: ({issuer_id, new_pubkey, old_key_valid_until}: {issuer_id: string, new_pubkey: Buffer, old_key_valid_until: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_issuer_metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the optional on-chain metadata for an issuer.
   * Returns `None` if no metadata has been set.
   */
  get_issuer_metadata: ({issuer}: {issuer: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<IssuerMetadata>>>

  /**
   * Construct and simulate a is_valid_issuer_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * True iff `pubkey` may sign submissions for `issuer_id` right now.
   * 
   * True for the issuer's current key and for any retired key whose validity
   * window has not closed and that has not been emergency-revoked. This is
   * the check ProofRegistry runs against a proof's public inputs, so a
   * credential issued before a rotation keeps verifying.
   */
  is_valid_issuer_key: ({issuer_id, pubkey}: {issuer_id: string, pubkey: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a set_issuer_metadata transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-role only. Pass `None` for fields you don't want to set.
   */
  set_issuer_metadata: ({issuer, name, url, logo}: {issuer: string, name: Option<string>, url: Option<string>, logo: Option<string>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a refresh_issuer_keys_ttl transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Extend the persistent-entry lifetime of an issuer's record and key
   * history. Admin-role only. Emits no event.
   * 
   * Persistent entries expire after `ENTRY_TTL`, and expiry is what makes an
   * entry unreadable — a retired key whose entry has lapsed stops verifying
   * even though its validity window is still open. Call this periodically
   * (a keeper job is the usual answer) for issuers with long validity
   * windows, ideally before `BUMP_THRESHOLD` ledgers have elapsed.
   */
  refresh_issuer_keys_ttl: ({issuer_id}: {issuer_id: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADAAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAADklzc3Vlck5vdEZvdW5kAAAAAAACAAAAAAAAAA9NZXRhZGF0YVRvb0xvbmcAAAAAAwAAAENUaGUgY2FsbGVyIGlzIG5vdCB0aGUgaG9sZGVyIG9mIHRoZSByb2xlIHJlcXVpcmVkIGJ5IHRoaXMgZnVuY3Rpb24uAAAAAAtSb2xlTm90SGVsZAAAAAAEAAAASmByZXZva2Vfcm9sZWAgbmFtZWQgYW4gYWRkcmVzcyB0aGF0IGlzIG5vdCB0aGUgY3VycmVudCBob2xkZXIgb2YgdGhlIHJvbGUuAAAAAAASUm9sZUhvbGRlck1pc21hdGNoAAAAAAAFAAAAdlRoZSBrZXkgaXMgbm90IHBhcnQgb2YgdGhpcyBpc3N1ZXIncyBsaXZlIGtleSBzZXQ6IGl0IHdhcyBuZXZlcgpyZWdpc3RlcmVkLCBvciBpdHMgdmFsaWRpdHkgd2luZG93IGhhcyBhbHJlYWR5IGNsb3NlZC4AAAAAAAtLZXlOb3RGb3VuZAAAAAAGAAAAR1RoZSBrZXkgd2FzIGFscmVhZHkgZW1lcmdlbmN5LXJldm9rZWQsIHNvIHJldm9raW5nIGl0IGFnYWluIGlzIGEgbm8tb3AuAAAAABFLZXlBbHJlYWR5UmV2b2tlZAAAAAAAAAcAAACZYHJvdGF0ZV9pc3N1ZXJfa2V5YCB3YXMgYXNrZWQgdG8gaW5zdGFsbCBhIGtleSB0aGF0IGlzIHN0aWxsIGluIHRoZQppc3N1ZXIncyBrZXkgc2V0LiBSZS11c2luZyBhIHJldGlyZWQga2V5IHdvdWxkIHJldml2ZSB0aGUgY3JlZGVudGlhbHMKc2lnbmVkIHdpdGggaXQuAAAAAAAAEUtleUFscmVhZHlSZXRpcmVkAAAAAAAACAAAAI5UaGUgaXNzdWVyIGFscmVhZHkgcmV0YWlucyBgTUFYX1JFVElSRURfS0VZU2Aga2V5cyB0aGF0IGFyZSBzdGlsbCBpbnNpZGUKdGhlaXIgdmFsaWRpdHkgd2luZG93czsgd2FpdCBmb3Igb25lIHRvIGV4cGlyZSBiZWZvcmUgcm90YXRpbmcgYWdhaW4uAAAAAAAOS2V5SGlzdG9yeUZ1bGwAAAAAAAkAAABgVGhlIHJlcXVlc3RlZCB2YWxpZGl0eSB3aW5kb3cgaXMgZW1wdHkgKGFscmVhZHkgY2xvc2VkKSBvciBsb25nZXIgdGhhbgpgTUFYX0tFWV9SRVRFTlRJT05fU0VDU2AuAAAAEEludmFsaWRLZXlXaW5kb3cAAAAKAAAASWByb3RhdGVfaXNzdWVyX2tleWAgd2FzIGFza2VkIHRvIGluc3RhbGwgdGhlIGtleSB0aGF0IGlzIGFscmVhZHkgY3VycmVudC4AAAAAAAARS2V5QWxyZWFkeUN1cnJlbnQAAAAAAAALAAAAhmByZWdpc3Rlcl9pc3N1ZXJgIHRyaWVkIHRvIGNoYW5nZSB0aGUgcHVia2V5IG9mIGFuIGV4aXN0aW5nIGlzc3Vlci4KVXNlIGByb3RhdGVfaXNzdWVyX2tleWAgc28gb3V0c3RhbmRpbmcgY3JlZGVudGlhbHMga2VlcCB2ZXJpZnlpbmcuAAAAAAAZS2V5Q2hhbmdlUmVxdWlyZXNSb3RhdGlvbgAAAAAAAAw=",
        "AAAAAQAAAAAAAAAAAAAABklzc3VlcgAAAAAAAwAAADJDcmVkZW50aWFsIHR5cGVzIHRoaXMgaXNzdWVyIGlzIHRydXN0ZWQgdG8gYXR0ZXN0LgAAAAAAEGNyZWRlbnRpYWxfdHlwZXMAAAPqAAAAEQAAAQ1zZWNwMjU2azEgcHVibGljIGtleSAoeCB8fCB5LCAzMiBieXRlcyBlYWNoKSB0aGUgaXNzdWVyIHNpZ25zIGNyZWRlbnRpYWxzCndpdGguIEEgcHJvb2YgY2FycmllcyB0aGlzIGtleSBhcyBhIHB1YmxpYyBpbnB1dDsgUHJvb2ZSZWdpc3RyeSBjaGVja3MgaXQKbWF0Y2hlcyB0aGlzIHJlZ2lzdGVyZWQgdmFsdWUsIHNvIGEgcHJvb2YgY2FuIG9ubHkgcGFzcyBpZiBhIHJlZ2lzdGVyZWQKaXNzdWVyIGFjdHVhbGx5IHNpZ25lZCB0aGUgY3JlZGVudGlhbCBjb21taXRtZW50LgAAAAAAAAZwdWJrZXkAAAAAA+4AAABAAAAAAAAAAAdyZXZva2VkAAAAAAE=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAADZSQkFDOiByb2xlIG5hbWUgKFN5bWJvbCkg4oaSIGN1cnJlbnQgaG9sZGVyIChBZGRyZXNzKS4AAAAAAAVSb2xlcwAAAAAAAAEAAAAAAAAABklzc3VlcgAAAAAAAQAAABMAAAABAAAAxVJldGlyZWQgc2lnbmluZyBrZXlzIG9mIGFuIGlzc3Vlciwgb2xkZXN0IGZpcnN0LiBFYWNoIGVudHJ5IGNhcnJpZXMgaXRzCm93biB2YWxpZGl0eSB3aW5kb3csIHNvIGEgcm90YXRpb24gZG9lcyBub3QgaW52YWxpZGF0ZSBjcmVkZW50aWFscyB0aGF0CndlcmUgc2lnbmVkIGJlZm9yZSBpdC4gQm91bmRlZCBieSBgTUFYX1JFVElSRURfS0VZU2AuAAAAAAAAC1JldGlyZWRLZXlzAAAAAAEAAAATAAAAAQAAANZXaGV0aGVyIHRoZSBpc3N1ZXIncyBjdXJyZW50IHNpZ25pbmcga2V5IHdhcyBlbWVyZ2VuY3ktcmV2b2tlZC4gU3RvcmVkCnNlcGFyYXRlbHkgZnJvbSBgSXNzdWVyYCBzbyB0aGUgYElzc3VlcmAgQUJJIHN0YXlzIHN0YWJsZTsgd2hpbGUgc2V0LCB0aGUKaXNzdWVyIGNhbm5vdCBpc3N1ZSAoYGlzX3ZhbGlkX2lzc3VlcmAgaXMgZmFsc2UpIGFuZCBtdXN0IGJlIHJvdGF0ZWQuAAAAAAARQ3VycmVudEtleVJldm9rZWQAAAAAAAABAAAAEwAAAAAAAAClQXBwZW5kLW9ubHkgbGlzdCBvZiByZWdpc3RlcmVkIGlzc3VlciBhZGRyZXNzZXMgZm9yIGVudW1lcmF0aW9uLgpTdG9yZWQgaW4gcGVyc2lzdGVudCBzdG9yYWdlIHRvIGF2b2lkIGhpdHRpbmcgdGhlIGluc3RhbmNlLXN0b3JhZ2UKc2l6ZSBjYXAgYXMgdGhlIGlzc3VlciBzZXQgZ3Jvd3MuAAAAAAAACklzc3Vlckxpc3QAAAAAAAEAAAAAAAAADklzc3Vlck1ldGFkYXRhAAAAAAABAAAAEwAAAAAAAACIVG90YWwgbnVtYmVyIG9mIHJlZ2lzdGVyZWQgaXNzdWVyczsga2VwdCBpbiBzeW5jIHdpdGggSXNzdWVyTGlzdCBzbwpjYWxsZXJzIGNhbiBzaXplIHBhZ2luYXRpb24gcmVxdWVzdHMgd2l0aG91dCBsb2FkaW5nIHRoZSB3aG9sZSBsaXN0LgAAAAtJc3N1ZXJDb3VudAA=",
        "AAAAAQAAAUBPbmUgZW50cnkgb2YgYW4gaXNzdWVyJ3Mga2V5IHNldC4KClRoZSBjdXJyZW50IHNpZ25pbmcga2V5IGlzIHJlcG9ydGVkIGJ5IFtgSXNzdWVyUmVnaXN0cnk6OmdldF9pc3N1ZXJfa2V5c2BdCmFzIHRoZSBmaXJzdCBlbnRyeSB3aXRoIGByZXRpcmVkX2F0ID09IDBgIGFuZCBgdmFsaWRfdW50aWwgPT0gMGA7IHJldGlyZWQKa2V5cyBmb2xsb3csIG9sZGVzdCBmaXJzdC4gUmV0aXJlZCBlbnRyaWVzIGFyZSBwcnVuZWQgb25jZSB0aGVpciB2YWxpZGl0eQp3aW5kb3cgY2xvc2VzLCBzbyBhIGxvbmctbGl2ZWQgaXNzdWVyJ3MgaGlzdG9yeSBzdGF5cyBib3VuZGVkLgAAAAAAAAAJSXNzdWVyS2V5AAAAAAAABAAAAC1zZWNwMjU2azEgcHVibGljIGtleSAoeCB8fCB5LCAzMiBieXRlcyBlYWNoKS4AAAAAAAAGcHVia2V5AAAAAAPuAAAAQAAAAHNMZWRnZXIgdGltZXN0YW1wIGF0IHdoaWNoIHRoZSBrZXkgc3RvcHBlZCBiZWluZyB0aGUgaXNzdWVyJ3MgY3VycmVudApzaWduaW5nIGtleS4gMCB3aGlsZSB0aGUga2V5IGlzIHN0aWxsIGN1cnJlbnQuAAAAAApyZXRpcmVkX2F0AAAAAAAGAAAAr1NldCBieSBgcmV2b2tlX2lzc3Vlcl9rZXlgLiBBIHJldm9rZWQga2V5IG5ldmVyIHZhbGlkYXRlcyBhZ2FpbiwKcmVnYXJkbGVzcyBvZiBgdmFsaWRfdW50aWxgIOKAlCB0aGF0IGlzIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gcm90YXRpb24KKHdpbmRvd2VkKSBhbmQgcmV2b2NhdGlvbiAoaW1tZWRpYXRlKS4AAAAAB3Jldm9rZWQAAAAAAQAAAIdMZWRnZXIgdGltZXN0YW1wIGZyb20gd2hpY2ggdGhlIGtleSBzdG9wcyB2YWxpZGF0aW5nIHN1Ym1pc3Npb25zLiAwCndoaWxlIHRoZSBrZXkgaXMgY3VycmVudCAodGhlIGN1cnJlbnQga2V5IGhhcyBubyBzY2hlZHVsZWQgZXhwaXJ5KS4AAAAAC3ZhbGlkX3VudGlsAAAAAAY=",
        "AAAAAQAAAAAAAAAAAAAADklzc3Vlck1ldGFkYXRhAAAAAAADAAAAAAAAAARsb2dvAAAD6AAAABAAAAAAAAAABG5hbWUAAAPoAAAAEAAAAAAAAAADdXJsAAAAA+gAAAAQ",
        "AAAAAQAAAElQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhbiBpc3N1ZXIgaXMgcmV2b2tlZC4KVG9waWNzOiAoImlzc19yZWciLCAicmV2b2tlZCIpAAAAAAAAAAAAABJFdmVudElzc3VlclJldm9rZWQAAAAAAAEAAAAiVGhlIGFkZHJlc3Mgb2YgdGhlIHJldm9rZWQgaXNzdWVyLgAAAAAABmlzc3VlcgAAAAAAEw==",
        "AAAAAQAAAGJQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhbiBpc3N1ZXIncyBzaWduaW5nIGtleSBpcyBlbWVyZ2VuY3ktcmV2b2tlZC4KVG9waWNzOiAoImlzc19yZWciLCAia2V5X3JldmsiKQAAAAAAAAAAABVFdmVudElzc3VlcktleVJldm9rZWQAAAAAAAAEAAAAIVRoZSBpc3N1ZXIgd2hvc2Uga2V5IHNldCBjaGFuZ2VkLgAAAAAAAAZpc3N1ZXIAAAAAABMAAAAYVGhlIGtleSB0aGF0IHdhcyBraWxsZWQuAAAABnB1YmtleQAAAAAD7gAAAEAAAAA1TGVkZ2VyIHRpbWVzdGFtcCBhdCB3aGljaCB0aGUgcmV2b2NhdGlvbiB0b29rIGVmZmVjdC4AAAAAAAAKcmV2b2tlZF9hdAAAAAAABgAAAMlUcnVlIHdoZW4gdGhlIHJldm9rZWQga2V5IHdhcyB0aGUgaXNzdWVyJ3MgY3VycmVudCBzaWduaW5nIGtleSAobm8gbmV3CmNyZWRlbnRpYWxzIGNhbiBiZSBpc3N1ZWQgdW50aWwgdGhlIGFkbWluIHJvdGF0ZXMgdG8gYSBuZXcgb25lKTsgZmFsc2UKd2hlbiBpdCB3YXMgYSByZXRpcmVkIGtleSBzdGlsbCBpbnNpZGUgaXRzIHZhbGlkaXR5IHdpbmRvdy4AAAAAAAALd2FzX2N1cnJlbnQAAAAAAQ==",
        "AAAAAQAAAFdQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhbiBpc3N1ZXIncyBzaWduaW5nIGtleSBpcyByb3RhdGVkLgpUb3BpY3M6ICgiaXNzX3JlZyIsICJrZXlfcm90IikAAAAAAAAAABVFdmVudElzc3VlcktleVJvdGF0ZWQAAAAAAAAEAAAAIVRoZSBpc3N1ZXIgd2hvc2Uga2V5IHNldCBjaGFuZ2VkLgAAAAAAAAZpc3N1ZXIAAAAAABMAAAAkVGhlIGtleSB0aGF0IGlzIGN1cnJlbnQgZnJvbSBub3cgb24uAAAACm5ld19wdWJrZXkAAAAAA+4AAABAAAABCExlZGdlciB0aW1lc3RhbXAgYWZ0ZXIgd2hpY2ggYG9sZF9wdWJrZXlgIHN0b3BzIHZhbGlkYXRpbmcgc3VibWlzc2lvbnMKKGluY2x1c2l2ZTogdGhlIGtleSBpcyBzdGlsbCB2YWxpZCBhdCBleGFjdGx5IHRoaXMgdGltZXN0YW1wKS4KQWxyZWFkeS1yZXZva2VkIGtleXMgYXJlIHJlY29yZGVkIGFzIGhpc3Rvcnkgb25seSwgc28gdGhpcyBmaWVsZCBpcyB0aGUKcmVxdWVzdGVkIHdpbmRvdyBldmVuIHdoZW4gdGhlIG9sZCBrZXkgaXMgZGVhZCByZWdhcmRsZXNzLgAAABNvbGRfa2V5X3ZhbGlkX3VudGlsAAAAAAYAAAAzVGhlIGtleSB0aGF0IHN0b3BwZWQgYmVpbmcgdGhlIGN1cnJlbnQgc2lnbmluZyBrZXkuAAAAAApvbGRfcHVia2V5AAAAAAPuAAAAQA==",
        "AAAAAQAAAFhQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhbiBpc3N1ZXIgaXMgcmVnaXN0ZXJlZCBvciB1cGRhdGVkLgpUb3BpY3M6ICgiaXNzX3JlZyIsICJyZWdpc3RlciIpAAAAAAAAABVFdmVudElzc3VlclJlZ2lzdGVyZWQAAAAAAAACAAAAK1RoZSBhZGRyZXNzIG9mIHRoZSBuZXdseSByZWdpc3RlcmVkIGlzc3Vlci4AAAAABmlzc3VlcgAAAAAAEwAAADpUaGUgaXNzdWVyJ3Mgc2VjcDI1NmsxIHB1YmxpYyBrZXkgKHggfHwgeSwgMzIgYnl0ZXMgZWFjaCkuAAAAAAAGcHVia2V5AAAAAAPuAAAAQA==",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAH5SZXR1cm5zIHRoZSBjb250cmFjdCB2ZXJzaW9uIGFzIGFuIGVuY29kZWQgdTMyLgpFbmNvZGluZzogKG1ham9yICogMTAwMDAwMCkgKyAobWlub3IgKiAxMDAwKSArIHBhdGNoCkV4YW1wbGU6IDEuMi4zIC0+IDEwMDIwMDMAAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAABA==",
        "AAAAAAAAACpUcnVlIGlmZiBgYWRkcmVzc2AgY3VycmVudGx5IGhvbGRzIGByb2xlYC4AAAAAAAhoYXNfcm9sZQAAAAIAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAC1GdWxsIG9uLWNoYWluIHJlY29yZCBmb3IgYSByZWdpc3RlcmVkIGlzc3Vlci4AAAAAAAAKZ2V0X2lzc3VlcgAAAAAAAQAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAEAAAfQAAAABklzc3VlcgAA",
        "AAAAAAAAAQNBc3NpZ24gYGFkZHJlc3NgIGFzIHRoZSBob2xkZXIgb2YgYHJvbGVgLCByZXBsYWNpbmcgYW55IHByZXZpb3VzIGhvbGRlci4KUm9vdC1hZG1pbiBvbmx5LiBVc2UgdGhpcyB0byBkZWxlZ2F0ZSBvciByb3RhdGUgYSByb2xlJ3Mga2V5IOKAlCBlLmcuIGhhbmQKdGhlIGBhZG1pbmAgcm9sZSB0byBhbiBvcGVyYXRpb25zIGtleSwgb3IgcHJlcGFyZSBhbiBgaXNzdWVyLW1hbmFnZXJgCnJvbGUgZm9yIGZpbmVyLWdyYWluZWQgaXNzdWVyIGdvdmVybmFuY2UuAAAAAApncmFudF9yb2xlAAAAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAA==",
        "AAAAAAAAARJBbGwgcmVnaXN0ZXJlZCBpc3N1ZXIgYWRkcmVzc2VzIChpbmNsdWRpbmcgcmV2b2tlZCkuCgojIFdhcm5pbmcKVGhpcyByZXR1cm5zIHRoZSBmdWxsIGxpc3QgaW4gYSBzaW5nbGUgVmVjLiBGb3IgcHJvZHVjdGlvbiBkZXBsb3ltZW50cwp3aXRoIGEgbGFyZ2UgbnVtYmVyIG9mIGlzc3VlcnMsIHByZWZlciBbYGdldF9pc3N1ZXJzX3BhZ2VgXSB0byBib3VuZAp0aGUgcGVyLWNhbGwgcmVhZCBmb290cHJpbnQgYW5kIGF2b2lkIGhpdHRpbmcgU29yb2JhbiByZXNvdXJjZSBsaW1pdHMuAAAAAAALZ2V0X2lzc3VlcnMAAAAAAAAAAAEAAAPqAAAAEw==",
        "AAAAAAAAAS9SZW1vdmUgYGFkZHJlc3NgIGFzIHRoZSBob2xkZXIgb2YgYHJvbGVgLiBSb290LWFkbWluIG9ubHkuCgpUaGUgbmFtZWQgYWRkcmVzcyBtdXN0IGJlIHRoZSBjdXJyZW50IGhvbGRlciAocmV2b2tpbmcgYSBkaWZmZXJlbnQKYWRkcmVzcyBpcyBhIG5vLW9wIHJpc2ssIHNvIGl0IGlzIHJlamVjdGVkIHdpdGggYFJvbGVIb2xkZXJNaXNtYXRjaGAKaW5zdGVhZCkuIEEgcm9sZSB3aXRoIG5vIGhvbGRlciBpcyBzaW1wbHkgdW5hc3NpZ25lZCDigJQgbm8gb25lIGNhbiBhY3QKdW5kZXIgaXQgdW50aWwgaXQgaXMgZ3JhbnRlZCBhZ2Fpbi4AAAAAC3Jldm9rZV9yb2xlAAAAAAIAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAA",
        "AAAAAAAAAJtUb3RhbCBudW1iZXIgb2YgcmVnaXN0ZXJlZCBpc3N1ZXJzIChpbmNsdWRpbmcgcmV2b2tlZCkuClVzZSB0aGlzIHRvZ2V0aGVyIHdpdGggW2BnZXRfaXNzdWVyc19wYWdlYF0gdG8gaXRlcmF0ZSB0aGUgZnVsbCBzZXQKd2l0aG91dCBsb2FkaW5nIGl0IGFsbCBhdCBvbmNlLgAAAAAMaXNzdWVyX2NvdW50AAAAAAAAAAEAAAAE",
        "AAAAAAAAACxTZXQgdGhlIHByb3RvY29sIGFkbWluIG9uY2UsIGF0IGRlcGxveSB0aW1lLgAAAA1fX2NvbnN0cnVjdG9yAAAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAI1NYXJrIGFuIGlzc3VlciBhcyByZXZva2VkLiBBZG1pbi1yb2xlIG9ubHkuIEV4aXN0aW5nIHByb29mcyBhcmUgbm90IGFmZmVjdGVkCmhlcmUg4oCUIHJldm9jYXRpb24gcHJvcGFnYXRlcyB0aHJvdWdoIGBpc192YWxpZF9pc3N1ZXJgIGNoZWNrcy4AAAAAAAANcmV2b2tlX2lzc3VlcgAAAAAAAAEAAAAAAAAACWlzc3Vlcl9pZAAAAAAAABMAAAAA",
        "AAAAAAAAAY5UaGUgaXNzdWVyJ3MgZnVsbCBrZXkgc2V0OiB0aGUgY3VycmVudCBzaWduaW5nIGtleSBmaXJzdCwgdGhlbiByZXRpcmVkCmtleXMgb2xkZXN0LWZpcnN0LiBFbXB0eSB2ZWN0b3IgZm9yIGFuIHVua25vd24gaXNzdWVyLgoKVGhlIGN1cnJlbnQga2V5IGlzIHJlcG9ydGVkIHdpdGggYHJldGlyZWRfYXQgPT0gMGAsIGB2YWxpZF91bnRpbCA9PSAwYAooaXQgaGFzIG5vIHNjaGVkdWxlZCBleHBpcnkpIGFuZCBgcmV2b2tlZGAgc2V0IHdoZW4gdGhlIGN1cnJlbnQga2V5IHdhcwplbWVyZ2VuY3ktcmV2b2tlZC4gUmV0aXJlZCBrZXlzIHBhc3QgdGhlaXIgd2luZG93IGFyZSBwcnVuZWQgYnkgdGhlIG5leHQKcm90YXRpb24sIHNvIHRoZSBsaXN0IGlzIGxpdmUga2V5cyBwbHVzIHJlY2VudCBoaXN0b3J5LgAAAAAAD2dldF9pc3N1ZXJfa2V5cwAAAAABAAAAAAAAAAlpc3N1ZXJfaWQAAAAAAAATAAAAAQAAA+oAAAfQAAAACUlzc3VlcktleQAAAA==",
        "AAAAAAAAAShUcnVlIGlmZiBgaXNzdWVyX2lkYCBpcyByZWdpc3RlcmVkLCBub3QgcmV2b2tlZCwgYW5kIHRydXN0ZWQgZm9yCmBjcmVkZW50aWFsX3R5cGVgLgoKQSBmYWxzZSByZXN1bHQgYWxzbyBjb3ZlcnMgYW4gaXNzdWVyIHdob3NlIGN1cnJlbnQgc2lnbmluZyBrZXkgd2FzCmVtZXJnZW5jeS1yZXZva2VkOiBpdCBjYW5ub3QgaXNzdWUgYW55dGhpbmcgdW50aWwgYW4gYWRtaW4gcm90YXRlcyBpdCB0bwphIG5ldyBrZXkuIFVzZSBbYGlzX3ZhbGlkX2lzc3Vlcl9rZXlgXSB0byBjaGVjayBhIHNwZWNpZmljIHByb29mJ3Mga2V5LgAAAA9pc192YWxpZF9pc3N1ZXIAAAAAAgAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAAAAAAPY3JlZGVudGlhbF90eXBlAAAAABEAAAABAAAAAQ==",
        "AAAAAAAAAHBSZWdpc3RlciAob3Igb3ZlcndyaXRlKSBhIHRydXN0ZWQgaXNzdWVyLiBBZG1pbi1vbmx5LgpSZWdpc3RlciAob3Igb3ZlcndyaXRlKSBhIHRydXN0ZWQgaXNzdWVyLiBBZG1pbi1yb2xlIG9ubHkuAAAAD3JlZ2lzdGVyX2lzc3VlcgAAAAADAAAAAAAAAAlpc3N1ZXJfaWQAAAAAAAATAAAAAAAAAAZwdWJrZXkAAAAAA+4AAABAAAAAAAAAABBjcmVkZW50aWFsX3R5cGVzAAAD6gAAABEAAAAA",
        "AAAAAAAAAWdQYWdpbmF0ZWQgcmVhZCBvZiByZWdpc3RlcmVkIGlzc3VlciBhZGRyZXNzZXMgKGluY2x1ZGluZyByZXZva2VkKS4KClJldHVybnMgdXAgdG8gYGxpbWl0YCBhZGRyZXNzZXMgc3RhcnRpbmcgYXQgemVyby1iYXNlZCBpbmRleCBgc3RhcnRgLgpgbGltaXRgIGlzIGNhcHBlZCBhdCAyMCB0byBib3VuZCB0aGUgcGVyLWNhbGwgcmVhZCBmb290cHJpbnQ7IHBhc3NpbmcgYQpsYXJnZXIgdmFsdWUgc2lsZW50bHkgdXNlcyAyMCBpbnN0ZWFkLgoKVXNlIFtgaXNzdWVyX2NvdW50YF0gdG8gZGV0ZXJtaW5lIGhvdyBtYW55IHBhZ2VzIGFyZSBuZWVkZWQ6CmBgYHRleHQKcGFnZXMgPSBjZWlsKGlzc3Vlcl9jb3VudCgpIC8gbGltaXQpCmBgYAAAAAAQZ2V0X2lzc3VlcnNfcGFnZQAAAAIAAAAAAAAABXN0YXJ0AAAAAAAABAAAAAAAAAAFbGltaXQAAAAAAAAEAAAAAQAAA+oAAAAT",
        "AAAAAAAAAQxMb29rIHVwIGFuIGlzc3VlcidzIGNyZWRlbnRpYWwtc2lnbmluZyBwdWJsaWMga2V5IChzZWNwMjU2azEgeCB8fCB5KS4KClRoaXMgaXMgdGhlICpjdXJyZW50KiBzaWduaW5nIGtleSBvbmx5LiBUbyBjaGVjayB0aGUga2V5IGNhcnJpZWQgYnkgYQpwcm9vZiDigJQgd2hpY2ggbWF5IGhhdmUgYmVlbiBzaWduZWQgYnkgYSByZXRpcmVkIGtleSB0aGF0IGlzIHN0aWxsIGluc2lkZQppdHMgdmFsaWRpdHkgd2luZG93IOKAlCB1c2UgW2Bpc192YWxpZF9pc3N1ZXJfa2V5YF0uAAAAEWdldF9pc3N1ZXJfcHVia2V5AAAAAAAAAQAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAEAAAPuAAAAQA==",
        "AAAAAAAAAb1FbWVyZ2VuY3ktcmV2b2tlIG9uZSBvZiBhbiBpc3N1ZXIncyBzaWduaW5nIGtleXMuIEFkbWluLXJvbGUgb25seS4KClVubGlrZSByb3RhdGlvbiwgcmV2b2NhdGlvbiBpcyBpbW1lZGlhdGUgYW5kIGlnbm9yZXMgdGhlIGtleSdzIHZhbGlkaXR5CndpbmRvdzogcHJvb2ZzIHNpZ25lZCBieSB0aGUga2V5IHN0b3AgdmVyaWZ5aW5nIG9uIHRoZSBuZXh0IGxlZGdlciwgYW5kCmlmIHRoZSBjdXJyZW50IGtleSBpcyByZXZva2VkIHRoZSBpc3N1ZXIgY2Fubm90IGlzc3VlIGF0IGFsbAooYGlzX3ZhbGlkX2lzc3VlcmAgcmV0dXJucyBmYWxzZSkgdW50aWwgYW4gYWRtaW4gcm90YXRlcyBpdCB0byBhIG5ldyBrZXkuClJldGlyaW5nIGEga2V5IG5vcm1hbGx5IGFuZCB0aGVuIGRpc2NvdmVyaW5nIGl0IHdhcyBjb21wcm9taXNlZCBpcyB0aGUKZXhhY3QgY2FzZSB0aGlzIGV4aXN0cyBmb3IuAAAAAAAAEXJldm9rZV9pc3N1ZXJfa2V5AAAAAAAAAgAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAAAAAAGcHVia2V5AAAAAAPuAAAAQAAAAAA=",
        "AAAAAAAAAyVSb3RhdGUgYW4gaXNzdWVyJ3Mgc2lnbmluZyBrZXkuIEFkbWluLXJvbGUgb25seS4KClRoZSBjdXJyZW50IGtleSBpcyByZXRpcmVkIHdpdGggYSB2YWxpZGl0eSB3aW5kb3cgdGhhdCBzdGF5cyBvcGVuCnRocm91Z2ggYG9sZF9rZXlfdmFsaWRfdW50aWxgIChpbmNsdXNpdmUpLCBhbmQgYG5ld19wdWJrZXlgIGJlY29tZXMgdGhlCmtleSB1c2VkIGZvciBuZXcgaXNzdWFuY2UuIENyZWRlbnRpYWxzIHNpZ25lZCBieSB0aGUgb2xkIGtleSB0aGVyZWZvcmUKa2VlcCB2ZXJpZnlpbmcgdW50aWwgdGhleSByZWFjaCB0aGVpciBuYXR1cmFsIGV4cGlyeSDigJQgcm90YXRpb24gYWxvbmUKbmV2ZXIgaW52YWxpZGF0ZXMgb3V0c3RhbmRpbmcgY3JlZGVudGlhbHMuCgpgb2xkX2tleV92YWxpZF91bnRpbGAgbXVzdCBsaWUgaW4gYChub3csIG5vdyArIE1BWF9LRVlfUkVURU5USU9OX1NFQ1NdYDsKc2V0IGl0IHRvIHRoZSBsYXRlc3QgZXhwaXJ5IGFtb25nIHRoZSBpc3N1ZXIncyBvdXRzdGFuZGluZyBjcmVkZW50aWFscy4KUmV0aXJlZCBrZXlzIGFyZSBwcnVuZWQgb25jZSB0aGVpciB3aW5kb3cgY2xvc2VzLCBzbyBhbiBpc3N1ZXIgY2FuIHJvdGF0ZQpyZXBlYXRlZGx5IG92ZXIgaXRzIGxpZmV0aW1lLgoKSWYgdGhlIG9sZCBrZXkgd2FzIGVtZXJnZW5jeS1yZXZva2VkLCByb3RhdGluZyBpbnN0YWxscyB0aGUgcmVwbGFjZW1lbnQKYW5kIHRoZSByZXZva2VkIGtleSBzdGF5cyBkZWFkIGluIHRoZSBoaXN0b3J5LiBUbyBraWxsIGEga2V5CmltbWVkaWF0ZWx5IGluc3RlYWQsIHVzZSBbYHJldm9rZV9pc3N1ZXJfa2V5YF0uAAAAAAAAEXJvdGF0ZV9pc3N1ZXJfa2V5AAAAAAAAAwAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAAAAAAKbmV3X3B1YmtleQAAAAAD7gAAAEAAAAAAAAAAE29sZF9rZXlfdmFsaWRfdW50aWwAAAAABgAAAAA=",
        "AAAAAAAAAF5SZWFkIHRoZSBvcHRpb25hbCBvbi1jaGFpbiBtZXRhZGF0YSBmb3IgYW4gaXNzdWVyLgpSZXR1cm5zIGBOb25lYCBpZiBubyBtZXRhZGF0YSBoYXMgYmVlbiBzZXQuAAAAAAATZ2V0X2lzc3Vlcl9tZXRhZGF0YQAAAAABAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAABAAAD6AAAB9AAAAAOSXNzdWVyTWV0YWRhdGEAAA==",
        "AAAAAAAAAUpUcnVlIGlmZiBgcHVia2V5YCBtYXkgc2lnbiBzdWJtaXNzaW9ucyBmb3IgYGlzc3Vlcl9pZGAgcmlnaHQgbm93LgoKVHJ1ZSBmb3IgdGhlIGlzc3VlcidzIGN1cnJlbnQga2V5IGFuZCBmb3IgYW55IHJldGlyZWQga2V5IHdob3NlIHZhbGlkaXR5CndpbmRvdyBoYXMgbm90IGNsb3NlZCBhbmQgdGhhdCBoYXMgbm90IGJlZW4gZW1lcmdlbmN5LXJldm9rZWQuIFRoaXMgaXMKdGhlIGNoZWNrIFByb29mUmVnaXN0cnkgcnVucyBhZ2FpbnN0IGEgcHJvb2YncyBwdWJsaWMgaW5wdXRzLCBzbyBhCmNyZWRlbnRpYWwgaXNzdWVkIGJlZm9yZSBhIHJvdGF0aW9uIGtlZXBzIHZlcmlmeWluZy4AAAAAABNpc192YWxpZF9pc3N1ZXJfa2V5AAAAAAIAAAAAAAAACWlzc3Vlcl9pZAAAAAAAABMAAAAAAAAABnB1YmtleQAAAAAD7gAAAEAAAAABAAAAAQ==",
        "AAAAAAAAAD5BZG1pbi1yb2xlIG9ubHkuIFBhc3MgYE5vbmVgIGZvciBmaWVsZHMgeW91IGRvbid0IHdhbnQgdG8gc2V0LgAAAAAAE3NldF9pc3N1ZXJfbWV0YWRhdGEAAAAABAAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAARuYW1lAAAD6AAAABAAAAAAAAAAA3VybAAAAAPoAAAAEAAAAAAAAAAEbG9nbwAAA+gAAAAQAAAAAA==",
        "AAAAAAAAAcdFeHRlbmQgdGhlIHBlcnNpc3RlbnQtZW50cnkgbGlmZXRpbWUgb2YgYW4gaXNzdWVyJ3MgcmVjb3JkIGFuZCBrZXkKaGlzdG9yeS4gQWRtaW4tcm9sZSBvbmx5LiBFbWl0cyBubyBldmVudC4KClBlcnNpc3RlbnQgZW50cmllcyBleHBpcmUgYWZ0ZXIgYEVOVFJZX1RUTGAsIGFuZCBleHBpcnkgaXMgd2hhdCBtYWtlcyBhbgplbnRyeSB1bnJlYWRhYmxlIOKAlCBhIHJldGlyZWQga2V5IHdob3NlIGVudHJ5IGhhcyBsYXBzZWQgc3RvcHMgdmVyaWZ5aW5nCmV2ZW4gdGhvdWdoIGl0cyB2YWxpZGl0eSB3aW5kb3cgaXMgc3RpbGwgb3Blbi4gQ2FsbCB0aGlzIHBlcmlvZGljYWxseQooYSBrZWVwZXIgam9iIGlzIHRoZSB1c3VhbCBhbnN3ZXIpIGZvciBpc3N1ZXJzIHdpdGggbG9uZyB2YWxpZGl0eQp3aW5kb3dzLCBpZGVhbGx5IGJlZm9yZSBgQlVNUF9USFJFU0hPTERgIGxlZGdlcnMgaGF2ZSBlbGFwc2VkLgAAAAAXcmVmcmVzaF9pc3N1ZXJfa2V5c190dGwAAAAAAQAAAAAAAAAJaXNzdWVyX2lkAAAAAAAAEwAAAAA=" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        version: this.txFromJSON<u32>,
        has_role: this.txFromJSON<boolean>,
        get_issuer: this.txFromJSON<Issuer>,
        grant_role: this.txFromJSON<null>,
        get_issuers: this.txFromJSON<Array<string>>,
        revoke_role: this.txFromJSON<null>,
        issuer_count: this.txFromJSON<u32>,
        revoke_issuer: this.txFromJSON<null>,
        get_issuer_keys: this.txFromJSON<Array<IssuerKey>>,
        is_valid_issuer: this.txFromJSON<boolean>,
        register_issuer: this.txFromJSON<null>,
        get_issuers_page: this.txFromJSON<Array<string>>,
        get_issuer_pubkey: this.txFromJSON<Buffer>,
        revoke_issuer_key: this.txFromJSON<null>,
        rotate_issuer_key: this.txFromJSON<null>,
        get_issuer_metadata: this.txFromJSON<Option<IssuerMetadata>>,
        is_valid_issuer_key: this.txFromJSON<boolean>,
        set_issuer_metadata: this.txFromJSON<null>,
        refresh_issuer_keys_ttl: this.txFromJSON<null>
  }
}
