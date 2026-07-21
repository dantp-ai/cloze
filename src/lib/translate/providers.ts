export type FetchFn = typeof fetch;

export async function deeplTranslate(
  text: string,
  source: string,
  target: string,
  apiKey: string,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  const res = await fetchFn("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: JSON.stringify({
      text: [text],
      source_lang: source.toUpperCase(),
      target_lang: target.toUpperCase(),
    }),
  });
  if (!res.ok) throw new Error(`DeepL request failed: ${res.status}`);
  const data = (await res.json()) as { translations: { text: string }[] };
  const translated = data.translations[0]?.text;
  if (translated === undefined) throw new Error("DeepL returned no translation.");
  return translated;
}

export async function googleTranslate(
  text: string,
  source: string,
  target: string,
  apiKey: string,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  const res = await fetchFn(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    },
  );
  if (!res.ok) throw new Error(`Google request failed: ${res.status}`);
  const data = (await res.json()) as { data: { translations: { translatedText: string }[] } };
  const translated = data.data.translations[0]?.translatedText;
  if (translated === undefined) throw new Error("Google returned no translation.");
  return translated;
}

export async function translateWith(
  provider: "deepl" | "google",
  text: string,
  source: string,
  target: string,
  apiKey: string,
  fetchFn: FetchFn = fetch,
): Promise<string> {
  if (provider === "deepl") return deeplTranslate(text, source, target, apiKey, fetchFn);
  return googleTranslate(text, source, target, apiKey, fetchFn);
}
