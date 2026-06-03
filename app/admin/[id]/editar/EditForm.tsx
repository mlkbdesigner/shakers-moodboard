"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/app/components/Topbar";

type Ref = {
  id: string;
  image_url: string;
  storage_path: string | null;
  title: string | null;
  position: number;
};

type Mb = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  notes: string | null;
};

type PendingNew = {
  file: File;
  preview: string;
  title: string;
};

export function EditForm({
  moodboard,
  initialRefs,
}: {
  moodboard: Mb;
  initialRefs: Ref[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(moodboard.name);
  const [clientName, setClientName] = useState(moodboard.client_name ?? "");
  const [notes, setNotes] = useState(moodboard.notes ?? "");

  const [refs, setRefs] = useState<Ref[]>(initialRefs);
  const [removedRefIds, setRemovedRefIds] = useState<string[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<PendingNew[]>([]);
  const [drag, setDrag] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function addFiles(fs: FileList | File[]) {
    const arr = Array.from(fs).filter((f) => f.type.startsWith("image/"));
    const next: PendingNew[] = arr.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      title: f.name.replace(/\.[^.]+$/, ""),
    }));
    setNewFiles((prev) => [...prev, ...next]);
  }

  function removeExisting(r: Ref) {
    setRefs((prev) => prev.filter((p) => p.id !== r.id));
    setRemovedRefIds((prev) => [...prev, r.id]);
    if (r.storage_path) setRemovedPaths((prev) => [...prev, r.storage_path!]);
  }

  function removeNew(i: number) {
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function save() {
    setErr(null);
    if (!name.trim()) {
      setErr("Dá um nome pro moodboard.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      // 1. update moodboard
      const { error: mbErr } = await supabase
        .from("moodboards")
        .update({
          name: name.trim(),
          client_name: clientName.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("id", moodboard.id);
      if (mbErr) throw mbErr;

      // 2. update titles das refs existentes
      for (const r of refs) {
        const { error } = await supabase
          .from("moodboard_references")
          .update({ title: r.title })
          .eq("id", r.id);
        if (error) throw error;
      }

      // 3. delete refs removidas
      if (removedRefIds.length) {
        const { error } = await supabase
          .from("moodboard_references")
          .delete()
          .in("id", removedRefIds);
        if (error) throw error;
      }
      // 3b. delete storage objects das removidas
      if (removedPaths.length) {
        await supabase.storage.from("moodboard-images").remove(removedPaths);
      }

      // 4. upload + insert das novas
      if (newFiles.length) {
        const maxPos = refs.reduce((m, r) => Math.max(m, r.position), -1);
        const inserts: {
          moodboard_id: string;
          image_url: string;
          storage_path: string;
          title: string;
          position: number;
        }[] = [];
        for (let i = 0; i < newFiles.length; i++) {
          const it = newFiles[i];
          const ext = it.file.name.split(".").pop() || "jpg";
          const path = `${moodboard.id}/${Date.now()}-edit-${i}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("moodboard-images")
            .upload(path, it.file, { contentType: it.file.type, upsert: false });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage
            .from("moodboard-images")
            .getPublicUrl(path);
          inserts.push({
            moodboard_id: moodboard.id,
            image_url: pub.publicUrl,
            storage_path: path,
            title: it.title || `Ref ${maxPos + 1 + i + 1}`,
            position: maxPos + 1 + i,
          });
        }
        const { error: insErr } = await supabase
          .from("moodboard_references")
          .insert(inserts);
        if (insErr) throw insErr;
      }

      router.push(`/admin/${moodboard.id}`);
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
      setBusy(false);
    }
  }

  async function deleteMoodboard() {
    if (!confirm("Apagar esse moodboard? Essa ação não tem volta — vai apagar respostas e imagens junto.")) {
      return;
    }
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    try {
      // remove storage objects das refs originais
      const paths = initialRefs.map((r) => r.storage_path).filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from("moodboard-images").remove(paths);
      }
      const { error } = await supabase
        .from("moodboards")
        .delete()
        .eq("id", moodboard.id);
      if (error) throw error;
      router.push("/admin");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao apagar");
      setBusy(false);
    }
  }

  const totalRefs = refs.length + newFiles.length;

  return (
    <>
      <Topbar>
        <Link href={`/admin/${moodboard.id}`} className="btn btn-ghost">
          ← Cancelar
        </Link>
      </Topbar>

      <main className="wrap view" style={{ paddingBottom: 160 }}>
        <div className="lead">
          <span className="eyebrow">Editar moodboard</span>
          <h1 className="display">
            Ajustes <em>finos</em>
          </h1>
          <p>Mude o nome, briefing, renomeie/remova referências ou adicione novas.</p>
        </div>

        {err && <div className="errbox">{err}</div>}

        <section className="section">
          <div className="section-head">
            <span className="idx">01</span>
            <h2>Informações</h2>
          </div>
          <div className="field">
            <label>Nome do moodboard</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              Nome do cliente <span className="desc">(opcional)</span>
            </label>
            <input
              className="input"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>
              Briefing curto <span className="desc">(opcional)</span>
            </label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="idx">02</span>
            <h2>Referências atuais</h2>
            <span className="hint">{refs.length} imagem(ns)</span>
          </div>

          {refs.length === 0 ? (
            <p style={{ color: "var(--faint)", fontSize: 14 }}>
              Nenhuma referência. Adicione novas abaixo.
            </p>
          ) : (
            <div className="upload-list">
              {refs.map((r) => (
                <div key={r.id} className="upload-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image_url} alt={r.title ?? ""} />
                  <button
                    className="rm"
                    type="button"
                    onClick={() => removeExisting(r)}
                    title="Remover"
                  >
                    ✕
                  </button>
                  <input
                    className="name-input"
                    value={r.title ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRefs((prev) =>
                        prev.map((p) => (p.id === r.id ? { ...p, title: v } : p)),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-head">
            <span className="idx">03</span>
            <h2>Adicionar novas</h2>
            <span className="hint">{newFiles.length} pra subir</span>
          </div>

          <div
            className={`upload-area ${drag ? "drag" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <div className="ico">🖼️</div>
            <p>Arrasta imagens aqui</p>
            <span>ou clica pra escolher do computador</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {newFiles.length > 0 && (
            <div className="upload-list">
              {newFiles.map((it, i) => (
                <div key={i} className="upload-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt="" />
                  <button className="rm" type="button" onClick={() => removeNew(i)}>
                    ✕
                  </button>
                  <input
                    className="name-input"
                    value={it.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewFiles((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, title: v } : p)),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section" style={{ borderColor: "var(--no-bg)" }}>
          <div className="section-head">
            <span className="idx" style={{ color: "var(--no)" }}>!</span>
            <h2>Zona perigosa</h2>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>
            Apagar o moodboard remove todas as referências, respostas e imagens. Não tem como desfazer.
          </p>
          <button
            type="button"
            className="btn btn-danger"
            onClick={deleteMoodboard}
            disabled={busy}
          >
            Apagar moodboard
          </button>
        </section>
      </main>

      <div className="actionbar">
        <div className="actionbar-inner">
          <div className="meta">
            <b>{totalRefs}</b> imagem(ns) total
          </div>
          <div className="spacer" />
          <Link href={`/admin/${moodboard.id}`} className="btn btn-ghost">
            Cancelar
          </Link>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Salvando…" : "Salvar mudanças"}
          </button>
        </div>
      </div>
    </>
  );
}
