/* Encargo / Taller de confianza: archivo vivo, intake visible y acciones verificables. */
import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, Clock3, Copy, Gauge, History, Layers3, Menu, Plus, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { crearIntake, confirmarEncargo, listarEncargos } from "@/lib/api";
import type { Encargo } from "@shared/types";

const examples = ["Preparar una propuesta para un restaurante que quiere renovar su identidad", "Ordenar mis ideas para una newsletter mensual", "Convertir estas notas en un plan de trabajo para mañana"];

const ESTADO_INFO: Record<Encargo["estado"], { label: string; pillClass: string }> = {
  borrador: { label: "Borrador", pillClass: "pill pill--draft" },
  pendiente_confirmacion: { label: "Listo para confirmar", pillClass: "pill pill--ready" },
  confirmado: { label: "Confirmado · en cola", pillClass: "pill pill--running" },
  ejecutando: { label: "Ejecutando", pillClass: "pill pill--running" },
  completado: { label: "Completado", pillClass: "pill pill--done" },
  rechazado: { label: "Rechazado", pillClass: "pill pill--draft" },
};

function AppMark({ small = false }: { small?: boolean }) {
  return <div className={`app-mark ${small ? "app-mark--small" : ""}`} aria-label="Encargo"><span /><i /></div>;
}

