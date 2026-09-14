"use client";

import { useState, type FormEvent } from "react";
import { MagneticButton } from "./MagneticButton";

const CONTACT_EMAIL = "contact@arc-wear.com";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = `Message de ${name} — site Arc`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label
          htmlFor="name"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted"
        >
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="border border-line bg-surface-raised px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="email"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="border border-line bg-surface-raised px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid gap-2">
        <label
          htmlFor="message"
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="resize-none border border-line bg-surface-raised px-4 py-3 text-sm outline-none focus:border-accent"
        />
      </div>

      <MagneticButton className="w-fit">
        <button
          type="submit"
          className="border border-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent"
        >
          Envoyer
        </button>
      </MagneticButton>

      <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
        Ouvre ton client email — le formulaire n&apos;est pas encore relié à
        un service d&apos;envoi automatique.
      </p>
    </form>
  );
}
