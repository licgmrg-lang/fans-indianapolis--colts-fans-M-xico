"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Heart,
  History,
  Home,
  IdCard,
  ImagePlus,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  MapPin,
  Medal,
  Menu,
  MessageCircle,
  Plus,
  RotateCcw,
  ScanLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Upload,
  UserCog,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { CLEAN_DATA, LocalStore, makeId, OWNER_EMAIL, type SessionUser } from "./store";
import {
  CITIES,
  type AppData,
  type CommunityEvent,
  type FeedPost,
  type Member,
  type Role,
} from "./types";

type TabId = "home" | "card" | "events" | "feed" | "picks" | "history" | "admin";
type ToastTone = "success" | "info" | "danger";
type Toast = { message: string; tone?: ToastTone } | null;

const NAV_ITEMS: { id: TabId; label: string; mobileLabel: string; icon: typeof Home }[] = [
  { id: "home", label: "Inicio", mobileLabel: "Inicio", icon: Home },
  { id: "card", label: "Mi credencial", mobileLabel: "Credencial", icon: IdCard },
  { id: "events", label: "Eventos y sorteos", mobileLabel: "Eventos", icon: CalendarDays },
  { id: "feed", label: "Comunidad", mobileLabel: "Muro", icon: Users },
  { id: "picks", label: "Quiniela", mobileLabel: "Quiniela", icon: Trophy },
  { id: "history", label: "Nuestra historia", mobileLabel: "Historia", icon: BookOpen },
  { id: "admin", label: "Administración", mobileLabel: "Admin", icon: ShieldCheck },
];

const REACTIONS: { key: keyof FeedPost["reactions"]; label: string; emoji: string }[] = [
  { key: "goColts", label: "Go Colts", emoji: "🏈" },
  { key: "horseshoe", label: "Horseshoe", emoji: "💙" },
  { key: "welcome", label: "Bienvenido", emoji: "👏" },
  { key: "letsGo", label: "Let's Go", emoji: "🔥" },
  { key: "family", label: "Familia", emoji: "🙌" },
  { key: "mvp", label: "MVP", emoji: "⭐" },
];

function formatDate(value: string, withTime = true) {
  if (!value) return "Fecha pendiente";
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function Avatar({
  member,
  size = "medium",
}: {
  member: Pick<Member, "fullName" | "avatarUrl">;
  size?: "small" | "medium" | "large";
}) {
  return member.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`avatar avatar-${size}`} src={member.avatarUrl} alt={`Foto de ${member.fullName}`} />
  ) : (
    <span className={`avatar avatar-${size} avatar-fallback`} aria-label={`Iniciales de ${member.fullName}`}>
      {initials(member.fullName)}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof CalendarDays;
  title: string;
  body: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={23} />
      </span>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LoginScreen({
  data,
  onEnter,
}: {
  data: AppData;
  onEnter: (member: Member, updated?: AppData) => void;
}) {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [fullName, setFullName] = useState("");
  const [cityId, setCityId] = useState("cdmx");
  const [photo, setPhoto] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Selecciona un archivo de imagen.");
    if (file.size > 2_500_000) return setError("La imagen debe pesar menos de 2.5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) return setError("Escribe un correo válido.");
    const existing = data.members.find((member) => member.email.toLowerCase() === normalized);
    if (!registering) {
      if (!existing) {
        setError("No encontramos este correo. Regístrate para crear tu credencial.");
        return;
      }
      onEnter(existing);
      return;
    }
    if (!fullName.trim()) return setError("Escribe tu nombre completo.");
    if (existing) {
      setError("Este correo ya pertenece a un miembro. Inicia sesión.");
      return;
    }
    const member: Member = {
      uid: makeId("member"),
      email: normalized,
      fullName: fullName.trim(),
      avatarUrl: photo || photoUrl.trim(),
      memberNumber: Math.max(1000, ...data.members.map((item) => item.memberNumber)) + 1,
      favoritePlayer: "Por elegir",
      cityId,
      state: CITIES.find((city) => city.id === cityId)?.name ?? "México",
      fanSinceYear: new Date().getFullYear(),
      status: "active",
      role: "member",
      createdAt: new Date().toISOString(),
      seasonsCount: 1,
      attendancesCount: 0,
      horseshoes: 0,
      achievements: ["Primer paso en la familia"],
      firstRememberedGame: "Por compartir",
    };
    const updated: AppData = {
      ...data,
      members: [...data.members, member],
      auditLogs: [
        {
          id: makeId("audit"),
          adminId: member.uid,
          adminName: member.fullName,
          action: "Registro de nuevo miembro",
          targetId: member.uid,
          timestamp: new Date().toISOString(),
        },
        ...data.auditLogs,
      ],
    };
    onEnter(member, updated);
  };

  return (
    <main className="login-shell">
      <div className="login-atmosphere" aria-hidden="true">
        <span className="stadium-line stadium-line-one" />
        <span className="stadium-line stadium-line-two" />
        <span className="stadium-glow" />
      </div>
      <section className="login-story">
        <div className="brand-lockup brand-lockup-light">
          <span className="brand-mark">U</span>
          <span>
            <strong>COLTS FANS</strong>
            <small>MÉXICO · PROJECT HORSESHOE</small>
          </span>
        </div>
        <div className="login-copy">
          <span className="hero-kicker">La casa digital de la familia Colt</span>
          <h1>Los recuerdos nos reúnen. La herradura nos identifica.</h1>
          <p>
            Credencial, watch parties, quinielas y memorias de una comunidad que encontró amigos
            gracias a los Indianapolis Colts.
          </p>
          <div className="chapter-row">
            {CITIES.map((city, index) => (
              <span key={city.id}>
                <b>{String(index + 1).padStart(2, "0")}</b> {city.name}
              </span>
            ))}
          </div>
        </div>
        <blockquote>“No somos un club. Somos una familia.”</blockquote>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-heading">
            <span className="mini-shield">
              <LockKeyhole size={18} />
            </span>
            <div>
              <span className="eyebrow">{registering ? "Nueva membresía" : "Acceso de miembros"}</span>
              <h2>{registering ? "Crea tu credencial" : "Bienvenido a casa"}</h2>
            </div>
          </div>

          <form onSubmit={submit} className="form-stack">
            {registering && (
              <>
                <div
                  className="photo-drop"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    acceptImage(event.dataTransfer.files[0]);
                  }}
                >
                  {photo || photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo || photoUrl} alt="Vista previa de la credencial" />
                  ) : (
                    <span className="photo-placeholder">
                      <Camera size={24} />
                    </span>
                  )}
                  <div>
                    <strong>Foto de tu credencial</strong>
                    <small>Arrastra una imagen o selecciónala</small>
                  </div>
                  <button type="button" className="button button-small button-ghost" onClick={() => fileRef.current?.click()}>
                    <Upload size={15} /> Elegir
                  </button>
                  <input
                    ref={fileRef}
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(event) => acceptImage(event.target.files?.[0])}
                  />
                </div>
                <label>
                  Nombre completo
                  <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Tu nombre y apellidos" />
                </label>
                <label>
                  Sede
                  <select value={cityId} onChange={(event) => setCityId(event.target.value)}>
                    {CITIES.map((city) => (
                      <option value={city.id} key={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  URL de fotografía <span className="optional">opcional</span>
                  <div className="input-with-icon">
                    <LinkIcon size={16} />
                    <input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
                  </div>
                </label>
              </>
            )}
            <label>
              Correo electrónico
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="button button-primary button-wide" type="submit">
              {registering ? "Crear mi membresía" : "Entrar a la comunidad"} <ChevronRight size={17} />
            </button>
          </form>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setRegistering((value) => !value);
              setError("");
            }}
          >
            {registering ? "Ya tengo credencial" : "Soy nuevo · quiero registrarme"}
          </button>
          <p className="prototype-note">Prototipo privado · acceso local sin contraseña</p>
        </div>
      </section>
    </main>
  );
}

