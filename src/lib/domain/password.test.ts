import { describe, expect, it } from "vitest";
import { validateNewPassword } from "./password";

describe("validateNewPassword", () => {
  it("acepta una contraseña válida", () => {
    expect(validateNewPassword("vieja123", "nueva2026", "nueva2026")).toBeNull();
  });

  it("exige la contraseña actual", () => {
    expect(validateNewPassword("", "nueva2026", "nueva2026")).toMatch(/actual/);
  });

  it("exige al menos 8 caracteres", () => {
    expect(validateNewPassword("vieja123", "abc123", "abc123")).toMatch(/8 caracteres/);
  });

  it("exige letras y números", () => {
    expect(validateNewPassword("vieja123", "sololetras", "sololetras")).toMatch(/letras y números/);
    expect(validateNewPassword("vieja123", "12345678", "12345678")).toMatch(/letras y números/);
  });

  it("no acepta repetir la actual", () => {
    expect(validateNewPassword("igual1234", "igual1234", "igual1234")).toMatch(/distinta/);
  });

  it("exige que la confirmación coincida", () => {
    expect(validateNewPassword("vieja123", "nueva2026", "nueva2027")).toMatch(/confirmación/);
  });
});
