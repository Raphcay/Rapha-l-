import { getCurrentUser } from "@/lib/auth";
import { requireActiveAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/pricing";
import { markLeadContactedAction } from "@/lib/actions/leads";

export default async function DemandesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  requireActiveAccess(user);

  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: { estimatedMax: "desc" },
  });

  if (leads.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-dashed border-ligne bg-white p-8 text-center">
        <h1 className="font-serif text-xl font-semibold text-encre">
          Aucune demande pour l&apos;instant
        </h1>
        <p className="mt-2 text-ardoise">
          Dès qu&apos;un visiteur termine ton questionnaire, sa demande
          apparaît ici, classée par montant estimé.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-encre">
          Demandes reçues
        </h1>
        <p className="mt-1 text-ardoise">
          Classées du montant estimé le plus élevé au plus faible.
        </p>
      </div>

      <div className="space-y-3">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ligne bg-white p-5"
          >
            <div>
              <p className="font-serif text-lg font-semibold text-encre">
                {formatPrice(lead.estimatedMin)} – {formatPrice(lead.estimatedMax)}
              </p>
              <p className="mt-1 text-sm text-encre">{lead.contactName}</p>
              <p className="text-sm text-ardoise">
                {lead.contactEmail} · {lead.contactPhone}
              </p>
              <p className="mt-1 text-xs text-ardoise">
                {new Intl.DateTimeFormat("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(lead.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  lead.status === "NEW"
                    ? "bg-corail/10 text-corail-dark"
                    : "bg-ivoire text-ardoise"
                }`}
              >
                {lead.status === "NEW" ? "Nouvelle" : "Contactée"}
              </span>
              {lead.status === "NEW" && (
                <form action={markLeadContactedAction}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-ardoise hover:text-encre"
                  >
                    Marquer comme contactée
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
