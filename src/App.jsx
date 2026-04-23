import { useState, useEffect, useRef } from "react";

const CATEGORIES = [
  { id: "ideia", label: "💡 Ideia", color: "#C9A96E" },
  { id: "tarefa", label: "✅ Tarefa", color: "#8BAF8B" },
  { id: "negocio", label: "🏢 Negócio", color: "#A87CA0" },
  { id: "sentimento", label: "🌊 Sentimento", color: "#7CA8BF" },
  { id: "captura", label: "🎙️ Captura Rápida", color: "#BF7C7C" },
];

const today = () => new Date().toLocaleDateString("pt-BR");
const now = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const STORAGE_KEY = "aura-thoughts";

function loadThoughts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveThoughts(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function AURA() {
  const [thoughts, setThoughts] = useState(loadThoughts);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("captura");
  const [listening, setListening] = useState(false);
  const [activeDate, setActiveDate] = useState(today());
  const [view, setView] = useState("capture"); // capture | review
  const [pulse, setPulse] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    saveThoughts(thoughts);
  }, [thoughts]);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz. Tente o Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setPulse(true);
    setTimeout(() => setPulse(false), 300);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const saveThought = () => {
    if (!input.trim()) return;
    const dateKey = today();
    const entry = {
      id: Date.now(),
      text: input.trim(),
      category,
      time: now(),
      reviewed: false,
    };
    setThoughts((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), entry],
    }));
    setInput("");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
    textareaRef.current?.focus();
  };

  const toggleReviewed = (dateKey, id) => {
    setThoughts((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].map((t) =>
        t.id === id ? { ...t, reviewed: !t.reviewed } : t
      ),
    }));
  };

  const changeCategory = (dateKey, id, newCat) => {
    setThoughts((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].map((t) =>
        t.id === id ? { ...t, category: newCat } : t
      ),
    }));
  };

  const deleteThought = (dateKey, id) => {
    setThoughts((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((t) => t.id !== id),
    }));
  };

  const dates = Object.keys(thoughts).sort((a, b) => {
    const parse = (d) => d.split("/").reverse().join("-");
    return new Date(parse(b)) - new Date(parse(a));
  });

  const todayThoughts = thoughts[today()] || [];
  const pendingCaptures = todayThoughts.filter(
    (t) => t.category === "captura" && !t.reviewed
  );

  const cat = CATEGORIES.find((c) => c.id === category);

  return (
    <div style={styles.root}>
      {/* Ambient background */}
      <div style={styles.ambient} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.orb} />
          <span style={styles.logoText}>AURA</span>
        </div>
        <div style={styles.subtitle}>sua mente, organizada</div>
        {pendingCaptures.length > 0 && (
          <button style={styles.badge} onClick={() => setView("review")}>
            🎙️ {pendingCaptures.length} captura{pendingCaptures.length > 1 ? "s" : ""} para revisar
          </button>
        )}
      </header>

      {/* Nav */}
      <nav style={styles.nav}>
        <button
          style={{ ...styles.navBtn, ...(view === "capture" ? styles.navActive : {}) }}
          onClick={() => setView("capture")}
        >
          Capturar
        </button>
        <button
          style={{ ...styles.navBtn, ...(view === "review" ? styles.navActive : {}) }}
          onClick={() => setView("review")}
        >
          Revisar
        </button>
      </nav>

      {/* CAPTURE VIEW */}
      {view === "capture" && (
        <div style={styles.card}>
          <div style={styles.cardLabel}>o que está na sua mente agora?</div>

          {/* Category selector */}
          <div style={styles.catRow}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  ...styles.catBtn,
                  ...(category === c.id
                    ? { background: c.color, color: "#0e0e14", fontWeight: 700 }
                    : { borderColor: c.color + "55", color: c.color }),
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Fale ou escreva aqui..."
            style={styles.textarea}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) saveThought();
            }}
          />

          {/* Voice + Save */}
          <div style={styles.actionRow}>
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={startListening}
              onTouchEnd={stopListening}
              style={{
                ...styles.micBtn,
                ...(listening ? styles.micActive : {}),
                ...(pulse ? styles.micPulse : {}),
              }}
              title="Segure para falar"
            >
              {listening ? "🔴" : "🎙️"}
              <span style={styles.micLabel}>
                {listening ? "Ouvindo..." : "Segurar pra falar"}
              </span>
            </button>

            <button
              onClick={saveThought}
              disabled={!input.trim()}
              style={{
                ...styles.saveBtn,
                ...(justSaved ? styles.saveBtnDone : {}),
                ...(!input.trim() ? { opacity: 0.4, cursor: "not-allowed" } : {}),
              }}
            >
              {justSaved ? "✓ Salvo!" : "Salvar"}
            </button>
          </div>

          {/* Today's count */}
          {todayThoughts.length > 0 && (
            <div style={styles.todayCount}>
              {todayThoughts.length} pensamento{todayThoughts.length > 1 ? "s" : ""} capturado{todayThoughts.length > 1 ? "s" : ""} hoje
            </div>
          )}
        </div>
      )}

      {/* REVIEW VIEW */}
      {view === "review" && (
        <div style={styles.reviewArea}>
          {/* Date tabs */}
          <div style={styles.dateTabs}>
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => setActiveDate(d)}
                style={{
                  ...styles.dateTab,
                  ...(activeDate === d ? styles.dateTabActive : {}),
                }}
              >
                {d === today() ? "Hoje" : d}
                <span style={styles.dateCount}>
                  {thoughts[d]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Thoughts list */}
          <div style={styles.thoughtList}>
            {(thoughts[activeDate] || []).length === 0 && (
              <div style={styles.empty}>Nenhum pensamento nesse dia.</div>
            )}
            {(thoughts[activeDate] || []).map((t) => {
              const tc = CATEGORIES.find((c) => c.id === t.category);
              return (
                <div
                  key={t.id}
                  style={{
                    ...styles.thoughtCard,
                    ...(t.reviewed ? styles.thoughtReviewed : {}),
                    borderLeftColor: tc?.color || "#555",
                  }}
                >
                  <div style={styles.thoughtTop}>
                    <span style={{ ...styles.thoughtCat, color: tc?.color }}>
                      {tc?.label}
                    </span>
                    <span style={styles.thoughtTime}>{t.time}</span>
                  </div>
                  <p style={styles.thoughtText}>{t.text}</p>
                  <div style={styles.thoughtActions}>
                    {/* Reclassify */}
                    <select
                      value={t.category}
                      onChange={(e) =>
                        changeCategory(activeDate, t.id, e.target.value)
                      }
                      style={styles.select}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => toggleReviewed(activeDate, t.id)}
                      style={{
                        ...styles.actionBtn,
                        color: t.reviewed ? "#8BAF8B" : "#888",
                      }}
                    >
                      {t.reviewed ? "✓ Revisado" : "Marcar revisado"}
                    </button>
                    <button
                      onClick={() => deleteThought(activeDate, t.id)}
                      style={{ ...styles.actionBtn, color: "#BF7C7C" }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a10",
    color: "#e8e2d9",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflowX: "hidden",
    paddingBottom: 60,
  },
  ambient: {
    position: "fixed",
    top: -200,
    left: "50%",
    transform: "translateX(-50%)",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(139,111,96,0.12) 0%, rgba(10,10,16,0) 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  header: {
    textAlign: "center",
    padding: "48px 24px 16px",
    position: "relative",
    zIndex: 1,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 6,
  },
  orb: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#C9A96E",
    boxShadow: "0 0 12px #C9A96E, 0 0 24px #C9A96E44",
    animation: "orbPulse 3s ease-in-out infinite",
  },
  logoText: {
    fontSize: 32,
    letterSpacing: 10,
    fontWeight: 400,
    color: "#e8e2d9",
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 3,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  badge: {
    display: "inline-block",
    background: "rgba(191,124,124,0.15)",
    border: "1px solid rgba(191,124,124,0.4)",
    color: "#BF7C7C",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 13,
    cursor: "pointer",
    marginTop: 8,
  },
  nav: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "0 24px 24px",
    position: "relative",
    zIndex: 1,
  },
  navBtn: {
    background: "transparent",
    border: "1px solid #2a2a35",
    color: "#888",
    borderRadius: 20,
    padding: "8px 24px",
    fontSize: 14,
    cursor: "pointer",
    letterSpacing: 1,
    transition: "all 0.2s",
  },
  navActive: {
    background: "rgba(201,169,110,0.1)",
    borderColor: "#C9A96E",
    color: "#C9A96E",
  },
  card: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "0 20px",
    position: "relative",
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: "#666",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
  },
  catRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "center",
  },
  catBtn: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: 0.5,
  },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #2a2a35",
    borderRadius: 12,
    color: "#e8e2d9",
    fontSize: 16,
    padding: "16px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: 1.6,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  actionRow: {
    display: "flex",
    gap: 12,
    marginTop: 12,
    alignItems: "center",
  },
  micBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #2a2a35",
    borderRadius: 10,
    color: "#aaa",
    padding: "14px",
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s",
    userSelect: "none",
  },
  micActive: {
    background: "rgba(191,124,124,0.1)",
    borderColor: "#BF7C7C",
    color: "#BF7C7C",
  },
  micPulse: {
    transform: "scale(0.97)",
  },
  micLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  saveBtn: {
    background: "#C9A96E",
    border: "none",
    borderRadius: 10,
    color: "#0a0a10",
    padding: "14px 28px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 1,
    transition: "all 0.2s",
  },
  saveBtnDone: {
    background: "#8BAF8B",
  },
  todayCount: {
    textAlign: "center",
    color: "#555",
    fontSize: 12,
    marginTop: 20,
    letterSpacing: 1,
  },
  reviewArea: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "0 20px",
    position: "relative",
    zIndex: 1,
  },
  dateTabs: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 12,
    marginBottom: 16,
  },
  dateTab: {
    background: "transparent",
    border: "1px solid #2a2a35",
    borderRadius: 20,
    color: "#888",
    padding: "6px 16px",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  dateTabActive: {
    background: "rgba(201,169,110,0.1)",
    borderColor: "#C9A96E",
    color: "#C9A96E",
  },
  dateCount: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "1px 7px",
    fontSize: 11,
  },
  thoughtList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  thoughtCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid #1e1e28",
    borderLeft: "3px solid #555",
    borderRadius: 10,
    padding: "14px 16px",
    transition: "opacity 0.2s",
  },
  thoughtReviewed: {
    opacity: 0.45,
  },
  thoughtTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  thoughtCat: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  thoughtTime: {
    fontSize: 11,
    color: "#555",
  },
  thoughtText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#ccc",
    margin: "0 0 12px",
  },
  thoughtActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    background: "#14141c",
    border: "1px solid #2a2a35",
    borderRadius: 6,
    color: "#888",
    fontSize: 11,
    padding: "4px 8px",
    cursor: "pointer",
  },
  actionBtn: {
    background: "transparent",
    border: "none",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 0",
    letterSpacing: 0.3,
  },
  empty: {
    textAlign: "center",
    color: "#444",
    fontSize: 14,
    paddingTop: 40,
  },
};
