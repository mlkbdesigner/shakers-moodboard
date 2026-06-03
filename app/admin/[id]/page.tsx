import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/app/components/Topbar";
import { DIMENSIONS } from "@/lib/types";
import { ShareBar } from "./ShareBar";

export const dynamic = "force-dynamic";

export default async function MoodboardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mb } = await supabase
    .from("moodboards")
    .select("*")
    .eq("id", id)
    .single();
  if (!mb) notFound();

  const { data: refs } = await supabase
    .from("moodboard_references")
    .select("*")
    .eq("moodboard_id", id)
    .order("position");

  const { data: responses } = await supabase
    .from("moodboard_responses")
    .select("*")
    .eq("moodboard_id", id)
    .order("submitted_at", { ascending: false });

  const respIds = responses?.map((r) => r.id) ?? [];
  const { data: items } = respIds.length
    ? await supabase
        .from("moodboard_response_items")
        .select("*")
        .in("response_id", respIds)
    : { data: [] as any[] };

  // monta URL pública
  const h = await headers();
  const host = h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  const shareUrl = `${proto}://${host}/m/${mb.slug}`;

  return (
    <>
      <Topbar>
        <Link href={`/admin/${id}/editar`} className="btn btn-soft">
          ✎ Editar
        </Link>
        <Link href="/admin" className="btn btn-ghost">
          ← Painel
        </Link>
      </Topbar>

      <main className="wrap view">
        <div className="lead">
          <span className="eyebrow">Moodboard</span>
          <h1 className="display">
            {mb.name.split(" ").length > 1 ? (
              <>
                {mb.name.split(" ").slice(0, -1).join(" ")}{" "}
                <em>{mb.name.split(" ").slice(-1)}</em>
              </>
            ) : (
              <em>{mb.name}</em>
            )}
          </h1>
          {mb.client_name && <p>Cliente: {mb.client_name}</p>}
        </div>

        <ShareBar url={shareUrl} />

        {/* respostas recebidas */}
        <div className="lead">
          <span className="eyebrow">Respostas do cliente</span>
          <h2 className="display" style={{ fontSize: "clamp(26px, 3.6vw, 36px)" }}>
            {responses?.length ?? 0} avaliação(ões)
          </h2>
        </div>

        {!responses || responses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-ico">⏳</div>
            <p>Aguardando o cliente</p>
            <span>Compartilhe o link acima.</span>
          </div>
        ) : (
          responses.map((resp) => {
            const respItems = (items ?? []).filter((i) => i.response_id === resp.id);
            return (
              <div key={resp.id} className="section">
                <div className="section-head">
                  <span className="idx">●</span>
                  <h2>
                    {resp.client_name || "Sem nome"} ·{" "}
                    <span style={{ color: "var(--faint)", fontWeight: 500, fontSize: 15 }}>
                      {new Date(resp.submitted_at).toLocaleString("pt-BR")}
                    </span>
                  </h2>
                </div>

                {resp.general_comment && (
                  <div className="why-quote" style={{ marginBottom: 18 }}>
                    &ldquo;{resp.general_comment}&rdquo;
                  </div>
                )}

                {(refs ?? []).map((r) => {
                  const item = respItems.find((i) => i.reference_id === r.id);
                  return (
                    <div key={r.id} className="bucket" style={{ boxShadow: "none", border: "1px solid var(--line)" }}>
                      <div className="bucket-head">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="img-thumb" src={r.image_url} alt={r.title ?? ""} />
                        <h3>{r.title || "Referência"}</h3>
                      </div>
                      {DIMENSIONS.map((d) => {
                        const v = (item?.[d.key as keyof typeof item] as string | null) ?? null;
                        const cls = v === "yes" ? "yes" : v === "maybe" ? "maybe" : v === "no" ? "no" : "empty";
                        const lbl = v === "yes" ? "Combina" : v === "maybe" ? "Neutro" : v === "no" ? "Não combina" : "—";
                        return (
                          <div key={d.key} className="score-row">
                            <div className="k">{d.label}</div>
                            <div>
                              <span className={`score-pill ${cls}`}>{lbl}</span>
                            </div>
                          </div>
                        );
                      })}
                      {item?.why && <div className="why-quote">&ldquo;{item.why}&rdquo;</div>}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </main>
    </>
  );
}
