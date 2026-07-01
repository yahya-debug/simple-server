// ============================================================
// Tests for src/auth.ts (password hashing + JWT helpers).
// ============================================================
import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT } from "./auth.js";


describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;
  let tok: string;
  let id: string;

  beforeAll(() => {
    // hash1 = await hashPassword(password1);
    // hash2 = await hashPassword(password2);
    tok = makeJWT("6fcea73e-894a-4cb5-95c7-5cc602583894", 20000, "YAHYA");
  });

//   it("should return true for the correct password", async () => {
//     const result = await checkPasswordHash(password1, hash1);
//     expect(result).toBe(true);
//   });
  it("should give me the id if i used the token correctly", () => {
    id = validateJWT(tok, 'YAHYA');
    expect(id).toBe("6fcea73e-894a-4cb5-95c7-5cc602583894");
  })
});