import type { Metadata } from "next";
import { ScrollReveal } from "@/components/ScrollReveal";
import { posts } from "@/data/posts";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes sur les matières, la fabrication et les intentions d'Arc.",
  alternates: { canonical: "/journal" },
};

const formatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function JournalPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <ScrollReveal>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          Journal
        </p>
        <h1 className="mt-2 max-w-[20ch] font-display text-4xl sm:text-5xl">
          Notes d&apos;atelier
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          On note ici ce qu&apos;on apprend en construisant Arc — la matière,
          la fabrication, comment entretenir les pièces. Publié au fil des
          drops, sans calendrier fixe.
        </p>
      </ScrollReveal>

      <div className="mt-12 divide-y divide-line border-y border-line">
        {posts.map((post, index) => (
          <ScrollReveal
            key={post.slug}
            as="article"
            delay={index * 0.06}
            className="grid gap-2 py-8 sm:grid-cols-[1fr_2.4fr] sm:gap-8"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              {formatter.format(new Date(post.date))}
              <br />
              {post.readTime} de lecture
            </p>
            <div>
              <h2 className="font-display text-2xl">{post.title}</h2>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted">
                {post.excerpt}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        Articles complets à venir.
      </p>
    </section>
  );
}
