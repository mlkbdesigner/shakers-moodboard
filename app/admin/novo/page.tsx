"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/app/components/Topbar";

type Pending = {
  file: File;
  preview: string;
  title: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function NovoMoodboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Pending[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function addFiles(fs: FileList | File[]) {
    const arr = Array.from(fs).filter((f) => f.type.startsWith("image/"));
    const next: Pending[] = arr.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      title: f.name.replace(/\.[^.]+$/, ""),
    }));
    setItems((prev) => [...prev, ...next]);
  }

  function removeItem(i: number) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  async function submit() {
    setErr(null);
    if (!name.trim()) {
      setErr("Dá um nome pro moodboard.");
      return;
    }
    if (items.length === 0) {
      setErr("Adiciona pelo menos uma imagem.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    try {
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
      const { data: mb, error: mbErr } = await supabase
        .from("moodboards")
        .insert({
          slug,
          name: name.trim(),
          client_name: clientName.trim() || null,
          notes: notes.trim() || null,
        })
        .select()
        .single();
      if (mbErr) throw mbErr;

      // upload imagens
      const refs: {
        moodboard_id: string;
        image_url: string;
        storage_path: string;
        title: string;
        position: number;
      }[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const ext = it.file.name.split(".").pop() || "jpg";
        const path = `${mb.id}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("moodboard-images")
          .upload(path, it.file, { contentType: it.file.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("moodboard-images").getPublicUrl(path);
        refs.push({
          moodboard_id: mb.id,
          image_url: pub.publicUrl,
          storage_path: path,
          title: it.title || `Ref ${i + 1}`,
          position: i,
        });
      }
      const { error: refsErr } = await supabase.from("moodboard_references").insert(refs);
      if (refsErr) throw refsErr;

      router.push(`/admin/${mb.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar moodboard");
      setBusy(false);
    }
  }

  return (
    <>
      <Topbar>
        <Link href="/admin" className="btn btn-ghost">
          ← Voltar
        </Link>
      </Topbar>

      <main className="wrap view" style={{ paddingBottom: 160 }}>
        <div className="lead">
          <span className="eyebrow">Novo moodboard</span>
          <h1 className="display">
            Monta o <em>painel</em>
          </h1>
          <p>Sobe as referências, dá um nome e gera o link pro cliente avaliar.</p>
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
              placeholder="Ex: Marca Conoti — referências fase 1"
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
              placeholder="Ex: João Silva"
            />
          </div>
          <div className="field">
            <label>
              Briefing curto <span className="desc">(opcional — aparece pro cliente)</span>
            </label>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que você quer descobrir com esse moodboard?"
            />
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <span className="idx">02</span>
            <h2>Referências visuais</h2>
            <span className="hint">{items.length} imagem(ns)</span>
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

          {items.length > 0 && (
            <div className="upload-list">
              {items.map((it, i) => (
                <div key={i} className="upload-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.preview} alt="" />
                  <button className="rm" type="button" onClick={() => removeItem(i)}>
                    ✕
                  </button>
                  <input
                    className="name-input"
                    value={it.title}
                    onChange={(e) => {
                      const v = e.target.value;
                      setItems((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, title: v } : p)),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div className="actionbar">
        <div className="actionbar-inner">
          <div className="meta">
            <b>{items.length}</b> imagem(ns) prontas
          </div>
          <div className="spacer" />
          <Link href="/admin" className="btn btn-ghost">
            Cancelar
          </Link>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Salvando…" : "Criar moodboard →"}
          </button>
        </div>
      </div>
    </>
  );
}
