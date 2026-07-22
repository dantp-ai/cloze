import { describe, it, expect, vi } from "vitest";
import { deeplTranslate, googleTranslate, translateWith, UnsupportedLanguageError } from "./providers";

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("deeplTranslate", () => {
  it("posts to DeepL and returns the translated text", async () => {
    const fetchFn = mockFetch(200, { translations: [{ text: "Today I had a coffee." }] });
    const out = await deeplTranslate("Oggi ho preso un caffè.", "it", "en", "key", fetchFn);
    expect(out).toBe("Today I had a coffee.");
    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("deepl");
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "DeepL-Auth-Key key" });
    expect(String((init as RequestInit).body)).toContain("EN");
  });

  it("throws on a non-ok response", async () => {
    await expect(deeplTranslate("x", "it", "en", "key", mockFetch(403, {}))).rejects.toThrow();
  });
});

describe("googleTranslate", () => {
  it("posts to Google and returns the translated text", async () => {
    const fetchFn = mockFetch(200, { data: { translations: [{ translatedText: "the cat" }] } });
    const out = await googleTranslate("il gatto", "it", "en", "key", fetchFn);
    expect(out).toBe("the cat");
    const [url] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain("googleapis");
  });
});

describe("translateWith", () => {
  it("dispatches to the named provider", async () => {
    const fetchFn = mockFetch(200, { translations: [{ text: "hi" }] });
    expect(await translateWith("deepl", "ciao", "it", "en", "key", fetchFn)).toBe("hi");
  });
});

describe("unsupported language handling", () => {
  it("throws UnsupportedLanguageError when DeepL rejects the language with 400", async () => {
    await expect(
      deeplTranslate("x", "it", "vo", "key", mockFetch(400, {})),
    ).rejects.toBeInstanceOf(UnsupportedLanguageError);
  });

  it("throws UnsupportedLanguageError when Google rejects the language with 400", async () => {
    await expect(
      googleTranslate("x", "it", "vo", "key", mockFetch(400, {})),
    ).rejects.toBeInstanceOf(UnsupportedLanguageError);
  });

  it("throws a generic (non-unsupported) error on other non-ok responses", async () => {
    await expect(
      deeplTranslate("x", "it", "en", "key", mockFetch(500, {})),
    ).rejects.toThrow(/request failed/i);
  });
});

describe("provider empty-response handling", () => {
  it("throws a clear error when DeepL returns no translations", async () => {
    await expect(
      deeplTranslate("x", "it", "en", "key", mockFetch(200, { translations: [] })),
    ).rejects.toThrow(/no translation/i);
  });

  it("throws a clear error when Google returns no translations", async () => {
    await expect(
      googleTranslate("x", "it", "en", "key", mockFetch(200, { data: { translations: [] } })),
    ).rejects.toThrow(/no translation/i);
  });
});
