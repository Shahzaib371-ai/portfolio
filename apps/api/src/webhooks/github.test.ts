// Phase 8: unit tests for the GitHub webhook security checks.
// Run: npm run test --workspace=@portfolio/api
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  verifySignature,
  isRateLimited,
  clearRateLimitState,
} from "./github.js";

const SECRET = "test-webhook-secret";
const BODY = Buffer.from(JSON.stringify({ zen: "Keep it logically awesome" }));

function sign(secret: string, body: Buffer): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifySignature", () => {
  it("accepts a valid signature", () => {
    assert.equal(verifySignature(SECRET, BODY, sign(SECRET, BODY)), true);
  });

  it("rejects a signature made with the wrong secret", () => {
    assert.equal(verifySignature(SECRET, BODY, sign("wrong-secret", BODY)), false);
  });

  it("rejects a tampered body", () => {
    const sig = sign(SECRET, BODY);
    assert.equal(verifySignature(SECRET, Buffer.from("tampered"), sig), false);
  });

  it("rejects a missing signature", () => {
    assert.equal(verifySignature(SECRET, BODY, null), false);
  });

  it("rejects a signature without the sha256= prefix", () => {
    const sig = sign(SECRET, BODY).replace("sha256=", "");
    assert.equal(verifySignature(SECRET, BODY, sig), false);
  });

  it("rejects a truncated signature (length mismatch is not timing-compared)", () => {
    const sig = sign(SECRET, BODY).slice(0, -4);
    assert.equal(verifySignature(SECRET, BODY, sig), false);
  });
});

describe("isRateLimited", () => {
  it("allows the first 30 requests, blocks the 31st", () => {
    clearRateLimitState();
    const ip = "203.0.113.7";
    for (let i = 0; i < 30; i++) {
      assert.equal(isRateLimited(ip), false, `request ${i + 1} should pass`);
    }
    assert.equal(isRateLimited(ip), true, "request 31 should be limited");
  });

  it("tracks IPs independently", () => {
    clearRateLimitState();
    const a = "198.51.100.1";
    const b = "198.51.100.2";
    for (let i = 0; i < 30; i++) isRateLimited(a);
    assert.equal(isRateLimited(a), true);
    assert.equal(isRateLimited(b), false, "other IP must not be affected");
  });
});
