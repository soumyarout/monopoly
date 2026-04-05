import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  brown:     { label:"Brown",      bg:"#8B4513", tx:"#fff", size:2, rent:[1,2]      },
  lightBlue: { label:"Light Blue", bg:"#5BBCD6", tx:"#000", size:3, rent:[1,2,3]   },
  pink:      { label:"Pink",       bg:"#E91E8C", tx:"#fff", size:3, rent:[1,2,4]   },
  orange:    { label:"Orange",     bg:"#E87000", tx:"#fff", size:3, rent:[1,3,5]   },
  red:       { label:"Red",        bg:"#CC1111", tx:"#fff", size:3, rent:[2,3,6]   },
  yellow:    { label:"Yellow",     bg:"#C9A800", tx:"#000", size:3, rent:[2,4,6]   },
  green:     { label:"Green",      bg:"#1B7A1B", tx:"#fff", size:3, rent:[2,4,7]   },
  blue:      { label:"Blue",       bg:"#1B3AEB", tx:"#fff", size:2, rent:[3,8]     },
  railroad:  { label:"Railroad",   bg:"#333",    tx:"#fff", size:4, rent:[1,2,3,4] },
  utility:   { label:"Utility",    bg:"#557080", tx:"#fff", size:2, rent:[1,2]     },
};