function StatusPill({ estado }: { estado: Encargo["estado"] }) {
  const info = ESTADO_INFO[estado];
  return <span className={info.pillClass}><span className="pill-dot" />{info.label}</span>;
}

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const { cerrarSesion } = useAuth();
  const [view, setView] = useState<"nuevo" | "historial" | "contexto">("nuevo");
  const [text, setText] = useState("");
  const [step, setStep] = useState<"intake" | "analizando" | "mirror" | "confirmando" | "confirmado">("intake");
  const [history, setHistory] = useState<Encargo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [current, setCurrent] = useState<Encargo | null>(null);
  const [selected, setSelected] = useState<Encargo | null>(null);
  const [context, setContext] = useState("Trabajo como directora de arte freelance. Mi tono es claro, cálido y con criterio; no quiero sonar corporativa ni usar frases vacías.");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, []);

  async function cargarHistorial() {
    setLoadingHistory(true);
    try {
      const encargos = await listarEncargos();
      setHistory(encargos);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function startMirror() {
    if (!text.trim()) { toast.error("Cuéntame primero qué necesitas resolver."); return; }
    setStep("analizando");
    try {
      const encargo = await crearIntake({ canalEntrada: "chat", inputBruto: text });
      setCurrent(encargo);
      setStep("mirror");
      toast.success("He ordenado tu petición. Revísala antes de confirmarla.");
    } catch (err) {
      toast.error((err as Error).message);
      setStep("intake");
    }
  }

  async function confirmOrder() {
    if (!current) return;
    setStep("confirmando");
    try {
      const actualizado = await confirmarEncargo(current.id);
      setCurrent(actualizado);
      setSelected(actualizado);
      setHistory((items) => [actualizado, ...items.filter((i) => i.id !== actualizado.id)]);
      setStep("confirmado");
      toast.success("Encargo confirmado. Entrará en la cola de ejecución en cuanto esté disponible.");
    } catch (err) {
      toast.error((err as Error).message);
      setStep("mirror");
    }
  }

  function reset() { setText(""); setStep("intake"); setCurrent(null); }

  const confianzaLabel = current?.confianzaClasificacion == null ? "" : current.confianzaClasificacion >= 0.8 ? "Entendimiento alto" : current.confianzaClasificacion >= 0.5 ? "Entendimiento medio" : "Entendimiento bajo — revisa con cuidado";
  const rutaPrincipal = current?.pasos[0]?.herramientaDestino ?? "IA";
  const pasoActivoLabel = step === "intake" ? "01" : step === "analizando" ? "01" : step === "mirror" ? "02" : "03";

  return <div className="shell">
    <aside className={`sidebar ${mobileNav ? "sidebar--open" : ""}`}>
      <div className="brand"><AppMark /><span>encargo</span><button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="Cerrar menú"><X size={18} /></button></div>
      <div className="workspace-label">Tu espacio <span>⌘ K</span></div>
      <nav className="nav" aria-label="Navegación principal">
        <button className={view === "nuevo" ? "nav-item nav-item--active" : "nav-item"} onClick={() => { setView("nuevo"); setMobileNav(false); }}><Plus size={18} />Nuevo encargo</button>
        <button className={view === "historial" ? "nav-item nav-item--active" : "nav-item"} onClick={() => { setView("historial"); setMobileNav(false); }}><History size={18} />Histórico <b>{history.length}</b></button>
        <button className={view === "contexto" ? "nav-item nav-item--active" : "nav-item"} onClick={() => { setView("contexto"); setMobileNav(false); }}><Layers3 size={18} />Contexto de negocio</button>
      </nav>
      <div className="sidebar-spacer" />
      <div className="usage-card"><div className="usage-head"><span>Uso este mes</span><Gauge size={16} /></div><strong>{history.length} <small>/ 30 encargos</small></strong><div className="usage-line"><span /></div><p>Plan beta · sin sorpresas</p></div>
      <button className="account" onClick={cerrarSesion}><span className="avatar">DM</span><span><strong>Tu cuenta</strong><small>Cerrar sesión</small></span><Settings2 size={16} /></button>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menú"><Menu size={20} /></button><div className="breadcrumbs"><span>Tu espacio</span><ChevronRight size={14} /><strong>{view === "nuevo" ? "Nuevo encargo" : view === "historial" ? "Histórico" : "Contexto de negocio"}</strong></div><div className="top-actions"><span className="status-live"><span />Sistema operativo</span><button className="icon-button" aria-label="Ayuda">?</button></div></header>

      {view === "historial" ? <section className="content history-view">
        <div className="page-heading"><div><span className="eyebrow">ARCHIVO VIVO · {history.length} ENCARGOS</span><h1>Lo que ya has puesto<br /><em>en marcha.</em></h1><p>Vuelve a tus decisiones, resultados y contexto sin empezar desde cero.</p></div><button className="primary-button" onClick={() => { setView("nuevo"); reset(); }}><Plus size={17} />Nuevo encargo</button></div>
        {loadingHistory ? <p className="mirror-lead">Cargando histórico...</p> : history.length === 0 ? <p className="mirror-lead">Todavía no tienes encargos. Crea el primero desde "Nuevo encargo".</p> : <div className="history-list">{history.map((item, index) => <button className={`history-row ${selected?.id === item.id ? "history-row--selected" : ""}`} key={item.id} onClick={() => setSelected(item)}><span className="row-number">{String(history.length - index).padStart(2, "0")}</span><span className="row-main"><strong>{item.resumenLegible ?? item.inputBruto ?? "Encargo sin título"}</strong><small>{item.pasos[0]?.herramientaDestino ?? item.tipo}</small></span><span className="row-meta"><StatusPill estado={item.estado} /><small>{formatearFecha(item.creadoEn)}</small></span><ArrowUpRight size={18} className="row-arrow" /></button>)}</div>}
        {selected && <div className="result-drawer"><div><span className="eyebrow">RESULTADO · {selected.id.slice(0, 8)}</span><h2>{selected.resumenLegible}</h2><p>{selected.pasos.map((p) => p.descripcion).join(" · ")}</p></div><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(selected.resumenLegible ?? ""); toast.success("Resumen copiado"); }}><Copy size={16} />Copiar resumen</button></div>}
      </section> : view === "contexto" ? <section className="content context-view"><div className="page-heading"><div><span className="eyebrow">MEMORIA DE NEGOCIO</span><h1>Tu contexto,<br /><em>siempre a mano.</em></h1><p>Encargo lo usa para que cada resultado suene a ti, no a una plantilla.</p></div><div className="context-seal"><ShieldCheck size={21} /><span>Privado<br /><b>solo para ti</b></span></div></div><div className="context-layout"><div className="context-editor"><div className="section-kicker"><span>01</span><h3>Cómo trabajas</h3></div><textarea value={context} onChange={(event) => setContext(event.target.value)} /><div className="editor-footer"><span>Pendiente: persistir en Supabase</span><button className="primary-button primary-button--small" onClick={() => toast.info("El guardado real del contexto es una fase posterior")}>Guardar cambios</button></div></div><aside className="context-aside"><div className="aside-icon"><Sparkles size={18} /></div><h3>Un poco de contexto<br />hace una gran diferencia.</h3><p>Cuanto mejor te conocemos, menos tienes que repetir. Añade ejemplos, palabras que sí usas y las que prefieres evitar.</p><button className="text-button" onClick={() => toast.info("Pronto podrás añadir ejemplos de estilo")}>Añadir un ejemplo <ArrowUpRight size={15} /></button></aside></div></section> : <section className="content new-view">
        <div className="intro"><div className="intro-copy"><span className="eyebrow">NUEVO ENCARGO · PASO {pasoActivoLabel}</span><h1>{step === "intake" || step === "analizando" ? <>Cuéntame qué<br /><em>necesitas.</em></> : step === "mirror" ? <>Esto es lo que<br /><em>he entendido.</em></> : step === "confirmando" ? <>Confirmando<br /><em>tu encargo.</em></> : <>Encargo<br /><em>confirmado.</em></>}</h1><p>{step === "intake" ? "Escríbelo como se lo contarías a alguien de confianza. Yo me ocupo de ordenar el resto." : step === "analizando" ? "Clasificando tu petición y preparando los pasos concretos." : step === "mirror" ? "Antes de actuar, te devuelvo el encargo traducido a un plan concreto." : step === "confirmando" ? "Guardando tu confirmación." : "Ha entrado en la cola. La ejecución automática llegará en una fase posterior."}</p></div><div className="intro-art"><div className="intro-art-placeholder" aria-hidden="true" /><div className="art-note">IDEA → ACCIÓN<br /><b>sin perder el hilo</b></div></div></div>
        <div className="workbench">
          {step === "intake" && <div className="intake-panel"><div className="panel-top"><span className="step-label"><span>01</span> Escríbelo en tus palabras</span><span className="hint">Sin prompts. Sin formato.</span></div><textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Ej. Necesito preparar una propuesta para..." /><div className="suggestions"><span>¿No sabes por dónde empezar?</span>{examples.map((example) => <button key={example} onClick={() => setText(example)}>{example}<ArrowUpRight size={14} /></button>)}</div><div className="intake-footer"><span><ShieldCheck size={15} /> Tu información se trata como privada</span><button className="primary-button" onClick={startMirror}>Ordenar mi encargo <Send size={16} /></button></div></div>}
          {step === "analizando" && <div className="progress-panel"><div className="loading-orb"><Sparkles size={25} /></div><div className="progress-copy"><span className="eyebrow">ANALIZANDO</span><h2>Clasificando tu petición.</h2><p>El Analista de Intake está extrayendo los pasos concretos.</p><div className="progress-track"><span /></div></div></div>}
          {step === "mirror" && current && <div className="mirror-panel"><div className="mirror-card"><div className="mirror-card-head"><span className="step-label"><span>02</span> Espejo de confirmación</span><span className="confidence"><span />{confianzaLabel}</span></div><h2>{current.resumenLegible}</h2><div className="mirror-details"><div><small>TIPO DE ENCARGO</small><strong>{current.tipo}</strong></div><div><small>RUTA ELEGIDA</small><strong className="route"><Wand2 size={15} />{rutaPrincipal}</strong></div><div><small>PASOS</small><strong>{current.pasos.length} {current.pasos.length === 1 ? "paso" : "pasos"}</strong></div></div><ul className="mirror-steps" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>{current.pasos.map((p) => <li key={p.id} style={{ fontSize: 14 }}>· {p.descripcion} <em style={{ opacity: .6 }}>({p.herramientaDestino})</em></li>)}</ul></div><div className="mirror-actions"><button className="secondary-button" onClick={() => setStep("intake")}><RotateCcw size={16} />Editar petición</button><button className="primary-button" onClick={confirmOrder}>Confirmar <ArrowUpRight size={16} /></button></div><div className="trust-note"><ShieldCheck size={18} /><span>{current.requiereConfirmacionExplicita ? <><strong>Esta acción tiene consecuencias externas.</strong> Revisa cada paso antes de confirmar.</> : <><strong>Encargo de bajo riesgo.</strong> Un solo paso reversible — confirmar es suficiente.</>}</span></div></div>}
          {step === "confirmando" && <div className="progress-panel"><div className="loading-orb"><Sparkles size={25} /></div><div className="progress-copy"><span className="eyebrow">CONFIRMANDO</span><h2>Un momento.</h2><div className="progress-track"><span /></div></div></div>}
          {step === "confirmado" && current && <div className="result-panel"><div className="result-top"><div><span className="step-label"><span>03</span> Confirmado</span><StatusPill estado={current.estado} /></div><button className="close-result" onClick={reset}><X size={18} /></button></div><h2>{current.resumenLegible}</h2><div className="result-content"><p>Tu encargo ha quedado confirmado y guardado en el histórico. La ejecución automática contra {rutaPrincipal} todavía no está conectada — llegará en la siguiente fase del desarrollo.</p><div className="result-paper"><div className="paper-label">ENCARGO · {rutaPrincipal.toUpperCase()}</div><h3>{current.resumenLegible}</h3><p>{current.pasos.map((p) => p.descripcion).join(" · ")}</p><div className="paper-line" /><span>Confirmado · {formatearFecha(current.confirmadoEn ?? current.creadoEn)}</span></div></div><div className="result-actions"><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(current.resumenLegible ?? ""); toast.success("Resumen copiado"); }}><Copy size={16} />Copiar resumen</button><button className="primary-button" onClick={reset}><Plus size={16} />Nuevo encargo</button></div></div>}
        </div>
        <div className="below-fold"><div className="trust-strip"><div><ShieldCheck size={20} /><span><strong>Siempre puedes revisar antes de ejecutar.</strong><br />El espejo de confirmación es parte de cada encargo.</span></div><div><Clock3 size={20} /><span><strong>Sin esperas innecesarias.</strong><br />La ejecución ocurre en segundo plano.</span></div><div><BriefcaseBusiness size={20} /><span><strong>Tu contexto trabaja contigo.</strong><br />No tendrás que repetir lo importante.</span></div></div></div>
      </section>}
    </main>
  </div>;
}