export default function HorseshoeApp() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(CLEAN_DATA);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<Role>("primary_owner");
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setData(LocalStore.load());
      const stored = LocalStore.session();
      setSession(stored);
      if (stored?.email === OWNER_EMAIL) setSimulatedRole(stored.role);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (ready) LocalStore.save(data);
  }, [data, ready]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const currentUser = session ? data.members.find((member) => member.uid === session.uid) ?? null : null;
  const isOwnerIdentity = currentUser?.email.toLowerCase() === OWNER_EMAIL;
  const effectiveRole: Role = isOwnerIdentity ? simulatedRole : currentUser?.role ?? "member";
  const isAdmin = effectiveRole === "admin" || effectiveRole === "primary_owner";

  const enter = (member: Member, updated?: AppData) => {
    if (updated) setData(updated);
    const nextSession = { uid: member.uid, email: member.email, role: member.role };
    LocalStore.setSession(nextSession);
    setSession(nextSession);
    setSimulatedRole(member.role);
    setActiveTab("home");
  };

  const notify = (message: string, tone: ToastTone = "success") => setToast({ message, tone });

  const audit = (action: string, targetId: string) => ({
    id: makeId("audit"),
    adminId: currentUser?.uid ?? "system",
    adminName: currentUser?.fullName ?? "Sistema",
    action,
    targetId,
    timestamp: new Date().toISOString(),
  });

  const updateCurrentMember = (patch: Partial<Member>) => {
    if (!currentUser) return;
    setData((previous) => ({
      ...previous,
      members: previous.members.map((member) => (member.uid === currentUser.uid ? { ...member, ...patch } : member)),
      auditLogs: [audit("Actualización de perfil", currentUser.uid), ...previous.auditLogs],
    }));
    notify("Tu credencial fue actualizada.");
  };

  const logout = () => {
    LocalStore.setSession(null);
    setSession(null);
    setActiveTab("home");
    setMobileMenu(false);
  };

  if (!ready) return <div className="app-loading">Preparando la casa de la familia Colt…</div>;
  if (!session || !currentUser) return <LoginScreen data={data} onEnter={enter} />;

  const availableNav = NAV_ITEMS.filter((item) => item.id !== "admin" || isAdmin);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-lockup">
            <span className="brand-mark">U</span>
            <span>
              <strong>COLTS FANS</strong>
              <small>MÉXICO</small>
            </span>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-member">
          <Avatar member={currentUser} />
          <div>
            <strong>{currentUser.fullName}</strong>
            <span>Miembro #{currentUser.memberNumber}</span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {availableNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeTab === item.id ? "active" : ""}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.id === "feed" && data.feedPosts.some((post) => post.status === "pending") && isAdmin && (
                  <b className="nav-badge">{data.feedPosts.filter((post) => post.status === "pending").length}</b>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="season-chip">Temporada 2026</span>
          <button onClick={logout}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Abrir menú">
            <Menu size={21} />
          </button>
          <div className="topbar-context">
            <span>{CITIES.find((city) => city.id === currentUser.cityId)?.name ?? "México"}</span>
            <b>La herradura nos reúne</b>
          </div>
          <div className="topbar-actions">
            {isOwnerIdentity && (
              <label className="role-switch">
                <Crown size={15} />
                <span>Rol simulado</span>
                <select
                  aria-label="Rol simulado"
                  value={simulatedRole}
                  onChange={(event) => {
                    const role = event.target.value as Role;
                    setSimulatedRole(role);
                    if (role === "member" && activeTab === "admin") setActiveTab("home");
                    notify(`Vista cambiada a ${role}`, "info");
                  }}
                >
                  <option value="primary_owner">Primary Owner</option>
                  <option value="admin">Administrador</option>
                  <option value="member">Miembro</option>
                </select>
              </label>
            )}
            <button className="icon-button notification-button" aria-label="Notificaciones">
              <Bell size={19} />
              <span />
            </button>
            <Avatar member={currentUser} size="small" />
          </div>
        </header>

        <main className="page-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "home" && (
                <Dashboard
                  data={data}
                  member={currentUser}
                  setTab={setActiveTab}
                  isAdmin={isAdmin}
                />
              )}
              {activeTab === "card" && <ProfileCard member={currentUser} onUpdate={updateCurrentMember} />}
              {activeTab === "events" && (
                <EventsModule
                  data={data}
                  setData={setData}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  audit={audit}
                  notify={notify}
                />
              )}
              {activeTab === "feed" && (
                <CommunityFeed
                  data={data}
                  setData={setData}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  audit={audit}
                  notify={notify}
                />
              )}
              {activeTab === "picks" && (
                <PredictionsModule data={data} setData={setData} currentUser={currentUser} notify={notify} />
              )}
              {activeTab === "history" && (
                <HistoryModule
                  data={data}
                  setData={setData}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  notify={notify}
                />
              )}
              {activeTab === "admin" && isAdmin && (
                <AdminModule
                  data={data}
                  setData={setData}
                  currentUser={currentUser}
                  isOwnerIdentity={isOwnerIdentity}
                  notify={notify}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="bottom-nav" aria-label="Navegación móvil">
          {availableNav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activeTab === item.id ? "active" : ""} onClick={() => setActiveTab(item.id)}>
                <Icon size={19} />
                <span>{item.mobileLabel}</span>
              </button>
            );
          })}
          <button onClick={() => setMobileMenu(true)}>
            <Menu size={19} />
            <span>Más</span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileMenu && <motion.button className="scrim" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)} />}
        {toast && (
          <motion.div
            className={`toast toast-${toast.tone ?? "success"}`}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {toast.tone === "danger" ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dashboard({
  data,
  member,
  setTab,
  isAdmin,
}: {
  data: AppData;
  member: Member;
  setTab: (tab: TabId) => void;
  isAdmin: boolean;
}) {
  const upcoming = [...data.events]
    .filter((event) => event.registrationOpen)
    .sort((a, b) => +new Date(a.matchDate) - +new Date(b.matchDate))[0];
  const approvedPosts = data.feedPosts.filter((post) => post.status === "approved");
  const attendance = data.attendances.filter((item) => item.memberId === member.uid).length;

  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Sparkles size={15} /> Bienvenido a casa
          </span>
          <h1>Hola, {member.fullName.split(" ")[0]}.</h1>
          <p>Todo lo que vivimos juntos, en un solo lugar.</p>
          <div className="hero-actions">
            <button className="button button-light" onClick={() => setTab("card")}>
              <IdCard size={17} /> Ver mi credencial
            </button>
            <button className="button button-outline-light" onClick={() => setTab("events")}>
              Próximos eventos <ChevronRight size={17} />
            </button>
          </div>
        </div>
        <div className="hero-horseshoe" aria-hidden="true">
          <span className="horse-outer">U</span>
          <span className="hero-number">#{member.memberNumber}</span>
        </div>
      </section>

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-icon stat-blue">
            <CalendarDays size={20} />
          </span>
          <div>
            <strong>{attendance}</strong>
            <span>Asistencias</span>
          </div>
          <small>Temporada actual</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-gold">
            <Award size={20} />
          </span>
          <div>
            <strong>{member.horseshoes}</strong>
            <span>Herraduras</span>
          </div>
          <small>Puntos de familia</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-sky">
            <Trophy size={20} />
          </span>
          <div>
            <strong>{data.predictions.filter((prediction) => prediction.memberId === member.uid).reduce((sum, item) => sum + item.pointsEarned, 0)}</strong>
            <span>Puntos Pick&apos;em</span>
          </div>
          <small>Ranking amistoso</small>
        </article>
        <article className="stat-card">
          <span className="stat-icon stat-silver">
            <Users size={20} />
          </span>
          <div>
            <strong>{data.members.filter((item) => item.status === "active").length}</strong>
            <span>Miembros</span>
          </div>
          <small>En cuatro ciudades</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="surface upcoming-card">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Siguiente reunión</span>
              <h2>{upcoming ? upcoming.title : "La próxima historia está por comenzar"}</h2>
            </div>
            <span className="status-pill">{upcoming ? "Registro abierto" : "Sin publicar"}</span>
          </div>
          {upcoming ? (
            <div className="event-feature">
              <div className="date-block">
                <strong>{new Date(upcoming.matchDate).getDate()}</strong>
                <span>{new Date(upcoming.matchDate).toLocaleDateString("es-MX", { month: "short" })}</span>
              </div>
              <div className="event-feature-copy">
                <p>
                  <Clock3 size={16} /> {formatDate(upcoming.matchDate)}
                </p>
                <p>
                  <MapPin size={16} /> {upcoming.locationName}
                </p>
              </div>
              <button className="button button-primary" onClick={() => setTab("events")}>
                Ver evento
              </button>
            </div>
          ) : (
            <div className="event-placeholder">
              <div className="field-lines" aria-hidden="true" />
              <p>
                {isAdmin
                  ? "Publica el primer watch party desde Eventos."
                  : "El comité publicará aquí el siguiente watch party."}
              </p>
              <button className="text-link" onClick={() => setTab("events")}>
                Ir al calendario <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>

        <section className="surface quick-card">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Accesos rápidos</span>
              <h2>Tu día de partido</h2>
            </div>
          </div>
          <div className="quick-grid">
            {[
              { icon: ScanLine, title: "Check-in", body: "Presenta tu QR", tab: "card" as TabId },
              { icon: Trophy, title: "Quiniela", body: "Registra tu marcador", tab: "picks" as TabId },
              { icon: MessageCircle, title: "Muro", body: "Comparte un recuerdo", tab: "feed" as TabId },
              { icon: BookOpen, title: "Historia", body: "Deja tu mensaje", tab: "history" as TabId },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} onClick={() => setTab(item.tab)}>
                  <span>
                    <Icon size={19} />
                  </span>
                  <b>{item.title}</b>
                  <small>{item.body}</small>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="surface">
        <div className="surface-heading">
          <div>
            <span className="eyebrow">Lo último en la familia</span>
            <h2>Memorias compartidas</h2>
          </div>
          <button className="text-link" onClick={() => setTab("feed")}>
            Ver muro <ChevronRight size={15} />
          </button>
        </div>
        {approvedPosts.length ? (
          <div className="memory-row">
            {approvedPosts.slice(0, 3).map((post) => (
              <article key={post.id}>
                <div className="memory-author">
                  <Avatar member={{ fullName: post.authorName, avatarUrl: post.authorAvatar }} size="small" />
                  <span>
                    <b>{post.authorName}</b>
                    <small>{formatDate(post.createdAt, false)}</small>
                  </span>
                </div>
                <p>{post.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={Heart} title="El muro espera su primera memoria" body="Comparte una foto, una anécdota o ese partido que nunca olvidarás." />
        )}
      </section>
    </div>
  );
}

function ProfileCard({ member, onUpdate }: { member: Member; onUpdate: (patch: Partial<Member>) => void }) {
  const [photoUrl, setPhotoUrl] = useState(member.avatarUrl);
  const [favoritePlayer, setFavoritePlayer] = useState(member.favoritePlayer);
  const [firstGame, setFirstGame] = useState(member.firstRememberedGame);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/") || file.size > 2_500_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      setPhotoUrl(value);
      onUpdate({ avatarUrl: value });
    };
    reader.readAsDataURL(file);
  };

  const qrValue = `COLTSMX|${member.uid}|${member.memberNumber}|${member.cityId}`;
  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="Identidad Colt"
        title="Mi credencial digital"
        description="Tu pase personal para eventos, asistencias y momentos de la comunidad."
      />
      <div className="profile-layout">
        <section className="credential-wrap">
          <div className="credential">
            <div className="credential-top">
              <div className="brand-lockup brand-lockup-light">
                <span className="brand-mark">U</span>
                <span>
                  <strong>COLTS FANS</strong>
                  <small>MÉXICO · MEMBER</small>
                </span>
              </div>
              <span className="credential-season">2026</span>
            </div>
            <div className="credential-body">
              <button
                className="credential-photo"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  applyFile(event.dataTransfer.files[0]);
                }}
                aria-label="Cambiar fotografía"
              >
                <Avatar member={{ ...member, avatarUrl: photoUrl }} size="large" />
                <span>
                  <Camera size={15} />
                </span>
              </button>
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => applyFile(event.target.files?.[0])} />
              <div className="credential-identity">
                <span>MIEMBRO OFICIAL</span>
                <h2>{member.fullName}</h2>
                <p>
                  <MapPin size={14} /> {CITIES.find((city) => city.id === member.cityId)?.name}
                </p>
                <div className="credential-number">
                  <small>NÚMERO DE MIEMBRO</small>
                  <strong>#{member.memberNumber}</strong>
                </div>
              </div>
              <div className="credential-qr">
                <QRCodeSVG value={qrValue} size={116} bgColor="#ffffff" fgColor="#002c5f" level="M" />
                <small>QR PERSONAL</small>
              </div>
            </div>
            <div className="credential-footer">
              <span>
                FAN DESDE <b>{member.fanSinceYear}</b>
              </span>
              <span>
                JUGADOR FAVORITO <b>{member.favoritePlayer}</b>
              </span>
              <span>
                ESTATUS <b>ACTIVO</b>
              </span>
            </div>
          </div>
          <p className="card-hint">
            <Camera size={15} /> Haz clic o arrastra una foto sobre tu credencial para actualizarla.
          </p>
        </section>

        <section className="surface profile-editor">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Configuración</span>
              <h2>Personaliza tu historia</h2>
            </div>
            <Settings size={20} />
          </div>
          <div className="form-stack">
            <label>
              URL de fotografía
              <div className="input-with-icon">
                <LinkIcon size={16} />
                <input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
              </div>
            </label>
            <label>
              Jugador favorito
              <input value={favoritePlayer} onChange={(event) => setFavoritePlayer(event.target.value)} />
            </label>
            <label>
              Primer partido que recuerdas
              <textarea value={firstGame} onChange={(event) => setFirstGame(event.target.value)} rows={3} />
            </label>
            <button
              className="button button-primary"
              onClick={() => onUpdate({ avatarUrl: photoUrl.trim(), favoritePlayer, firstRememberedGame: firstGame })}
            >
              <Check size={16} /> Guardar cambios
            </button>
          </div>
          <div className="achievement-strip">
            <Medal size={22} />
            <span>
              <small>RECONOCIMIENTO</small>
              <strong>{member.achievements[0] ?? "Miembro de la familia Colt"}</strong>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}

function EventsModule({
  data,
  setData,
  currentUser,
  isAdmin,
  audit,
  notify,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: Member;
  isAdmin: boolean;
  audit: (action: string, targetId: string) => AppData["auditLogs"][number];
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("Watch Party · Colts");
  const [matchDate, setMatchDate] = useState("");
  const [location, setLocation] = useState("Stagg Bar & Grill");
  const [selectedMember, setSelectedMember] = useState(currentUser.uid);
  const [prize, setPrize] = useState("Artículo oficial Colts");
  const [winner, setWinner] = useState("");

  const createEvent = (event: React.FormEvent) => {
    event.preventDefault();
    if (!matchDate) return notify("Selecciona la fecha del evento.", "danger");
    const created: CommunityEvent = {
      id: makeId("event"),
      title,
      type: "match",
      season: "2026",
      week: "Por definir",
      matchDate: new Date(matchDate).toISOString(),
      locationName: location,
      address: "CDMX",
      cityId: currentUser.cityId,
      maxCapacity: 120,
      registrationOpen: true,
      attendanceClosed: false,
    };
    setData((previous) => ({
      ...previous,
      events: [created, ...previous.events],
      auditLogs: [audit("Creación de evento", created.id), ...previous.auditLogs],
    }));
    setShowCreate(false);
    notify("Evento publicado.");
  };

  const checkIn = (eventItem: CommunityEvent) => {
    const member = data.members.find((item) => item.uid === selectedMember);
    if (!member) return;
    if (eventItem.attendanceClosed) return notify("La asistencia de este evento ya está cerrada.", "danger");
    if (data.attendances.some((item) => item.eventId === eventItem.id && item.memberId === member.uid)) {
      return notify("Este miembro ya tiene asistencia registrada.", "info");
    }
    const attendance = {
      id: makeId("attendance"),
      eventId: eventItem.id,
      memberId: member.uid,
      memberName: member.fullName,
      cityId: eventItem.cityId,
      checkInTime: new Date().toISOString(),
      method: "manual_admin" as const,
      registeredBy: currentUser.uid,
    };
    setData((previous) => ({
      ...previous,
      attendances: [attendance, ...previous.attendances],
      members: previous.members.map((item) =>
        item.uid === member.uid
          ? { ...item, attendancesCount: item.attendancesCount + 1, horseshoes: item.horseshoes + 10 }
          : item,
      ),
      auditLogs: [audit("Registro manual de asistencia", attendance.id), ...previous.auditLogs],
    }));
    notify(`Asistencia registrada para ${member.fullName}.`);
  };

  const draw = (eventItem: CommunityEvent) => {
    const pastWinners = new Set(data.raffles.filter((raffle) => raffle.eventId === eventItem.id).map((raffle) => raffle.winnerMemberId));
    const eligible = data.attendances.filter(
      (attendance) => attendance.eventId === eventItem.id && !pastWinners.has(attendance.memberId),
    );
    if (!eligible.length) return notify("No hay boletos elegibles para este sorteo.", "danger");
    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    const raffle = {
      id: makeId("raffle"),
      eventId: eventItem.id,
      prizeName: prize,
      winnerMemberId: selected.memberId,
      winnerName: selected.memberName,
      drawnAt: new Date().toISOString(),
      eligibleTicketCount: eligible.length,
      drawnBy: currentUser.uid,
    };
    setWinner(selected.memberName);
    setData((previous) => ({
      ...previous,
      raffles: [raffle, ...previous.raffles],
      auditLogs: [audit(`Sorteo ejecutado: ${prize}`, raffle.id), ...previous.auditLogs],
    }));
    notify("Sorteo registrado en la bitácora.");
  };

  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="Calendario de la familia"
        title="Eventos, asistencias y sorteos"
        description="Cada reunión suma una historia y un boleto transparente."
        action={
          isAdmin ? (
            <button className="button button-primary" onClick={() => setShowCreate((value) => !value)}>
              <Plus size={17} /> Nuevo evento
            </button>
          ) : undefined
        }
      />

      <AnimatePresence>
        {showCreate && (
          <motion.form
            className="surface inline-form"
            onSubmit={createEvent}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="form-grid">
              <label>
                Nombre del evento
                <input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
              <label>
                Fecha y hora
                <input type="datetime-local" value={matchDate} onChange={(event) => setMatchDate(event.target.value)} />
              </label>
              <label>
                Sede
                <input value={location} onChange={(event) => setLocation(event.target.value)} />
              </label>
              <button className="button button-primary" type="submit">
                Publicar evento
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {data.events.length ? (
        <div className="event-list">
          {data.events.map((eventItem) => {
            const eventAttendance = data.attendances.filter((item) => item.eventId === eventItem.id);
            const lastRaffle = data.raffles.find((raffle) => raffle.eventId === eventItem.id);
            return (
              <article className="surface event-card" key={eventItem.id}>
                <div className="event-date-large">
                  <strong>{new Date(eventItem.matchDate).getDate()}</strong>
                  <span>{new Date(eventItem.matchDate).toLocaleDateString("es-MX", { month: "short" })}</span>
                  <small>{new Date(eventItem.matchDate).getFullYear()}</small>
                </div>
                <div className="event-main">
                  <div className="event-title-row">
                    <div>
                      <span className="category-chip">{eventItem.type === "match" ? "WATCH PARTY" : "EVENTO"}</span>
                      <h3>{eventItem.title}</h3>
                    </div>
                    <span className={`status-pill ${eventItem.attendanceClosed ? "status-closed" : ""}`}>
                      {eventItem.attendanceClosed ? "Asistencia cerrada" : "Registro abierto"}
                    </span>
                  </div>
                  <div className="event-meta">
                    <span>
                      <Clock3 size={15} /> {formatDate(eventItem.matchDate)}
                    </span>
                    <span>
                      <MapPin size={15} /> {eventItem.locationName}
                    </span>
                    <span>
                      <Users size={15} /> {eventAttendance.length}/{eventItem.maxCapacity}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="admin-event-tools">
                      <div>
                        <select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}>
                          {data.members
                            .filter((member) => member.status === "active")
                            .map((member) => (
                              <option value={member.uid} key={member.uid}>
                                #{member.memberNumber} · {member.fullName}
                              </option>
                            ))}
                        </select>
                        <button className="button button-secondary" onClick={() => checkIn(eventItem)}>
                          <ScanLine size={16} /> Registrar asistencia
                        </button>
                        <button
                          className="button button-ghost"
                          onClick={() => {
                            setData((previous) => ({
                              ...previous,
                              events: previous.events.map((item) =>
                                item.id === eventItem.id ? { ...item, attendanceClosed: !item.attendanceClosed } : item,
                              ),
                              auditLogs: [audit("Cambio de cierre de asistencia", eventItem.id), ...previous.auditLogs],
                            }));
                          }}
                        >
                          <LockKeyhole size={15} /> {eventItem.attendanceClosed ? "Reabrir" : "Cerrar"}
                        </button>
                      </div>
                      <div className="raffle-tools">
                        <div className="input-with-icon">
                          <Ticket size={16} />
                          <input value={prize} onChange={(event) => setPrize(event.target.value)} aria-label="Premio del sorteo" />
                        </div>
                        <button className="button button-gold" onClick={() => draw(eventItem)}>
                          <Sparkles size={16} /> Sortear
                        </button>
                      </div>
                    </div>
                  )}
                  {(winner || lastRaffle) && (
                    <div className="winner-banner">
                      <Trophy size={19} />
                      <span>
                        Último ganador <b>{winner || lastRaffle?.winnerName}</b>
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="El calendario está listo para su primer evento"
          body={isAdmin ? "Crea un watch party y comienza el registro de asistencias." : "Muy pronto aparecerán aquí las próximas reuniones."}
        />
      )}
    </div>
  );
}

function CommunityFeed({
  data,
  setData,
  currentUser,
  isAdmin,
  audit,
  notify,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: Member;
  isAdmin: boolean;
  audit: (action: string, targetId: string) => AppData["auditLogs"][number];
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<FeedPost["category"]>("memory");
  const visible = data.feedPosts.filter((post) => post.status === "approved" || isAdmin || post.authorId === currentUser.uid);

  const publish = () => {
    if (text.trim().length < 8) return notify("Cuéntanos un poco más antes de publicar.", "danger");
    const post: FeedPost = {
      id: makeId("post"),
      authorId: currentUser.uid,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatarUrl,
      text: text.trim(),
      category,
      status: isAdmin ? "approved" : "pending",
      reactions: { goColts: 0, horseshoe: 0, welcome: 0, letsGo: 0, family: 0, mvp: 0 },
      createdAt: new Date().toISOString(),
    };
    setData((previous) => ({
      ...previous,
      feedPosts: [post, ...previous.feedPosts],
      auditLogs: isAdmin ? [audit("Publicación aprobada", post.id), ...previous.auditLogs] : previous.auditLogs,
    }));
    setText("");
    notify(isAdmin ? "Memoria publicada." : "Tu memoria quedó en revisión.");
  };

  const moderate = (post: FeedPost, status: "approved" | "rejected") => {
    setData((previous) => ({
      ...previous,
      feedPosts: previous.feedPosts.map((item) => (item.id === post.id ? { ...item, status } : item)),
      auditLogs: [audit(`Publicación ${status === "approved" ? "aprobada" : "rechazada"}`, post.id), ...previous.auditLogs],
    }));
    notify(status === "approved" ? "Publicación aprobada." : "Publicación rechazada.", status === "approved" ? "success" : "info");
  };

  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="Muro comunitario"
        title="Aquí vivimos los colores"
        description="Jerseys, viajes, colecciones y anécdotas en un espacio moderado y familiar."
      />
      <div className="feed-layout">
        <section className="surface composer">
          <div className="composer-user">
            <Avatar member={currentUser} />
            <span>
              <strong>Comparte una memoria</strong>
              <small>La comunidad quiere leerte, {currentUser.fullName.split(" ")[0]}.</small>
            </span>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="¿Qué momento Colt quieres preservar hoy?"
            rows={4}
          />
          <div className="composer-actions">
            <select value={category} onChange={(event) => setCategory(event.target.value as FeedPost["category"])}>
              <option value="memory">Memoria</option>
              <option value="jersey">Jersey</option>
              <option value="travel">Viaje</option>
              <option value="collection">Colección</option>
              <option value="general">General</option>
            </select>
            <button className="button button-ghost" type="button">
              <ImagePlus size={16} /> Añadir imagen
            </button>
            <button className="button button-primary" onClick={publish}>
              Publicar
            </button>
          </div>
          {!isAdmin && <small className="moderation-note">Las publicaciones pasan por una revisión breve para cuidar el ambiente familiar.</small>}
        </section>

        <aside className="surface family-code">
          <ShieldCheck size={25} />
          <h3>Código de la familia</h3>
          <p>Celebramos con respeto, cuidamos la privacidad y dejamos fuera el spam y la toxicidad.</p>
          <span>Ambiente moderado</span>
        </aside>
      </div>

      {visible.length ? (
        <div className="post-list">
          {visible.map((post) => (
            <article className="surface post-card" key={post.id}>
              <div className="post-header">
                <div className="memory-author">
                  <Avatar member={{ fullName: post.authorName, avatarUrl: post.authorAvatar }} />
                  <span>
                    <b>{post.authorName}</b>
                    <small>{formatDate(post.createdAt)}</small>
                  </span>
                </div>
                <span className={`post-status post-status-${post.status}`}>
                  {post.status === "approved" ? "Publicado" : post.status === "pending" ? "En revisión" : "No aprobado"}
                </span>
              </div>
              <span className="category-chip">{post.category.toUpperCase()}</span>
              <p className="post-text">{post.text}</p>
              <div className="reaction-row">
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction.key}
                    onClick={() =>
                      setData((previous) => ({
                        ...previous,
                        feedPosts: previous.feedPosts.map((item) =>
                          item.id === post.id
                            ? { ...item, reactions: { ...item.reactions, [reaction.key]: item.reactions[reaction.key] + 1 } }
                            : item,
                        ),
                      }))
                    }
                    title={reaction.label}
                  >
                    <span>{reaction.emoji}</span> {post.reactions[reaction.key] || ""}
                  </button>
                ))}
              </div>
              {isAdmin && post.status === "pending" && (
                <div className="moderation-actions">
                  <button className="button button-secondary" onClick={() => moderate(post, "approved")}>
                    <Check size={16} /> Aprobar
                  </button>
                  <button className="button button-ghost" onClick={() => moderate(post, "rejected")}>
                    <X size={16} /> Rechazar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={MessageCircle} title="Sé la primera voz del muro" body="Comparte el recuerdo que te hizo sentir parte de esta familia." />
      )}
    </div>
  );
}

function PredictionsModule({
  data,
  setData,
  currentUser,
  notify,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: Member;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const matchEvents = data.events.filter((event) => event.type === "match");
  const [eventId, setEventId] = useState(matchEvents[0]?.id ?? "");
  const [colts, setColts] = useState(24);
  const [opponent, setOpponent] = useState(17);
  const [firstTd, setFirstTd] = useState("");
  const [mvp, setMvp] = useState("");

  const leaderboard = useMemo(() => {
    const table = new Map<string, { name: string; points: number; picks: number }>();
    data.predictions.forEach((prediction) => {
      const row = table.get(prediction.memberId) ?? { name: prediction.memberName, points: 0, picks: 0 };
      row.points += prediction.pointsEarned;
      row.picks += 1;
      table.set(prediction.memberId, row);
    });
    return [...table.entries()].sort((a, b) => b[1].points - a[1].points);
  }, [data.predictions]);

  const savePick = () => {
    if (!eventId) return notify("Primero debe existir un partido publicado.", "danger");
    const id = `${currentUser.uid}_${eventId}`;
    const prediction = {
      id,
      memberId: currentUser.uid,
      memberName: currentUser.fullName,
      eventId,
      scoreColts: colts,
      scoreOpponent: opponent,
      firstTdPlayer: firstTd || "Por definir",
      mvpPlayer: mvp || "Por definir",
      pointsEarned: 0,
      createdAt: new Date().toISOString(),
    };
    setData((previous) => ({
      ...previous,
      predictions: [prediction, ...previous.predictions.filter((item) => item.id !== id)],
    }));
    notify("Pronóstico guardado. Puedes editarlo antes del partido.");
  };

  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="Pick'em amistoso"
        title="Pronostica. Celebra. Comparte."
        description="Sin apuestas: solo intuición, conversación y orgullo Colt."
      />
      <div className="picks-layout">
        <section className="surface pick-form">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Tu próximo pronóstico</span>
              <h2>Marcador final</h2>
            </div>
            <Trophy size={22} />
          </div>
          {matchEvents.length ? (
            <div className="form-stack">
              <label>
                Partido
                <select value={eventId} onChange={(event) => setEventId(event.target.value)}>
                  {matchEvents.map((event) => (
                    <option value={event.id} key={event.id}>
                      {event.title} · {formatDate(event.matchDate, false)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="score-pickers">
                <div>
                  <span className="mini-logo">U</span>
                  <b>COLTS</b>
                  <input type="number" min={0} max={99} value={colts} onChange={(event) => setColts(Number(event.target.value))} />
                </div>
                <strong>—</strong>
                <div>
                  <span className="mini-logo mini-logo-opponent">VS</span>
                  <b>RIVAL</b>
                  <input type="number" min={0} max={99} value={opponent} onChange={(event) => setOpponent(Number(event.target.value))} />
                </div>
              </div>
              <label>
                Primer touchdown
                <input value={firstTd} onChange={(event) => setFirstTd(event.target.value)} placeholder="Nombre del jugador" />
              </label>
              <label>
                MVP del partido
                <input value={mvp} onChange={(event) => setMvp(event.target.value)} placeholder="Nombre del jugador" />
              </label>
              <button className="button button-primary" onClick={savePick}>
                <Check size={16} /> Guardar pronóstico
              </button>
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="Aún no hay partido disponible" body="Cuando el comité publique un partido, podrás guardar aquí tu marcador." />
          )}
        </section>

        <section className="surface leaderboard">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Tabla general</span>
              <h2>Ranking de la temporada</h2>
            </div>
            <Medal size={22} />
          </div>
          {leaderboard.length ? (
            <div className="leaderboard-list">
              {leaderboard.map(([id, row], index) => (
                <div key={id}>
                  <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                  <div>
                    <b>{row.name}</b>
                    <small>{row.picks} pronóstico{row.picks === 1 ? "" : "s"}</small>
                  </div>
                  <strong>{row.points} pts</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Trophy} title="La tabla inicia en cero" body="El primer pronóstico marcará el comienzo de la temporada." />
          )}
        </section>
      </div>
    </div>
  );
}

function HistoryModule({
  data,
  setData,
  currentUser,
  isAdmin,
  notify,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: Member;
  isAdmin: boolean;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [message, setMessage] = useState("");
  const [travelTitle, setTravelTitle] = useState("");
  const [destination, setDestination] = useState("Indianapolis · Lucas Oil Stadium");

  const signBook = () => {
    if (message.trim().length < 6) return notify("Escribe un mensaje un poco más largo.", "danger");
    setData((previous) => ({
      ...previous,
      guestBook: [
        {
          id: makeId("guest"),
          authorId: currentUser.uid,
          authorName: currentUser.fullName,
          authorAvatar: currentUser.avatarUrl,
          cityId: currentUser.cityId,
          text: message.trim(),
          createdAt: new Date().toISOString(),
        },
        ...previous.guestBook,
      ],
    }));
    setMessage("");
    notify("Tu mensaje quedó guardado en nuestra historia.");
  };

  const addTravel = () => {
    if (!travelTitle.trim()) return notify("Escribe un nombre para el viaje.", "danger");
    setData((previous) => ({
      ...previous,
      travels: [
        {
          id: makeId("travel"),
          title: travelTitle.trim(),
          destination,
          travelDate: new Date().toISOString(),
          memberCount: 1,
          description: "Un nuevo capítulo de la familia Colts Fans México.",
          imageUrl: "",
          organizerName: currentUser.fullName,
        },
        ...previous.travels,
      ],
    }));
    setTravelTitle("");
    notify("Viaje añadido al diario.");
  };

  return (
    <div className="page-stack">
      <section className="history-hero">
        <span className="eyebrow">Desde 2020 · México</span>
        <h1>Nuestra historia se escribe cada domingo.</h1>
        <p>Un archivo vivo de primeras veces, viajes, jerseys y abrazos después de cada touchdown.</p>
      </section>

      <div className="history-layout">
        <section className="surface guest-book">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Libro de visitas</span>
              <h2>Deja una huella</h2>
            </div>
            <BookOpen size={22} />
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="¿Cómo fue tu primera reunión con la familia Colt?"
          />
          <button className="button button-primary" onClick={signBook}>
            Firmar el libro
          </button>
          <div className="guest-messages">
            {data.guestBook.map((entry) => (
              <article key={entry.id}>
                <Avatar member={{ fullName: entry.authorName, avatarUrl: entry.authorAvatar }} size="small" />
                <div>
                  <p>“{entry.text}”</p>
                  <small>{entry.authorName} · {formatDate(entry.createdAt, false)}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface travel-book">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Diario de viajes</span>
              <h2>Más allá de casa</h2>
            </div>
            <MapPin size={22} />
          </div>
          {isAdmin && (
            <div className="travel-form">
              <input value={travelTitle} onChange={(event) => setTravelTitle(event.target.value)} placeholder="Nombre del viaje" />
              <input value={destination} onChange={(event) => setDestination(event.target.value)} />
              <button className="button button-secondary" onClick={addTravel}>
                <Plus size={16} /> Añadir viaje
              </button>
            </div>
          )}
          {data.travels.length ? (
            <div className="travel-list">
              {data.travels.map((travel) => (
                <article key={travel.id}>
                  <span className="travel-pin">
                    <MapPin size={18} />
                  </span>
                  <div>
                    <h3>{travel.title}</h3>
                    <p>{travel.destination}</p>
                    <small>Organiza {travel.organizerName}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={MapPin} title="El siguiente destino nos espera" body="Aquí vivirá el diario de viajes a Indianapolis y partidos especiales." />
          )}
        </section>
      </div>

      <section className="milestone-row">
        {[
          ["2020", "Nace la familia digital"],
          ["2021", "Primer libro de recuerdos"],
          ["2024", "Una comunidad multiciudad"],
          ["2026", "Project Horseshoe"],
        ].map(([year, label]) => (
          <div key={year}>
            <span>{year}</span>
            <p>{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function AdminModule({
  data,
  setData,
  currentUser,
  isOwnerIdentity,
  notify,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  currentUser: Member;
  isOwnerIdentity: boolean;
  notify: (message: string, tone?: ToastTone) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const pending = data.feedPosts.filter((post) => post.status === "pending").length;

  const changeRole = (member: Member, role: Role) => {
    if (!isOwnerIdentity || member.email === OWNER_EMAIL) return;
    setData((previous) => ({
      ...previous,
      members: previous.members.map((item) => (item.uid === member.uid ? { ...item, role } : item)),
      auditLogs: [
        {
          id: makeId("audit"),
          adminId: currentUser.uid,
          adminName: currentUser.fullName,
          action: `Rol actualizado a ${role}`,
          targetId: member.uid,
          timestamp: new Date().toISOString(),
        },
        ...previous.auditLogs,
      ],
    }));
    notify(`Rol actualizado para ${member.fullName}.`);
  };

  return (
    <div className="page-stack">
      <SectionTitle
        eyebrow="Consola protegida"
        title="Administración y auditoría"
        description="Operación transparente, trazable y centrada en el cuidado de la comunidad."
      />
      <div className="admin-stats">
        <article>
          <Users size={20} />
          <span>
            <strong>{data.members.length}</strong>
            <small>Miembros registrados</small>
          </span>
        </article>
        <article>
          <CalendarDays size={20} />
          <span>
            <strong>{data.attendances.length}</strong>
            <small>Asistencias verificadas</small>
          </span>
        </article>
        <article>
          <MessageCircle size={20} />
          <span>
            <strong>{pending}</strong>
            <small>Posts por revisar</small>
          </span>
        </article>
        <article>
          <History size={20} />
          <span>
            <strong>{data.auditLogs.length}</strong>
            <small>Acciones auditadas</small>
          </span>
        </article>
      </div>

      <div className="admin-layout">
        <section className="surface member-admin">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Directorio</span>
              <h2>Gestión de miembros</h2>
            </div>
            <UserCog size={22} />
          </div>
          <div className="member-table">
            {data.members.map((member) => (
              <div key={member.uid}>
                <Avatar member={member} size="small" />
                <span>
                  <b>{member.fullName}</b>
                  <small>#{member.memberNumber} · {member.email}</small>
                </span>
                <span className={`role-pill role-${member.role}`}>{member.role.replace("_", " ")}</span>
                {isOwnerIdentity && member.email !== OWNER_EMAIL ? (
                  <select value={member.role} onChange={(event) => changeRole(member, event.target.value as Role)}>
                    <option value="member">Miembro</option>
                    <option value="admin">Administrador</option>
                  </select>
                ) : (
                  <LockKeyhole size={16} className="locked-role" />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="surface audit-card">
          <div className="surface-heading">
            <div>
              <span className="eyebrow">Bitácora</span>
              <h2>Actividad reciente</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          {data.auditLogs.length ? (
            <div className="audit-list">
              {data.auditLogs.slice(0, 12).map((log) => (
                <div key={log.id}>
                  <span className="audit-dot" />
                  <div>
                    <b>{log.action}</b>
                    <small>{log.adminName} · {formatDate(log.timestamp)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={History} title="La bitácora está limpia" body="Las acciones administrativas aparecerán aquí automáticamente." />
          )}
        </section>
      </div>

      {isOwnerIdentity && (
        <section className="danger-zone">
          <div>
            <RotateCcw size={20} />
            <span>
              <strong>Reiniciar estado de prueba</strong>
              <small>Conserva únicamente al Primary Owner y elimina el resto de los datos locales.</small>
            </span>
          </div>
          {confirmReset ? (
            <div>
              <button
                className="button button-danger"
                onClick={() => {
                  LocalStore.wipe();
                  setData(CLEAN_DATA);
                  setConfirmReset(false);
                  notify("Estado limpio restaurado.", "info");
                }}
              >
                Confirmar limpieza
              </button>
              <button className="button button-ghost" onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <button className="button button-ghost-danger" onClick={() => setConfirmReset(true)}>
              Reiniciar datos
            </button>
          )}
        </section>
      )}
    </div>
  );
}
