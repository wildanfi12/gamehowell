// Optional integration contract. No production server or redeemable codes are included.
export class PrizeAPI {
  constructor(baseURL) {
    if (!baseURL?.startsWith("https://"))
      throw new Error("HTTPS backend required");
    this.baseURL = baseURL.replace(/\/$/, "");
  }
  async request(path, body) {
    const response = await fetch(this.baseURL + path, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    return response.json();
  }
  startSession() {
    return this.request("/sessions", {});
  }
  finishSession(sessionId, inputEvents) {
    return this.request("/sessions/finish", { sessionId, inputEvents });
  }
  claim(entitlementId, idempotencyKey) {
    return this.request("/claims", { entitlementId, idempotencyKey });
  }
  // Staff-authenticated server route must validate role, stock and single-use claim atomically.
  redeem(claimCode, idempotencyKey) {
    return this.request("/staff/redemptions", { claimCode, idempotencyKey });
  }
}
