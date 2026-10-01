// ==============================
// RiskLens — In-browser identity proof
// Builds a zero-knowledge proof from the user's details without sending them
// anywhere. Only the proof and its public values (today's date and a salted
// commitment) go to the server. Circuit: zk/risklens_kyc_circuit.
// ==============================

import type { KYCProofRequest } from "./types";

const CIRCUIT_URL = "/circuits/risklens_kyc_circuit.json";
// Must match ZK_TARGET in backend/zk_kyc_service.py
const VERIFIER_TARGET = "noir-recursive" as const;

export interface IdentityDetails {
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  countryCode: number;
  documentId: string;
}

export interface IdentityProof {
  request: KYCProofRequest;
  commitment: string;
}

export class IdentityProofError extends Error {}

// Map circuit assertion messages to something a person can act on
const CIRCUIT_ERRORS: Record<string, string> = {
  "under 18": "You must be 18 or older.",
  "restricted country": "This country code is on the demo restricted list.",
  "date of birth is in the future": "The date of birth is in the future.",
};

/** SHA-256 of normalised text, truncated to 31 bytes so it fits in a field. */
async function textToField(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const bytes = new Uint8Array(digest).slice(0, 31);
  return BigInt("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")).toString();
}

function randomField(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(31));
  return BigInt("0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")).toString();
}

function yyyymmdd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function createIdentityProof(
  details: IdentityDetails,
  onStage?: (stage: "loading" | "proving") => void
): Promise<IdentityProof> {
  onStage?.("loading");
  const [{ Noir }, { Barretenberg, UltraHonkBackend }, circuit] = await Promise.all([
    import("@noir-lang/noir_js"),
    import("@aztec/bb.js"),
    fetch(CIRCUIT_URL).then((r) => {
      if (!r.ok) throw new IdentityProofError("Couldn't load the proof circuit.");
      return r.json();
    }),
  ]);

  const inputs = {
    name_hash: await textToField(details.fullName.trim().replace(/\s+/g, " ").toUpperCase()),
    document_hash: await textToField(details.documentId.replace(/\s+/g, "").toUpperCase()),
    dob: details.dateOfBirth.replaceAll("-", ""),
    country_code: String(details.countryCode),
    salt: randomField(),
    today: yyyymmdd(new Date()),
  };

  onStage?.("proving");
  let witness: Uint8Array;
  try {
    ({ witness } = await new Noir(circuit).execute(inputs));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const known = Object.keys(CIRCUIT_ERRORS).find((k) => message.includes(k));
    throw new IdentityProofError(known ? CIRCUIT_ERRORS[known] : "These details don't satisfy the identity check.");
  }

  // Multi-threading needs cross-origin isolation; fall back to one thread
  const threads = typeof crossOriginIsolated !== "undefined" && crossOriginIsolated ? navigator.hardwareConcurrency : 1;
  const api = await Barretenberg.new({ threads });
  try {
    const backend = new UltraHonkBackend(circuit.bytecode, api);
    const { proof, publicInputs } = await backend.generateProof(witness, { verifierTarget: VERIFIER_TARGET });
    return {
      request: { proof: toBase64(proof), public_inputs: publicInputs },
      commitment: publicInputs[1],
    };
  } finally {
    await api.destroy();
  }
}
