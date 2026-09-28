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
    contractId: "CA3I5YDPU4HVJXP7W4HCVIGEZGBSNO4GLUORDMNM4MXX7T23BMWIXQNF",
  }
} as const




export const Errors = {
  1: {message:"NotInitialized"},
  2: {message:"VerificationFailed"},
  3: {message:"NotAuthorized"},
  4: {message:"IssuerNotTrusted"},
  5: {message:"IssuerKeyMismatch"},
  6: {message:"ProofNotFound"},
  7: {message:"BatchTooLarge"},
  8: {message:"BatchEmpty"},
  9: {message:"DuplicateCredentialType"},
  10: {message:"AggregateLayoutInvalid"},
  11: {message:"SubmissionsPaused"},
  /**
   * `expiry` is not in the future, or is too far in the future.
   */
  12: {message:"InvalidExpiry"},
  /**
   * The caller is not the holder of the role required by this function.
   */
  13: {message:"RoleNotHeld"},
  /**
   * `revoke_role` named an address that is not the current holder of the role.
   */
  14: {message:"RoleHolderMismatch"},
  /**
   * `accept_admin` was called with no pending proposal (#343).
   */
  15: {message:"NoPendingAdmin"}
}

export type DataKey = {tag: "Admin", values: void} | {tag: "PendingAdmin", values: void} | {tag: "Roles", values: void} | {tag: "Verifier", values: void} | {tag: "IssuerRegistry", values: void} | {tag: "Paused", values: void} | {tag: "Proof", values: readonly [string, string]} | {tag: "ProofRecordSchemaVersion", values: void} | {tag: "LastMigrationTimestamp", values: void} | {tag: "Delegation", values: readonly [string, string, string]};


/**
 * Payload emitted when submissions are paused.
 * Topics: ("proof_reg", "paused")
 * 
 * The `admin` field carries the address that performed the pause — under RBAC
 * this is the holder of the `pauser` role, which may differ from the root
 * admin. The field name is kept as `admin` to preserve the event ABI that
 * existing indexers parse.
 */
export interface EventPaused {
  admin: string;
  paused_at: u64;
}


export interface ProofRecord {
  expiry: u64;
  issuer: Option<string>;
  revoked: boolean;
  threshold: Option<u64>;
  verified_at: u64;
  vk_version: u32;
}


/**
 * Payload emitted when submissions are unpaused.
 * Topics: ("proof_reg", "unpaused")
 * 
 * The `admin` field carries the address that performed the unpause — under
 * RBAC this is the holder of the `pauser` role (see [`EventPaused`]).
 */
export interface EventUnpaused {
  admin: string;
  unpaused_at: u64;
}


export interface ProofSubmission {
  credential_type: string;
  expiry: u64;
  issuer_id: string;
  proof: Buffer;
  public_inputs: Array<u32>;
  vk_version: Option<u32>;
}


/**
 * Payload emitted when an issuer revokes a holder's proof.
 */
export interface EventProofRevoked {
  holder: string;
  issuer: string;
  revoked_at: u64;
}


export interface LegacyProofRecord {
  expiry: u64;
  revoked: boolean;
  threshold: Option<u64>;
  verified_at: u64;
}


/**
 * Payload emitted when a proof is successfully verified and stored.
 */
export interface EventProofSubmitted {
  expiry: u64;
  holder: string;
  issuer: string;
  verified_at: u64;
}


/**
 * Payload emitted when the contract is upgraded (new WASM deployed).
 * Topics: ("proof_reg", "upgraded")
 */
export interface EventContractUpgraded {
  admin: string;
  /**
 * Previous contract version (encoded as major * 1000000 + minor * 1000 + patch)
 */
from_version: u32;
  new_wasm_hash: Buffer;
  /**
 * New contract version (encoded as major * 1000000 + minor * 1000 + patch)
 */
to_version: u32;
  upgraded_at: u64;
}


/**
 * Payload emitted when a holder grants a verifier delegated read access
 * (#396). `credential_type` is already in the event topic tuple, matching
 * `EventProofSubmitted`'s convention, so it isn't repeated here.
 */
export interface EventVerificationGranted {
  expiry: u64;
  holder: string;
  verifier: string;
}


/**
 * Payload emitted when a holder revokes a previously-granted delegation.
 */
