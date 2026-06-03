"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/admin");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Cadastro feito. Se a confirmação por email estiver ativa, verifique sua caixa antes de entrar.");
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap view">
      <div className="auth-screen">
        <div className="auth-lock">🔒</div>
        <span className="eyebrow">Área da equipe</span>
        <h1 className="display">
          Painel <em>Shakers</em>
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "42ch", margin: "6px auto 0" }}>
          {mode === "signin"
            ? "Entre com seu email da equipe pra acessar os moodboards."
            : "Crie sua conta de equipe. Depois é só fazer login."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <input
            className="input"
            type="email"
            placeholder="email@shakers.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
          {err && <div className="auth-err">{err}</div>}
          {msg && <div style={{ color: "var(--g-700)", fontSize: 14, marginTop: 12 }}>{msg}</div>}
        </form>

        <p style={{ marginTop: 18, fontSize: 14, color: "var(--muted)" }}>
          {mode === "signin" ? "Primeira vez aqui? " : "Já tem conta? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setErr(null);
              setMsg(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--g-600)",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              font: "inherit",
            }}
          >
            {mode === "signin" ? "Criar conta da equipe" : "Fazer login"}
          </button>
        </p>
      </div>
    </main>
  );
}
