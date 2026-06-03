"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MoodboardActions({
  id,
  storagePaths,
}: {
  id: string;
  storagePaths: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Apagar esse moodboard? Vai apagar respostas e imagens junto.")) return;
    setBusy(true);
    const supabase = createClient();
    try {
      if (storagePaths.length) {
        await supabase.storage.from("moodboard-images").remove(storagePaths);
      }
      const { error } = await supabase.from("moodboards").delete().eq("id", id);
      if (error) throw error;
      router.refresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao apagar");
      setBusy(false);
    }
  }

  return (
    <div className="card-actions">
      <Link
        href={`/admin/${id}/editar`}
        className="card-action-btn"
        title="Editar"
        onClick={(e) => e.stopPropagation()}
      >
        ✎
      </Link>
      <button
        type="button"
        className="card-action-btn danger"
        title="Apagar"
        onClick={onDelete}
        disabled={busy}
      >
        🗑
      </button>
    </div>
  );
}