export interface EventVerificationRevoked {
  holder: string;
  verifier: string;
}

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pause new submissions. Pauser-role only — the `pauser` role may be held
   * by a different key than the root admin, so emergency pause power can be
   * delegated (e.g. to an operations or security key) without handing over
   * full administration.
   */
  pause: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revoke transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke an existing proof before expiry. The caller must be both a
   * currently trusted issuer and the issuer stored on that proof record.
   */
  revoke: ({issuer, holder, credential_type}: {issuer: string, holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  unpause: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Replace the contract wasm. Upgrader-role only — the holder of the
   * `upgrader` role may be a different key than the root admin, so upgrade
   * power can be delegated or rotated independently of other governance.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

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
   * Construct and simulate a bump_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  bump_claim: ({holder, credential_type}: {holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_record transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_record: ({holder, credential_type}: {holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<ProofRecord>>>

  /**
   * Construct and simulate a grant_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Assign `address` as the holder of `role`, replacing any previous holder.
   * Root-admin only. Use this to delegate or rotate a role's key — e.g. hand
   * the `upgrader` role to a release engineer, or the `pauser` role to an
   * operations key — so each privileged capability is scoped and rotatable
   * independently.
   */
  grant_role: ({role, address}: {role: string, address: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revoke_all transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke_all: ({holder}: {holder: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a check_claim transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  check_claim: ({holder, credential_type, min_threshold, trusted_issuers}: {holder: string, credential_type: string, min_threshold: Option<u64>, trusted_issuers: Option<Array<string>>}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a is_verified transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read-only verification check for `holder`'s cached `credential_type` claim.
   * 
   * Returns `(valid, verified_at, expiry)`:
   * - `valid` is `true` only if the record exists, is not revoked, has not
   * passed `expiry`, and (if `trusted_issuers` is provided) was issued by
   * one of the addresses in that list.
   * - `verified_at` / `expiry` are returned even when `valid` is `false`
   * (e.g. an expired or untrusted-issuer record still reports its stored
   * timestamps), so callers can distinguish "never submitted" (both `0`)
   * from "submitted but no longer valid".
   * 
   * `trusted_issuers`:
   * - `None` accepts a claim from any issuer registered at submission time.
   * - `Some(list)` restricts acceptance to issuers in `list`; a record with
   * no stored issuer (e.g. an un-migrated legacy record) is rejected.
   */
  is_verified: ({holder, credential_type, trusted_issuers}: {holder: string, credential_type: string, trusted_issuers: Option<Array<string>>}, options?: MethodOptions) => Promise<AssembledTransaction<readonly [boolean, u64, u64]>>

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
   * Construct and simulate a accept_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Accept the pending root-admin role. Callable only by the address named
   * in the most recent `propose_admin`. On success the accepted address
   * becomes the new `DataKey::Admin` AND inherits every role the outgoing
   * admin held — matching the wholesale governance transfer the old
   * single-step `set_admin` performed. Emits `("proof_reg", "adm_acc")`
   * with the new admin as the payload (#343).
   */
  accept_admin: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a claim_expiry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_expiry: ({holder, credential_type}: {holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a migrate_data transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-only: triggers a data migration (for future schema changes).
   * This is a placeholder that can be extended when ProofRecord structure changes.
   * Currently, this function:
   * 1. Records the current schema version
   * 2. Emits an event for audit trail purposes
   * 3. Can be extended to transform existing ProofRecords if needed
   */
  migrate_data: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revoke_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke a cached proof. The holder authorizes their own revocation.
   */
  revoke_proof: ({holder, credential_type}: {holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify a proof and, if valid, cache it for `holder` until `expiry`.
   */
  submit_proof: ({holder, issuer_id, credential_type, proof, public_inputs, vk_version, expiry}: {holder: string, issuer_id: string, credential_type: string, proof: Buffer, public_inputs: Buffer, vk_version: Option<u32>, expiry: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a pending_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Read the current pending admin proposal, if any (#343).
   */
  pending_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Option<string>>>

  /**
   * Construct and simulate a propose_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Propose a new root admin. Root-admin only. Overwrites any existing
   * pending proposal. Emits `("proof_reg", "adm_prop")` with the proposed
   * address as the payload (#343).
   */
  propose_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_proofs transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Batch submission - one event per credential.
   */
  submit_proofs: ({holder, submissions}: {holder: string, submissions: Array<ProofSubmission>}, options?: MethodOptions) => Promise<AssembledTransaction<Array<boolean>>>

  /**
   * Construct and simulate a migrate_record transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin-role only. Migration from the legacy 4-field `ProofRecord` layout (no
   * `issuer`, no `vk_version`) to the current 6-field layout. Reads the
   * stored map as a generic `Map<Symbol, Val>` to determine the field count
   * without triggering the struct-deserialisation panic that would occur on
   * a shape mismatch.
   * 
   * - Idempotent: records already in the current 6-field shape are a no-op.
   * - Migrated records are written with `issuer: None` so they fail closed
   * under an active `trusted_issuers` filter (there is no issuer to check
   * against) and `vk_version: 0` (the "latest at submission time"
   * sentinel, which is what legacy records were verified against).
   * - Only the holder of the `admin` role may call this function.
   */
  migrate_record: ({holder, credential_type}: {holder: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a verifier_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  verifier_address: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a grant_verification transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Grant `verifier` a scoped, time-boxed right to read `holder`'s
   * `credential_type` result via `check_delegated_verification`, until
   * `expiry` (#396). Purely additive: `is_verified` remains a public read
   * exactly as before for every caller — this is a discoverable,
   * on-chain consent record apps can condition *their own* gated
   * experiences on, not a change to the underlying read's semantics
   * (Soroban storage has no confidentiality to gate in the first place).
   * Granting the same (holder, verifier, credential_type) again simply
   * overwrites the previous expiry.
   */
  grant_verification: ({holder, verifier, credential_type, expiry}: {holder: string, verifier: string, credential_type: string, expiry: u64}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a revoke_verification transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Revoke a previously-granted delegation. The holder authorizes their
   * own revocation, same as `revoke_proof`. A no-op (not an error) if no
   * such delegation exists.
   */
  revoke_verification: ({holder, verifier, credential_type}: {holder: string, verifier: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a cancel_admin_proposal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a pending admin proposal. Root-admin only. Emits
   * `("proof_reg", "adm_canc")` with an empty payload (#343).
   */
  cancel_admin_proposal: (options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a submit_aggregate_proof transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Aggregate proof submission with per-credential expiries.
   */
  submit_aggregate_proof: ({holder, issuer_ids, credential_types, proof, public_inputs, expiries}: {holder: string, issuer_ids: Array<string>, credential_types: Array<string>, proof: Buffer, public_inputs: Buffer, expiries: Array<u64>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a issuer_registry_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  issuer_registry_address: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a last_migration_timestamp transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the timestamp of the last data migration, or 0 if none has occurred.
   * Useful for audit trails and monitoring schema evolution.
   */
  last_migration_timestamp: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a proof_record_schema_version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Returns the current ProofRecord schema version.
   * Used to detect when data migrations are needed.
   */
  proof_record_schema_version: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a check_delegated_verification transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * `verifier`'s delegated view of `holder`'s `credential_type` result
   * (#396): returns `is_verified`'s own `(valid, verified_at, expiry)` —
   * but only if `verifier` currently holds a non-expired
   * `grant_verification` delegation from `holder` for that credential
   * type; otherwise `(false, 0, 0)`, mirroring `is_verified`'s own
   * "never submitted" shape so callers can't distinguish "no delegation"
   * from "no claim" by shape alone (deliberately — see the module-level
   * note on this not being a confidentiality boundary).
   */
  check_delegated_verification: ({holder, verifier, credential_type}: {holder: string, verifier: string, credential_type: string}, options?: MethodOptions) => Promise<AssembledTransaction<readonly [boolean, u64, u64]>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, verifier, issuer_registry}: {admin: string, verifier: string, issuer_registry: string},
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
    return ContractClient.deploy({admin, verifier, issuer_registry}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADwAAAAAAAAAOTm90SW5pdGlhbGl6ZWQAAAAAAAEAAAAAAAAAElZlcmlmaWNhdGlvbkZhaWxlZAAAAAAAAgAAAAAAAAANTm90QXV0aG9yaXplZAAAAAAAAAMAAAAAAAAAEElzc3Vlck5vdFRydXN0ZWQAAAAEAAAAAAAAABFJc3N1ZXJLZXlNaXNtYXRjaAAAAAAAAAUAAAAAAAAADVByb29mTm90Rm91bmQAAAAAAAAGAAAAAAAAAA1CYXRjaFRvb0xhcmdlAAAAAAAABwAAAAAAAAAKQmF0Y2hFbXB0eQAAAAAACAAAAAAAAAAXRHVwbGljYXRlQ3JlZGVudGlhbFR5cGUAAAAACQAAAAAAAAAWQWdncmVnYXRlTGF5b3V0SW52YWxpZAAAAAAACgAAAAAAAAARU3VibWlzc2lvbnNQYXVzZWQAAAAAAAALAAAAO2BleHBpcnlgIGlzIG5vdCBpbiB0aGUgZnV0dXJlLCBvciBpcyB0b28gZmFyIGluIHRoZSBmdXR1cmUuAAAAAA1JbnZhbGlkRXhwaXJ5AAAAAAAADAAAAENUaGUgY2FsbGVyIGlzIG5vdCB0aGUgaG9sZGVyIG9mIHRoZSByb2xlIHJlcXVpcmVkIGJ5IHRoaXMgZnVuY3Rpb24uAAAAAAtSb2xlTm90SGVsZAAAAAANAAAASmByZXZva2Vfcm9sZWAgbmFtZWQgYW4gYWRkcmVzcyB0aGF0IGlzIG5vdCB0aGUgY3VycmVudCBob2xkZXIgb2YgdGhlIHJvbGUuAAAAAAASUm9sZUhvbGRlck1pc21hdGNoAAAAAAAOAAAAOmBhY2NlcHRfYWRtaW5gIHdhcyBjYWxsZWQgd2l0aCBubyBwZW5kaW5nIHByb3Bvc2FsICgjMzQzKS4AAAAAAA5Ob1BlbmRpbmdBZG1pbgAAAAAADw==",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAACgAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAFpQZW5kaW5nIHJvb3QtYWRtaW4gY2FuZGlkYXRlIHNldCBieSBgcHJvcG9zZV9hZG1pbmAgYW5kIGNvbnN1bWVkIGJ5CmBhY2NlcHRfYWRtaW5gICgjMzQzKS4AAAAAAAxQZW5kaW5nQWRtaW4AAAAAAAAANlJCQUM6IHJvbGUgbmFtZSAoU3ltYm9sKSDihpIgY3VycmVudCBob2xkZXIgKEFkZHJlc3MpLgAAAAAABVJvbGVzAAAAAAAAAAAAAAAAAAAIVmVyaWZpZXIAAAAAAAAAAAAAAA5Jc3N1ZXJSZWdpc3RyeQAAAAAAAAAAAAAAAAAGUGF1c2VkAAAAAAABAAAAAAAAAAVQcm9vZgAAAAAAAAIAAAATAAAAEQAAAAAAAAB4VHJhY2tzIHRoZSBzY2hlbWEgdmVyc2lvbiBvZiBzdG9yZWQgUHJvb2ZSZWNvcmRzLgpVc2VkIGZvciBmb3J3YXJkLWNvbXBhdGlibGUgbWlncmF0aW9ucyB3aGVuIFByb29mUmVjb3JkIHNoYXBlIGNoYW5nZXMuAAAAGFByb29mUmVjb3JkU2NoZW1hVmVyc2lvbgAAAAAAAAA3VGltZXN0YW1wIG9mIHRoZSBsYXN0IGRhdGEgbWlncmF0aW9uIChmb3IgYXVkaXQgdHJhaWwpLgAAAAAWTGFzdE1pZ3JhdGlvblRpbWVzdGFtcAAAAAAAAQAAAL8oaG9sZGVyLCB2ZXJpZmllciwgY3JlZGVudGlhbF90eXBlKSAtPiBleHBpcnkgKHVuaXggc2Vjb25kcykuIEEKc2NvcGVkLCB0aW1lLWJveGVkIGdyYW50IGxldHRpbmcgYHZlcmlmaWVyYCByZWFkIGBob2xkZXJgJ3MKYGNyZWRlbnRpYWxfdHlwZWAgcmVzdWx0IHZpYSBgY2hlY2tfZGVsZWdhdGVkX3ZlcmlmaWNhdGlvbmAgKCMzOTYpLgAAAAAKRGVsZWdhdGlvbgAAAAAAAwAAABMAAAATAAAAEQ==",
        "AAAAAQAAAURQYXlsb2FkIGVtaXR0ZWQgd2hlbiBzdWJtaXNzaW9ucyBhcmUgcGF1c2VkLgpUb3BpY3M6ICgicHJvb2ZfcmVnIiwgInBhdXNlZCIpCgpUaGUgYGFkbWluYCBmaWVsZCBjYXJyaWVzIHRoZSBhZGRyZXNzIHRoYXQgcGVyZm9ybWVkIHRoZSBwYXVzZSDigJQgdW5kZXIgUkJBQwp0aGlzIGlzIHRoZSBob2xkZXIgb2YgdGhlIGBwYXVzZXJgIHJvbGUsIHdoaWNoIG1heSBkaWZmZXIgZnJvbSB0aGUgcm9vdAphZG1pbi4gVGhlIGZpZWxkIG5hbWUgaXMga2VwdCBhcyBgYWRtaW5gIHRvIHByZXNlcnZlIHRoZSBldmVudCBBQkkgdGhhdApleGlzdGluZyBpbmRleGVycyBwYXJzZS4AAAAAAAAAC0V2ZW50UGF1c2VkAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAJcGF1c2VkX2F0AAAAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAC1Byb29mUmVjb3JkAAAAAAYAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAGaXNzdWVyAAAAAAPoAAAAEwAAAAAAAAAHcmV2b2tlZAAAAAABAAAAAAAAAAl0aHJlc2hvbGQAAAAAAAPoAAAABgAAAAAAAAALdmVyaWZpZWRfYXQAAAAABgAAAAAAAAAKdmtfdmVyc2lvbgAAAAAABA==",
        "AAAAAQAAAOBQYXlsb2FkIGVtaXR0ZWQgd2hlbiBzdWJtaXNzaW9ucyBhcmUgdW5wYXVzZWQuClRvcGljczogKCJwcm9vZl9yZWciLCAidW5wYXVzZWQiKQoKVGhlIGBhZG1pbmAgZmllbGQgY2FycmllcyB0aGUgYWRkcmVzcyB0aGF0IHBlcmZvcm1lZCB0aGUgdW5wYXVzZSDigJQgdW5kZXIKUkJBQyB0aGlzIGlzIHRoZSBob2xkZXIgb2YgdGhlIGBwYXVzZXJgIHJvbGUgKHNlZSBbYEV2ZW50UGF1c2VkYF0pLgAAAAAAAAANRXZlbnRVbnBhdXNlZAAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAALdW5wYXVzZWRfYXQAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAD1Byb29mU3VibWlzc2lvbgAAAAAGAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAAlpc3N1ZXJfaWQAAAAAAAATAAAAAAAAAAVwcm9vZgAAAAAAAA4AAAAAAAAADXB1YmxpY19pbnB1dHMAAAAAAAPqAAAABAAAAAAAAAAKdmtfdmVyc2lvbgAAAAAD6AAAAAQ=",
        "AAAAAQAAADhQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhbiBpc3N1ZXIgcmV2b2tlcyBhIGhvbGRlcidzIHByb29mLgAAAAAAAAARRXZlbnRQcm9vZlJldm9rZWQAAAAAAAADAAAAAAAAAAZob2xkZXIAAAAAABMAAAAAAAAABmlzc3VlcgAAAAAAEwAAAAAAAAAKcmV2b2tlZF9hdAAAAAAABg==",
        "AAAAAQAAAAAAAAAAAAAAEUxlZ2FjeVByb29mUmVjb3JkAAAAAAAABAAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAAAAAAdyZXZva2VkAAAAAAEAAAAAAAAACXRocmVzaG9sZAAAAAAAA+gAAAAGAAAAAAAAAAt2ZXJpZmllZF9hdAAAAAAG",
        "AAAAAQAAAEFQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhIHByb29mIGlzIHN1Y2Nlc3NmdWxseSB2ZXJpZmllZCBhbmQgc3RvcmVkLgAAAAAAAAAAAAATRXZlbnRQcm9vZlN1Ym1pdHRlZAAAAAAEAAAAAAAAAAZleHBpcnkAAAAAAAYAAAAAAAAABmhvbGRlcgAAAAAAEwAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAAt2ZXJpZmllZF9hdAAAAAAG",
        "AAAAAQAAAGRQYXlsb2FkIGVtaXR0ZWQgd2hlbiB0aGUgY29udHJhY3QgaXMgdXBncmFkZWQgKG5ldyBXQVNNIGRlcGxveWVkKS4KVG9waWNzOiAoInByb29mX3JlZyIsICJ1cGdyYWRlZCIpAAAAAAAAABVFdmVudENvbnRyYWN0VXBncmFkZWQAAAAAAAAFAAAAAAAAAAVhZG1pbgAAAAAAABMAAABNUHJldmlvdXMgY29udHJhY3QgdmVyc2lvbiAoZW5jb2RlZCBhcyBtYWpvciAqIDEwMDAwMDAgKyBtaW5vciAqIDEwMDAgKyBwYXRjaCkAAAAAAAAMZnJvbV92ZXJzaW9uAAAABAAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAASE5ldyBjb250cmFjdCB2ZXJzaW9uIChlbmNvZGVkIGFzIG1ham9yICogMTAwMDAwMCArIG1pbm9yICogMTAwMCArIHBhdGNoKQAAAAp0b192ZXJzaW9uAAAAAAAEAAAAAAAAAAt1cGdyYWRlZF9hdAAAAAAG",
        "AAAAAQAAAMxQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhIGhvbGRlciBncmFudHMgYSB2ZXJpZmllciBkZWxlZ2F0ZWQgcmVhZCBhY2Nlc3MKKCMzOTYpLiBgY3JlZGVudGlhbF90eXBlYCBpcyBhbHJlYWR5IGluIHRoZSBldmVudCB0b3BpYyB0dXBsZSwgbWF0Y2hpbmcKYEV2ZW50UHJvb2ZTdWJtaXR0ZWRgJ3MgY29udmVudGlvbiwgc28gaXQgaXNuJ3QgcmVwZWF0ZWQgaGVyZS4AAAAAAAAAGEV2ZW50VmVyaWZpY2F0aW9uR3JhbnRlZAAAAAMAAAAAAAAABmV4cGlyeQAAAAAABgAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAAh2ZXJpZmllcgAAABM=",
        "AAAAAQAAAEZQYXlsb2FkIGVtaXR0ZWQgd2hlbiBhIGhvbGRlciByZXZva2VzIGEgcHJldmlvdXNseS1ncmFudGVkIGRlbGVnYXRpb24uAAAAAAAAAAAAGEV2ZW50VmVyaWZpY2F0aW9uUmV2b2tlZAAAAAIAAAAAAAAABmhvbGRlcgAAAAAAEwAAAAAAAAAIdmVyaWZpZXIAAAAT",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAO1QYXVzZSBuZXcgc3VibWlzc2lvbnMuIFBhdXNlci1yb2xlIG9ubHkg4oCUIHRoZSBgcGF1c2VyYCByb2xlIG1heSBiZSBoZWxkCmJ5IGEgZGlmZmVyZW50IGtleSB0aGFuIHRoZSByb290IGFkbWluLCBzbyBlbWVyZ2VuY3kgcGF1c2UgcG93ZXIgY2FuIGJlCmRlbGVnYXRlZCAoZS5nLiB0byBhbiBvcGVyYXRpb25zIG9yIHNlY3VyaXR5IGtleSkgd2l0aG91dCBoYW5kaW5nIG92ZXIKZnVsbCBhZG1pbmlzdHJhdGlvbi4AAAAAAAAFcGF1c2UAAAAAAAAAAAAAAA==",
        "AAAAAAAAAIZSZXZva2UgYW4gZXhpc3RpbmcgcHJvb2YgYmVmb3JlIGV4cGlyeS4gVGhlIGNhbGxlciBtdXN0IGJlIGJvdGggYQpjdXJyZW50bHkgdHJ1c3RlZCBpc3N1ZXIgYW5kIHRoZSBpc3N1ZXIgc3RvcmVkIG9uIHRoYXQgcHJvb2YgcmVjb3JkLgAAAAAABnJldm9rZQAAAAAAAwAAAAAAAAAGaXNzdWVyAAAAAAATAAAAAAAAAAZob2xkZXIAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAA==",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAAAAAAAAA==",
        "AAAAAAAAAM9SZXBsYWNlIHRoZSBjb250cmFjdCB3YXNtLiBVcGdyYWRlci1yb2xlIG9ubHkg4oCUIHRoZSBob2xkZXIgb2YgdGhlCmB1cGdyYWRlcmAgcm9sZSBtYXkgYmUgYSBkaWZmZXJlbnQga2V5IHRoYW4gdGhlIHJvb3QgYWRtaW4sIHNvIHVwZ3JhZGUKcG93ZXIgY2FuIGJlIGRlbGVnYXRlZCBvciByb3RhdGVkIGluZGVwZW5kZW50bHkgb2Ygb3RoZXIgZ292ZXJuYW5jZS4AAAAAB3VwZ3JhZGUAAAAAAQAAAAAAAAANbmV3X3dhc21faGFzaAAAAAAAA+4AAAAgAAAAAA==",
        "AAAAAAAAAH5SZXR1cm5zIHRoZSBjb250cmFjdCB2ZXJzaW9uIGFzIGFuIGVuY29kZWQgdTMyLgpFbmNvZGluZzogKG1ham9yICogMTAwMDAwMCkgKyAobWlub3IgKiAxMDAwKSArIHBhdGNoCkV4YW1wbGU6IDEuMi4zIC0+IDEwMDIwMDMAAAAAAAd2ZXJzaW9uAAAAAAAAAAABAAAABA==",
        "AAAAAAAAACpUcnVlIGlmZiBgYWRkcmVzc2AgY3VycmVudGx5IGhvbGRzIGByb2xlYC4AAAAAAAhoYXNfcm9sZQAAAAIAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhZGRyZXNzAAAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAKYnVtcF9jbGFpbQAAAAAAAgAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAA=",
        "AAAAAAAAAAAAAAAKZ2V0X3JlY29yZAAAAAAAAgAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAEAAAPoAAAH0AAAAAtQcm9vZlJlY29yZAA=",
        "AAAAAAAAATFBc3NpZ24gYGFkZHJlc3NgIGFzIHRoZSBob2xkZXIgb2YgYHJvbGVgLCByZXBsYWNpbmcgYW55IHByZXZpb3VzIGhvbGRlci4KUm9vdC1hZG1pbiBvbmx5LiBVc2UgdGhpcyB0byBkZWxlZ2F0ZSBvciByb3RhdGUgYSByb2xlJ3Mga2V5IOKAlCBlLmcuIGhhbmQKdGhlIGB1cGdyYWRlcmAgcm9sZSB0byBhIHJlbGVhc2UgZW5naW5lZXIsIG9yIHRoZSBgcGF1c2VyYCByb2xlIHRvIGFuCm9wZXJhdGlvbnMga2V5IOKAlCBzbyBlYWNoIHByaXZpbGVnZWQgY2FwYWJpbGl0eSBpcyBzY29wZWQgYW5kIHJvdGF0YWJsZQppbmRlcGVuZGVudGx5LgAAAAAAAApncmFudF9yb2xlAAAAAAACAAAAAAAAAARyb2xlAAAAEQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAAKcmV2b2tlX2FsbAAAAAAAAQAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALY2hlY2tfY2xhaW0AAAAABAAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAAAAAANbWluX3RocmVzaG9sZAAAAAAAA+gAAAAGAAAAAAAAAA90cnVzdGVkX2lzc3VlcnMAAAAD6AAAA+oAAAATAAAAAQAAAAE=",
        "AAAAAAAAAv9SZWFkLW9ubHkgdmVyaWZpY2F0aW9uIGNoZWNrIGZvciBgaG9sZGVyYCdzIGNhY2hlZCBgY3JlZGVudGlhbF90eXBlYCBjbGFpbS4KClJldHVybnMgYCh2YWxpZCwgdmVyaWZpZWRfYXQsIGV4cGlyeSlgOgotIGB2YWxpZGAgaXMgYHRydWVgIG9ubHkgaWYgdGhlIHJlY29yZCBleGlzdHMsIGlzIG5vdCByZXZva2VkLCBoYXMgbm90CnBhc3NlZCBgZXhwaXJ5YCwgYW5kIChpZiBgdHJ1c3RlZF9pc3N1ZXJzYCBpcyBwcm92aWRlZCkgd2FzIGlzc3VlZCBieQpvbmUgb2YgdGhlIGFkZHJlc3NlcyBpbiB0aGF0IGxpc3QuCi0gYHZlcmlmaWVkX2F0YCAvIGBleHBpcnlgIGFyZSByZXR1cm5lZCBldmVuIHdoZW4gYHZhbGlkYCBpcyBgZmFsc2VgCihlLmcuIGFuIGV4cGlyZWQgb3IgdW50cnVzdGVkLWlzc3VlciByZWNvcmQgc3RpbGwgcmVwb3J0cyBpdHMgc3RvcmVkCnRpbWVzdGFtcHMpLCBzbyBjYWxsZXJzIGNhbiBkaXN0aW5ndWlzaCAibmV2ZXIgc3VibWl0dGVkIiAoYm90aCBgMGApCmZyb20gInN1Ym1pdHRlZCBidXQgbm8gbG9uZ2VyIHZhbGlkIi4KCmB0cnVzdGVkX2lzc3VlcnNgOgotIGBOb25lYCBhY2NlcHRzIGEgY2xhaW0gZnJvbSBhbnkgaXNzdWVyIHJlZ2lzdGVyZWQgYXQgc3VibWlzc2lvbiB0aW1lLgotIGBTb21lKGxpc3QpYCByZXN0cmljdHMgYWNjZXB0YW5jZSB0byBpc3N1ZXJzIGluIGBsaXN0YDsgYSByZWNvcmQgd2l0aApubyBzdG9yZWQgaXNzdWVyIChlLmcuIGFuIHVuLW1pZ3JhdGVkIGxlZ2FjeSByZWNvcmQpIGlzIHJlamVjdGVkLgAAAAALaXNfdmVyaWZpZWQAAAAAAwAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAAAAAAPdHJ1c3RlZF9pc3N1ZXJzAAAAA+gAAAPqAAAAEwAAAAEAAAPtAAAAAwAAAAEAAAAGAAAABg==",
        "AAAAAAAAAS9SZW1vdmUgYGFkZHJlc3NgIGFzIHRoZSBob2xkZXIgb2YgYHJvbGVgLiBSb290LWFkbWluIG9ubHkuCgpUaGUgbmFtZWQgYWRkcmVzcyBtdXN0IGJlIHRoZSBjdXJyZW50IGhvbGRlciAocmV2b2tpbmcgYSBkaWZmZXJlbnQKYWRkcmVzcyBpcyBhIG5vLW9wIHJpc2ssIHNvIGl0IGlzIHJlamVjdGVkIHdpdGggYFJvbGVIb2xkZXJNaXNtYXRjaGAKaW5zdGVhZCkuIEEgcm9sZSB3aXRoIG5vIGhvbGRlciBpcyBzaW1wbHkgdW5hc3NpZ25lZCDigJQgbm8gb25lIGNhbiBhY3QKdW5kZXIgaXQgdW50aWwgaXQgaXMgZ3JhbnRlZCBhZ2Fpbi4AAAAAC3Jldm9rZV9yb2xlAAAAAAIAAAAAAAAABHJvbGUAAAARAAAAAAAAAAdhZGRyZXNzAAAAABMAAAAA",
        "AAAAAAAAAYBBY2NlcHQgdGhlIHBlbmRpbmcgcm9vdC1hZG1pbiByb2xlLiBDYWxsYWJsZSBvbmx5IGJ5IHRoZSBhZGRyZXNzIG5hbWVkCmluIHRoZSBtb3N0IHJlY2VudCBgcHJvcG9zZV9hZG1pbmAuIE9uIHN1Y2Nlc3MgdGhlIGFjY2VwdGVkIGFkZHJlc3MKYmVjb21lcyB0aGUgbmV3IGBEYXRhS2V5OjpBZG1pbmAgQU5EIGluaGVyaXRzIGV2ZXJ5IHJvbGUgdGhlIG91dGdvaW5nCmFkbWluIGhlbGQg4oCUIG1hdGNoaW5nIHRoZSB3aG9sZXNhbGUgZ292ZXJuYW5jZSB0cmFuc2ZlciB0aGUgb2xkCnNpbmdsZS1zdGVwIGBzZXRfYWRtaW5gIHBlcmZvcm1lZC4gRW1pdHMgYCgicHJvb2ZfcmVnIiwgImFkbV9hY2MiKWAKd2l0aCB0aGUgbmV3IGFkbWluIGFzIHRoZSBwYXlsb2FkICgjMzQzKS4AAAAMYWNjZXB0X2FkbWluAAAAAAAAAAA=",
        "AAAAAAAAAAAAAAAMY2xhaW1fZXhwaXJ5AAAAAgAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAA9jcmVkZW50aWFsX3R5cGUAAAAAEQAAAAEAAAAG",
        "AAAAAAAAATxBZG1pbi1vbmx5OiB0cmlnZ2VycyBhIGRhdGEgbWlncmF0aW9uIChmb3IgZnV0dXJlIHNjaGVtYSBjaGFuZ2VzKS4KVGhpcyBpcyBhIHBsYWNlaG9sZGVyIHRoYXQgY2FuIGJlIGV4dGVuZGVkIHdoZW4gUHJvb2ZSZWNvcmQgc3RydWN0dXJlIGNoYW5nZXMuCkN1cnJlbnRseSwgdGhpcyBmdW5jdGlvbjoKMS4gUmVjb3JkcyB0aGUgY3VycmVudCBzY2hlbWEgdmVyc2lvbgoyLiBFbWl0cyBhbiBldmVudCBmb3IgYXVkaXQgdHJhaWwgcHVycG9zZXMKMy4gQ2FuIGJlIGV4dGVuZGVkIHRvIHRyYW5zZm9ybSBleGlzdGluZyBQcm9vZlJlY29yZHMgaWYgbmVlZGVkAAAADG1pZ3JhdGVfZGF0YQAAAAAAAAAA",
        "AAAAAAAAAEJSZXZva2UgYSBjYWNoZWQgcHJvb2YuIFRoZSBob2xkZXIgYXV0aG9yaXplcyB0aGVpciBvd24gcmV2b2NhdGlvbi4AAAAAAAxyZXZva2VfcHJvb2YAAAACAAAAAAAAAAZob2xkZXIAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAA==",
        "AAAAAAAAAENWZXJpZnkgYSBwcm9vZiBhbmQsIGlmIHZhbGlkLCBjYWNoZSBpdCBmb3IgYGhvbGRlcmAgdW50aWwgYGV4cGlyeWAuAAAAAAxzdWJtaXRfcHJvb2YAAAAHAAAAAAAAAAZob2xkZXIAAAAAABMAAAAAAAAACWlzc3Vlcl9pZAAAAAAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAAAAAAVwcm9vZgAAAAAAAA4AAAAAAAAADXB1YmxpY19pbnB1dHMAAAAAAAAOAAAAAAAAAAp2a192ZXJzaW9uAAAAAAPoAAAABAAAAAAAAAAGZXhwaXJ5AAAAAAAGAAAAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIdmVyaWZpZXIAAAATAAAAAAAAAA9pc3N1ZXJfcmVnaXN0cnkAAAAAEwAAAAA=",
        "AAAAAAAAADdSZWFkIHRoZSBjdXJyZW50IHBlbmRpbmcgYWRtaW4gcHJvcG9zYWwsIGlmIGFueSAoIzM0MykuAAAAAA1wZW5kaW5nX2FkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
        "AAAAAAAAAKdQcm9wb3NlIGEgbmV3IHJvb3QgYWRtaW4uIFJvb3QtYWRtaW4gb25seS4gT3ZlcndyaXRlcyBhbnkgZXhpc3RpbmcKcGVuZGluZyBwcm9wb3NhbC4gRW1pdHMgYCgicHJvb2ZfcmVnIiwgImFkbV9wcm9wIilgIHdpdGggdGhlIHByb3Bvc2VkCmFkZHJlc3MgYXMgdGhlIHBheWxvYWQgKCMzNDMpLgAAAAANcHJvcG9zZV9hZG1pbgAAAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAACxCYXRjaCBzdWJtaXNzaW9uIC0gb25lIGV2ZW50IHBlciBjcmVkZW50aWFsLgAAAA1zdWJtaXRfcHJvb2ZzAAAAAAAAAgAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAAtzdWJtaXNzaW9ucwAAAAPqAAAH0AAAAA9Qcm9vZlN1Ym1pc3Npb24AAAAAAQAAA+oAAAAB",
        "AAAAAAAAAsJBZG1pbi1yb2xlIG9ubHkuIE1pZ3JhdGlvbiBmcm9tIHRoZSBsZWdhY3kgNC1maWVsZCBgUHJvb2ZSZWNvcmRgIGxheW91dCAobm8KYGlzc3VlcmAsIG5vIGB2a192ZXJzaW9uYCkgdG8gdGhlIGN1cnJlbnQgNi1maWVsZCBsYXlvdXQuIFJlYWRzIHRoZQpzdG9yZWQgbWFwIGFzIGEgZ2VuZXJpYyBgTWFwPFN5bWJvbCwgVmFsPmAgdG8gZGV0ZXJtaW5lIHRoZSBmaWVsZCBjb3VudAp3aXRob3V0IHRyaWdnZXJpbmcgdGhlIHN0cnVjdC1kZXNlcmlhbGlzYXRpb24gcGFuaWMgdGhhdCB3b3VsZCBvY2N1ciBvbgphIHNoYXBlIG1pc21hdGNoLgoKLSBJZGVtcG90ZW50OiByZWNvcmRzIGFscmVhZHkgaW4gdGhlIGN1cnJlbnQgNi1maWVsZCBzaGFwZSBhcmUgYSBuby1vcC4KLSBNaWdyYXRlZCByZWNvcmRzIGFyZSB3cml0dGVuIHdpdGggYGlzc3VlcjogTm9uZWAgc28gdGhleSBmYWlsIGNsb3NlZAp1bmRlciBhbiBhY3RpdmUgYHRydXN0ZWRfaXNzdWVyc2AgZmlsdGVyICh0aGVyZSBpcyBubyBpc3N1ZXIgdG8gY2hlY2sKYWdhaW5zdCkgYW5kIGB2a192ZXJzaW9uOiAwYCAodGhlICJsYXRlc3QgYXQgc3VibWlzc2lvbiB0aW1lIgpzZW50aW5lbCwgd2hpY2ggaXMgd2hhdCBsZWdhY3kgcmVjb3JkcyB3ZXJlIHZlcmlmaWVkIGFnYWluc3QpLgotIE9ubHkgdGhlIGhvbGRlciBvZiB0aGUgYGFkbWluYCByb2xlIG1heSBjYWxsIHRoaXMgZnVuY3Rpb24uAAAAAAAObWlncmF0ZV9yZWNvcmQAAAAAAAIAAAAAAAAABmhvbGRlcgAAAAAAEwAAAAAAAAAPY3JlZGVudGlhbF90eXBlAAAAABEAAAAA",
        "AAAAAAAAAAAAAAAQdmVyaWZpZXJfYWRkcmVzcwAAAAAAAAABAAAAEw==",
        "AAAAAAAAAitHcmFudCBgdmVyaWZpZXJgIGEgc2NvcGVkLCB0aW1lLWJveGVkIHJpZ2h0IHRvIHJlYWQgYGhvbGRlcmAncwpgY3JlZGVudGlhbF90eXBlYCByZXN1bHQgdmlhIGBjaGVja19kZWxlZ2F0ZWRfdmVyaWZpY2F0aW9uYCwgdW50aWwKYGV4cGlyeWAgKCMzOTYpLiBQdXJlbHkgYWRkaXRpdmU6IGBpc192ZXJpZmllZGAgcmVtYWlucyBhIHB1YmxpYyByZWFkCmV4YWN0bHkgYXMgYmVmb3JlIGZvciBldmVyeSBjYWxsZXIg4oCUIHRoaXMgaXMgYSBkaXNjb3ZlcmFibGUsCm9uLWNoYWluIGNvbnNlbnQgcmVjb3JkIGFwcHMgY2FuIGNvbmRpdGlvbiAqdGhlaXIgb3duKiBnYXRlZApleHBlcmllbmNlcyBvbiwgbm90IGEgY2hhbmdlIHRvIHRoZSB1bmRlcmx5aW5nIHJlYWQncyBzZW1hbnRpY3MKKFNvcm9iYW4gc3RvcmFnZSBoYXMgbm8gY29uZmlkZW50aWFsaXR5IHRvIGdhdGUgaW4gdGhlIGZpcnN0IHBsYWNlKS4KR3JhbnRpbmcgdGhlIHNhbWUgKGhvbGRlciwgdmVyaWZpZXIsIGNyZWRlbnRpYWxfdHlwZSkgYWdhaW4gc2ltcGx5Cm92ZXJ3cml0ZXMgdGhlIHByZXZpb3VzIGV4cGlyeS4AAAAAEmdyYW50X3ZlcmlmaWNhdGlvbgAAAAAABAAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAAh2ZXJpZmllcgAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAAAAAAZleHBpcnkAAAAAAAYAAAAA",
        "AAAAAAAAAKBSZXZva2UgYSBwcmV2aW91c2x5LWdyYW50ZWQgZGVsZWdhdGlvbi4gVGhlIGhvbGRlciBhdXRob3JpemVzIHRoZWlyCm93biByZXZvY2F0aW9uLCBzYW1lIGFzIGByZXZva2VfcHJvb2ZgLiBBIG5vLW9wIChub3QgYW4gZXJyb3IpIGlmIG5vCnN1Y2ggZGVsZWdhdGlvbiBleGlzdHMuAAAAE3Jldm9rZV92ZXJpZmljYXRpb24AAAAAAwAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAAh2ZXJpZmllcgAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAA==",
        "AAAAAAAAAHFDYW5jZWwgYSBwZW5kaW5nIGFkbWluIHByb3Bvc2FsLiBSb290LWFkbWluIG9ubHkuIEVtaXRzCmAoInByb29mX3JlZyIsICJhZG1fY2FuYyIpYCB3aXRoIGFuIGVtcHR5IHBheWxvYWQgKCMzNDMpLgAAAAAAABVjYW5jZWxfYWRtaW5fcHJvcG9zYWwAAAAAAAAAAAAAAA==",
        "AAAAAAAAADhBZ2dyZWdhdGUgcHJvb2Ygc3VibWlzc2lvbiB3aXRoIHBlci1jcmVkZW50aWFsIGV4cGlyaWVzLgAAABZzdWJtaXRfYWdncmVnYXRlX3Byb29mAAAAAAAGAAAAAAAAAAZob2xkZXIAAAAAABMAAAAAAAAACmlzc3Vlcl9pZHMAAAAAA+oAAAATAAAAAAAAABBjcmVkZW50aWFsX3R5cGVzAAAD6gAAABEAAAAAAAAABXByb29mAAAAAAAADgAAAAAAAAANcHVibGljX2lucHV0cwAAAAAAAA4AAAAAAAAACGV4cGlyaWVzAAAD6gAAAAYAAAAA",
        "AAAAAAAAAAAAAAAXaXNzdWVyX3JlZ2lzdHJ5X2FkZHJlc3MAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAIVSZXR1cm5zIHRoZSB0aW1lc3RhbXAgb2YgdGhlIGxhc3QgZGF0YSBtaWdyYXRpb24sIG9yIDAgaWYgbm9uZSBoYXMgb2NjdXJyZWQuClVzZWZ1bCBmb3IgYXVkaXQgdHJhaWxzIGFuZCBtb25pdG9yaW5nIHNjaGVtYSBldm9sdXRpb24uAAAAAAAAGGxhc3RfbWlncmF0aW9uX3RpbWVzdGFtcAAAAAAAAAABAAAABg==",
        "AAAAAAAAAF9SZXR1cm5zIHRoZSBjdXJyZW50IFByb29mUmVjb3JkIHNjaGVtYSB2ZXJzaW9uLgpVc2VkIHRvIGRldGVjdCB3aGVuIGRhdGEgbWlncmF0aW9ucyBhcmUgbmVlZGVkLgAAAAAbcHJvb2ZfcmVjb3JkX3NjaGVtYV92ZXJzaW9uAAAAAAAAAAABAAAABA==",
        "AAAAAAAAAf5gdmVyaWZpZXJgJ3MgZGVsZWdhdGVkIHZpZXcgb2YgYGhvbGRlcmAncyBgY3JlZGVudGlhbF90eXBlYCByZXN1bHQKKCMzOTYpOiByZXR1cm5zIGBpc192ZXJpZmllZGAncyBvd24gYCh2YWxpZCwgdmVyaWZpZWRfYXQsIGV4cGlyeSlgIOKAlApidXQgb25seSBpZiBgdmVyaWZpZXJgIGN1cnJlbnRseSBob2xkcyBhIG5vbi1leHBpcmVkCmBncmFudF92ZXJpZmljYXRpb25gIGRlbGVnYXRpb24gZnJvbSBgaG9sZGVyYCBmb3IgdGhhdCBjcmVkZW50aWFsCnR5cGU7IG90aGVyd2lzZSBgKGZhbHNlLCAwLCAwKWAsIG1pcnJvcmluZyBgaXNfdmVyaWZpZWRgJ3Mgb3duCiJuZXZlciBzdWJtaXR0ZWQiIHNoYXBlIHNvIGNhbGxlcnMgY2FuJ3QgZGlzdGluZ3Vpc2ggIm5vIGRlbGVnYXRpb24iCmZyb20gIm5vIGNsYWltIiBieSBzaGFwZSBhbG9uZSAoZGVsaWJlcmF0ZWx5IOKAlCBzZWUgdGhlIG1vZHVsZS1sZXZlbApub3RlIG9uIHRoaXMgbm90IGJlaW5nIGEgY29uZmlkZW50aWFsaXR5IGJvdW5kYXJ5KS4AAAAAABxjaGVja19kZWxlZ2F0ZWRfdmVyaWZpY2F0aW9uAAAAAwAAAAAAAAAGaG9sZGVyAAAAAAATAAAAAAAAAAh2ZXJpZmllcgAAABMAAAAAAAAAD2NyZWRlbnRpYWxfdHlwZQAAAAARAAAAAQAAA+0AAAADAAAAAQAAAAYAAAAG" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        pause: this.txFromJSON<null>,
        revoke: this.txFromJSON<null>,
        unpause: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        version: this.txFromJSON<u32>,
        has_role: this.txFromJSON<boolean>,
        bump_claim: this.txFromJSON<null>,
        get_record: this.txFromJSON<Option<ProofRecord>>,
        grant_role: this.txFromJSON<null>,
        revoke_all: this.txFromJSON<null>,
        check_claim: this.txFromJSON<boolean>,
        is_verified: this.txFromJSON<readonly [boolean, u64, u64]>,
        revoke_role: this.txFromJSON<null>,
        accept_admin: this.txFromJSON<null>,
        claim_expiry: this.txFromJSON<u64>,
        migrate_data: this.txFromJSON<null>,
        revoke_proof: this.txFromJSON<null>,
        submit_proof: this.txFromJSON<null>,
        pending_admin: this.txFromJSON<Option<string>>,
        propose_admin: this.txFromJSON<null>,
        submit_proofs: this.txFromJSON<Array<boolean>>,
        migrate_record: this.txFromJSON<null>,
        verifier_address: this.txFromJSON<string>,
        grant_verification: this.txFromJSON<null>,
        revoke_verification: this.txFromJSON<null>,
        cancel_admin_proposal: this.txFromJSON<null>,
        submit_aggregate_proof: this.txFromJSON<null>,
        issuer_registry_address: this.txFromJSON<string>,
        last_migration_timestamp: this.txFromJSON<u64>,
        proof_record_schema_version: this.txFromJSON<u32>,
        check_delegated_verification: this.txFromJSON<readonly [boolean, u64, u64]>
  }
}