const ACTION_COLORS = {
  passGo:"#1565C0", birthday:"#AD1457", debtCollector:"#E64A19",
  slyDeal:"#4527A0", forcedDeal:"#1B5E20", dealBreaker:"#B71C1C",
  justSayNo:"#00695C", doubleRent:"#F57F17", house:"#6D4C41", hotel:"#37474F",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createDeck() {
  let uid = 0;
  const nid = () => String(++uid);
  const cards = [];

  [1,1,1,1,1,1,2,2,2,2,2,3,3,3,4,4,4,5,5,10].forEach(v =>
    cards.push({ id:nid(), type:"money", value:v, name:`$${v}M` }));

  [
    {color:"brown",    name:"Mediterranean", value:1},
    {color:"brown",    name:"Baltic",        value:1},
    {color:"lightBlue",name:"Oriental Ave",  value:1},
    {color:"lightBlue",name:"Vermont Ave",   value:1},
    {color:"lightBlue",name:"Connecticut",   value:1},
    {color:"pink",     name:"St. Charles",   value:2},
    {color:"pink",     name:"States Ave",    value:2},
    {color:"pink",     name:"Virginia",      value:2},
    {color:"orange",   name:"St. James",     value:2},
    {color:"orange",   name:"Tennessee",     value:2},
    {color:"orange",   name:"New York",      value:2},
    {color:"red",      name:"Kentucky",      value:3},
    {color:"red",      name:"Indiana",       value:3},
    {color:"red",      name:"Illinois",      value:3},
    {color:"yellow",   name:"Atlantic",      value:3},
    {color:"yellow",   name:"Ventnor",       value:3},
    {color:"yellow",   name:"Marvin Gdns",   value:3},
    {color:"green",    name:"Pacific",       value:4},
    {color:"green",    name:"N Carolina",    value:4},
    {color:"green",    name:"Pennsylvania",  value:4},
    {color:"blue",     name:"Park Place",    value:4},
    {color:"blue",     name:"Boardwalk",     value:4},
    {color:"railroad", name:"Reading RR",    value:2},
    {color:"railroad", name:"Penn RR",       value:2},
    {color:"railroad", name:"B&O RR",        value:2},
    {color:"railroad", name:"Short Line",    value:2},
    {color:"utility",  name:"Electric Co",   value:2},
    {color:"utility",  name:"Water Works",   value:2},
  ].forEach(p => cards.push({ id:nid(), type:"property", ...p }));

  [
    {colors:["railroad","utility"], value:4, name:"RR/Utility Wild"},
    {colors:["railroad","utility"], value:4, name:"RR/Utility Wild"},
    {colors:["lightBlue","brown"],  value:1, name:"LtBlue/Brown Wild"},
    {colors:["pink","orange"],      value:2, name:"Pink/Orange Wild"},
    {colors:["pink","orange"],      value:2, name:"Pink/Orange Wild"},
    {colors:["red","yellow"],       value:3, name:"Red/Yellow Wild"},
    {colors:["red","yellow"],       value:3, name:"Red/Yellow Wild"},
    {colors:["green","blue"],       value:4, name:"Green/Blue Wild"},
    {colors:["green","blue"],       value:4, name:"Green/Blue Wild"},
    {colors:["railroad","green"],   value:4, name:"RR/Green Wild"},
    {colors:"all",                  value:0, name:"All-Color Wild"},
    {colors:"all",                  value:0, name:"All-Color Wild"},
  ].forEach(w => cards.push({ id:nid(), type:"wildProperty", activeColor:null, ...w }));

  [
    ...Array(10).fill({action:"passGo",       name:"Pass Go",       value:1, desc:"Draw 2 more cards"}),
    ...Array(3).fill( {action:"birthday",      name:"My Birthday",   value:2, desc:"Everyone pays $2M"}),
    ...Array(3).fill( {action:"debtCollector", name:"Debt Collector",value:3, desc:"One player pays $5M"}),
    ...Array(3).fill( {action:"slyDeal",       name:"Sly Deal",      value:3, desc:"Steal a property"}),
    ...Array(4).fill( {action:"forcedDeal",    name:"Forced Deal",   value:3, desc:"Swap a property"}),
    ...Array(2).fill( {action:"dealBreaker",   name:"Deal Breaker",  value:5, desc:"Steal a full set"}),
    ...Array(3).fill( {action:"justSayNo",     name:"Just Say No",   value:4, desc:"Cancel any action"}),
    ...Array(2).fill( {action:"doubleRent",    name:"Double Rent",   value:1, desc:"Next rent x2"}),
    ...Array(3).fill( {action:"house",         name:"House",         value:3, desc:"Full set +$3M rent"}),
    ...Array(2).fill( {action:"hotel",         name:"Hotel",         value:4, desc:"Upgrade house +$7M"}),
  ].forEach(a => cards.push({ id:nid(), type:"action", ...a }));

  [
    ...Array(2).fill({colors:["brown","lightBlue"],  name:"Rent", value:1}),
    ...Array(2).fill({colors:["pink","orange"],       name:"Rent", value:1}),
    ...Array(2).fill({colors:["red","yellow"],        name:"Rent", value:1}),
    ...Array(2).fill({colors:["green","blue"],        name:"Rent", value:1}),
    ...Array(2).fill({colors:["railroad","utility"],  name:"Rent", value:1}),
    ...Array(3).fill({colors:"all",                   name:"Wild Rent", value:3}),
  ].forEach(r => cards.push({ id:nid(), type:"rent", ...r }));

  return shuffle(cards);
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const propCount    = (pl, c) => ((pl.properties || {})[c] || []).length;
const isComplete   = (pl, c) => propCount(pl,c) >= (COLORS[c]?.size || 0);
const completeSets = (pl)    => Object.keys(pl.properties || {}).filter(c => propCount(pl,c) > 0 && isComplete(pl,c)).length;
const bankTotal    = (pl)    => (pl.bank || []).reduce((s,c) => s + c.value, 0);

function calcRent(pl, color, doubled) {
  const n = propCount(pl, color);
  if (!n) return 0;
  const rents = COLORS[color]?.rent || [];
  let base = rents[Math.min(n - 1, rents.length - 1)] || 0;
  const ex = ((pl.propertyExtras || {})[color]) || {};
  if (ex.hotel) base += 7;
  else if (ex.house) base += 3;
  return doubled ? base * 2 : base;
}

function initGame(lobbyPlayers) {
  let deck = createDeck();
  const players = lobbyPlayers.map(lp => {
    const hand = deck.slice(0, 5);
    deck = deck.slice(5);
    return { id:lp.id, name:lp.name, hand, bank:[], properties:{}, propertyExtras:{} };
  });
  return {
    phase: "playing", players, deck, discard: [],
    currentPlayerIndex: 0,
    turn: { cardsPlayed:0, drawnCards:false, doubleRentActive:false },
    pendingAction: null,
    log: ["Game started! Draw 2 cards to begin your turn."],
    winner: null,
    version: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────────────────────────

async function storeSave(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); }
  catch(e) { console.warn("storeSave error", e); }
}

async function storeLoad(key) {
  try {
    const r = await window.storage.get(key, true);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLAUDE JUDGE
// ─────────────────────────────────────────────────────────────────────────────

async function callJudge(situation, gs) {
  try {
    const summary = (gs.players || [])
      .map(p => `${p.name}: ${completeSets(p)} sets, $${bankTotal(p)}M bank`)
      .join(" | ");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 180,
        system: "You are the Monopoly Deal live judge and announcer. Be energetic, fair, entertaining. Under 70 words. Use 1-2 emojis. Make clear rulings on illegal moves.",
        messages: [{ role:"user", content:`Situation: ${situation}\nState: ${summary}\nCurrent turn: ${(gs.players||[])[gs.currentPlayerIndex]?.name}` }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "The judge deliberates...";
  } catch {
    return "Judge unavailable.";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle = {
  padding:"10px 12px", background:"rgba(255,255,255,0.08)",
  border:"1px solid #2a5a2a", borderRadius:6, color:"#fff",
  fontSize:14, width:"100%", boxSizing:"border-box", outline:"none",
};

function mkBtn(bg, extra) {
  return {
    background: bg, color:"#fff", border:"none", borderRadius:6,
    padding:"5px 8px", cursor:"pointer", fontSize:11, fontWeight:"bold",
    width:"100%", textAlign:"left", marginBottom:3, ...(extra || {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD CHIP
// ─────────────────────────────────────────────────────────────────────────────

function CardChip({ card, selected, onClick, disabled, small }) {
  let bg = "#444", tx = "#fff";
  if (card.type === "money") {
    bg = "#2E7D32";
  } else if (card.type === "property" || card.type === "wildProperty") {
    const ci = COLORS[card.color || card.activeColor];
    if (ci) { bg = ci.bg; tx = ci.tx; }
    else bg = "linear-gradient(135deg,#555 50%,#888 50%)";
  } else if (card.type === "action") {
    bg = ACTION_COLORS[card.action] || "#333";
  } else if (card.type === "rent") {
    bg = "#6A1B9A";
  }

  const w = small ? 52 : 70, h = small ? 64 : 92;
  return (
    <div
      onClick={disabled ? undefined : onClick}
      title={card.name + (card.desc ? " — " + card.desc : "")}
      style={{
        width:w, minWidth:w, height:h, minHeight:h, borderRadius:6,
        background:bg, color:tx,
        border: selected ? "3px solid #FFD700" : "2px solid rgba(0,0,0,0.35)",
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", cursor: disabled ? "default" : "pointer",
        userSelect:"none", fontSize: small ? 7 : 9, fontWeight:"600",
        padding:3, boxSizing:"border-box", textAlign:"center", lineHeight:1.3,
        wordBreak:"break-word", position:"relative",
        transform: selected ? "translateY(-10px) scale(1.06)" : "none",
        boxShadow: selected
          ? "0 6px 18px rgba(255,215,0,0.55)"
          : "0 2px 6px rgba(0,0,0,0.45)",
        transition:"transform 0.15s, box-shadow 0.15s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <div style={{ fontSize: small ? 6 : 8, opacity:0.75, marginBottom:2 }}>${card.value}M</div>
      <div>{card.name}</div>
      {!small && card.type === "action" && (
        <div style={{ fontSize:7, opacity:0.65, marginTop:2 }}>{card.desc}</div>
      )}
      {!small && card.type === "wildProperty" && (
        <div style={{ fontSize:7, opacity:0.65, marginTop:2 }}>
          {card.colors === "all" ? "Any Color" : (card.colors||[]).map(c => COLORS[c]?.label||c).join("/")}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROP SET
// ─────────────────────────────────────────────────────────────────────────────

function PropSet({ color, cards, extras, small }) {
  const ci = COLORS[color] || { bg:"#555", tx:"#fff", label:color, size:1 };
  const full = cards.length >= ci.size;
  return (
    <div style={{
      background: full ? ci.bg : ci.bg + "88",
      border: `2px solid ${full ? "#FFD700" : ci.bg + "55"}`,
      borderRadius:6, padding: small ? 4 : 6,
      minWidth: small ? 64 : 84,
    }}>
      <div style={{
        fontSize: small ? 7 : 9, color: ci.tx, fontWeight:"bold",
        display:"flex", justifyContent:"space-between", marginBottom:2,
      }}>
        <span>{ci.label}</span>
        <span>{cards.length}/{ci.size}{full ? "✅" : ""}</span>
      </div>
      {cards.map(c => (
        <div key={c.id} style={{
          fontSize: small ? 6 : 8, color: ci.tx,
          background:"rgba(255,255,255,0.18)", borderRadius:3,
          padding:"1px 4px", marginBottom:1,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
          maxWidth: small ? 60 : 92,
        }}>
          {small ? c.name.slice(0,10) : c.name}
        </div>
      ))}
      {((extras||{}).house || (extras||{}).hotel) && (
        <div style={{ fontSize:8, color:ci.tx, textAlign:"center", marginTop:2 }}>
          {(extras||{}).hotel ? "🏨 Hotel" : "🏡 House"}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING RESPONSE
// ─────────────────────────────────────────────────────────────────────────────

function PendingResp({ pa, gs, me, onPay, onJsn }) {
  const init = (gs.players||[]).find(p => p.id === pa.initiator);
  const hasJsn = (me.hand||[]).some(c => c.action === "justSayNo");
  let msg = "";
  if (pa.type === "rent")          msg = `${init?.name} charges $${pa.amount}M rent`;
  if (pa.type === "birthday")      msg = `${init?.name}'s Birthday — pay $2M`;
  if (pa.type === "debtCollector") msg = `Debt from ${init?.name} — pay $5M`;
  return (
    <div style={{
      background:"rgba(200,0,0,0.18)", border:"1px solid #cc3333",
      borderRadius:6, padding:8, margin:"4px 0",
    }}>
      <div style={{ color:"#ff8888", fontWeight:"bold", fontSize:11, marginBottom:4 }}>
        ⚠️ You owe!
      </div>
      <div style={{ fontSize:10, color:"#fff", marginBottom:6 }}>{msg}</div>
      <button onClick={() => onPay(pa.amount)} style={mkBtn("#cc5500", { marginBottom:4 })}>
        💸 Pay ${pa.amount}M
      </button>
      {hasJsn && (
        <button onClick={onJsn} style={mkBtn("#004D40")}>🚫 Just Say No!</button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER CARD (sidebar)
// ─────────────────────────────────────────────────────────────────────────────

function PlayerCard({ p, pid, isCur }) {
  return (
    <div style={{
      background: isCur ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${isCur ? "#FFD700" : "#1e441e"}`,
      borderRadius:6, padding:6,
    }}>
      <div style={{ fontSize:11, fontWeight:"bold", color: isCur ? "#FFD700" : "#ddd" }}>
        {isCur ? "▶ " : ""}{p.name}{p.id === pid ? " (you)" : ""}
      </div>
      <div style={{ fontSize:9, color:"#888", marginTop:2 }}>
        💰${bankTotal(p)}M · 🃏{(p.hand||[]).length}
      </div>
      <div style={{ fontSize:9, color:"#90EE90" }}>
        🏠{completeSets(p)}/3{completeSets(p) >= 3 ? " 🏆" : ""}
      </div>
      <div style={{ display:"flex", gap:2, flexWrap:"wrap", marginTop:3 }}>
        {Object.keys(p.properties||{}).map(c =>
          (p.properties[c]||[]).length > 0 ? (
            <div key={c} style={{
              width:8, height:8, borderRadius:2,
              background: COLORS[c]?.bg || "#555",
              border: isComplete(p,c) ? "1px solid #FFD700" : "none",
            }} title={COLORS[c]?.label} />
          ) : null
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION PANEL
// ─────────────────────────────────────────────────────────────────────────────

function ActionPanel({
  pui, setPui, selCard, gs, me, pid, canPlay,
  onBank, onProp, onAction, onRent,
  onBirthday, onDebt, onSly, onBreaker, onForced,
  onHouse, onHotel, setErr,
}) {
  const [tgt,   setTgt]   = useState(null);
  const [col1,  setCol1]  = useState(null);
  const [prop1, setProp1] = useState(null);
  const [col2,  setCol2]  = useState(null);

  useEffect(() => {
    setTgt(null); setCol1(null); setProp1(null); setCol2(null);
  }, [selCard?.id, pui?.type]);

  if (!selCard || !pui) {
    return (
      <div style={{ color:"#444", fontSize:11, textAlign:"center", padding:12 }}>
        {canPlay
          ? "Click a card in your hand"
          : gs?.turn?.drawnCards
            ? "3 actions used this turn"
            : "Draw cards to start your turn"}
      </div>
    );
  }

  const others = (gs.players||[]).filter(p => p.id !== pid);
  const card   = selCard;
  const type   = pui.type;

  // Reusable button inside panel
  const PBtn = ({ onClick, bg, style: sx, children }) => (
    <button onClick={onClick} style={mkBtn(bg || "#1a5a1a", sx)}>{children}</button>
  );
  const BackBtn   = ({ onClick }) => <PBtn onClick={onClick} bg="#2a2a2a">← Back</PBtn>;
  const CancelBtn = () => <PBtn onClick={() => { setPui(null); setErr(""); }} bg="#3a1a1a">✕ Cancel</PBtn>;
  const BankBtn   = () => <PBtn onClick={() => onBank(card)} bg="#2E7D32">🏦 Bank for ${card.value}M</PBtn>;

  const hdr = { fontSize:12, fontWeight:"bold", color:"#FFD700", marginBottom:6 };

  if (type === "playMoney") return (
    <div><div style={hdr}>{card.name}</div><BankBtn /><CancelBtn /></div>
  );

  if (type === "playProperty") {
    const ci = COLORS[card.color];
    return (
      <div>
        <div style={hdr}>{card.name}</div>
        <PBtn onClick={() => onProp(card, card.color)} bg={ci?.bg} style={{ color:ci?.tx }}>
          🏠 Place in {ci?.label}
        </PBtn>
        <BankBtn /><CancelBtn />
      </div>
    );
  }

  if (type === "playWild") {
    const cols = card.colors === "all" ? Object.keys(COLORS) : (card.colors||[]);
    return (
      <div>
        <div style={hdr}>{card.name}</div>
        <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>Choose color:</div>
        {cols.map(c => (
          <PBtn key={c} onClick={() => onProp(card, c)} bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
            {COLORS[c]?.label}
          </PBtn>
        ))}
        <BankBtn /><CancelBtn />
      </div>
    );
  }

  if (type === "playRent") {
    const doubled = gs.turn?.doubleRentActive;
    const validCols = (card.colors === "all" ? Object.keys(COLORS) : (card.colors||[]))
      .filter(c => propCount(me,c) > 0);
    return (
      <div>
        <div style={hdr}>Rent Card</div>
        {doubled && <div style={{ color:"#FFD700", fontSize:10, marginBottom:4 }}>🔥 DOUBLED!</div>}
        {validCols.length === 0
          ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No matching properties!</div>
          : validCols.map(c => {
              const r = calcRent(me, c, doubled);
              return (
                <PBtn key={c} onClick={() => onRent(card, c)}
                  bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
                  {COLORS[c]?.label} — ${r}M{doubled ? " (×2)" : ""}
                </PBtn>
              );
            })
        }
        <BankBtn /><CancelBtn />
      </div>
    );
  }

  if (type === "directAction") return (
    <div>
      <div style={hdr}>{card.name}</div>
      <div style={{ fontSize:10, color:"#aaa", marginBottom:6 }}>{card.desc}</div>
      <PBtn onClick={() => onAction(card)} bg="#1565C0">▶ Play</PBtn>
      <BankBtn /><CancelBtn />
    </div>
  );

  if (type === "birthday") return (
    <div>
      <div style={hdr}>{card.name}</div>
      <div style={{ fontSize:10, color:"#aaa", marginBottom:6 }}>All players pay you $2M</div>
      <PBtn onClick={onBirthday} bg="#AD1457">🎂 Play!</PBtn>
      <BankBtn /><CancelBtn />
    </div>
  );

  if (type === "debtCollector") return (
    <div>
      <div style={hdr}>{card.name}</div>
      <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>Who pays $5M?</div>
      {others.map(p => (
        <PBtn key={p.id} onClick={() => onDebt(p.id)} bg="#E64A19">
          💼 {p.name} (${bankTotal(p)}M)
        </PBtn>
      ))}
      <BankBtn /><CancelBtn />
    </div>
  );

  if (type === "slyDeal") {
    if (!tgt) {
      const valid = others.filter(p =>
        Object.keys(p.properties||{}).some(c => propCount(p,c) > 0 && !isComplete(p,c))
      );
      return (
        <div>
          <div style={hdr}>Sly Deal</div>
          <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>Steal from:</div>
          {valid.length === 0
            ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No stealable properties!</div>
            : valid.map(p => <PBtn key={p.id} onClick={() => setTgt(p.id)} bg="#4527A0">{p.name}</PBtn>)
          }
          <BankBtn /><CancelBtn />
        </div>
      );
    }
    const tp = (gs.players||[]).find(p => p.id === tgt);
    if (!col1) {
      const cols = Object.keys(tp.properties||{}).filter(c => propCount(tp,c)>0 && !isComplete(tp,c));
      return (
        <div>
          <div style={hdr}>→ {tp.name}</div>
          {cols.map(c => (
            <PBtn key={c} onClick={() => setCol1(c)} bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
              {COLORS[c]?.label} ({propCount(tp,c)})
            </PBtn>
          ))}
          <BackBtn onClick={() => setTgt(null)} />
        </div>
      );
    }
    return (
      <div>
        <div style={hdr}>Steal from {COLORS[col1]?.label}:</div>
        {(tp.properties[col1]||[]).map(pc => (
          <PBtn key={pc.id} onClick={() => onSly(tgt, col1, pc)} bg="#4527A0">
            🕵️ {pc.name}
          </PBtn>
        ))}
        <BackBtn onClick={() => setCol1(null)} />
      </div>
    );
  }

  if (type === "dealBreaker") {
    if (!tgt) {
      const valid = others.filter(p =>
        Object.keys(p.properties||{}).some(c => isComplete(p,c))
      );
      return (
        <div>
          <div style={hdr}>Deal Breaker</div>
          <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>Steal full set from:</div>
          {valid.length === 0
            ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No complete sets out there!</div>
            : valid.map(p => <PBtn key={p.id} onClick={() => setTgt(p.id)} bg="#B71C1C">{p.name}</PBtn>)
          }
          <BankBtn /><CancelBtn />
        </div>
      );
    }
    const tp = (gs.players||[]).find(p => p.id === tgt);
    const cols = Object.keys(tp.properties||{}).filter(c => isComplete(tp,c));
    return (
      <div>
        <div style={hdr}>Deal Breaker on {tp.name}:</div>
        {cols.map(c => (
          <PBtn key={c} onClick={() => onBreaker(tgt, c)} bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
            💥 Steal {COLORS[c]?.label}!
          </PBtn>
        ))}
        <BackBtn onClick={() => setTgt(null)} />
      </div>
    );
  }

  if (type === "forcedDeal") {
    if (!tgt) {
      const valid = others.filter(p =>
        Object.keys(p.properties||{}).some(c => propCount(p,c)>0 && !isComplete(p,c))
      );
      return (
        <div>
          <div style={hdr}>Forced Deal</div>
          <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>Swap with:</div>
          {valid.length === 0
            ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No eligible targets!</div>
            : valid.map(p => <PBtn key={p.id} onClick={() => setTgt(p.id)} bg="#1B5E20">{p.name}</PBtn>)
          }
          <BankBtn /><CancelBtn />
        </div>
      );
    }
    const tp = (gs.players||[]).find(p => p.id === tgt);
    if (!col1) {
      const cols = Object.keys(tp.properties||{}).filter(c => propCount(tp,c)>0 && !isComplete(tp,c));
      return (
        <div>
          <div style={hdr}>Take from {tp.name}:</div>
          {cols.map(c => (
            <PBtn key={c} onClick={() => setCol1(c)} bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
              {COLORS[c]?.label} ({propCount(tp,c)})
            </PBtn>
          ))}
          <BackBtn onClick={() => setTgt(null)} />
        </div>
      );
    }
    if (!prop1) {
      return (
        <div>
          <div style={hdr}>Which card?</div>
          {(tp.properties[col1]||[]).map(pc => (
            <PBtn key={pc.id} onClick={() => setProp1(pc)} bg={COLORS[col1]?.bg} style={{ color:COLORS[col1]?.tx }}>
              {pc.name}
            </PBtn>
          ))}
          <BackBtn onClick={() => setCol1(null)} />
        </div>
      );
    }
    if (!col2) {
      const myCols = Object.keys(me.properties||{}).filter(c => propCount(me,c)>0 && !isComplete(me,c));
      return (
        <div>
          <div style={hdr}>Give back (your color):</div>
          {myCols.length === 0
            ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No non-complete props to give!</div>
            : myCols.map(c => (
                <PBtn key={c} onClick={() => setCol2(c)} bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
                  {COLORS[c]?.label}
                </PBtn>
              ))
          }
          <BackBtn onClick={() => setProp1(null)} />
        </div>
      );
    }
    return (
      <div>
        <div style={hdr}>Give which card?</div>
        {(me.properties[col2]||[]).map(mc => (
          <PBtn key={mc.id} onClick={() => onForced(tgt, col1, prop1, col2, mc)}
            bg={COLORS[col2]?.bg} style={{ color:COLORS[col2]?.tx }}>
            🔄 Give {mc.name}
          </PBtn>
        ))}
        <BackBtn onClick={() => setCol2(null)} />
      </div>
    );
  }

  if (type === "house" || type === "hotel") {
    const myEligible = Object.keys(me.properties||{}).filter(c => {
      if (!propCount(me,c)) return false;
      if (type === "house") return isComplete(me,c) && !(me.propertyExtras||{})[c]?.house;
      return (me.propertyExtras||{})[c]?.house && !(me.propertyExtras||{})[c]?.hotel;
    });
    return (
      <div>
        <div style={hdr}>{card.name}</div>
        <div style={{ fontSize:10, color:"#aaa", marginBottom:4 }}>
          {type === "house" ? "Add to complete set:" : "Upgrade house (needs house first):"}
        </div>
        {myEligible.length === 0
          ? <div style={{ color:"#ff6b6b", fontSize:10 }}>No eligible sets!</div>
          : myEligible.map(c => (
              <PBtn key={c} onClick={() => type === "house" ? onHouse(c) : onHotel(c)}
                bg={COLORS[c]?.bg} style={{ color:COLORS[c]?.tx }}>
                {type === "house" ? "🏡" : "🏨"} {COLORS[c]?.label}
              </PBtn>
            ))
        }
        <BankBtn /><CancelBtn />
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOBBY SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function LobbyScreen({ onCreate, onJoin }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    if (busy) return;
    setBusy(true); setErr("");
    const e = await fn();
    if (e) setErr(e);
    setBusy(false);
  };

  const bigBtn = {
    background:"#1a7f1a", color:"#fff", border:"none", borderRadius:8,
    padding:"12px 0", fontSize:14, fontWeight:"bold", cursor:"pointer",
    width:"100%", marginBottom:10,
  };

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(140deg,#071407,#142014)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Georgia,serif",
    }}>
      <div style={{
        background:"rgba(255,255,255,0.05)", borderRadius:16, padding:36,
        border:"2px solid #2a5a2a", maxWidth:380, width:"100%", textAlign:"center",
      }}>
        <div style={{ fontSize:52, marginBottom:8 }}>🎲</div>
        <h1 style={{ color:"#FFD700", fontSize:26, margin:"0 0 4px" }}>Monopoly Deal</h1>
        <p style={{ color:"#555", fontSize:11, marginBottom:24 }}>
          Multiplayer · Claude is your live Judge · Collect 3 complete sets to win!
        </p>

        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Your name"
          onKeyDown={e => e.key === "Enter" && run(() => onCreate(name))}
          style={{ ...inputStyle, marginBottom:12 }}
        />
        <button onClick={() => run(() => onCreate(name))} disabled={busy} style={bigBtn}>
          {busy ? "..." : "🏠 Create Room"}
        </button>

        <div style={{ color:"#333", margin:"4px 0 12px", fontSize:12 }}>— or join existing room —</div>

        <div style={{ display:"flex", gap:8 }}>
          <input
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            onKeyDown={e => e.key === "Enter" && run(() => onJoin(name, code))}
            style={{ ...inputStyle, flex:1 }}
          />
          <button
            onClick={() => run(() => onJoin(name, code))} disabled={busy}
            style={{ ...bigBtn, width:60, marginBottom:0, padding:"12px 0", fontSize:12 }}
          >Join</button>
        </div>

        {err && <div style={{ color:"#ff6b6b", marginTop:10, fontSize:12 }}>{err}</div>}

        <div style={{ marginTop:20, color:"#444", fontSize:10, textAlign:"left", lineHeight:1.7 }}>
          <strong style={{ color:"#666" }}>Rules: </strong>
          Draw 2 cards to start each turn. Play up to 3 cards (properties, bank money, or
          action cards). First player to collect <strong style={{ color:"#90EE90" }}>3 complete
          property sets</strong> wins!
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WAITING SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function WaitingScreen({ lobby, pid, roomCode, onStart }) {
  const isHost = (lobby?.players||[]).find(p => p.id === pid)?.isHost;
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");
  const n = (lobby?.players||[]).length;

  const start = async () => {
    if (n < 2) { setErr("Need at least 2 players!"); return; }
    setBusy(true);
    await onStart();
    setBusy(false);
  };

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(140deg,#071407,#142014)",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"Georgia,serif",
    }}>
      <div style={{
        background:"rgba(255,255,255,0.05)", borderRadius:16, padding:36,
        border:"2px solid #2a5a2a", maxWidth:380, width:"100%", textAlign:"center",
      }}>
        <div style={{ fontSize:36, marginBottom:12 }}>⏳</div>
        <h2 style={{ color:"#FFD700", margin:"0 0 8px" }}>Waiting Room</h2>

        <div style={{
          background:"#080f08", border:"1px solid #2a5a2a", borderRadius:8,
          padding:"8px 20px", display:"inline-block", marginBottom:8,
          letterSpacing:6, fontSize:22, color:"#90EE90",
        }}>{roomCode}</div>
        <p style={{ color:"#444", fontSize:11, marginBottom:16 }}>Share this code with friends!</p>

        {(lobby?.players||[]).map(p => (
          <div key={p.id} style={{
            display:"flex", alignItems:"center", gap:8, padding:"7px 0",
            borderBottom:"1px solid #1a3a1a",
          }}>
            <span>{p.isHost ? "👑" : "👤"}</span>
            <span style={{ color:"#ddd" }}>{p.name}</span>
            {p.id === pid && <span style={{ color:"#555", fontSize:10 }}>(you)</span>}
          </div>
        ))}

        {isHost ? (
          <>
            <button
              onClick={start} disabled={busy || n < 2}
              style={{
                background: n < 2 ? "#1a3a1a" : "#1a7f1a",
                color: n < 2 ? "#444" : "#fff", border:"none", borderRadius:8,
                padding:"12px 0", fontSize:14, fontWeight:"bold",
                cursor: n < 2 ? "default" : "pointer", width:"100%", marginTop:16,
              }}
            >
              {busy ? "Starting…" : "🎮 Start Game"}
            </button>
            {n < 2 && <div style={{ color:"#444", fontSize:11, marginTop:6 }}>Need at least 2 players</div>}
          </>
        ) : (
          <div style={{ color:"#555", marginTop:16, fontSize:13 }}>Waiting for host to start…</div>
        )}
        {err && <div style={{ color:"#ff6b6b", marginTop:8, fontSize:12 }}>{err}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function WinScreen({ gs, pid, judgeMsg }) {
  const winner = (gs.players||[]).find(p => p.id === gs.winner);
  const isMe   = gs.winner === pid;
  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(140deg,#071407,#1a1a2e)",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", textAlign:"center", padding:24,
      fontFamily:"Georgia,serif",
    }}>
      <div style={{ fontSize:80 }}>{isMe ? "🏆" : "🎉"}</div>
      <h1 style={{ color:"#FFD700", fontSize:32, margin:"16px 0 8px" }}>
        {isMe ? "YOU WIN!" : `${winner?.name} Wins!`}
      </h1>
      <div style={{ color:"#c8b4f0", maxWidth:440, marginBottom:20, fontSize:13, lineHeight:1.7 }}>
        {judgeMsg}
      </div>
      <div style={{ marginBottom:24, color:"#777", fontSize:12 }}>
        {(gs.players||[]).map(p => (
          <div key={p.id}>{p.name}: {completeSets(p)} sets, ${bankTotal(p)}M banked</div>
        ))}
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background:"#1565C0", color:"#fff", border:"none", borderRadius:8,
          padding:"12px 32px", fontSize:15, fontWeight:"bold", cursor:"pointer",
        }}
      >Play Again</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [pid]      = useState(() => "p" + Math.random().toString(36).slice(2,8));
  const [screen,   setScreen]   = useState("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [lobby,    setLobby]    = useState(null);
  const [gs,       setGs]       = useState(null);
  const [judgeMsg, setJudgeMsg] = useState("🎩 Welcome to Monopoly Deal! Claude is your live judge.");
  const [selCard,  setSelCard]  = useState(null);
  const [pui,      setPui]      = useState(null);
  const [err,      setErr]      = useState("");
  const pollRef  = useRef(null);
  const lastVer  = useRef(0);

  const me      = (gs?.players||[]).find(p => p.id === pid);
  const myTurn  = (gs?.players||[])[gs?.currentPlayerIndex]?.id === pid;
  const curP    = (gs?.players||[])[gs?.currentPlayerIndex];
  const canPlay = myTurn && (gs?.turn?.cardsPlayed||0) < 3 && !gs?.pendingAction && gs?.turn?.drawnCards;
  const canDraw = myTurn && !gs?.turn?.drawnCards && !gs?.pendingAction;

  const iAmTarget =
    gs?.pendingAction &&
    (gs.pendingAction.targets||[]).includes(pid) &&
    !(gs.pendingAction.responded||{})[pid] &&
    !(gs.pendingAction.justSayNos||{})[pid];

  // ── POLLING ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return;
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      if (screen === "waiting") {
        const l = await storeLoad(`lobby:${roomCode}`);
        if (!l || !alive) return;
        setLobby(l);
        if (l.gameStarted) {
          const g = await storeLoad(`game:${roomCode}`);
          if (g && alive) { setGs(g); setScreen("game"); }
        }
      } else if (screen === "game") {
        const g = await storeLoad(`game:${roomCode}`);
        if (g && alive && g.version !== lastVer.current) {
          lastVer.current = g.version;
          setGs(g);
        }
      }
    };
    poll();
    pollRef.current = setInterval(poll, 2500);
    return () => { alive = false; clearInterval(pollRef.current); };
  }, [roomCode, screen]);

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const cg = () => JSON.parse(JSON.stringify(gs));

  const saveGs = useCallback(async (g, judgeCtx, skipJudge) => {
    g.version = Date.now();
    lastVer.current = g.version;
    const w = (g.players||[]).find(p => completeSets(p) >= 3);
    if (w && !g.winner) { g.winner = w.id; g.phase = "ended"; }
    if (!skipJudge && judgeCtx) {
      const msg = await callJudge(judgeCtx, g);
      g.log = [msg, ...(g.log||[]).slice(0,28)];
      setJudgeMsg(msg);
    }
    await storeSave(`game:${roomCode}`, g);
    setGs({ ...g });
  }, [roomCode]);

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  const onCreateRoom = async (name) => {
    if (!name.trim()) return "Enter your name";
    const code = Math.random().toString(36).slice(2,7).toUpperCase();
    const l = { code, players:[{ id:pid, name:name.trim(), isHost:true }], gameStarted:false };
    await storeSave(`lobby:${code}`, l);
    setRoomCode(code); setLobby(l); setScreen("waiting");
    return null;
  };

  const onJoinRoom = async (name, joinCode) => {
    if (!name.trim()) return "Enter your name";
    if (!joinCode.trim()) return "Enter a room code";
    const code = joinCode.trim().toUpperCase();
    const l = await storeLoad(`lobby:${code}`);
    if (!l) return "Room not found";
    if (l.gameStarted) return "That game has already started";
    if ((l.players||[]).length >= 5) return "Room is full (max 5 players)";
    if ((l.players||[]).find(p => p.id === pid)) {
      setRoomCode(code); setLobby(l); setScreen("waiting"); return null;
    }
    const ul = { ...l, players:[...l.players, { id:pid, name:name.trim(), isHost:false }] };
    await storeSave(`lobby:${code}`, ul);
    setRoomCode(code); setLobby(ul); setScreen("waiting");
    return null;
  };

  const onStart = async () => {
    const g = initGame(lobby.players);
    const names = (lobby.players||[]).map(p => p.name).join(", ");
    const msg = await callJudge(
      `New Monopoly Deal game! Players: ${names}. Welcome everyone and explain: draw 2 to start your turn, play up to 3 cards, first to 3 complete property sets wins!`, g
    );
    g.log = [msg, ...g.log];
    await storeSave(`lobby:${roomCode}`, { ...lobby, gameStarted:true });
    await storeSave(`game:${roomCode}`, g);
    setGs(g); setJudgeMsg(msg); setScreen("game");
  };

  // ── DRAW ───────────────────────────────────────────────────────────────────
  const drawCards = async () => {
    if (!canDraw) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const n = (pl.hand||[]).length === 0 ? 5 : 2;
    if (g.deck.length < n) { g.deck = shuffle(g.discard); g.discard = []; }
    pl.hand = [...(pl.hand||[]), ...g.deck.slice(0, n)];
    g.deck = g.deck.slice(n);
    g.turn.drawnCards = true;
    g.log = [`📥 ${pl.name} drew ${n} card${n>1?"s":""}.`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
    setSelCard(null);
  };

  // ── BANK ───────────────────────────────────────────────────────────────────
  const bankCard = async (card) => {
    if (!canPlay) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    pl.bank.push({ ...card });
    g.discard.push(card);
    g.turn.cardsPlayed++;
    g.log = [`🏦 ${pl.name} banked ${card.name}.`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
    setSelCard(null); setPui(null);
  };

  // ── PLAY PROPERTY ──────────────────────────────────────────────────────────
  const playProp = async (card, color) => {
    if (!canPlay) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    if (!pl.properties[color]) pl.properties[color] = [];
    pl.properties[color].push({ ...card, activeColor:color });
    g.turn.cardsPlayed++;
    const done = isComplete(pl, color);
    const sets = completeSets(pl);
    g.log = [
      `🏠 ${pl.name} placed ${card.name} in ${COLORS[color]?.label||color}.${done?" SET COMPLETE!":""}`,
      ...(g.log||[]).slice(0,29),
    ];
    await saveGs(
      g,
      done ? `${pl.name} completed the ${COLORS[color]?.label} set! That's ${sets}/3 sets. Victory looms!` : null
    );
    setSelCard(null); setPui(null);
  };

  // ── SIMPLE ACTIONS ─────────────────────────────────────────────────────────
  const playAction = async (card) => {
    if (!canPlay) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    if (card.action === "passGo") {
      if (g.deck.length < 2) { g.deck = shuffle(g.discard); g.discard = []; }
      pl.hand = [...(pl.hand||[]), ...g.deck.slice(0,2)];
      g.deck = g.deck.slice(2);
      g.log = [`✅ ${pl.name} played Pass Go and drew 2 extra cards!`, ...(g.log||[]).slice(0,29)];
      await saveGs(g, null, true);
    } else if (card.action === "doubleRent") {
      g.turn.doubleRentActive = true;
      g.log = [`✖️2 ${pl.name} played Double the Rent!`, ...(g.log||[]).slice(0,29)];
      await saveGs(g, `${pl.name} played Double the Rent! Their next rent card will be doubled. Beware!`);
    }
    setSelCard(null); setPui(null);
  };

  // ── RENT ───────────────────────────────────────────────────────────────────
  const playRent = async (card, color) => {
    if (!canPlay) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const dbl = g.turn.doubleRentActive;
    const amt = calcRent(pl, color, dbl);
    if (!amt) { setErr("No properties of that color!"); return; }
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    g.turn.doubleRentActive = false;
    g.pendingAction = {
      type:"rent", initiator:pid, color, amount:amt,
      targets: g.players.filter(p => p.id !== pid).map(p => p.id),
      responded:{}, justSayNos:{},
    };
    g.log = [
      `💰 ${pl.name} charges $${amt}M rent (${COLORS[color]?.label}${dbl?" DOUBLED":""})!`,
      ...(g.log||[]).slice(0,29),
    ];
    await saveGs(
      g,
      `${pl.name} played a rent card for ${COLORS[color]?.label}! $${amt}M per player${dbl?" — DOUBLED!!":""}!`
    );
    setSelCard(null); setPui(null);
  };

  // ── PAY DEBT ───────────────────────────────────────────────────────────────
  const payDebt = async (amount) => {
    const g = cg();
    const pa = g.pendingAction;
    if (!pa) return;
    const pl   = g.players.find(p => p.id === pid);
    const init = g.players.find(p => p.id === pa.initiator);
    let rem = amount;
    // Pay from bank (largest first)
    const sorted = [...(pl.bank||[])].sort((a,b) => b.value - a.value);
    const newBank = [];
    for (const c of sorted) {
      if (rem <= 0) { newBank.push(c); }
      else if (c.value <= rem) { init.bank.push(c); rem -= c.value; }
      else { newBank.push(c); }
    }
    pl.bank = newBank;
    // Pay from properties if still owe
    if (rem > 0) {
      for (const col of Object.keys(pl.properties||{})) {
        if (rem <= 0) break;
        const stack = pl.properties[col] || [];
        while (stack.length > 0 && rem > 0) {
          const pc = stack.pop();
          if (!init.properties[col]) init.properties[col] = [];
          init.properties[col].push(pc);
          rem -= pc.value;
        }
        if (!stack.length) delete pl.properties[col];
      }
    }
    pa.responded[pid] = true;
    const allDone = (pa.targets||[]).every(t => pa.responded[t] || pa.justSayNos[t]);
    if (allDone) g.pendingAction = null;
    g.log = [`💸 ${pl.name} paid $${amount - Math.max(0,rem)}M.`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
  };

  // ── JUST SAY NO ────────────────────────────────────────────────────────────
  const justSayNo = async () => {
    const g = cg();
    const pa = g.pendingAction;
    if (!pa) return;
    const pl  = g.players.find(p => p.id === pid);
    const jsn = (pl.hand||[]).find(c => c.action === "justSayNo");
    if (!jsn) { setErr("No Just Say No card!"); return; }
    pl.hand = (pl.hand||[]).filter(c => c.id !== jsn.id);
    g.discard.push(jsn);
    pa.justSayNos[pid] = true;
    pa.responded[pid]  = true;
    const allDone = (pa.targets||[]).every(t => pa.responded[t] || pa.justSayNos[t]);
    if (allDone) g.pendingAction = null;
    g.log = [`🚫 ${pl.name} played Just Say No!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} played Just Say No! The action is completely BLOCKED! What a twist!`);
  };

  // ── END TURN ───────────────────────────────────────────────────────────────
  const passTurn = async () => {
    if (!myTurn) return;
    if (gs.pendingAction) { setErr("Resolve the pending action first!"); return; }
    if ((me?.hand||[]).length > 7) {
      setErr(`Discard down to 7 cards first! (You have ${(me.hand||[]).length})`); return;
    }
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
    g.turn = { cardsPlayed:0, drawnCards:false, doubleRentActive:false };
    const nxt = g.players[g.currentPlayerIndex];
    g.log = [`⏭️ ${pl.name} ended turn. ${nxt.name}'s turn!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} ended their turn. It's ${nxt.name}'s turn now — draw 2 cards to begin!`);
    setSelCard(null); setPui(null);
  };

  // ── DISCARD ────────────────────────────────────────────────────────────────
  const discardCard = async (card) => {
    if (!myTurn) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.log = [`🗑️ ${pl.name} discarded ${card.name}.`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
    setSelCard(null);
  };

  // ── COMPLEX ACTIONS ────────────────────────────────────────────────────────
  const doBirthday = async () => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    g.pendingAction = {
      type:"birthday", initiator:pid, amount:2,
      targets: g.players.filter(p => p.id !== pid).map(p => p.id),
      responded:{}, justSayNos:{},
    };
    g.log = [`🎂 ${pl.name} plays It's My Birthday! Everyone pays $2M!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} played It's My Birthday! Everyone must pay them $2M — happy birthday! 🎉`);
    setPui(null); setSelCard(null);
  };

  const doDebt = async (tgtId) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const tp = g.players.find(p => p.id === tgtId);
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    g.pendingAction = {
      type:"debtCollector", initiator:pid, amount:5,
      targets:[tgtId], responded:{}, justSayNos:{},
    };
    g.log = [`💼 ${pl.name} sends Debt Collector to ${tp.name}! Pay $5M!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} unleashed the Debt Collector on ${tp.name}! Pay up — $5M now!`);
    setPui(null); setSelCard(null);
  };

  const doSly = async (tgtId, color, propCard) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const tp = g.players.find(p => p.id === tgtId);
    if (isComplete(tp, color)) {
      const msg = await callJudge(
        `ILLEGAL MOVE: ${pl.name} tried to Sly Deal ${propCard.name} from ${tp.name}'s COMPLETE ${color} set. Sly Deal cannot target complete sets. Rule it illegal!`, g
      );
      setJudgeMsg(msg);
      setErr("Can't steal from a complete set! Judge has ruled.");
      return;
    }
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    tp.properties[color] = (tp.properties[color]||[]).filter(c => c.id !== propCard.id);
    if (!(tp.properties[color]||[]).length) delete tp.properties[color];
    if (!pl.properties[color]) pl.properties[color] = [];
    pl.properties[color].push(propCard);
    g.log = [`🕵️ ${pl.name} stole ${propCard.name} from ${tp.name}!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} used Sly Deal to swipe ${propCard.name} from ${tp.name}! Very sneaky!`);
    setPui(null); setSelCard(null);
  };

  const doBreaker = async (tgtId, color) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const tp = g.players.find(p => p.id === tgtId);
    if (!isComplete(tp, color)) { setErr("That set isn't complete!"); return; }
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    if (!pl.properties[color]) pl.properties[color] = [];
    pl.properties[color] = [...(pl.properties[color]||[]), ...(tp.properties[color]||[])];
    tp.properties[color] = [];
    if ((tp.propertyExtras||{})[color]) {
      if (!pl.propertyExtras) pl.propertyExtras = {};
      pl.propertyExtras[color] = tp.propertyExtras[color];
      delete tp.propertyExtras[color];
    }
    g.log = [`💥 DEAL BREAKER! ${pl.name} stole ${tp.name}'s ${COLORS[color]?.label} set!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `DEAL BREAKER!! ${pl.name} just stole ${tp.name}'s entire ${COLORS[color]?.label} set! Absolute chaos!`);
    setPui(null); setSelCard(null);
  };

  const doForced = async (tgtId, theirCol, theirCard, myCol, myCard) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    const tp = g.players.find(p => p.id === tgtId);
    if (isComplete(tp, theirCol) || isComplete(pl, myCol)) {
      setErr("Can't swap from/to a complete set!"); return;
    }
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    tp.properties[theirCol] = (tp.properties[theirCol]||[]).filter(c => c.id !== theirCard.id);
    if (!(tp.properties[theirCol]||[]).length) delete tp.properties[theirCol];
    if (!pl.properties[theirCol]) pl.properties[theirCol] = [];
    pl.properties[theirCol].push(theirCard);
    pl.properties[myCol] = (pl.properties[myCol]||[]).filter(c => c.id !== myCard.id);
    if (!(pl.properties[myCol]||[]).length) delete pl.properties[myCol];
    if (!tp.properties[myCol]) tp.properties[myCol] = [];
    tp.properties[myCol].push(myCard);
    g.log = [`🔄 ${pl.name} forced a swap with ${tp.name}!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, `${pl.name} used Forced Deal to swap with ${tp.name}! Properties have changed hands!`);
    setPui(null); setSelCard(null);
  };

  const doHouse = async (color) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    if (!isComplete(pl, color)) { setErr("Need a complete set!"); return; }
    if ((pl.propertyExtras||{})[color]?.house) { setErr("Already have a house there!"); return; }
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    if (!pl.propertyExtras) pl.propertyExtras = {};
    if (!pl.propertyExtras[color]) pl.propertyExtras[color] = {};
    pl.propertyExtras[color].house = true;
    g.log = [`🏡 ${pl.name} built a house on ${COLORS[color]?.label}!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
    setPui(null); setSelCard(null);
  };

  const doHotel = async (color) => {
    if (!canPlay || !pui) return;
    const g = cg();
    const pl = g.players.find(p => p.id === pid);
    if (!(pl.propertyExtras||{})[color]?.house) { setErr("Need a house first!"); return; }
    if ((pl.propertyExtras||{})[color]?.hotel) { setErr("Already have a hotel there!"); return; }
    const card = pui.card;
    pl.hand = (pl.hand||[]).filter(c => c.id !== card.id);
    g.discard.push(card);
    g.turn.cardsPlayed++;
    pl.propertyExtras[color].hotel = true;
    g.log = [`🏨 ${pl.name} upgraded to hotel on ${COLORS[color]?.label}!`, ...(g.log||[]).slice(0,29)];
    await saveGs(g, null, true);
    setPui(null); setSelCard(null);
  };

  // ── CARD CLICK ─────────────────────────────────────────────────────────────
  const handleCardClick = (card) => {
    if (!myTurn) return;
    if (!canPlay && card.action !== "justSayNo") return;
    if (selCard?.id === card.id) { setSelCard(null); setPui(null); return; }
    setSelCard(card); setErr("");
    if      (card.type === "money")                               setPui({ type:"playMoney",     card });
    else if (card.type === "property")                            setPui({ type:"playProperty",  card });
    else if (card.type === "wildProperty")                        setPui({ type:"playWild",      card });
    else if (card.type === "rent")                                setPui({ type:"playRent",      card });
    else if (["passGo","doubleRent"].includes(card.action))       setPui({ type:"directAction",  card });
    else if (card.action === "birthday")                          setPui({ type:"birthday",      card });
    else if (card.action === "debtCollector")                     setPui({ type:"debtCollector", card });
    else if (card.action === "slyDeal")                           setPui({ type:"slyDeal",       card });
    else if (card.action === "forcedDeal")                        setPui({ type:"forcedDeal",    card });
    else if (card.action === "dealBreaker")                       setPui({ type:"dealBreaker",   card });
    else if (card.action === "house")                             setPui({ type:"house",         card });
    else if (card.action === "hotel")                             setPui({ type:"hotel",         card });
  };

  // ── SCREENS ────────────────────────────────────────────────────────────────
  if (screen === "lobby")   return <LobbyScreen onCreate={onCreateRoom} onJoin={onJoinRoom} />;
  if (screen === "waiting") return <WaitingScreen lobby={lobby} pid={pid} roomCode={roomCode} onStart={onStart} />;
  if (!gs) return (
    <div style={{ color:"#fff", textAlign:"center", marginTop:80, fontFamily:"Georgia,serif", fontSize:16 }}>
      Loading…
    </div>
  );
  if (gs.winner) return <WinScreen gs={gs} pid={pid} judgeMsg={judgeMsg} />;

  const others = (gs.players||[]).filter(p => p.id !== pid);
  const myHand = me?.hand || [];
  const myBank = me?.bank || [];
  const myProps = me?.properties || {};
  const myExtras = me?.propertyExtras || {};
  const handOver = myHand.length > 7;

  // ── GAME UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(160deg,#0a1a0a,#142014)",
      color:"#fff", fontFamily:"Georgia,serif", fontSize:12,
      display:"flex", flexDirection:"column", overflow:"hidden",
    }}>

      {/* TOP BAR */}
      <div style={{
        background:"#080f08", borderBottom:"2px solid #1e441e",
        padding:"6px 14px", display:"flex", alignItems:"center",
        gap:10, flexWrap:"wrap", flexShrink:0,
      }}>
        <span style={{ fontSize:17, fontWeight:"bold", color:"#FFD700" }}>🎲 Monopoly Deal</span>
        <span style={{
          background:"#162716", border:"1px solid #2a5a2a", borderRadius:4,
          padding:"2px 8px", letterSpacing:3, fontSize:12, color:"#90EE90",
        }}>{roomCode}</span>
        <span style={{ fontSize:10, color:"#444" }}>
          Deck:{gs.deck.length} · Disc:{gs.discard.length}
        </span>
        <span style={{ marginLeft:"auto", fontSize:11 }}>
          {myTurn ? (
            <span style={{ color:"#90EE90", fontWeight:"bold" }}>
              ⭐ YOUR TURN
              {gs.turn.drawnCards
                ? ` · Actions: ${gs.turn.cardsPlayed}/3${gs.turn.doubleRentActive ? " · 🔥 DOUBLE RENT" : ""}`
                : " · Draw cards first!"}
            </span>
          ) : (
            <span style={{ color:"#555" }}>⏳ {curP?.name}'s turn</span>
          )}
        </span>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden", minHeight:0 }}>

        {/* LEFT SIDEBAR */}
        <div style={{
          width:155, background:"#080f08", borderRight:"1px solid #1e441e",
          padding:8, overflowY:"auto", display:"flex", flexDirection:"column",
          gap:5, flexShrink:0,
        }}>
          <div style={{ fontSize:10, color:"#333", letterSpacing:1, marginBottom:2 }}>PLAYERS</div>
          {(gs.players||[]).map((p, i) => (
            <PlayerCard key={p.id} p={p} pid={pid} isCur={i === gs.currentPlayerIndex} />
          ))}
        </div>

        {/* CENTER */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* Judge bar */}
          <div style={{
            background:"#0f0f22", borderBottom:"1px solid #2a2a4a",
            padding:"6px 12px", fontSize:11, color:"#c8b4f0",
            lineHeight:1.5, flexShrink:0,
          }}>
            <strong style={{ color:"#9b80e8" }}>⚖️ Judge: </strong>{judgeMsg}
          </div>

          {/* Other players */}
          <div style={{
            background:"#0e1a0e", borderBottom:"1px solid #1e441e",
            padding:8, display:"flex", gap:8, overflowX:"auto",
            flexShrink:0, minHeight:90,
          }}>
            {others.length === 0 && (
              <div style={{ color:"#333", fontSize:11, alignSelf:"center" }}>
                Waiting for other players…
              </div>
            )}
            {others.map(p => {
              const idx = (gs.players||[]).findIndex(x => x.id === p.id);
              const isCur = idx === gs.currentPlayerIndex;
              return (
                <div key={p.id} style={{
                  background: isCur ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isCur ? "#FFD700" : "#1e441e"}`,
                  borderRadius:8, padding:8, minWidth:150, flexShrink:0,
                }}>
                  <div style={{ fontSize:11, fontWeight:"bold", color: isCur ? "#FFD700" : "#bbb", marginBottom:4 }}>
                    {isCur ? "▶ " : ""}{p.name}
                    <span style={{ color:"#444", fontWeight:"normal", fontSize:9, marginLeft:4 }}>
                      {(p.hand||[]).length} cards · ${bankTotal(p)}M
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {Object.keys(p.properties||{}).map(c =>
                      (p.properties[c]||[]).length > 0
                        ? <PropSet key={c} color={c} cards={p.properties[c]} extras={(p.propertyExtras||{})[c]} small />
                        : null
                    )}
                    {!Object.keys(p.properties||{}).some(c => (p.properties[c]||[]).length > 0) && (
                      <div style={{ color:"#333", fontSize:10 }}>No properties yet</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* My properties */}
          <div style={{
            background:"#112411", borderBottom:"1px solid #1e441e",
            padding:8, overflowX:"auto", flexShrink:0, minHeight:90,
          }}>
            <div style={{ fontSize:10, color:"#666", marginBottom:4 }}>
              YOUR PROPERTIES
              {completeSets(me||{}) > 0 && (
                <span style={{ color:"#FFD700", marginLeft:6 }}>
                  {"✅".repeat(completeSets(me||{}))} {completeSets(me||{})}/3 complete!
                </span>
              )}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {Object.keys(myProps).map(c =>
                (myProps[c]||[]).length > 0
                  ? <PropSet key={c} color={c} cards={myProps[c]} extras={myExtras[c]} />
                  : null
              )}
              {!Object.keys(myProps).some(c => (myProps[c]||[]).length > 0) && (
                <div style={{ color:"#333", fontSize:11 }}>No properties yet</div>
              )}
            </div>
          </div>

          {/* Bank */}
          <div style={{
            background:"#080f08", borderBottom:"1px solid #1e441e",
            padding:"4px 8px", flexShrink:0, fontSize:11,
          }}>
            <span style={{ color:"#FFD700", fontWeight:"bold" }}>💰 Bank: ${bankTotal(me||{})}M</span>
            <span style={{ color:"#333", marginLeft:8 }}>
              {myBank.map(c => `$${c.value}M`).join(" · ") || "empty"}
            </span>
          </div>

          {/* Hand */}
          <div style={{ flex:1, padding:8, background:"#0c160c", overflowY:"auto" }}>
            <div style={{ fontSize:10, color:"#666", marginBottom:6 }}>
              YOUR HAND ({myHand.length}/7)
              {handOver && (
                <span style={{ color:"#ff5555", marginLeft:6, fontWeight:"bold" }}>
                  ⚠ Discard {myHand.length - 7} card{myHand.length-7>1?"s":""}!
                </span>
              )}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              {myHand.map(card => (
                <div key={card.id} style={{ position:"relative" }}>
                  <CardChip
                    card={card}
                    selected={selCard?.id === card.id}
                    onClick={() => handleCardClick(card)}
                    disabled={!myTurn || (!canPlay && card.action !== "justSayNo")}
                  />
                  {handOver && myTurn && (
                    <button
                      onClick={() => discardCard(card)}
                      style={{
                        position:"absolute", top:-5, right:-5,
                        background:"#cc0000", color:"#fff", border:"none",
                        borderRadius:"50%", width:16, height:16,
                        fontSize:11, cursor:"pointer", lineHeight:"16px",
                        fontWeight:"bold", display:"flex", alignItems:"center",
                        justifyContent:"center", padding:0,
                      }}
                    >×</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              {canDraw && (
                <button onClick={drawCards} style={{
                  background:"#1565C0", color:"#fff", border:"none", borderRadius:6,
                  padding:"7px 14px", fontSize:12, fontWeight:"bold", cursor:"pointer",
                }}>
                  📥 Draw {myHand.length === 0 ? 5 : 2} Cards
                </button>
              )}
              {myTurn && gs.turn.drawnCards && !gs.pendingAction && (
                <button onClick={passTurn} style={{
                  background:"#222", color:"#999", border:"1px solid #333", borderRadius:6,
                  padding:"7px 14px", fontSize:12, cursor:"pointer",
                }}>
                  ⏭️ End Turn
                </button>
              )}
              {err && (
                <div style={{ color:"#ff7777", fontSize:11 }}>{err}</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{
          width:195, background:"#080f08", borderLeft:"1px solid #1e441e",
          display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden",
        }}>

          {/* Action Panel */}
          <div style={{
            padding:8, background:"#0f1a0f", borderBottom:"1px solid #1e441e",
            overflowY:"auto", flexShrink:0, maxHeight:320,
          }}>
            <div style={{ fontSize:10, color:"#333", letterSpacing:1, marginBottom:5 }}>CARD ACTIONS</div>
            <ActionPanel
              pui={pui} setPui={setPui} selCard={selCard}
              gs={gs} me={me || { properties:{}, bank:[], hand:[], propertyExtras:{} }}
              pid={pid} canPlay={canPlay}
              onBank={bankCard} onProp={playProp} onAction={playAction} onRent={playRent}
              onBirthday={doBirthday} onDebt={doDebt}
              onSly={doSly} onBreaker={doBreaker} onForced={doForced}
              onHouse={doHouse} onHotel={doHotel}
              setErr={setErr}
            />
          </div>

          {/* Pending Response */}
          {iAmTarget && gs.pendingAction && (
            <div style={{ padding:8, borderBottom:"1px solid #1e441e", flexShrink:0 }}>
              <PendingResp
                pa={gs.pendingAction} gs={gs}
                me={me || { hand:[] }}
                onPay={payDebt} onJsn={justSayNo}
              />
            </div>
          )}

          {/* Waiting for others */}
          {gs.pendingAction && gs.pendingAction.initiator === pid && (
            <div style={{
              padding:8, background:"rgba(0,80,0,0.1)",
              borderBottom:"1px solid #1e441e", fontSize:10, flexShrink:0,
            }}>
              <div style={{ color:"#90EE90", fontWeight:"bold", marginBottom:4 }}>⏳ Waiting for:</div>
              {(gs.pendingAction.targets||[])
                .filter(t => !(gs.pendingAction.responded||{})[t] && !(gs.pendingAction.justSayNos||{})[t])
                .map(t => {
                  const tp = (gs.players||[]).find(p => p.id === t);
                  return <div key={t} style={{ color:"#777" }}>• {tp?.name}</div>;
                })
              }
            </div>
          )}

          {/* Game Log */}
          <div style={{ flex:1, overflowY:"auto", padding:8 }}>
            <div style={{ fontSize:10, color:"#333", letterSpacing:1, marginBottom:4 }}>GAME LOG</div>
            {(gs.log||[]).map((entry, i) => (
              <div key={i} style={{
                fontSize:10, color: i === 0 ? "#ddd" : "#555",
                borderBottom:"1px solid #0c180c", padding:"3px 0", lineHeight:1.4,
              }}>
                {entry}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
