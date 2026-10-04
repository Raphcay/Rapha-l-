"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { FavoritesList } from "@/components/FavoritesList";

const INPUT_CLASS =
  "w-full border-b border-ink/40 bg-transparent py-3 text-base outline-none placeholder:text-ink/30 focus:border-accent";
const BUTTON_CLASS =
  "border border-ink/80 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent disabled:opacity-40";

export function AccountView() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = client.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [session]);

  if (!supabase) {
    return <p className="text-sm text-muted">La connexion au compte sera disponible prochainement.</p>;
  }
  if (!ready) {
    return <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Chargement…</p>;
  }

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !email) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/compte` },
    });
    setBusy(false);
    setMessage(error ? "Le lien n'a pas pu être envoyé. Réessaie dans un instant." : "Lien envoyé. Regarde ta boîte email.");
  }

  async function saveName(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, full_name: fullName.trim() || null });
    setBusy(false);
    setMessage(error ? "Enregistrement impossible pour le moment." : "Informations enregistrées.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage(null);
  }

  if (!session) {
    return (
      <form onSubmit={sendLink} className="max-w-md">
        <label htmlFor="account-email" className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Ton email
        </label>
        <input
          id="account-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="toi@exemple.com"
          className={`mt-2 ${INPUT_CLASS}`}
        />
        <button type="submit" disabled={busy} className={`mt-6 ${BUTTON_CLASS}`}>
          Recevoir mon lien de connexion
        </button>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Pas de mot de passe à retenir : on t&apos;envoie un lien, tu cliques, c&apos;est tout.
        </p>
        {message && <p className="mt-4 text-sm text-accent" aria-live="polite">{message}</p>}
      </form>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
      <form onSubmit={saveName} className="max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">Connecté avec</p>
        <p className="mt-2 text-sm">{session.user.email}</p>
        <label htmlFor="account-name" className="mt-8 block font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Ton nom
        </label>
        <input
          id="account-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={`mt-2 ${INPUT_CLASS}`}
        />
        <button type="submit" disabled={busy} className={`mt-6 ${BUTTON_CLASS}`}>
          Enregistrer
        </button>
        {message && <p className="mt-4 text-sm text-accent" aria-live="polite">{message}</p>}
      </form>
      <button type="button" onClick={signOut} className={BUTTON_CLASS}>
        Me déconnecter
      </button>
      <div className="md:col-span-2">
        <FavoritesList userId={session.user.id} />
      </div>
    </div>
  );
}
