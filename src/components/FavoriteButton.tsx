"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Heart button for a product page. Needs a logged-in client; otherwise it invites to log in.
export function FavoriteButton({ slug }: { slug: string }) {
  const [userId, setUserId] = useState<string | null | undefined>(supabase ? undefined : null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = client.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;
    supabase
      .from("favorites")
      .select("product_slug")
      .eq("user_id", userId)
      .eq("product_slug", slug)
      .maybeSingle()
      .then(({ data }) => setSaved(Boolean(data)));
  }, [userId, slug]);

  if (!supabase || userId === null) {
    return (
      <Link href="/compte" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted underline decoration-line underline-offset-4 hover:text-ink">
        Connecte-toi pour garder ce coloris
      </Link>
    );
  }
  if (userId === undefined) return null;

  async function toggle() {
    if (!supabase || !userId || busy) return;
    setBusy(true);
    setError(null);
    const result = saved
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("product_slug", slug)
      : await supabase.from("favorites").insert({ user_id: userId, product_slug: slug });
    if (result.error) {
      setError("Enregistrement impossible pour le moment.");
    } else {
      setSaved(!saved);
    }
    setBusy(false);
  }

  return (
    <div>
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:opacity-40 ${
        saved ? "text-accent" : "text-muted hover:text-ink"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      {saved ? "Dans mes favoris" : "Ajouter aux favoris"}
      </button>
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
