import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── FONT LOADER ─────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (document.getElementById("plantpal-fonts")) return;
    const link = document.createElement("link");
    link.id = "plantpal-fonts";
    link.href = "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
}

// ─── API LAYER ───────────────────────────────────────────────
const BASE = "http://localhost:8080/api";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("plantpal_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const API = {
  auth: {
    register: (name, email, password) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
    login:    (email, password)        => apiFetch("/auth/login",    { method: "POST", body: JSON.stringify({ email, password }) }),
  },
  plants: {
    getAll:       ()        => apiFetch("/plants"),
    create:       (p)       => apiFetch("/plants",    { method: "POST",   body: JSON.stringify(p) }),
    update:       (id, p)   => apiFetch(`/plants/${id}`, { method: "PUT", body: JSON.stringify(p) }),
    delete:       (id)      => apiFetch(`/plants/${id}`, { method: "DELETE" }),
    dashboard:    ()        => apiFetch("/plants/dashboard"),
    logWater:     (id, n)   => apiFetch(`/plants/${id}/water`,    { method: "POST", body: JSON.stringify({ notes: n }) }),
    getWater:     (id)      => apiFetch(`/plants/${id}/water`),
    logProgress:  (id, d)   => apiFetch(`/plants/${id}/progress`, { method: "POST", body: JSON.stringify(d) }),
    getProgress:  (id)      => apiFetch(`/plants/${id}/progress`),
  },
};

