"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DIMENSIONS, type DimensionKey, type Score } from "@/lib/types";

type Ref = {
  id: string;
  image_url: string;
  title: string | null;
};

type Mb = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  notes: string | null;
};

type ItemState = Partial<Record<DimensionKey, Score>> & { why?: string };

export function ClientForm({ moodboard, refs }: { moodboard: Mb; refs: Ref[] }) {
  const [clientName, setClientName] = useState(moodboard.client_name ?? "");
  const [generalComment, setGeneralComment] = useState("");
  const [byRef, setByRef] = useState<Record<string, ItemState>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setScore(refId: string, dim: DimensionKey, v: Score) {
    setByRef((prev) => ({
      ...prev,
      [refId]: { ...(prev[refId] ?? {}), [dim]: v },
    }));
  }
  function setWhy(refId: string, why: string) {
    setByRef((prev) => ({
      ...prev,
      [refId]: { ...(prev[refId] ?? {}), why },
    }));
  }

  // contagem geral
  const totalAnswers = Object.values(byRef).reduce((acc, it) => {
    return (
      acc +
      DIMENSIONS.reduce((a, d) => a + (it[d.key] ? 1 : 0), 0)
    );
  }, 0);
  const totalPossible = refs.length * DIMENSIONS.length;

  async function submit() {
    setErr(null);
    if (!clientName.trim()) {
      setErr("Coloca seu nome antes de enviar.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      const { data: resp, error: respErr } = await supabase
        .from("moodboard_responses")
        .insert({
          moodboard_id: moodboard.id,
          client_name: clientName.trim(),
          general_comment: generalComment.trim() || null,
        })
        .select()
        .single();
      if (respErr) throw respErr;

      const items = refs.map((r) => {
        const it = byRef[r.id] ?? {};
        return {
          response_id: resp.id,
          reference_id: r.id,
          estilo: it.estilo ?? null,
          cores: it.cores ?? null,
          vibe: it.vibe ?? null,
          tipografia: it.tipografia ?? null,
          composicao: it.composicao ?? null,
          mensagem: it.mensagem ?? null,
          why: it.why?.trim() || null,
        };
      });
      const { error: itemsErr } = await supabase
        .from("moodboard_response_items")
        .insert(items);
      if (itemsErr) throw itemsErr;
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao enviar");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="wrap view">
        <div className="sent-screen">
          <div className="sent-check">✓</div>
          <span className="eyebrow">Enviado</span>
          <h1 className="display">
            Obrigada pelas <em>respostas</em>!
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 18, maxWidth: "48ch", margin: "6px auto 0" }}>
            A equipe da Shakers já recebeu seu feedback e vai usar isso pra ajustar a direção da marca.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="wordmark">
            <span className="glyph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Shakers" />
            </span>
            <span>Moodboard</span>
            <span className="sub">Shakers</span>
          </div>
        </div>
      </header>

      <main className="wrap view" style={{ paddingBottom: 160 }}>
        <div className="lead">
          <span className="eyebrow">Avaliação de referências</span>
          <h1 className="display">
            {moodboard.name.split(" ").length > 1 ? (
              <>
                {moodboard.name.split(" ").slice(0, -1).join(" ")}{" "}
                <em>{moodboard.name.split(" ").slice(-1)}</em>
              </>
            ) : (
              <em>{moodboard.name}</em>
            )}
          </h1>
          <p>
            Pra cada referência abaixo, marque o que combina ou não com a marca em cada dimensão.
            Não precisa preencher tudo — só o que sentir.
          </p>
        </div>

        {moodboard.notes && (
          <div className="hintbar">
            <span style={{ fontWeight: 600 }}>📝 Briefing:</span> {moodboard.notes}
          </div>
        )}

        {err && <div className="errbox">{err}</div>}

        <section className="section">
          <div className="section-head">
            <span className="idx">01</span>
            <h2>Quem está respondendo</h2>
          </div>
          <div className="field">
            <label>Seu nome</label>
            <input
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
            />
          </div>
        </section>

        <div className="lead" style={{ marginTop: 32 }}>
          <span className="eyebrow">Referências · {refs.length}</span>
        </div>

        <div className="review-grid">
        {refs.map((r, idx) => {
          const state = byRef[r.id] ?? {};
          return (
            <article key={r.id} className="review-card">
              <div className="review-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image_url} alt={r.title ?? `Referência ${idx + 1}`} />
              </div>
              <div className="review-body">
                <h3 className="review-title">
                  {idx + 1}. {r.title || `Referência ${idx + 1}`}
                </h3>

                {DIMENSIONS.map((d) => (
                  <div key={d.key} className="dim-row">
                    <div className="dim-label">{d.label}</div>
                    <div className="radio-row">
                      <button
                        type="button"
                        className={`radio-opt ${state[d.key] === "yes" ? "on-yes" : ""}`}
                        onClick={() => setScore(r.id, d.key, state[d.key] === "yes" ? null : "yes")}
                      >
                        ✓ Combina
                      </button>
                      <button
                        type="button"
                        className={`radio-opt ${state[d.key] === "maybe" ? "on-maybe" : ""}`}
                        onClick={() => setScore(r.id, d.key, state[d.key] === "maybe" ? null : "maybe")}
                      >
                        ◐ Neutro
                      </button>
                      <button
                        type="button"
                        className={`radio-opt ${state[d.key] === "no" ? "on-no" : ""}`}
                        onClick={() => setScore(r.id, d.key, state[d.key] === "no" ? null : "no")}
                      >
                        ✕ Não combina
                      </button>
                    </div>
                  </div>
                ))}

                <div className="field" style={{ marginTop: 16 }}>
                  <label>
                    Por quê? <span className="desc">(opcional — conta o motivo)</span>
                  </label>
                  <textarea
                    className="textarea"
                    value={state.why ?? ""}
                    onChange={(e) => setWhy(r.id, e.target.value)}
                    placeholder="Ex: achei muito cheio, faltou respiro…"
                  />
                </div>
              </div>
            </article>
          );
        })}
        </div>

        <section className="section" style={{ marginTop: 32 }}>
          <div className="section-head">
            <span className="idx">✦</span>
            <h2>Comentários adicionais</h2>
          </div>
          <div className="field">
            <label>
              Algo geral sobre o conjunto? <span className="desc">(opcional)</span>
            </label>
            <textarea
              className="textarea"
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              placeholder="Ex: sinto falta de referências mais minimalistas, com mais espaço em branco…"
            />
          </div>
        </section>
      </main>

      <div className="actionbar">
        <div className="actionbar-inner">
          <div className="meta">
            <b>{totalAnswers}</b> / {totalPossible} avaliadas
          </div>
          <div className="spacer" />
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Enviando…" : "Enviar respostas →"}
          </button>
        </div>
      </div>
    </>
  );
}
