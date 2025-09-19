import { Locales } from "@/lib/locales/index";

describe("Locales", () => {
  it("should export a configured I18n instance", () => {
    expect(Locales).toBeDefined();
    expect(typeof Locales.t).toBe("function");
  });

  it("should have fallback enabled", () => {
    expect(Locales.enableFallback).toBe(true);
  });

  it("should have English locale configured", () => {
    expect(Locales.locale).toBeDefined();
    expect(Locales.translations.en).toBeDefined();
  });
});