// ─── AUTH CONTEXT ────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("plantpal_user") || "null"); } catch { return null; }
  });

  const login = useCallback((userData) => {
    localStorage.setItem("plantpal_token", userData.token);
    localStorage.setItem("plantpal_user",  JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("plantpal_token");
    localStorage.removeItem("plantpal_user");
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

// ─── THEME ───────────────────────────────────────────────────
const T = {
  deep:   "#1e3a2f", forest: "#2d5a3d", sage:  "#6b9e78",
  mint:   "#a8d5b5", pale:   "#e8f5ec", cream: "#faf8f3",
  warm:   "#f5f1e8", earth:  "#8b6f47", amber: "#d4a853",
  muted:  "#6b7e6e", border: "#d4e8d8", text:  "#1a2e1c",
  danger: "#c0605a", blue:   "#3d7ab5",
};

// ─── SHARED STYLES ───────────────────────────────────────────
const css = {
  card: { background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" },
  input: { padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.border}`, fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem", color: T.text, background: T.warm, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s" },
  btnPrimary: { background: T.deep, color: "#fff", border: "none", padding: "11px 22px", borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" },
  btnSecondary: { background: "none", color: T.deep, border: `1.5px solid ${T.border}`, padding: "10px 20px", borderRadius: 12, fontFamily: "'Outfit',sans-serif", fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  label: { fontSize: "0.82rem", fontWeight: 500, color: T.text, marginBottom: 5, display: "block" },
};

const healthMeta = {
  excellent: { bg: "#DCFCE7", color: "#15803D", label: "Excellent" },
  good:      { bg: "#E0F2FE", color: "#0E7490", label: "Good" },
  needs:     { bg: "#FFE4E6", color: "#BE123C", label: "Needs Care" },
};

// ─── MINI COMPONENTS ─────────────────────────────────────────

function Toast({ msg, visible }) {
  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 999, background: T.deep, color: "#fff", padding: "13px 20px", borderRadius: 14, fontSize: "0.88rem", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", transform: visible ? "translateY(0)" : "translateY(110px)", opacity: visible ? 1 : 0, transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)", maxWidth: 340, display: "flex", alignItems: "center", gap: 10 }}>
      {msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${T.pale}`, borderTopColor: T.sage, animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = T.sage }) {
  return (
    <div style={{ background: T.pale, borderRadius: 100, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: 100, transition: "width 0.6s ease" }} />
    </div>
  );
}

function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.42)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 22, padding: "2rem 2.2rem", width: 430, maxWidth: "92vw", boxShadow: "0 24px 64px rgba(0,0,0,0.22)", animation: "popIn 0.25s ease" }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}`}</style>
        <h3 style={{ fontFamily: "'Lora',serif", fontSize: "1.35rem", color: T.deep, marginBottom: subtitle ? 4 : "1.4rem" }}>{title}</h3>
        {subtitle && <p style={{ fontSize: "0.84rem", color: T.muted, marginBottom: "1.4rem" }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={css.label}>{label}</label>
      {children}
    </div>
  );
}

function useHover(hoverStyle, baseStyle = {}) {
  const [hovered, setHovered] = useState(false);
  return { style: hovered ? { ...baseStyle, ...hoverStyle } : baseStyle, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };
}

// ─── PLANT CARD ───────────────────────────────────────────────
function PlantCard({ plant, onDelete, onWater }) {
  const h = healthMeta[plant.healthStatus] || healthMeta.good;
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ ...css.card, overflow: "hidden", transition: "all 0.25s", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 10px 32px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.05)" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ height: 110, background: h.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", position: "relative" }}>
        {plant.emoji || "🌱"}
        <span style={{ position: "absolute", top: 10, right: 10, fontSize: "0.65rem", fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: h.bg, color: h.color, border: `1px solid ${h.color}30` }}>{h.label}</span>
      </div>
      <div style={{ padding: "0.9rem 1.1rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 3 }}>{plant.plantName}</div>
        <div style={{ fontSize: "0.78rem", color: T.muted }}>{plant.plantType} · {plant.location || "—"}</div>
      </div>
      <div style={{ padding: "0.7rem 1.1rem", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: "0.73rem", color: T.muted }}>💧 {plant.wateringFrequency}</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onWater(plant)} title="Log watering" style={{ ...css.btnPrimary, padding: "5px 10px", fontSize: "0.72rem", gap: 4 }}>💧</button>
          <button onClick={() => onDelete(plant.id)} title="Delete plant" style={{ background: "#fde8e7", color: T.danger, border: "none", padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: "0.72rem" }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════

// ─── HOME PAGE ────────────────────────────────────────────────
function HomePage({ navigate }) {
  return (
    <div style={{ background: `linear-gradient(160deg, ${T.cream} 0%, ${T.pale} 55%, #c8e6cc 100%)`, minHeight: "calc(100vh - 62px)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .pp-fade{animation:fadeUp 0.7s ease both}
        .pp-fade:nth-child(2){animation-delay:0.1s}
        .pp-fade:nth-child(3){animation-delay:0.2s}
        .pp-fade:nth-child(4){animation-delay:0.3s}
        .pp-float{animation:float 4s ease-in-out infinite}
        .pp-float:nth-child(2){animation-delay:0.7s}
        .pp-float:nth-child(3){animation-delay:1.4s}
        .pp-float:nth-child(4){animation-delay:2.1s}
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 62px)", alignItems: "center", padding: "4rem 6rem", gap: "4rem", maxWidth: 1280, margin: "0 auto" }}>
        <div>
          <div className="pp-fade" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.pale, border: `1px solid ${T.border}`, padding: "5px 14px", borderRadius: 100, fontSize: "0.78rem", color: T.forest, fontWeight: 500, marginBottom: "1.4rem" }}>
            🌿 Your intelligent garden companion
          </div>
          <h1 className="pp-fade" style={{ fontFamily: "'Lora',serif", fontSize: "clamp(2.6rem,4vw,4rem)", lineHeight: 1.15, color: T.deep, marginBottom: "1.2rem" }}>
            Grow your garden<br /><em style={{ color: T.sage, fontStyle: "italic" }}>with confidence</em>
          </h1>
          <p className="pp-fade" style={{ fontSize: "1rem", color: T.muted, lineHeight: 1.75, maxWidth: 460, marginBottom: "2rem" }}>
            PlantPal tracks your plants, sends smart watering reminders, and gives personalized care tips — so every plant in your garden thrives.
          </p>
          <div className="pp-fade" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button style={{ ...css.btnPrimary, padding: "13px 26px", fontSize: "0.95rem" }} onClick={() => navigate("register")}
              onMouseEnter={e => { e.currentTarget.style.background = T.forest; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 24px rgba(30,58,47,0.3)`; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.deep; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              🌱 Get Started Free
            </button>
            <button style={{ ...css.btnSecondary, padding: "12px 22px", fontSize: "0.95rem" }} onClick={() => navigate("guide")}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.sage; e.currentTarget.style.background = T.pale; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "none"; }}>
              Browse Plants →
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[
            { emoji: "🌵", name: "Cactus",    type: "Succulent", badge: "✓ Healthy",      bc: "#2d6a3f", bb: "#e6f5e9", mt: 0 },
            { emoji: "🌿", name: "Pothos",    type: "Tropical",  badge: "💧 Water today", bc: "#2c6ea6", bb: "#e0f0ff", mt: "1.5rem" },
            { emoji: "🌸", name: "Orchid",    type: "Flowering", badge: "☀ Needs sun",    bc: "#a07810", bb: "#fff8e0", mt: "-1rem" },
            { emoji: "🌱", name: "Aloe Vera", type: "Medicinal", badge: "✓ Healthy",      bc: "#2d6a3f", bb: "#e6f5e9", mt: 0 },
          ].map((p, i) => (
            <div key={i} className="pp-float" style={{ ...css.card, padding: "1.3rem", marginTop: p.mt, transition: "all 0.3s" }}>
              <div style={{ fontSize: "2.2rem", marginBottom: 8 }}>{p.emoji}</div>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontSize: "0.75rem", color: T.muted, marginBottom: 8 }}>{p.type}</div>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: p.bb, color: p.bc }}>{p.badge}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "center", gap: "2.5rem", padding: "2rem", flexWrap: "wrap", background: "rgba(255,255,255,0.6)" }}>
        {[["💧","Smart watering reminders"],["📊","Growth tracking"],["📚","Plant care library"],["🌦","Weather-based tips"],["📱","Mobile friendly"]].map(([ic, tx]) => (
          <div key={tx} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "0.88rem", color: T.muted }}>
            <span style={{ fontSize: "1.15rem" }}>{ic}</span>{tx}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function Dashboard({ navigate, showToast }) {
  const { user, logout } = useAuth();
  const [plants, setPlants]   = useState([]);
  const [stats, setStats]     = useState({ totalPlants: 0, healthyPlants: 0, needsWatering: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [waterModal, setWaterModal] = useState(null);
  const [waterNote, setWaterNote]   = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [all, dash] = await Promise.all([API.plants.getAll(), API.plants.dashboard()]);
      setPlants(all);
      setStats(dash);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plant?")) return;
    try {
      await API.plants.delete(id);
      showToast("🗑 Plant removed from your garden");
      load();
    } catch (e) { showToast("❌ " + e.message); }
  };

  const handleWater = (plant) => { setWaterModal(plant); setWaterNote(""); };

  const confirmWater = async () => {
    try {
      await API.plants.logWater(waterModal.id, waterNote);
      showToast(`💧 Watering logged for ${waterModal.plantName}!`);
      setWaterModal(null);
      load();
    } catch (e) { showToast("❌ " + e.message); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "calc(100vh - 62px)" }}>
      {/* Sidebar */}
      <aside style={{ background: "#fff", borderRight: `1px solid ${T.border}`, padding: "1.5rem 1rem", display: "flex", flexDirection: "column", gap: 3 }}>
        {[["🏠","Dashboard","dashboard"],["➕","Add Plant","add-plant"],["📚","Plant Guide","guide"],["📊","Growth Tracker","tracker"]].map(([ic, lb, pg]) => (
          <button key={pg} onClick={() => navigate(pg)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, border: "none", background: pg === "dashboard" ? T.pale : "none", fontFamily: "'Outfit',sans-serif", fontSize: "0.88rem", color: pg === "dashboard" ? T.deep : T.muted, fontWeight: pg === "dashboard" ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
            onMouseEnter={e => { if (pg !== "dashboard") { e.currentTarget.style.background = T.pale; e.currentTarget.style.color = T.text; }}}
            onMouseLeave={e => { if (pg !== "dashboard") { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.muted; }}}>
            <span style={{ fontSize: "1.1rem", width: 24 }}>{ic}</span>{lb}
          </button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: `1px solid ${T.border}` }}>
          <div style={{ padding: "8px 12px", fontSize: "0.82rem", color: T.muted, marginBottom: 4 }}>Signed in as</div>
          <div style={{ padding: "8px 12px", fontSize: "0.85rem", fontWeight: 500, color: T.text, marginBottom: 8 }}>{user?.name}</div>
          <button onClick={() => { logout(); navigate("login"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, border: "none", background: "none", fontFamily: "'Outfit',sans-serif", fontSize: "0.88rem", color: T.muted, cursor: "pointer", width: "100%" }}>
            <span style={{ fontSize: "1.1rem", width: 24 }}>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: "2rem 2.5rem", overflowY: "auto", background: T.cream }}>
        {error && <div style={{ background: "#fde8e7", color: T.danger, padding: "12px 16px", borderRadius: 10, marginBottom: "1.5rem", fontSize: "0.88rem" }}>⚠️ {error} — Is the Spring Boot server running on port 8080?</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.8rem" }}>
          <div>
            <h2 style={{ fontFamily: "'Lora',serif", fontSize: "1.75rem", color: T.deep }}>Good morning, {user?.name?.split(" ")[0] || "Gardener"} 🌻</h2>
            <p style={{ fontSize: "0.85rem", color: T.muted, marginTop: 4 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · {stats.needsWatering} plants need attention
            </p>
          </div>
          <button style={css.btnPrimary} onClick={() => navigate("add-plant")}
            onMouseEnter={e => { e.currentTarget.style.background = T.forest; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.deep; e.currentTarget.style.transform = "none"; }}>
            ➕ Add Plant
          </button>
        </div>

        {/* Weather */}
        <div style={{ background: "linear-gradient(135deg, #e8f5ec, #c8e6cc)", borderRadius: 16, padding: "1.2rem 1.6rem", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: "2rem" }}>⛅</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: T.deep }}>Partly Cloudy — Mathura, UP</div>
              <div style={{ fontSize: "0.78rem", color: T.forest, marginTop: 2 }}>Good conditions for outdoor plants · Light breeze expected</div>
            </div>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: T.deep }}>28°C</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.1rem", marginBottom: "1.6rem" }}>
          {[["🌱", T.pale, stats.totalPlants, "Total Plants"], ["💧", "#e0f0ff", stats.needsWatering, "Need Watering"], ["🌟", "#fff8e0", stats.healthyPlants, "Healthy Plants"]].map(([ic, bg, val, lb]) => (
            <div key={lb} style={{ ...css.card, padding: "1.2rem 1.4rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{ic}</div>
              <div>
                <div style={{ fontSize: "1.7rem", fontWeight: 700, color: T.text, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: "0.78rem", color: T.muted, marginTop: 3 }}>{lb}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Growth preview */}
        {plants.length > 0 && (
          <div style={{ ...css.card, marginBottom: "1.6rem", overflow: "hidden" }}>
            <div style={{ padding: "1rem 1.4rem", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>📈 Growth Overview</span>
            </div>
            <div style={{ padding: "1rem 1.4rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {plants.slice(0, 4).map(p => (
                <div key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 6 }}>
                    <span>{p.emoji} {p.plantName}</span>
                  </div>
                  <ProgressBar value={p.healthStatus === "excellent" ? 85 : p.healthStatus === "good" ? 55 : 25} max={100}
                    color={p.healthStatus === "excellent" ? T.sage : p.healthStatus === "good" ? T.blue : T.danger} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plant Grid */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>My Plants ({plants.length})</span>
          <button style={{ ...css.btnPrimary, padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => navigate("add-plant")}>+ Add</button>
        </div>

        {loading ? <Spinner /> : plants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: T.muted }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🌱</div>
            <p style={{ marginBottom: "1rem" }}>No plants yet. Add your first plant!</p>
            <button style={css.btnPrimary} onClick={() => navigate("add-plant")}>➕ Add First Plant</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "1.1rem" }}>
            {plants.map(p => <PlantCard key={p.id} plant={p} onDelete={handleDelete} onWater={handleWater} />)}
          </div>
        )}
      </main>

      {/* Water Modal */}
      <Modal open={!!waterModal} onClose={() => setWaterModal(null)} title="💧 Log Watering"
        subtitle={waterModal ? `Record watering for ${waterModal.plantName}` : ""}>
        <Field label="Notes (optional)">
          <input style={css.input} value={waterNote} onChange={e => setWaterNote(e.target.value)} placeholder="e.g., Watered thoroughly" />
        </Field>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1rem" }}>
          <button style={{ ...css.btnSecondary, padding: "10px 18px" }} onClick={() => setWaterModal(null)}>Cancel</button>
          <button style={{ ...css.btnPrimary, flex: 1, justifyContent: "center" }} onClick={confirmWater}>💧 Log Watering</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── ADD PLANT PAGE ───────────────────────────────────────────
const EMOJIS = ["🌱","🌿","🌵","🌸","🌺","🌻","🍀","🌹","🎋","🎍","🍃","🌙"];

function AddPlantPage({ navigate, showToast }) {
  const [form, setForm] = useState({ plantName: "", plantType: "", wateringFrequency: "Every week", sunlight: "Indirect light", location: "", notes: "", dateAdded: new Date().toISOString().split("T")[0] });
  const [emoji, setEmoji]     = useState("🌱");
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const focus = (e) => { e.target.style.borderColor = T.sage; e.target.style.boxShadow = `0 0 0 3px ${T.sage}22`; };
  const blur  = (e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; };

  const submit = async () => {
    const errs = {};
    if (!form.plantName.trim()) errs.plantName = "Plant name is required";
    if (!form.plantType)        errs.plantType  = "Please select a type";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setSaving(true);
      await API.plants.create({ ...form, emoji });
      showToast(`🌱 ${form.plantName} added to your garden!`);
      navigate("dashboard");
    } catch (e) { showToast("❌ " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: T.cream, minHeight: "calc(100vh - 62px)" }}>
      <div style={{ maxWidth: 680, margin: "2.5rem auto", padding: "0 2rem" }}>
        <div style={{ ...css.card, padding: "2.5rem 2.8rem" }}>
          <h2 style={{ fontFamily: "'Lora',serif", fontSize: "1.8rem", color: T.deep, marginBottom: 4 }}>Add a New Plant 🌱</h2>
          <p style={{ color: T.muted, fontSize: "0.88rem", marginBottom: "2rem" }}>Fill in the details to start tracking your plant</p>

          <div style={{ marginBottom: "1.6rem" }}>
            <label style={css.label}>Choose an icon</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{ width: 48, height: 48, fontSize: "1.5rem", borderRadius: 12, border: emoji === e ? `2px solid ${T.deep}` : `2px solid ${T.border}`, background: emoji === e ? T.pale : "#fff", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Plant Name *</label>
              <input style={{ ...css.input, borderColor: errors.plantName ? T.danger : T.border }} placeholder="e.g., My Pothos" value={form.plantName}
                onChange={e => { set("plantName", e.target.value); setErrors(x => ({ ...x, plantName: null })); }}
                onFocus={focus} onBlur={blur} />
              {errors.plantName && <span style={{ fontSize: "0.75rem", color: T.danger }}>{errors.plantName}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Plant Type *</label>
              <select style={{ ...css.input, borderColor: errors.plantType ? T.danger : T.border }} value={form.plantType}
                onChange={e => { set("plantType", e.target.value); setErrors(x => ({ ...x, plantType: null })); }}>
                <option value="">Select type</option>
                {["Succulent","Tropical","Flowering","Herb","Cactus","Fern","Tree / Shrub","Other"].map(t => <option key={t}>{t}</option>)}
              </select>
              {errors.plantType && <span style={{ fontSize: "0.75rem", color: T.danger }}>{errors.plantType}</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Watering Frequency</label>
              <select style={css.input} value={form.wateringFrequency} onChange={e => set("wateringFrequency", e.target.value)}>
                {["Every 2 days","Every 3 days","Every week","Every 10 days","Every 2 weeks","Monthly"].map(w => <option key={w}>{w}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Sunlight Requirement</label>
              <select style={css.input} value={form.sunlight} onChange={e => set("sunlight", e.target.value)}>
                {["Full sun (6+ hrs)","Indirect light","Partial shade","Low light"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Location</label>
              <input style={css.input} placeholder="e.g., Bedroom windowsill" value={form.location} onChange={e => set("location", e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Date Added</label>
              <input type="date" style={css.input} value={form.dateAdded} onChange={e => set("dateAdded", e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={css.label}>Notes</label>
              <textarea style={{ ...css.input, minHeight: 90, resize: "vertical" }} placeholder="Any special care instructions..." value={form.notes} onChange={e => set("notes", e.target.value)} onFocus={focus} onBlur={blur} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.6rem" }}>
            <button style={{ ...css.btnSecondary, padding: "12px 22px" }} onClick={() => navigate("dashboard")}>Cancel</button>
            <button style={{ ...css.btnPrimary, flex: 1, justifyContent: "center", padding: "13px", opacity: saving ? 0.7 : 1 }} onClick={submit} disabled={saving}
              onMouseEnter={e => { e.currentTarget.style.background = T.forest; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.deep; }}>
              {saving ? "Saving…" : "🌱 Add Plant to Garden"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PLANT GUIDE ──────────────────────────────────────────────
const LIBRARY = [
  { emoji:"🌱", name:"Aloe Vera",    water:"Every 7 days",   sun:"Bright indirect", diff:"Easy",   desc:"Resilient succulent known for soothing gel. Prefers well-draining soil and tolerates neglect." },
  { emoji:"🍀", name:"Snake Plant",  water:"Every 10 days",  sun:"Low to bright",   diff:"Easy",   desc:"Nearly indestructible. Tolerates low light and infrequent watering — ideal for beginners." },
  { emoji:"🌿", name:"Pothos",       water:"Every 3–5 days", sun:"Indirect",        diff:"Easy",   desc:"Fast-growing trailing vine. Remove yellow leaves and avoid overwatering for best results." },
  { emoji:"🌵", name:"Cactus",       water:"Monthly",        sun:"Full sun",        diff:"Easy",   desc:"Desert native that stores water in its thick stem. Allow soil to dry completely between waterings." },
  { emoji:"🌸", name:"Orchid",       water:"Every 7–10 days",sun:"Indirect bright", diff:"Medium", desc:"Elegant flowering plant. Use bark medium, not soil. Repot after blooming season each year." },
  { emoji:"🌺", name:"Peace Lily",   water:"Every 5 days",   sun:"Low to medium",   diff:"Easy",   desc:"Great air purifier. Droops dramatically when thirsty — a built-in watering signal!" },
  { emoji:"🌻", name:"Sunflower",    water:"Every 2 days",   sun:"Full sun 6+ hrs", diff:"Easy",   desc:"Bright annual. Plant in large pots or garden beds with full direct sunlight." },
  { emoji:"🌹", name:"Rose",         water:"Every 3 days",   sun:"Full sun 6 hrs",  diff:"Hard",   desc:"Classic beauty. Requires regular pruning, feeding, and vigilance against pests and disease." },
  { emoji:"🍃", name:"Monstera",     water:"Every week",     sun:"Indirect bright", diff:"Easy",   desc:"Iconic tropical with split leaves. Wipe leaves monthly and provide a moss pole for support." },
  { emoji:"🌱", name:"Mint",         water:"Every 2 days",   sun:"Partial sun",     diff:"Easy",   desc:"Vigorous herb best kept in pots to prevent spreading. Great for kitchen windowsills." },
  { emoji:"🎋", name:"Bamboo",       water:"Every 2–3 days", sun:"Indirect",        diff:"Medium", desc:"Fast-growing, often grown in water. Trim yellow stalks and change water weekly." },
  { emoji:"🍃", name:"Fern",         water:"Every 2 days",   sun:"Low to indirect", diff:"Medium", desc:"Loves humidity. Mist regularly or place on a pebble tray for consistent moisture." },
];

function GuidePage() {
  const [q, setQ] = useState("");
  const filtered = LIBRARY.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.desc.toLowerCase().includes(q.toLowerCase()));
  const diffColor = { Easy: ["#e6f5e9","#2d6a3f"], Medium: ["#fff8e0","#a07810"], Hard: ["#fde8e7","#b94040"] };

  return (
    <div style={{ background: T.cream, minHeight: "calc(100vh - 62px)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem" }}>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: "1.9rem", color: T.deep, marginBottom: 6 }}>Plant Care Guide 📚</h2>
        <p style={{ color: T.muted, fontSize: "0.88rem", marginBottom: "1.8rem" }}>Learn how to care for popular houseplants</p>
        <input style={{ ...css.input, maxWidth: 480, padding: "12px 16px", fontSize: "0.95rem", borderRadius: 14, marginBottom: "2rem" }}
          placeholder="🔍 Search plants…" value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px,1fr))", gap: "1.4rem" }}>
          {filtered.map(p => (
            <div key={p.name} style={{ ...css.card, overflow: "hidden", transition: "all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}>
              <div style={{ height: 90, background: T.pale, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.2rem" }}>{p.emoji}</div>
              <div style={{ padding: "1.1rem 1.3rem" }}>
                <h3 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.7rem" }}>{p.name}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: "0.8rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: "#e0f0ff", color: "#2c6ea6" }}>💧 {p.water}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: "#fff8e0", color: "#a07810" }}>☀ {p.sun}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px", borderRadius: 100, background: diffColor[p.diff][0], color: diffColor[p.diff][1] }}>{p.diff}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", color: T.muted }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
            <p>No plants found for "{q}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TRACKER PAGE ─────────────────────────────────────────────
function TrackerPage({ showToast }) {
  const [plants, setPlants]   = useState([]);
  const [logs, setLogs]       = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({ heightCm: "", healthStatus: "Excellent", notes: "" });

  useEffect(() => {
    API.plants.getAll()
      .then(data => { setPlants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openModal = async (plant) => {
    setModal(plant);
    setForm({ heightCm: "", healthStatus: "Excellent", notes: "" });
    try {
      const data = await API.plants.getProgress(plant.id);
      setLogs(l => ({ ...l, [plant.id]: data }));
    } catch {}
  };

  const saveLog = async () => {
    try {
      await API.plants.logProgress(modal.id, form);
      showToast(`📊 Growth logged for ${modal.plantName}!`);
      const fresh = await API.plants.getProgress(modal.id);
      setLogs(l => ({ ...l, [modal.id]: fresh }));
      setModal(null);
    } catch (e) { showToast("❌ " + e.message); }
  };

  return (
    <div style={{ background: T.cream, minHeight: "calc(100vh - 62px)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem" }}>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: "1.9rem", color: T.deep, marginBottom: 6 }}>Growth Tracker 📊</h2>
        <p style={{ color: T.muted, fontSize: "0.88rem", marginBottom: "2rem" }}>Monitor and record your plant's progress over time</p>

        {loading ? <Spinner /> : plants.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: T.muted }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
            <p>No plants to track yet. Add some plants first!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {plants.map(p => (
              <div key={p.id}>
                <div style={{ ...css.card, padding: "1.3rem 1.6rem", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "1.4rem", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.09)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}>
                  <div style={{ fontSize: "2.4rem" }}>{p.emoji || "🌱"}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.97rem", marginBottom: 4 }}>{p.plantName}</div>
                    <div style={{ fontSize: "0.8rem", color: T.muted, marginBottom: 10 }}>{p.plantType} · Added {p.dateAdded}</div>
                    <div style={{ display: "flex", gap: "1.5rem", marginBottom: 10 }}>
                      <span style={{ fontSize: "0.78rem", color: T.muted }}>Health: <strong style={{ color: T.text }}>{healthMeta[p.healthStatus]?.label || "—"}</strong></span>
                      <span style={{ fontSize: "0.78rem", color: T.muted }}>Logs: <strong style={{ color: T.text }}>{(logs[p.id] || []).length}</strong></span>
                    </div>
                    <div style={{ width: 220 }}><ProgressBar value={p.healthStatus === "excellent" ? 85 : p.healthStatus === "good" ? 55 : 25} max={100} /></div>
                  </div>
                  <button onClick={() => openModal(p)} style={{ background: T.pale, color: T.deep, border: "none", padding: "9px 18px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.mint; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.pale; }}>
                    + Log Update
                  </button>
                </div>
                {(logs[p.id] || []).map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", padding: "0.9rem 1.2rem", background: T.warm, borderRadius: 10, marginTop: 6, marginLeft: 24 }}>
                    <div style={{ fontSize: "0.73rem", color: T.muted, whiteSpace: "nowrap", paddingTop: 2 }}>{l.logDate}</div>
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 500 }}>{l.healthStatus} {l.heightCm ? `· ${l.heightCm} cm` : ""}</div>
                      <div style={{ fontSize: "0.77rem", color: T.muted, marginTop: 2 }}>{l.notes || "No notes"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title="📝 Log Growth Update" subtitle={modal ? `Record today's measurements for ${modal.plantName}` : ""}>
        <Field label="Height (cm)">
          <input type="number" style={css.input} value={form.heightCm} onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))} placeholder="e.g., 28" />
        </Field>
        <Field label="Health Status">
          <select style={css.input} value={form.healthStatus} onChange={e => setForm(f => ({ ...f, healthStatus: e.target.value }))}>
            {["Excellent","Good","Fair","Needs attention"].map(h => <option key={h}>{h}</option>)}
          </select>
        </Field>
        <Field label="Notes">
          <input style={css.input} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any observations today…" />
        </Field>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.2rem" }}>
          <button style={{ ...css.btnSecondary, padding: "10px 18px" }} onClick={() => setModal(null)}>Cancel</button>
          <button style={{ ...css.btnPrimary, flex: 1, justifyContent: "center" }} onClick={saveLog}>Save Entry</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────
