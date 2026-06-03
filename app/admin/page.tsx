import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/app/components/Topbar";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: moodboards } = await supabase
    .from("moodboards")
    .select("id, slug, name, client_name, created_at")
    .order("created_at", { ascending: false });

  // contagem de respostas por moodboard
  const ids = moodboards?.map((m) => m.id) ?? [];
  const { data: respCounts } = ids.length
    ? await supabase
        .from("moodboard_responses")
        .select("moodboard_id")
        .in("moodboard_id", ids)
    : { data: [] as { moodboard_id: string }[] };
  const counts = new Map<string, number>();
  (respCounts ?? []).forEach((r) => {
    counts.set(r.moodboard_id, (counts.get(r.moodboard_id) ?? 0) + 1);
  });

  return (
    <>
      <Topbar>
        <Link href="/admin/novo" className="btn btn-primary">
          + Novo moodboard
        </Link>
        <form action={signOut}>
          <button className="btn btn-ghost" type="submit">
            Sair
          </button>
        </form>
      </Topbar>

      <main className="wrap view">
        <div className="lead">
          <span className="eyebrow">Painel da equipe</span>
          <h1 className="display">
            Seus <em>moodboards</em>
          </h1>
          <p>Crie referências visuais e envie o link pro cliente avaliar.</p>
        </div>

        {!moodboards || moodboards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-ico">🎨</div>
            <p>Nenhum moodboard ainda</p>
            <span>Clique em &ldquo;Novo moodboard&rdquo; pra começar.</span>
          </div>
        ) : (
          <div className="inbox-grid">
            {moodboards.map((m) => (
              <Link key={m.id} href={`/admin/${m.id}`} className="inbox-card">
                <div className="inbox-name">{m.name}</div>
                {m.client_name && <div className="inbox-meta">Cliente: {m.client_name}</div>}
                <div className="inbox-meta">
                  {new Date(m.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="inbox-stats">
                  <span>📬 {counts.get(m.id) ?? 0} respostas</span>
                </div>
                <div className="inbox-open">Ver detalhes →</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
