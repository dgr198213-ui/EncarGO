/* Encargo / Taller de confianza: archivo vivo, intake visible y acciones verificables. */
import { useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Check, ChevronRight, Clock3, Copy, FileText, Gauge, History, Layers3, Menu, Plus, RotateCcw, Send, Settings2, ShieldCheck, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";

type Status = "Borrador" | "Listo para confirmar" | "En ejecución" | "Completado";
type Encargo = { id: string; title: string; summary: string; status: Status; date: string; integration: string; cost: string; category: string };

const initialHistory: Encargo[] = [
  { id: "EN-024", title: "Calendario editorial de septiembre", summary: "12 ideas de contenido para una fotógrafa de bodas con tono cercano.", status: "Completado", date: "Hoy, 10:42", integration: "Creative engine", cost: "0,08 €", category: "Contenido" },
  { id: "EN-023", title: "Respuesta a propuesta comercial", summary: "Correo de seguimiento para un cliente de identidad visual, sin sonar insistente.", status: "Completado", date: "Ayer, 16:18", integration: "ChatGPT", cost: "0,03 €", category: "Negocio" },
  { id: "EN-022", title: "Lista de tomas para sesión", summary: "Plan de producción para una sesión de producto en interior con luz natural.", status: "Completado", date: "12 sep 2026", integration: "Creative engine", cost: "0,05 €", category: "Producción" },
];

const examples = ["Preparar una propuesta para un restaurante que quiere renovar su identidad", "Ordenar mis ideas para una newsletter mensual", "Convertir estas notas en un plan de trabajo para mañana"];

function AppMark({ small = false }: { small?: boolean }) {
  return <div className={`app-mark ${small ? "app-mark--small" : ""}`} aria-label="Encargo"><span /><i /></div>;
}

function StatusPill({ status }: { status: Status }) {
  const classes = { Completado: "pill pill--done", "Listo para confirmar": "pill pill--ready", "En ejecución": "pill pill--running", Borrador: "pill pill--draft" };
  return <span className={classes[status]}><span className="pill-dot" />{status}</span>;
}

export default function Home() {
  const [view, setView] = useState<"nuevo" | "historial" | "contexto">("nuevo");
  const [text, setText] = useState("");
  const [step, setStep] = useState<"intake" | "mirror" | "running" | "result">("intake");
  const [history, setHistory] = useState(initialHistory);
  const [selected, setSelected] = useState<Encargo | null>(null);
  const [context, setContext] = useState("Trabajo como directora de arte freelance. Mi tono es claro, cálido y con criterio; no quiero sonar corporativa ni usar frases vacías.");
  const [mobileNav, setMobileNav] = useState(false);

  const draft = useMemo(() => ({
    title: text ? text.split(" ").slice(0, 7).join(" ") + (text.split(" ").length > 7 ? "…" : "") : "Tu próximo encargo",
    objective: text || "Describe una necesidad real de tu negocio creativo y Encargo la convertirá en un siguiente paso claro.",
    route: text.toLowerCase().includes("propuesta") || text.toLowerCase().includes("cliente") ? "Creative engine" : "ChatGPT",
  }), [text]);

  function startMirror() {
    if (!text.trim()) { toast.error("Cuéntame primero qué necesitas resolver."); return; }
    setStep("mirror");
    toast.success("He ordenado tu petición. Revísala antes de enviarla.");
  }

  function confirmOrder() {
    setStep("running");
    window.setTimeout(() => {
      const newItem: Encargo = { id: `EN-${String(history.length + 25).padStart(3, "0")}`, title: draft.title, summary: draft.objective, status: "Completado", date: "Ahora", integration: draft.route, cost: "0,04 €", category: "Nuevo" };
      setHistory((items) => [newItem, ...items]);
      setSelected(newItem);
      setStep("result");
      toast.success("Encargo completado. Ya está en tu histórico.");
    }, 1050);
  }

  function reset() { setText(""); setStep("intake"); setSelected(null); }

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
      <div className="usage-card"><div className="usage-head"><span>Uso este mes</span><Gauge size={16} /></div><strong>7 <small>/ 30 encargos</small></strong><div className="usage-line"><span /></div><p>Plan beta · sin sorpresas</p></div>
      <button className="account"><span className="avatar">DM</span><span><strong>Dani Martín</strong><small>Cuenta personal</small></span><Settings2 size={16} /></button>
    </aside>

    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Abrir menú"><Menu size={20} /></button><div className="breadcrumbs"><span>Tu espacio</span><ChevronRight size={14} /><strong>{view === "nuevo" ? "Nuevo encargo" : view === "historial" ? "Histórico" : "Contexto de negocio"}</strong></div><div className="top-actions"><span className="status-live"><span />Sistema operativo</span><button className="icon-button" aria-label="Ayuda">?</button></div></header>

      {view === "historial" ? <section className="content history-view">
        <div className="page-heading"><div><span className="eyebrow">ARCHIVO VIVO · {history.length} ENCARGOS</span><h1>Lo que ya has puesto<br /><em>en marcha.</em></h1><p>Vuelve a tus decisiones, resultados y contexto sin empezar desde cero.</p></div><button className="primary-button" onClick={() => { setView("nuevo"); reset(); }}><Plus size={17} />Nuevo encargo</button></div>
        <div className="history-list">{history.map((item, index) => <button className={`history-row ${selected?.id === item.id ? "history-row--selected" : ""}`} key={item.id} onClick={() => setSelected(item)}><span className="row-number">{String(history.length - index).padStart(2, "0")}</span><span className="row-main"><strong>{item.title}</strong><small>{item.summary}</small></span><span className="row-meta"><StatusPill status={item.status} /><small>{item.date}</small></span><ArrowUpRight size={18} className="row-arrow" /></button>)}</div>
        {selected && <div className="result-drawer"><div><span className="eyebrow">RESULTADO · {selected.id}</span><h2>{selected.title}</h2><p>{selected.summary}</p></div><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(selected.summary); toast.success("Resumen copiado"); }}><Copy size={16} />Copiar resumen</button></div>}
      </section> : view === "contexto" ? <section className="content context-view"><div className="page-heading"><div><span className="eyebrow">MEMORIA DE NEGOCIO</span><h1>Tu contexto,<br /><em>siempre a mano.</em></h1><p>Encargo lo usa para que cada resultado suene a ti, no a una plantilla.</p></div><div className="context-seal"><ShieldCheck size={21} /><span>Privado<br /><b>solo para ti</b></span></div></div><div className="context-layout"><div className="context-editor"><div className="section-kicker"><span>01</span><h3>Cómo trabajas</h3></div><textarea value={context} onChange={(event) => setContext(event.target.value)} /><div className="editor-footer"><span>Se guarda automáticamente</span><button className="primary-button primary-button--small" onClick={() => toast.success("Contexto actualizado")}>Guardar cambios</button></div></div><aside className="context-aside"><div className="aside-icon"><Sparkles size={18} /></div><h3>Un poco de contexto<br />hace una gran diferencia.</h3><p>Cuanto mejor te conocemos, menos tienes que repetir. Añade ejemplos, palabras que sí usas y las que prefieres evitar.</p><button className="text-button" onClick={() => toast.info("Pronto podrás añadir ejemplos de estilo")}>Añadir un ejemplo <ArrowUpRight size={15} /></button></aside></div></section> : <section className="content new-view">
        <div className="intro"><div className="intro-copy"><span className="eyebrow">NUEVO ENCARGO · PASO {step === "intake" ? "01" : step === "mirror" ? "02" : "03"}</span><h1>{step === "intake" ? <>Cuéntame qué<br /><em>necesitas.</em></> : step === "mirror" ? <>Esto es lo que<br /><em>he entendido.</em></> : step === "running" ? <>Poniendo tu encargo<br /><em>en marcha.</em></> : <>Ya está<br /><em>resuelto.</em></>}</h1><p>{step === "intake" ? "Escríbelo como se lo contarías a alguien de confianza. Yo me ocupo de ordenar el resto." : step === "mirror" ? "Antes de actuar, te devuelvo el encargo traducido a un plan concreto. Corrige lo que haga falta." : step === "running" ? "He enviado la tarea a la herramienta adecuada. Tardará solo unos instantes." : "Aquí tienes el resultado y una copia guardada en tu histórico."}</p></div><div className="intro-art"><img src="/manus-storage/encargo-editorial-collage_2055b393.png" alt="Composición editorial abstracta" /><div className="art-note">IDEA → ACCIÓN<br /><b>sin perder el hilo</b></div></div></div>
        <div className="workbench">
          {step === "intake" && <div className="intake-panel"><div className="panel-top"><span className="step-label"><span>01</span> Escríbelo en tus palabras</span><span className="hint">Sin prompts. Sin formato.</span></div><textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Ej. Necesito preparar una propuesta para..." /><div className="suggestions"><span>¿No sabes por dónde empezar?</span>{examples.map((example) => <button key={example} onClick={() => setText(example)}>{example}<ArrowUpRight size={14} /></button>)}</div><div className="intake-footer"><span><ShieldCheck size={15} /> Tu información se trata como privada</span><button className="primary-button" onClick={startMirror}>Ordenar mi encargo <Send size={16} /></button></div></div>}
          {step === "mirror" && <div className="mirror-panel"><div className="mirror-card"><div className="mirror-card-head"><span className="step-label"><span>02</span> Espejo de confirmación</span><span className="confidence"><span />Entendimiento alto</span></div><h2>{draft.title}</h2><p className="mirror-lead">{draft.objective}</p><div className="mirror-details"><div><small>OBJETIVO</small><strong>Convertir tu necesidad en una entrega concreta y utilizable.</strong></div><div><small>RUTA ELEGIDA</small><strong className="route"><Wand2 size={15} />{draft.route}</strong></div><div><small>ESTIMACIÓN</small><strong>~ 30 segundos · 0,04 €</strong></div></div></div><div className="mirror-actions"><button className="secondary-button" onClick={() => setStep("intake")}><RotateCcw size={16} />Editar petición</button><button className="primary-button" onClick={confirmOrder}>Confirmar y ejecutar <ArrowUpRight size={16} /></button></div><div className="trust-note"><ShieldCheck size={18} /><span><strong>Tú tienes el control.</strong> Esta acción no publica, envía ni realiza pagos. Si algo pudiera tener consecuencias externas, te pediríamos una confirmación adicional.</span></div></div>}
          {step === "running" && <div className="progress-panel"><div className="loading-orb"><Sparkles size={25} /></div><div className="progress-copy"><span className="eyebrow">EJECUCIÓN EN CURSO</span><h2>Conectando las piezas.</h2><p>Preparando el contexto y enviándolo a <strong>{draft.route}</strong>.</p><div className="progress-track"><span /></div><small>Analizando · 1 de 3</small></div></div>}
          {step === "result" && selected && <div className="result-panel"><div className="result-top"><div><span className="step-label"><span>03</span> Resultado listo</span><StatusPill status="Completado" /></div><button className="close-result" onClick={reset}><X size={18} /></button></div><h2>{selected.title}</h2><div className="result-content"><p>He preparado una primera versión a partir de tu contexto y la petición original. Puedes copiarla, ajustarla o crear un nuevo encargo a partir de aquí.</p><div className="result-paper"><div className="paper-label">ENTREGA · {selected.integration.toUpperCase()}</div><h3>{selected.title}</h3><p>{selected.summary}</p><p>La propuesta mantiene un tono claro y cercano, prioriza una idea principal y deja espacio para que puedas adaptarla con tu propio criterio.</p><div className="paper-line" /><span>Generado para Dani Martín · {selected.date}</span></div></div><div className="result-actions"><button className="secondary-button" onClick={() => { navigator.clipboard?.writeText(selected.summary); toast.success("Resultado copiado"); }}><Copy size={16} />Copiar resultado</button><button className="primary-button" onClick={reset}><Plus size={16} />Nuevo encargo</button></div></div>}
        </div>
        <div className="below-fold"><div className="trust-strip"><div><ShieldCheck size={20} /><span><strong>Siempre puedes revisar antes de ejecutar.</strong><br />El espejo de confirmación es parte de cada encargo.</span></div><div><Clock3 size={20} /><span><strong>Sin esperas innecesarias.</strong><br />La ejecución ocurre en segundo plano.</span></div><div><BriefcaseBusiness size={20} /><span><strong>Tu contexto trabaja contigo.</strong><br />No tendrás que repetir lo importante.</span></div></div></div>
      </section>}
    </main>
  </div>;
}
