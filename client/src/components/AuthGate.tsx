import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

function AppMark() {
  return (
    <div className="app-mark" aria-label="Encargo">
      <span />
      <i />
    </div>
  );
}

export default function AuthGate() {
  const { enviarEnlaceMagico } = useAuth();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    const { error } = await enviarEnlaceMagico(email.trim());
    setEnviando(false);
    if (error) {
      toast.error(error);
      return;
    }
    setEnviado(true);
    toast.success("Enlace enviado. Revisa tu correo.");
  }

  return (
    <div className="shell" style={{ alignItems: "center", justifyContent: "center" }}>
      <div className="mirror-card" style={{ maxWidth: 420, width: "100%", margin: "0 24px" }}>
        <div className="brand" style={{ marginBottom: 18 }}>
          <AppMark />
          <span>encargo</span>
        </div>
        {enviado ? (
          <>
            <h2>Revisa tu correo</h2>
            <p className="mirror-lead">
              Te hemos enviado un enlace de acceso a <strong>{email}</strong>. Ábrelo desde este mismo dispositivo.
            </p>
          </>
        ) : (
          <>
            <h2>Accede a tu espacio</h2>
            <p className="mirror-lead">Te enviamos un enlace mágico, sin contraseñas que recordar.</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  color: "var(--foreground)",
                  font: "inherit",
                }}
              />
              <button className="primary-button" type="submit" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar enlace de acceso"}
              </button>
            </form>
          </>
        )}
        <div className="trust-note" style={{ marginTop: 20 }}>
          <ShieldCheck size={18} />
          <span>Sin contraseñas almacenadas. El acceso lo gestiona Supabase Auth.</span>
        </div>
      </div>
    </div>
  );
}