function AuthPage({ mode, navigate, showToast }) {
  const { login } = useAuth();
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const isLogin = mode === "login";
  const focus = e => { e.target.style.borderColor = T.sage; e.target.style.boxShadow = `0 0 0 3px ${T.sage}22`; };
  const blur  = e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; };

  const submit = async () => {
    try {
      setSaving(true);
      const data = isLogin
        ? await API.auth.login(form.email, form.password)
        : await API.auth.register(form.name, form.email, form.password);
      login(data);
      showToast(isLogin ? `🌻 Welcome back, ${data.name}!` : `🌱 Welcome to PlantPal, ${data.name}!`);
      navigate("dashboard");
    } catch (e) { showToast("❌ " + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 62px)", background: `linear-gradient(160deg, ${T.cream}, ${T.pale})` }}>
      <div style={{ ...css.card, padding: "2.8rem 3rem", width: 420, maxWidth: "90vw", boxShadow: "0 8px 48px rgba(0,0,0,0.1)" }}>
        <div style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 8 }}>{isLogin ? "🌱" : "🌿"}</div>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: "1.65rem", color: T.deep, textAlign: "center", marginBottom: 4 }}>
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ textAlign: "center", color: T.muted, fontSize: "0.85rem", marginBottom: "2rem" }}>
          {isLogin ? "Sign in to your PlantPal account" : "Start your gardening journey with PlantPal"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {!isLogin && <input style={css.input} placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onFocus={focus} onBlur={blur} />}
          <input type="email" style={css.input} placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onFocus={focus} onBlur={blur} />
          <input type="password" style={css.input} placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onFocus={focus} onBlur={blur}
            onKeyDown={e => { if (e.key === "Enter") submit(); }} />
          <button style={{ ...css.btnPrimary, justifyContent: "center", padding: "13px", marginTop: 4, fontSize: "0.95rem", opacity: saving ? 0.7 : 1 }} onClick={submit} disabled={saving}
            onMouseEnter={e => { e.currentTarget.style.background = T.forest; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.deep; }}>
            {saving ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.2rem 0" }}>
          <div style={{ flex: 1, height: 1, background: T.border }} /><span style={{ fontSize: "0.75rem", color: T.muted }}>or</span><div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <p style={{ textAlign: "center", fontSize: "0.84rem", color: T.muted }}>
          {isLogin ? "No account? " : "Already registered? "}
          <span style={{ color: T.sage, fontWeight: 500, cursor: "pointer" }} onClick={() => navigate(isLogin ? "register" : "login")}>
            {isLogin ? "Sign up free" : "Sign in"}
          </span>
        </p>
        {isLogin && (
          <div style={{ marginTop: "1.2rem", padding: "10px 14px", background: T.pale, borderRadius: 10, fontSize: "0.78rem", color: T.muted }}>
            <strong>Demo credentials:</strong><br />
            Email: demo@plantpal.com<br />
            Password: password123
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════
function NavBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? T.pale : "none", color: active ? T.deep : T.muted, fontWeight: active ? 600 : 400, border: "none", padding: "8px 14px", borderRadius: 10, fontFamily: "'Outfit',sans-serif", fontSize: "0.88rem", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = T.pale; e.currentTarget.style.color = T.text; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.muted; }}}>
      {label}
    </button>
  );
}

