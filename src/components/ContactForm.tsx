"use client";

import { useState, type FormEvent } from "react";
import { MagneticButton } from "./MagneticButton";
import { CONTACT_EMAIL_DISPLAY, CONTACT_EMAIL_REAL } from "@/lib/site";

const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  function sendByMailto() {
    const subject = `Message de ${name} — site Arc`;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:${CONTACT_EMAIL_REAL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!WEB3FORMS_KEY) {
      sendByMailto();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Nouveau message — site Arc (${name})`,
          from_name: "Site Arc",
          name,
          email,
          message,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("sent");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="grid gap-2 py-6 text-center">
        <p className="font-display text-2xl">Message envoyé.</p>
        <p className="text-sm text-muted">On te répond personnellement, généralement sous 48h.</p>
      </div>
    );
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
          disabled={status === "sending"}
          className="border border-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {status === "sending" ? "Envoi..." : "Envoyer"}
        </button>
      </MagneticButton>

      {status === "error" && (
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
          Le message n&apos;a pas pu partir. Écris-nous directement à{" "}
          <a href={`mailto:${CONTACT_EMAIL_REAL}`} className="underline">
            {CONTACT_EMAIL_DISPLAY}
          </a>
          .
        </p>
      )}

      {!WEB3FORMS_KEY && status === "idle" && (
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          Ouvre ton client email — le formulaire n&apos;est pas encore relié à
          un service d&apos;envoi automatique.
        </p>
      )}
    </form>
  );
}
