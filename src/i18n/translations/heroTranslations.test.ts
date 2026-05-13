import { describe, it, expect } from "vitest";
import { fr } from "./fr";
import { en } from "./en";
import { zh } from "./zh";
import { nqo } from "./nqo";

describe("Hero translations", () => {
  const translations = { fr, en, zh, nqo };

  describe("Key existence", () => {
    it.each(Object.entries(translations))(
      "%s should have hero.title1 and hero.title2 keys",
      (_lang, t) => {
        expect(t.hero).toBeDefined();
        expect(t.hero.title1).toBeDefined();
        expect(t.hero.title2).toBeDefined();
      }
    );
  });

  describe("Non-empty values (all languages)", () => {
    it.each(Object.entries(translations))(
      "%s should have non-empty hero.title1 and hero.title2",
      (_lang, t) => {
        expect(t.hero.title1.trim()).not.toBe("");
        expect(t.hero.title2.trim()).not.toBe("");
      }
    );
  });

  describe("French exact text match", () => {
    it("fr hero.title1 should match exactly", () => {
      expect(fr.hero.title1).toBe("Achetez, Vendez, Louez,");
    });

    it("fr hero.title2 should match exactly", () => {
      expect(fr.hero.title2).toBe("connectez la Guinee et le monde entier");
    });

    it("fr full slogan should match expected text", () => {
      const fullSlogan = `${fr.hero.title1} ${fr.hero.title2}`;
      expect(fullSlogan).toBe(
        "Achetez, Vendez, Louez, connectez la Guinee et le monde entier"
      );
    });
  });
});
