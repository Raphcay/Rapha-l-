import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question, une précommande, une collaboration : écris-nous.",
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            Contact
          </p>
          <h1 className="mt-2 max-w-[16ch] text-balance font-display text-4xl italic sm:text-5xl">
            Parlons-en.
          </h1>
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-muted">
            Une question sur une matière, une précommande, une proposition de
            collaboration : écris-nous, on répond personnellement.
          </p>
          <dl className="mt-10 space-y-4 font-mono text-[13px]">
            <div>
              <dt className="uppercase tracking-[0.1em] text-muted">Email</dt>
              <dd className="mt-1">
                <a
                  href="mailto:contact@arc-wear.com"
                  className="underline decoration-line underline-offset-4 hover:text-accent"
                >
                  contact@arc-wear.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.1em] text-muted">Instagram</dt>
              <dd className="mt-1">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line underline-offset-4 hover:text-accent"
                >
                  @arc.wear
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="border border-line bg-surface p-6 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