function AppInner() {
  useFonts();
  const { user, logout } = useAuth();
  const [page, setPage]   = useState("home");
  const [toast, setToast] = useState({ msg: "", visible: false });
  const toastTimer        = useRef(null);

  const navigate = useCallback((p) => { setPage(p); window.scrollTo(0, 0); }, []);

  const showToast = useCallback((msg) => {
    setToast({ msg, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3400);
  }, []);

  // Redirect protected pages if not logged in
  useEffect(() => {
    const protected_ = ["dashboard", "add-plant", "tracker"];
    if (protected_.includes(page) && !user) { navigate("login"); }
  }, [page, user, navigate]);

  const NAV = [
    { label: "Home",    page: "home" },
    { label: "Dashboard", page: "dashboard" },
    { label: "Plant Guide", page: "guide" },
    { label: "Tracker", page: "tracker" },
    { label: "Add Plant", page: "add-plant" },
  ];

  const PAGES = {
    home:       <HomePage navigate={navigate} />,
    dashboard:  <Dashboard navigate={navigate} showToast={showToast} />,
    "add-plant":<AddPlantPage navigate={navigate} showToast={showToast} />,
    guide:      <GuidePage />,
    tracker:    <TrackerPage showToast={showToast} />,
    login:      <AuthPage mode="login"    navigate={navigate} showToast={showToast} />,
    register:   <AuthPage mode="register" navigate={navigate} showToast={showToast} />,
  };

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: T.cream, minHeight: "100vh", color: T.text }}>
      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(250,248,243,0.93)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2.5rem", height: 62 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontFamily: "'Lora',serif", fontSize: "1.35rem", fontWeight: 700, color: T.deep }} onClick={() => navigate("home")}>
          <span>🌱</span> PlantPal
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {NAV.map(({ label, page: p }) => <NavBtn key={p} label={label} active={page === p} onClick={() => navigate(p)} />)}
        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.85rem", color: T.muted }}>Hi, {user.name?.split(" ")[0]}</span>
            <button style={{ ...css.btnPrimary, padding: "8px 18px", fontSize: "0.85rem" }} onClick={() => { logout(); navigate("home"); showToast("👋 Logged out successfully"); }}
              onMouseEnter={e => { e.currentTarget.style.background = T.forest; }}
              onMouseLeave={e => { e.currentTarget.style.background = T.deep; }}>
              Logout
            </button>
          </div>
        ) : (
          <button style={{ ...css.btnPrimary, padding: "8px 18px", fontSize: "0.85rem" }} onClick={() => navigate("login")}
            onMouseEnter={e => { e.currentTarget.style.background = T.forest; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.deep; }}>
            Sign In
          </button>
        )}
      </nav>

      {/* Page content */}
      <div style={{ paddingTop: 62 }}>
        {PAGES[page] || PAGES["home"]}
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

export default function PlantPal() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
