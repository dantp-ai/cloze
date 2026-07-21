"use client";

import { useEffect, useRef, useState } from "react";
import { getTranslation } from "@/lib/translate/actions";

export function HoverTranslate({
  sentenceId,
  lang,
  children,
}: {
  sentenceId: string;
  lang: string;
  children: React.ReactNode;
}) {
  const metaHeld = useRef(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null | undefined>(undefined); // undefined = not fetched
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.key === "Meta") metaHeld.current = true;
    }
    function up(e: KeyboardEvent) {
      if (e.key === "Meta") metaHeld.current = false;
    }
    function onBlur() {
      metaHeld.current = false;
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // Reset the cached translation if the target language changes.
  useEffect(() => {
    setText(undefined);
  }, [lang, sentenceId]);

  async function onEnter() {
    if (!metaHeld.current) return;
    setOpen(true);
    if (text === undefined && !loading) {
      setLoading(true);
      setFailed(false);
      const res = await getTranslation(sentenceId, lang);
      if (res.ok) {
        setText(res.text);
      } else {
        setFailed(true);
      }
      setLoading(false);
    }
  }

  return (
    <span className="relative" onMouseEnter={onEnter} onMouseLeave={() => setOpen(false)}>
      {children}
      {open && (
        <span className="absolute left-0 top-full z-10 mt-1 max-w-xs rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-700 shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
          {loading ? "Translating..." : failed ? "Translation failed" : (text ?? "No translation")}
        </span>
      )}
    </span>
  );
}
