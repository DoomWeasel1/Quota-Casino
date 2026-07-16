import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================
   QUOTA CASINO v2 — beat the House's quota in 5 minutes a day.
   All play money. No real gambling.
   New: real roulette wheel · Baccarat · Penguin Cross ·
        night shop with power-ups · min AND max bet limits
   ============================================================ */

const C = {
  bg: "#0B0D12",
  panel: "#131722",
  felt: "#12382B",
  feltDark: "#0D2A20",
  gold: "#E9B94D",
  goldDim: "#9A7A2E",
  red: "#FF4D6D",
  green: "#3DDC84",
  cream: "#F3EAD3",
  muted: "#8B93A3",
  line: "#232A38",
  ice: "#9FD8EF",
};

const fmt = (n) => "$" + Math.round(n).toLocaleString();
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const r50 = (n) => Math.max(50, Math.round(n / 50) * 50);
const r5 = (n) => Math.max(5, Math.round(n / 5) * 5);

function useIsMobile() {
  const [m, setM] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 640 : false));
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return m;
}

/* ---------- shared UI ---------- */

function Btn({ children, onClick, disabled, kind = "gold", style }) {
  const bg =
    kind === "gold" ? C.gold : kind === "red" ? C.red : kind === "green" ? C.green : C.panel;
  const fg = kind === "ghost" ? C.cream : "#111";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Rubik', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        padding: "12px 20px",
        borderRadius: 10,
        border: kind === "ghost" ? `1px solid ${C.line}` : "none",
        background: disabled ? "#2A2F3C" : bg,
        color: disabled ? "#5A6170" : fg,
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: 0.3,
        transition: "transform .08s, filter .15s",
        ...style,
      }}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.96)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

const chipStyle = (dis) => ({
  padding: "8px 12px",
  borderRadius: 999,
  border: `1px dashed ${dis ? "#333" : C.goldDim}`,
  background: "transparent",
  color: dis ? "#555" : C.gold,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 12,
  fontWeight: 700,
  cursor: dis ? "not-allowed" : "pointer",
});

function BetControls({ bet, setBet, minBet, maxBet, money, disabled }) {
  const cap = Math.min(maxBet, money);
  const chips = [...new Set([minBet, minBet * 2, minBet * 5].map((c) => Math.min(c, maxBet)))];
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Rubik',sans-serif" }}>BET</span>
        <input
          type="number"
          inputMode="numeric"
          value={bet}
          min={minBet}
          max={cap}
          disabled={disabled}
          onChange={(e) => setBet(clamp(Math.round(+e.target.value || 0), 0, cap))}
          style={{
            width: 110,
            padding: "10px 12px",
            borderRadius: 8,
            border: `1px solid ${C.line}`,
            background: "#0E1119",
            color: C.gold,
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: 16,
          }}
        />
        {chips.map((c) => (
          <button
            key={c}
            disabled={disabled || c > cap}
            onClick={() => setBet(Math.min(c, cap))}
            style={chipStyle(disabled || c > cap)}
          >
            {fmt(c)}
          </button>
        ))}
        <button
          disabled={disabled}
          onClick={() => setBet(clamp(Math.floor(money / 2), minBet, cap))}
          style={chipStyle(disabled)}
        >
          ½
        </button>
        <button disabled={disabled} onClick={() => setBet(cap)} style={chipStyle(disabled)}>
          MAX
        </button>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 6,
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11,
          color: C.muted,
        }}
      >
        table limits {fmt(minBet)} – {fmt(maxBet)}
      </div>
    </div>
  );
}

function validBet(bet, minBet, maxBet, money) {
  return bet >= minBet && bet <= maxBet && bet <= money && bet > 0;
}

function ResultBanner({ msg, win }) {
  if (!msg) return null;
  return (
    <div
      style={{
        marginTop: 14,
        padding: "10px 18px",
        borderRadius: 10,
        background: win ? "rgba(61,220,132,.12)" : "rgba(255,77,109,.12)",
        border: `1px solid ${win ? C.green : C.red}`,
        color: win ? C.green : C.red,
        fontFamily: "'IBM Plex Mono', monospace",
        fontWeight: 700,
        textAlign: "center",
        animation: "pop .25s ease",
      }}
    >
      {msg}
    </div>
  );
}

function GameShell({ title, children }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "6px 10px 36px" : "8px 16px 40px" }}>
      <h2
        style={{
          fontFamily: "'Bungee', cursive",
          color: C.cream,
          fontSize: isMobile ? 20 : 24,
          textAlign: "center",
          margin: "6px 0 16px",
          letterSpacing: 1,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, ${C.felt}, ${C.feltDark})`,
          border: `1px solid ${C.goldDim}`,
          borderRadius: 18,
          padding: isMobile ? "18px 10px" : "22px 18px",
          boxShadow: "0 20px 50px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- GAMES ---------- */

/* Roulette — with a real spinning wheel (European layout) */
const RED_NUMS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const EU_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20,
  14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const rouColor = (n) => (n === 0 ? "#1E7A4C" : RED_NUMS.has(n) ? "#B32642" : "#1A1E28");

function Roulette({ money, minBet, maxBet, spend, payout }) {
  const isMobile = useIsMobile();
  const size = isMobile ? 225 : 270;
  const labelR = size / 2 - 19;
  const [bet, setBet] = useState(minBet);
  const [pick, setPick] = useState("red");
  const [num, setNum] = useState(7);
  const [spinning, setSpinning] = useState(false);
  const [deg, setDeg] = useState(0);
  const [landed, setLanded] = useState(null);
  const [res, setRes] = useState(null);
  const per = 360 / 37;

  const grad = useMemo(
    () =>
      `conic-gradient(${EU_ORDER.map(
        (n, i) => `${rouColor(n)} ${i * per}deg ${(i + 1) * per}deg`
      ).join(",")})`,
    [per]
  );

  const opts = [
    { id: "red", label: "RED", mult: 2, test: (n) => n !== 0 && RED_NUMS.has(n) },
    { id: "black", label: "BLACK", mult: 2, test: (n) => n !== 0 && !RED_NUMS.has(n) },
    { id: "even", label: "EVEN", mult: 2, test: (n) => n !== 0 && n % 2 === 0 },
    { id: "odd", label: "ODD", mult: 2, test: (n) => n % 2 === 1 },
    { id: "low", label: "1–18", mult: 2, test: (n) => n >= 1 && n <= 18 },
    { id: "high", label: "19–36", mult: 2, test: (n) => n >= 19 },
    { id: "num", label: "NUMBER", mult: 36, test: (n) => n === num },
  ];

  const spin = () => {
    if (!validBet(bet, minBet, maxBet, money) || spinning) return;
    spend(bet);
    setRes(null);
    setLanded(null);
    setSpinning(true);
    const i = Math.floor(Math.random() * 37);
    const final = EU_ORDER[i];
    const target = 360 * 7 + (360 - (i * per + per / 2));
    setDeg((d) => d + target - (d % 360));
    setTimeout(() => {
      setSpinning(false);
      setLanded(final);
      const o = opts.find((x) => x.id === pick);
      if (o.test(final)) {
        payout(bet * o.mult);
        setRes({ msg: `${final} — WIN ${fmt(bet * o.mult)}!`, win: true });
      } else setRes({ msg: `${final} — the House takes it.`, win: false });
    }, 3700);
  };

  return (
    <GameShell title="ROULETTE">
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto 18px" }}>
        <div
          style={{
            position: "absolute",
            top: -4,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: `18px solid ${C.gold}`,
            zIndex: 3,
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: grad,
            border: `7px solid ${C.gold}`,
            boxShadow: "0 12px 34px rgba(0,0,0,.55), inset 0 0 0 3px rgba(0,0,0,.35)",
            transform: `rotate(${deg}deg)`,
            transition: spinning ? "transform 3.6s cubic-bezier(.12,.75,.15,1)" : "none",
            position: "relative",
          }}
        >
          {EU_ORDER.map((n, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 20,
                height: 12,
                lineHeight: "12px",
                margin: "-6px 0 0 -10px",
                transform: `rotate(${i * per + per / 2}deg) translateY(-${labelR}px)`,
                fontFamily: "'IBM Plex Mono',monospace",
                fontWeight: 700,
                fontSize: isMobile ? 8 : 9,
                color: C.cream,
                textAlign: "center",
              }}
            >
              {n}
            </div>
          ))}
          {/* hub */}
          <div
            style={{
              position: "absolute",
              inset: "26%",
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, #1E2430, #0A0C10)`,
              border: `3px solid ${C.goldDim}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${-deg}deg)`,
              transition: spinning ? "transform 3.6s cubic-bezier(.12,.75,.15,1)" : "none",
              fontFamily: "'Bungee',cursive",
              fontSize: isMobile ? 26 : 34,
              color: landed === null ? C.muted : landed === 0 ? C.green : RED_NUMS.has(landed) ? C.red : C.cream,
            }}
          >
            {landed === null ? "•" : landed}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 8, marginBottom: 10 }}>
        {opts.map((o) => (
          <button
            key={o.id}
            disabled={spinning}
            onClick={() => setPick(o.id)}
            style={{
              padding: "10px 6px",
              borderRadius: 8,
              border: `2px solid ${pick === o.id ? C.gold : C.line}`,
              background: pick === o.id ? "rgba(233,185,77,.15)" : "#0E1119",
              color: o.id === "red" ? C.red : C.cream,
              fontFamily: "'Rubik',sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {o.label}
            <div style={{ fontSize: 10, color: C.muted }}>×{o.mult}</div>
          </button>
        ))}
      </div>
      {pick === "num" && (
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span style={{ color: C.muted, fontSize: 13, marginRight: 8, fontFamily: "'Rubik',sans-serif" }}>
            straight up on
          </span>
          <input
            type="number"
            min={0}
            max={36}
            value={num}
            disabled={spinning}
            onChange={(e) => setNum(clamp(Math.round(+e.target.value || 0), 0, 36))}
            style={{
              width: 70,
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${C.goldDim}`,
              background: "#0E1119",
              color: C.gold,
              fontFamily: "'IBM Plex Mono',monospace",
              fontWeight: 700,
              fontSize: 15,
            }}
          />
        </div>
      )}
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={spinning} />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={spin} disabled={spinning || !validBet(bet, minBet, maxBet, money)}>
          {spinning ? "NO MORE BETS…" : "SPIN"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Cards (shared by blackjack, baccarat, hi-lo) */
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
function newDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ r, s });
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
function Card({ c, hidden }) {
  const red = c && (c.s === "♥" || c.s === "♦");
  return (
    <div
      style={{
        width: 54,
        height: 76,
        borderRadius: 8,
        background: hidden
          ? `repeating-linear-gradient(45deg,#7A1F35,#7A1F35 6px,#5C1727 6px,#5C1727 12px)`
          : C.cream,
        border: `1px solid ${hidden ? C.goldDim : "#C9BFA5"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "'Rubik',sans-serif",
        fontWeight: 700,
        fontSize: 18,
        color: red ? "#C42348" : "#1A1D24",
        boxShadow: "0 4px 10px rgba(0,0,0,.4)",
        animation: "dealIn .25s ease",
      }}
    >
      {!hidden && (
        <>
          <span>{c.r}</span>
          <span style={{ fontSize: 20 }}>{c.s}</span>
        </>
      )}
    </div>
  );
}

/* Blackjack */
function handVal(cards) {
  let v = 0,
    aces = 0;
  for (const c of cards) {
    if (c.r === "A") {
      v += 11;
      aces++;
    } else if (["J", "Q", "K"].includes(c.r)) v += 10;
    else v += +c.r;
  }
  while (v > 21 && aces > 0) {
    v -= 10;
    aces--;
  }
  return v;
}
function Blackjack({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [deck, setDeck] = useState([]);
  const [player, setPlayer] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [phase, setPhase] = useState("bet");
  const [res, setRes] = useState(null);
  const [curBet, setCurBet] = useState(0);

  const deal = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    setCurBet(bet);
    const d = newDeck();
    const p = [d.pop(), d.pop()];
    const de = [d.pop(), d.pop()];
    setDeck(d);
    setPlayer(p);
    setDealer(de);
    setRes(null);
    const pv = handVal(p),
      dv = handVal(de);
    if (pv === 21 || dv === 21) {
      setPhase("done");
      if (pv === 21 && dv === 21) {
        payout(bet);
        setRes({ msg: "Both blackjack — push.", win: true });
      } else if (pv === 21) {
        payout(Math.round(bet * 2.5));
        setRes({ msg: `BLACKJACK! Paid ${fmt(bet * 2.5)}`, win: true });
      } else setRes({ msg: "Dealer blackjack.", win: false });
    } else setPhase("play");
  };
  const finish = (p, d, dk, b) => {
    const dd = [...d];
    const deckCopy = [...dk];
    while (handVal(dd) < 17) dd.push(deckCopy.pop());
    setDealer(dd);
    setDeck(deckCopy);
    const pv = handVal(p),
      dv = handVal(dd);
    setPhase("done");
    if (dv > 21 || pv > dv) {
      payout(b * 2);
      setRes({ msg: `You win ${fmt(b * 2)}! (${pv} vs ${dv > 21 ? "bust" : dv})`, win: true });
    } else if (pv === dv) {
      payout(b);
      setRes({ msg: `Push — ${pv} apiece. Bet returned.`, win: true });
    } else setRes({ msg: `Dealer wins ${dv} to ${pv}.`, win: false });
  };
  const hit = () => {
    const d = [...deck];
    const p = [...player, d.pop()];
    setPlayer(p);
    setDeck(d);
    if (handVal(p) > 21) {
      setPhase("done");
      setRes({ msg: `Bust with ${handVal(p)}.`, win: false });
    }
  };
  const stand = () => finish(player, dealer, deck, curBet);
  const dbl = () => {
    if (money < curBet) return;
    spend(curBet);
    const d = [...deck];
    const p = [...player, d.pop()];
    setPlayer(p);
    if (handVal(p) > 21) {
      setDeck(d);
      setPhase("done");
      setRes({ msg: `Bust with ${handVal(p)} on the double.`, win: false });
    } else finish(p, dealer, d, curBet * 2);
  };
  const hideHole = phase === "play";
  return (
    <GameShell title="BLACKJACK">
      <div style={{ textAlign: "center" }}>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'Rubik',sans-serif", marginBottom: 6 }}>
          DEALER {phase !== "bet" && !hideHole ? `— ${handVal(dealer)}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", minHeight: 80, flexWrap: "wrap" }}>
          {dealer.map((c, i) => (
            <Card key={i} c={c} hidden={hideHole && i === 1} />
          ))}
        </div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'Rubik',sans-serif", margin: "14px 0 6px" }}>
          YOU {player.length > 0 ? `— ${handVal(player)}` : ""}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", minHeight: 80, flexWrap: "wrap" }}>
          {player.map((c, i) => (
            <Card key={i} c={c} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        {phase === "play" ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn onClick={hit}>HIT</Btn>
            <Btn onClick={stand} kind="ghost">
              STAND
            </Btn>
            <Btn onClick={dbl} disabled={money < curBet || player.length > 2} kind="red">
              DOUBLE
            </Btn>
          </div>
        ) : (
          <>
            <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} />
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <Btn onClick={deal} disabled={!validBet(bet, minBet, maxBet, money)}>
                DEAL
              </Btn>
            </div>
          </>
        )}
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Baccarat */
const bacVal = (c) => (c.r === "A" ? 1 : ["10", "J", "Q", "K"].includes(c.r) ? 0 : +c.r);
const bacTotal = (h) => h.reduce((s, c) => s + bacVal(c), 0) % 10;
function Baccarat({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [side, setSide] = useState("player");
  const [pHand, setPHand] = useState([]);
  const [bHand, setBHand] = useState([]);
  const [res, setRes] = useState(null);
  const [dealing, setDealing] = useState(false);

  const deal = () => {
    if (!validBet(bet, minBet, maxBet, money) || dealing) return;
    spend(bet);
    setRes(null);
    setDealing(true);
    const d = newDeck();
    let p = [d.pop(), d.pop()];
    let b = [d.pop(), d.pop()];
    // third-card tableau
    if (bacTotal(p) < 8 && bacTotal(b) < 8) {
      let p3 = null;
      if (bacTotal(p) <= 5) {
        p3 = d.pop();
        p = [...p, p3];
      }
      const bt = bacTotal(b);
      let bankerDraws = false;
      if (p3 === null) bankerDraws = bt <= 5;
      else {
        const v = bacVal(p3);
        if (bt <= 2) bankerDraws = true;
        else if (bt === 3) bankerDraws = v !== 8;
        else if (bt === 4) bankerDraws = v >= 2 && v <= 7;
        else if (bt === 5) bankerDraws = v >= 4 && v <= 7;
        else if (bt === 6) bankerDraws = v >= 6 && v <= 7;
      }
      if (bankerDraws) b = [...b, d.pop()];
    }
    setPHand(p);
    setBHand(b);
    setTimeout(() => {
      setDealing(false);
      const pt = bacTotal(p),
        bt = bacTotal(b);
      const winner = pt > bt ? "player" : bt > pt ? "banker" : "tie";
      if (winner === "tie") {
        if (side === "tie") {
          payout(bet * 9);
          setRes({ msg: `TIE ${pt}–${bt} — WIN ${fmt(bet * 9)}!`, win: true });
        } else {
          payout(bet);
          setRes({ msg: `Tie ${pt}–${bt} — bet returned.`, win: true });
        }
      } else if (winner === side) {
        const w = Math.round(bet * (side === "banker" ? 1.95 : 2));
        payout(w);
        setRes({ msg: `${winner === "player" ? "Player" : "Banker"} ${Math.max(pt, bt)}–${Math.min(pt, bt)} — WIN ${fmt(w)}!`, win: true });
      } else {
        setRes({ msg: `${winner === "player" ? "Player" : "Banker"} wins ${Math.max(pt, bt)}–${Math.min(pt, bt)}.`, win: false });
      }
    }, 500);
  };

  const sides = [
    { id: "player", label: "PLAYER", mult: "×2" },
    { id: "banker", label: "BANKER", mult: "×1.95" },
    { id: "tie", label: "TIE", mult: "×9" },
  ];
  return (
    <GameShell title="BACCARAT">
      <div style={{ display: "flex", justifyContent: "center", gap: 30, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { name: "PLAYER", hand: pHand },
          { name: "BANKER", hand: bHand },
        ].map((h) => (
          <div key={h.name} style={{ textAlign: "center" }}>
            <div style={{ color: C.muted, fontSize: 12, fontFamily: "'Rubik',sans-serif", marginBottom: 6 }}>
              {h.name} {h.hand.length > 0 ? `— ${bacTotal(h.hand)}` : ""}
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", minHeight: 80 }}>
              {h.hand.map((c, i) => (
                <Card key={i} c={c} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
        {sides.map((s) => (
          <button
            key={s.id}
            disabled={dealing}
            onClick={() => setSide(s.id)}
            style={{
              padding: "12px 22px",
              borderRadius: 10,
              border: `2px solid ${side === s.id ? C.gold : C.line}`,
              background: side === s.id ? "rgba(233,185,77,.15)" : "#0E1119",
              color: s.id === "tie" ? C.green : C.cream,
              fontFamily: "'Rubik',sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {s.label}
            <div style={{ fontSize: 10, color: C.muted }}>{s.mult}</div>
          </button>
        ))}
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={dealing} />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={deal} disabled={dealing || !validBet(bet, minBet, maxBet, money)}>
          {dealing ? "DEALING…" : "DEAL"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Penguin Cross */
const PENGUIN_MULTS = [1.3, 1.7, 2.2, 2.9, 3.8, 5.0, 6.6, 8.6];
function PenguinCross({ money, minBet, maxBet, spend, payout }) {
  const isMobile = useIsMobile();
  const floeSize = isMobile ? 30 : 46;
  const [bet, setBet] = useState(minBet);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0); // number of floes crossed
  const [deadAt, setDeadAt] = useState(null);
  const [res, setRes] = useState(null);
  const start = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    setActive(true);
    setStep(0);
    setDeadAt(null);
    setRes(null);
  };
  const hop = () => {
    const next = step + 1;
    const hazard = 0.16 + step * 0.025;
    if (Math.random() < hazard) {
      setDeadAt(next);
      setActive(false);
      setRes({ msg: "🐋 An orca got the penguin. Bet lost.", win: false });
    } else {
      setStep(next);
      if (next === PENGUIN_MULTS.length) {
        const w = Math.round(bet * PENGUIN_MULTS[next - 1]);
        payout(w);
        setActive(false);
        setRes({ msg: `Full crossing! ×${PENGUIN_MULTS[next - 1]} — WIN ${fmt(w)}!`, win: true });
      }
    }
  };
  const cashOut = () => {
    const w = Math.round(bet * PENGUIN_MULTS[step - 1]);
    payout(w);
    setActive(false);
    setRes({ msg: `Waddled home with ${fmt(w)} (×${PENGUIN_MULTS[step - 1]}).`, win: true });
  };
  return (
    <GameShell title="PENGUIN CROSS">
      <div
        style={{
          display: "flex",
          gap: isMobile ? 3 : 6,
          justifyContent: "center",
          alignItems: "flex-end",
          marginBottom: 6,
        }}
      >
        {/* start shore */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: isMobile ? 17 : 26, minHeight: isMobile ? 24 : 34 }}>
            {step === 0 && deadAt === null ? "🐧" : ""}
          </div>
          <div style={floeStyle("#3E5C74", floeSize)}>🏔️</div>
          <div style={floeLabel}>start</div>
        </div>
        {PENGUIN_MULTS.map((m, i) => {
          const here = active && step === i + 1;
          const died = deadAt === i + 1;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 17 : 26, minHeight: isMobile ? 24 : 34 }}>
                {here ? "🐧" : died ? "🐋" : ""}
              </div>
              <div style={floeStyle(died ? "#5C2733" : i + 1 <= step ? "#2E6D57" : "#274156", floeSize)}>🧊</div>
              <div style={floeLabel}>×{m}</div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: 12,
          fontFamily: "'IBM Plex Mono',monospace",
          marginBottom: 14,
        }}
      >
        every hop raises the payout — and the odds of an orca
      </div>
      {active ? (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn onClick={hop}>HOP → {step < PENGUIN_MULTS.length ? `×${PENGUIN_MULTS[step]}` : ""}</Btn>
          <Btn onClick={cashOut} kind="green" disabled={step === 0}>
            CASH OUT {step > 0 ? fmt(bet * PENGUIN_MULTS[step - 1]) : ""}
          </Btn>
        </div>
      ) : (
        <>
          <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Btn onClick={start} disabled={!validBet(bet, minBet, maxBet, money)}>
              RELEASE THE PENGUIN
            </Btn>
          </div>
        </>
      )}
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}
const floeStyle = (bg, size = 46) => ({
  width: size,
  height: size,
  borderRadius: Math.round(size * 0.22),
  background: bg,
  border: `1px solid ${C.line}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: Math.round(size * 0.44),
});
const floeLabel = {
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: 9,
  color: C.muted,
  marginTop: 3,
};

/* Slots */
const SYMBOLS = ["🍒", "🍋", "🔔", "🍀", "💎", "7️⃣"];
function Slots({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [reels, setReels] = useState(["🍒", "🔔", "💎"]);
  const [spinning, setSpinning] = useState(false);
  const [res, setRes] = useState(null);
  const spin = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    setRes(null);
    setSpinning(true);
    const final = [0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    let t = 0;
    const iv = setInterval(() => {
      setReels([0, 0, 0].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
      t += 80;
      if (t >= 1300) {
        clearInterval(iv);
        setReels(final);
        setSpinning(false);
        const [a, b, c] = final;
        let mult = 0;
        if (a === b && b === c) mult = a === "7️⃣" ? 25 : a === "💎" ? 15 : 8;
        else if (a === b || b === c || a === c) mult = 2;
        if (mult > 0) {
          payout(bet * mult);
          setRes({ msg: `×${mult} — WIN ${fmt(bet * mult)}!`, win: true });
        } else setRes({ msg: "No match. Spin again.", win: false });
      }
    }, 80);
  };
  return (
    <GameShell title="SLOTS">
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
        {reels.map((s, i) => (
          <div
            key={i}
            style={{
              width: 90,
              height: 110,
              borderRadius: 12,
              background: "#0A0C10",
              border: `3px solid ${C.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              boxShadow: spinning ? `0 0 18px rgba(233,185,77,.5)` : "inset 0 4px 12px rgba(0,0,0,.6)",
            }}
          >
            {s}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", color: C.muted, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 14 }}>
        7️⃣7️⃣7️⃣ ×25 · 💎💎💎 ×15 · any triple ×8 · any pair ×2
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={spinning} />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={spin} disabled={spinning || !validBet(bet, minBet, maxBet, money)}>
          {spinning ? "SPINNING…" : "PULL"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Money Wheel */
const WHEEL_SEGS = [0, 2, 0.5, 3, 0, 1, 5, 0.5, 1, 10];
const SEG_COLORS = WHEEL_SEGS.map((m) =>
  m === 0 ? "#3A2230" : m === 10 ? C.gold : m >= 3 ? "#B0552E" : m >= 1 ? "#1F4D3A" : "#25304A"
);
function Wheel({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [deg, setDeg] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [res, setRes] = useState(null);
  const grad = useMemo(() => {
    const per = 360 / WHEEL_SEGS.length;
    return `conic-gradient(${WHEEL_SEGS.map((_, i) => `${SEG_COLORS[i]} ${i * per}deg ${(i + 1) * per}deg`).join(",")})`;
  }, []);
  const spin = () => {
    if (!validBet(bet, minBet, maxBet, money) || spinning) return;
    spend(bet);
    setRes(null);
    setSpinning(true);
    const i = Math.floor(Math.random() * WHEEL_SEGS.length);
    const per = 360 / WHEEL_SEGS.length;
    const target = 360 * 6 + (360 - (i * per + per / 2));
    setDeg((d) => d + target - (d % 360));
    setTimeout(() => {
      setSpinning(false);
      const mult = WHEEL_SEGS[i];
      if (mult > 0) {
        const w = Math.round(bet * mult);
        payout(w);
        setRes({ msg: `×${mult} — ${mult >= 1 ? "WIN" : "back"} ${fmt(w)}${mult === 10 ? " 🎉" : ""}`, win: mult >= 1 });
      } else setRes({ msg: "×0 — swallowed by the House.", win: false });
    }, 3200);
  };
  const per = 360 / WHEEL_SEGS.length;
  return (
    <GameShell title="WHEEL SPIN">
      <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto 20px" }}>
        <div
          style={{
            position: "absolute",
            top: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: `20px solid ${C.cream}`,
            zIndex: 2,
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))",
          }}
        />
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: grad,
            border: `6px solid ${C.gold}`,
            transform: `rotate(${deg}deg)`,
            transition: spinning ? "transform 3.1s cubic-bezier(.15,.8,.2,1)" : "none",
            position: "relative",
            boxShadow: "0 10px 30px rgba(0,0,0,.5)",
          }}
        >
          {WHEEL_SEGS.map((m, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 34,
                height: 16,
                lineHeight: "16px",
                margin: "-8px 0 0 -17px",
                transform: `rotate(${i * per + per / 2}deg) translateY(-92px)`,
                fontFamily: "'IBM Plex Mono',monospace",
                fontWeight: 700,
                fontSize: 14,
                color: m === 10 ? "#111" : C.cream,
                textAlign: "center",
              }}
            >
              ×{m}
            </div>
          ))}
        </div>
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={spinning} />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={spin} disabled={spinning || !validBet(bet, minBet, maxBet, money)}>
          {spinning ? "SPINNING…" : "SPIN THE WHEEL"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Coin flip */
function CoinFlip({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [pick, setPick] = useState("H");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState("H");
  const [res, setRes] = useState(null);
  const flip = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    setRes(null);
    setFlipping(true);
    const out = Math.random() < 0.5 ? "H" : "T";
    let t = 0;
    const iv = setInterval(() => {
      setFace((f) => (f === "H" ? "T" : "H"));
      t += 100;
      if (t >= 1200) {
        clearInterval(iv);
        setFace(out);
        setFlipping(false);
        if (out === pick) {
          payout(bet * 2);
          setRes({ msg: `${out === "H" ? "Heads" : "Tails"} — WIN ${fmt(bet * 2)}!`, win: true });
        } else setRes({ msg: `${out === "H" ? "Heads" : "Tails"} — gone.`, win: false });
      }
    }, 100);
  };
  return (
    <GameShell title="COIN FLIP">
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, #F7D97C, ${C.gold} 60%, #A87F24)`,
            fontFamily: "'Bungee',cursive",
            fontSize: 44,
            color: "#5C4310",
            boxShadow: "0 8px 22px rgba(0,0,0,.5)",
            transform: flipping ? "rotateY(90deg)" : "rotateY(0)",
            transition: "transform .1s",
          }}
        >
          {face}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
        {["H", "T"].map((p) => (
          <button
            key={p}
            disabled={flipping}
            onClick={() => setPick(p)}
            style={{
              padding: "12px 26px",
              borderRadius: 10,
              border: `2px solid ${pick === p ? C.gold : C.line}`,
              background: pick === p ? "rgba(233,185,77,.15)" : "#0E1119",
              color: C.cream,
              fontFamily: "'Rubik',sans-serif",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {p === "H" ? "HEADS" : "TAILS"}
          </button>
        ))}
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={flipping} />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Btn onClick={flip} disabled={flipping || !validBet(bet, minBet, maxBet, money)}>
          {flipping ? "FLIPPING…" : "FLIP (×2)"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Higher / Lower — pick a line from 1–100, then call the roll */
function HigherLower({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [target, setTarget] = useState(50);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState(null);
  const [res, setRes] = useState(null);
  const chanceHi = (100 - target) / 100;
  const chanceLo = (target - 1) / 100;
  const multOf = (c) => (c > 0 ? Math.min(50, +(0.97 / c).toFixed(2)) : 0);
  const multHi = multOf(chanceHi);
  const multLo = multOf(chanceLo);

  const play = (dir) => {
    if (!validBet(bet, minBet, maxBet, money) || rolling) return;
    spend(bet);
    setRes(null);
    setRolling(true);
    const final = 1 + Math.floor(Math.random() * 100);
    let t = 0;
    const iv = setInterval(() => {
      setRoll(1 + Math.floor(Math.random() * 100));
      t += 70;
      if (t >= 1200) {
        clearInterval(iv);
        setRoll(final);
        setRolling(false);
        const win = dir === "hi" ? final > target : final < target;
        if (win) {
          const m = dir === "hi" ? multHi : multLo;
          const w = Math.round(bet * m);
          payout(w);
          setRes({ msg: `Rolled ${final} — ${dir === "hi" ? "HIGHER" : "LOWER"} hits! WIN ${fmt(w)} (×${m})`, win: true });
        } else {
          setRes({
            msg: `Rolled ${final} — ${final === target ? "dead on your number, House takes it." : "wrong side."}`,
            win: false,
          });
        }
      }
    }, 70);
  };

  return (
    <GameShell title="HIGHER OR LOWER">
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 16,
            background: rolling ? "#20263A" : C.cream,
            border: `2px solid ${C.gold}`,
            fontFamily: "'Bungee',cursive",
            fontSize: 36,
            color: rolling ? C.gold : "#1A1D24",
            transition: "background .2s",
          }}
        >
          {roll === null ? "?" : roll}
        </div>
      </div>

      {/* number line + slider */}
      <div style={{ maxWidth: 440, margin: "0 auto 6px" }}>
        <div
          style={{
            position: "relative",
            height: 14,
            borderRadius: 999,
            overflow: "hidden",
            border: `1px solid ${C.line}`,
            background: `linear-gradient(90deg, rgba(255,77,109,.45) ${target - 1}%, #0E1119 ${target - 1}%, #0E1119 ${target}%, rgba(61,220,132,.45) ${target}%)`,
          }}
        />
        <input
          type="range"
          min={2}
          max={99}
          value={target}
          disabled={rolling}
          onChange={(e) => setTarget(+e.target.value)}
          style={{ width: "100%", accentColor: C.gold, marginTop: 6, cursor: rolling ? "default" : "pointer" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            color: C.muted,
          }}
        >
          <span style={{ color: C.red }}>◀ lower {Math.round(chanceLo * 100)}%</span>
          <span style={{ color: C.gold, fontSize: 16, fontWeight: 700 }}>{target}</span>
          <span style={{ color: C.green }}>higher {Math.round(chanceHi * 100)}% ▶</span>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: 12,
          fontFamily: "'IBM Plex Mono',monospace",
          marginBottom: 14,
        }}
      >
        pick your number · rolls 1–100 · landing exactly on it loses
      </div>

      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={rolling} />
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
        <Btn onClick={() => play("lo")} kind="red" disabled={rolling || !validBet(bet, minBet, maxBet, money)}>
          LOWER ▼ ×{multLo}
        </Btn>
        <Btn onClick={() => play("hi")} kind="green" disabled={rolling || !validBet(bet, minBet, maxBet, money)}>
          HIGHER ▲ ×{multHi}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Mines */
function Mines({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [mines, setMines] = useState(null);
  const [open, setOpen] = useState(new Set());
  const [dead, setDead] = useState(false);
  const [res, setRes] = useState(null);
  const picks = open.size;
  const mult = +Math.pow(1.28, picks).toFixed(2);
  const start = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    const m = new Set();
    while (m.size < 5) m.add(Math.floor(Math.random() * 25));
    setMines(m);
    setOpen(new Set());
    setDead(false);
    setRes(null);
  };
  const click = (i) => {
    if (!mines || dead || open.has(i)) return;
    if (mines.has(i)) {
      setDead(true);
      setRes({ msg: "💥 Mine. Bet lost.", win: false });
    } else {
      const o = new Set(open);
      o.add(i);
      setOpen(o);
    }
  };
  const cashOut = () => {
    const w = Math.round(bet * mult);
    payout(w);
    setRes({ msg: `Cashed out ${fmt(w)} (×${mult}).`, win: true });
    setMines(null);
  };
  const active = mines !== null;
  return (
    <GameShell title="MINES">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, maxWidth: 320, margin: "0 auto 16px" }}>
        {Array.from({ length: 25 }, (_, i) => {
          const isOpen = open.has(i);
          const isMine = mines?.has(i);
          const show = dead && isMine;
          return (
            <button
              key={i}
              onClick={() => click(i)}
              disabled={!active || dead}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: show ? "rgba(255,77,109,.25)" : isOpen ? "rgba(61,220,132,.18)" : "#0E1119",
                fontSize: 18,
                cursor: active && !dead ? "pointer" : "default",
                color: C.cream,
              }}
            >
              {show ? "💣" : isOpen ? "💎" : ""}
            </button>
          );
        })}
      </div>
      {active && !dead ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", color: C.gold, fontWeight: 700, marginBottom: 10 }}>
            ×{mult} · cash out for {fmt(bet * mult)}
          </div>
          <Btn onClick={cashOut} kind="green" disabled={picks === 0}>
            CASH OUT
          </Btn>
        </div>
      ) : (
        <>
          <div style={{ textAlign: "center", color: C.muted, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 12 }}>
            5 mines hidden in 25 tiles · every safe pick ×1.28
          </div>
          <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Btn onClick={start} disabled={!validBet(bet, minBet, maxBet, money)}>
              {dead ? "PLAY AGAIN" : "START"}
            </Btn>
          </div>
        </>
      )}
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Crash */
function Crash({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [mult, setMult] = useState(1);
  const [running, setRunning] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [res, setRes] = useState(null);
  const crashAt = useRef(1);
  const multRef = useRef(1);
  const ivRef = useRef(null);
  useEffect(() => () => clearInterval(ivRef.current), []);
  const start = () => {
    if (!validBet(bet, minBet, maxBet, money)) return;
    spend(bet);
    setRes(null);
    setCrashed(false);
    const r = Math.random();
    crashAt.current = Math.max(1.01, Math.min(50, 0.97 / (1 - r)));
    multRef.current = 1;
    setMult(1);
    setRunning(true);
    ivRef.current = setInterval(() => {
      multRef.current = multRef.current * 1.012 + 0.002;
      if (multRef.current >= crashAt.current) {
        clearInterval(ivRef.current);
        setMult(crashAt.current);
        setRunning(false);
        setCrashed(true);
        setRes({ msg: `Crashed at ×${crashAt.current.toFixed(2)}. Bet lost.`, win: false });
      } else setMult(multRef.current);
    }, 60);
  };
  const cashOut = () => {
    clearInterval(ivRef.current);
    setRunning(false);
    const w = Math.round(bet * multRef.current);
    payout(w);
    setRes({ msg: `Cashed out at ×${multRef.current.toFixed(2)} — ${fmt(w)}!`, win: true });
  };
  return (
    <GameShell title="CRASH">
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            fontFamily: "'Bungee',cursive",
            fontSize: 56,
            color: crashed ? C.red : running ? C.green : C.cream,
            textShadow: running ? `0 0 24px rgba(61,220,132,.5)` : "none",
            transition: "color .2s",
          }}
        >
          ×{mult.toFixed(2)}
        </div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>
          cash out before it crashes
        </div>
      </div>
      {running ? (
        <div style={{ textAlign: "center" }}>
          <Btn onClick={cashOut} kind="green" style={{ fontSize: 18, padding: "14px 32px" }}>
            CASH OUT {fmt(bet * mult)}
          </Btn>
        </div>
      ) : (
        <>
          <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} />
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <Btn onClick={start} disabled={!validBet(bet, minBet, maxBet, money)}>
              LAUNCH 🚀
            </Btn>
          </div>
        </>
      )}
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Dice */
function Dice({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState(null);
  const [res, setRes] = useState(null);
  const opts = [
    { label: "OVER 25", th: 25, mult: 1.3 },
    { label: "OVER 50", th: 50, mult: 1.95 },
    { label: "OVER 75", th: 75, mult: 3.9 },
    { label: "OVER 90", th: 90, mult: 9.7 },
  ];
  const play = (o) => {
    if (!validBet(bet, minBet, maxBet, money) || rolling) return;
    spend(bet);
    setRes(null);
    setRolling(true);
    const final = 1 + Math.floor(Math.random() * 100);
    let t = 0;
    const iv = setInterval(() => {
      setRoll(1 + Math.floor(Math.random() * 100));
      t += 70;
      if (t >= 1100) {
        clearInterval(iv);
        setRoll(final);
        setRolling(false);
        if (final > o.th) {
          const w = Math.round(bet * o.mult);
          payout(w);
          setRes({ msg: `Rolled ${final} — WIN ${fmt(w)}!`, win: true });
        } else setRes({ msg: `Rolled ${final} — not over ${o.th}.`, win: false });
      }
    }, 70);
  };
  return (
    <GameShell title="DICE">
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 16,
            background: C.cream,
            fontFamily: "'Bungee',cursive",
            fontSize: 36,
            color: "#1A1D24",
            boxShadow: "0 8px 20px rgba(0,0,0,.5)",
          }}
        >
          {roll === null ? "🎲" : roll}
        </div>
        <div style={{ color: C.muted, fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", marginTop: 8 }}>
          roll 1–100 · beat the line to win
        </div>
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={rolling} />
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
        {opts.map((o) => (
          <Btn key={o.th} onClick={() => play(o)} disabled={rolling || !validBet(bet, minBet, maxBet, money)} kind={o.th >= 75 ? "red" : "gold"}>
            {o.label} ×{o.mult}
          </Btn>
        ))}
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* Horse race */
const HORSES = ["🐎 Lucky Lad", "🐎 Midnight", "🐎 Gold Rush", "🐎 Long Shot"];
function HorseRace({ money, minBet, maxBet, spend, payout }) {
  const [bet, setBet] = useState(minBet);
  const [pick, setPick] = useState(0);
  const [pos, setPos] = useState([0, 0, 0, 0]);
  const [racing, setRacing] = useState(false);
  const [res, setRes] = useState(null);
  const ivRef = useRef(null);
  useEffect(() => () => clearInterval(ivRef.current), []);
  const race = () => {
    if (!validBet(bet, minBet, maxBet, money) || racing) return;
    spend(bet);
    setRes(null);
    setPos([0, 0, 0, 0]);
    setRacing(true);
    let p = [0, 0, 0, 0];
    ivRef.current = setInterval(() => {
      p = p.map((x) => x + Math.random() * 3.2);
      setPos([...p]);
      if (Math.max(...p) >= 100) {
        clearInterval(ivRef.current);
        setRacing(false);
        const w = p.indexOf(Math.max(...p));
        if (w === pick) {
          payout(Math.round(bet * 3.8));
          setRes({ msg: `${HORSES[w]} wins — ${fmt(bet * 3.8)}!`, win: true });
        } else setRes({ msg: `${HORSES[w]} takes it. Your horse trailed.`, win: false });
      }
    }, 100);
  };
  return (
    <GameShell title="HORSE RACE">
      <div style={{ marginBottom: 16 }}>
        {HORSES.map((h, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <button
              disabled={racing}
              onClick={() => setPick(i)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border: `2px solid ${pick === i ? C.gold : C.line}`,
                background: pick === i ? "rgba(233,185,77,.12)" : "#0E1119",
                color: C.cream,
                fontFamily: "'Rubik',sans-serif",
                fontWeight: 600,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${Math.min(100, pos[i])}%`,
                  background: "rgba(61,220,132,.12)",
                  transition: "width .1s linear",
                }}
              />
              <span
                style={{
                  position: "relative",
                  left: `${Math.min(88, pos[i] * 0.85)}%`,
                  transition: "left .1s linear",
                  display: "inline-block",
                }}
              >
                {h}
              </span>
            </button>
          </div>
        ))}
      </div>
      <BetControls bet={bet} setBet={setBet} minBet={minBet} maxBet={maxBet} money={money} disabled={racing} />
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <Btn onClick={race} disabled={racing || !validBet(bet, minBet, maxBet, money)}>
          {racing ? "THEY'RE OFF…" : "RACE (×3.8)"}
        </Btn>
      </div>
      <ResultBanner msg={res?.msg} win={res?.win} />
    </GameShell>
  );
}

/* ---------- registries ---------- */
const GAMES = [
  { id: "roulette", name: "Roulette", icon: "🎡", tag: "Red or black", comp: Roulette },
  { id: "blackjack", name: "Blackjack", icon: "🃏", tag: "Beat the dealer", comp: Blackjack },
  { id: "baccarat", name: "Baccarat", icon: "🀄", tag: "Player, banker or tie", comp: Baccarat },
  { id: "penguin", name: "Penguin Cross", icon: "🐧", tag: "Hop or cash out", comp: PenguinCross },
  { id: "slots", name: "Slots", icon: "🎰", tag: "Triple 7s pay ×25", comp: Slots },
  { id: "wheel", name: "Wheel Spin", icon: "☸️", tag: "Up to ×10", comp: Wheel },
  { id: "coin", name: "Coin Flip", icon: "🪙", tag: "Double or nothing", comp: CoinFlip },
  { id: "hilo", name: "Higher / Lower", icon: "🔺", tag: "Pick a line 1–100", comp: HigherLower },
  { id: "mines", name: "Mines", icon: "💣", tag: "Pick or pop", comp: Mines },
  { id: "crash", name: "Crash", icon: "🚀", tag: "Cash out in time", comp: Crash },
  { id: "dice", name: "Dice", icon: "🎲", tag: "Beat the line", comp: Dice },
  { id: "horse", name: "Horse Race", icon: "🐎", tag: "Pick a winner ×3.8", comp: HorseRace },
];

const SHOP_ITEMS = [
  { id: "time", icon: "⏱️", name: "Extra Time", desc: "+60 seconds on tomorrow's clock", costOf: (q) => r50(q * 0.15) },
  { id: "cut", icon: "✂️", name: "Quota Cut", desc: "Tomorrow's quota is reduced by 15%", costOf: (q) => r50(q * 0.25) },
  { id: "luck", icon: "🍀", name: "Lucky Charm", desc: "Every payout is boosted +15% tomorrow", costOf: (q) => r50(q * 0.3) },
  { id: "limit", icon: "💳", name: "High Roller Pass", desc: "Tomorrow's max bet is set at 60% of your bankroll instead of 30%", costOf: (q) => r50(q * 0.15) },
  { id: "ins", icon: "🛡️", name: "Insurance", desc: "Miss a quota once and get 2 minutes of overtime instead of losing", costOf: (q) => r50(q * 0.4) },
];

const DAY_SECONDS = 300;
const START_MONEY = 1000;
const BASE_MAX_FRAC = 0.3;

export default function App() {
  const [screen, setScreen] = useState("intro"); // intro | menu | game | shop | gameover
  const [gameId, setGameId] = useState(null);
  const [money, setMoney] = useState(START_MONEY);
  const [day, setDay] = useState(1);
  const [quota, setQuota] = useState(1500);
  const [minBet, setMinBet] = useState(25);
  const [time, setTime] = useState(DAY_SECONDS);
  const [best, setBest] = useState(1);
  const [failReason, setFailReason] = useState("");
  const [pendingQuota, setPendingQuota] = useState(1500); // locked in at day end, before shopping
  const [owned, setOwned] = useState(new Set()); // items bought tonight
  const [luckDay, setLuckDay] = useState(false);
  const [maxBet, setMaxBet] = useState(r5(START_MONEY * BASE_MAX_FRAC));
  const [insurance, setInsurance] = useState(false);
  const [notice, setNotice] = useState("");
  const isMobile = useIsMobile();

  const spend = useCallback((amt) => setMoney((m) => m - amt), []);
  const payout = useCallback(
    (amt) => setMoney((m) => m + Math.round(amt * (luckDay ? 1.15 : 1))),
    [luckDay]
  );

  const running = screen === "menu" || screen === "game";

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);

  // time up → evaluate
  useEffect(() => {
    if (running && time <= 0) {
      if (money >= quota) winDay();
      else if (insurance) {
        setInsurance(false);
        setTime(120);
        setNotice("🛡️ Insurance kicked in — 2 minutes of overtime!");
      } else {
        setFailReason(`Time ran out at ${fmt(money)} — quota was ${fmt(quota)}.`);
        setBest((b) => Math.max(b, day));
        setScreen("gameover");
      }
    }
    // eslint-disable-next-line
  }, [time]);

  // busted check (only between games)
  useEffect(() => {
    if (screen === "menu" && money < minBet && money < quota) {
      setFailReason(`Busted — ${fmt(money)} left and the table minimum is ${fmt(minBet)}.`);
      setBest((b) => Math.max(b, day));
      setScreen("gameover");
    }
  }, [screen, money, minBet, quota, day]);

  const winDay = () => {
    setBest((b) => Math.max(b, day));
    setPendingQuota(r50(money * 1.5)); // quota locks in NOW — shopping won't change it
    setOwned(new Set());
    setScreen("shop");
  };

  const buy = (item) => {
    const cost = item.costOf(quota);
    if (owned.has(item.id) || money < cost) return;
    setMoney((m) => m - cost);
    setOwned((o) => new Set([...o, item.id]));
  };

  const previewQuota = () => (owned.has("cut") ? r50(pendingQuota * 0.85) : pendingQuota);

  const nextDay = () => {
    const nd = day + 1;
    setDay(nd);
    setQuota(previewQuota());
    const nMin = Math.max(25 * nd, r5(money * 0.04));
    setMinBet(nMin);
    setMaxBet(Math.max(nMin, r5(money * (owned.has("limit") ? 0.6 : BASE_MAX_FRAC))));
    setTime(DAY_SECONDS + (owned.has("time") ? 60 : 0));
    setLuckDay(owned.has("luck"));
    if (owned.has("ins")) setInsurance(true);
    setOwned(new Set());
    setScreen("menu");
  };

  const restart = () => {
    setMoney(START_MONEY);
    setDay(1);
    setQuota(1500);
    setMinBet(25);
    setTime(DAY_SECONDS);
    setGameId(null);
    setLuckDay(false);
    setMaxBet(r5(START_MONEY * BASE_MAX_FRAC));
    setInsurance(false);
    setOwned(new Set());
    setScreen("menu");
  };

  const mm = String(Math.max(0, Math.floor(time / 60)));
  const ss = String(Math.max(0, time % 60)).padStart(2, "0");
  const pct = clamp((money / quota) * 100, 0, 100);
  const quotaMet = money >= quota;
  const urgent = time <= 30;

  const Active = GAMES.find((g) => g.id === gameId)?.comp;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(80% 60% at 50% -10%, #171B26, ${C.bg} 70%)`,
        color: C.cream,
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        button { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        input[type="range"] { height: 28px; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes pop { from { transform: scale(.9); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes dealIn { from { transform: translateY(-14px); opacity: 0 } to { transform: none; opacity: 1 } }
        @keyframes blinkRed { 0%,100% { color: ${C.red} } 50% { color: ${C.cream} } }
        @keyframes bulb { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.gold}; outline-offset: 2px; }
      `}</style>

      {/* ===== HUD ===== */}
      {(screen === "menu" || screen === "game") && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(11,13,18,.92)",
            backdropFilter: "blur(8px)",
            borderBottom: `1px solid ${C.line}`,
            padding: "10px 14px",
          }}
        >
          {(() => {
            const quotaBlock = (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                    color: quotaMet ? C.green : C.muted,
                    marginBottom: 4,
                  }}
                >
                  <span>QUOTA {fmt(quota)}</span>
                  <span>{quotaMet ? "MET ✓" : `${Math.floor(pct)}%`}</span>
                </div>
                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#0E1119",
                    border: `1px solid ${quotaMet ? C.green : C.goldDim}`,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: quotaMet
                        ? `linear-gradient(90deg, ${C.green}, #7CF0B1)`
                        : `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`,
                      transition: "width .3s ease",
                    }}
                  />
                  {[...Array(8)].map((_, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        top: 2,
                        left: `${6 + i * 12.5}%`,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: C.cream,
                        opacity: 0.35,
                        animation: quotaMet ? `bulb 1s ${i * 0.12}s infinite` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
            return (
              <div style={{ maxWidth: 760, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
                  {screen === "game" && (
                    <button
                      onClick={() => setScreen("menu")}
                      aria-label="Back to games"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        border: `1px solid ${C.goldDim}`,
                        background: "#0E1119",
                        color: C.gold,
                        fontSize: 20,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      ←
                    </button>
                  )}
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.muted }}>
                      DAY {day}
                      {insurance ? " 🛡️" : ""}
                      {luckDay ? " 🍀" : ""}
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontWeight: 700,
                        fontSize: isMobile ? 16 : 18,
                        color: C.gold,
                      }}
                    >
                      {fmt(money)}
                    </div>
                  </div>
                  {!isMobile && quotaBlock}
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "auto" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: isMobile ? 10 : 11, color: C.muted }}>
                      BETS {fmt(minBet)}–{fmt(maxBet)}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Bungee',cursive",
                        fontSize: isMobile ? 18 : 20,
                        color: urgent ? C.red : C.cream,
                        animation: urgent ? "blinkRed 1s infinite" : "none",
                      }}
                    >
                      {mm}:{ss}
                    </div>
                  </div>
                  {quotaMet && (
                    <Btn onClick={winDay} kind="green" style={{ padding: isMobile ? "10px 10px" : "10px 14px", fontSize: 13 }}>
                      {isMobile ? "END ✓" : "END DAY ✓"}
                    </Btn>
                  )}
                </div>
                {isMobile && <div style={{ marginTop: 8 }}>{quotaBlock}</div>}
              </div>
            );
          })()}
          {notice && (
            <div
              style={{
                maxWidth: 760,
                margin: "8px auto 0",
                padding: "8px 14px",
                borderRadius: 8,
                background: "rgba(233,185,77,.12)",
                border: `1px solid ${C.gold}`,
                color: C.gold,
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 13,
                fontWeight: 700,
                textAlign: "center",
                animation: "pop .25s ease",
              }}
            >
              {notice}
            </div>
          )}
        </div>
      )}

      {/* ===== INTRO ===== */}
      {screen === "intro" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Bungee',cursive",
              fontSize: 44,
              color: C.gold,
              lineHeight: 1.1,
              textShadow: "0 0 30px rgba(233,185,77,.35)",
            }}
          >
            QUOTA
            <br />
            CASINO
          </div>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, margin: "24px 0" }}>
            The House fronts you <b style={{ color: C.cream }}>{fmt(START_MONEY)}</b> of play money. Every day you get{" "}
            <b style={{ color: C.cream }}>5 minutes</b> to hit the quota across twelve games. Make it and you can spend
            winnings on power-ups before the quota, table minimum, and stakes all climb. Miss it, and you start over
            from Day 1. Table limits are locked in each morning — the max bet is set from your bankroll at the start of
            the day and won't move until tomorrow.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginBottom: 28 }}>
            {GAMES.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: "10px 4px",
                  borderRadius: 10,
                  border: `1px solid ${C.line}`,
                  background: C.panel,
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                <div style={{ fontSize: 22 }}>{g.icon}</div>
                {g.name}
              </div>
            ))}
          </div>
          <Btn onClick={() => setScreen("menu")} style={{ fontSize: 18, padding: "16px 40px" }}>
            HIT THE FLOOR
          </Btn>
          <p style={{ color: "#5A6170", fontSize: 11, marginTop: 20, fontFamily: "'IBM Plex Mono',monospace" }}>
            play money only · nothing real is wagered
          </p>
        </div>
      )}

      {/* ===== MENU ===== */}
      {screen === "menu" && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 16px 50px" }}>
          <h1 style={{ fontFamily: "'Bungee',cursive", fontSize: 24, color: C.cream, textAlign: "center", margin: "4px 0 22px" }}>
            PICK YOUR TABLE
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setGameId(g.id);
                  setScreen("game");
                }}
                style={{
                  padding: "20px 12px",
                  borderRadius: 14,
                  border: `1px solid ${C.line}`,
                  background: `linear-gradient(160deg, ${C.panel}, #0E1119)`,
                  color: C.cream,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "border-color .15s, transform .12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.line;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ fontSize: 34, marginBottom: 8 }}>{g.icon}</div>
                <div style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.muted, marginTop: 4 }}>{g.tag}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== GAME ===== */}
      {screen === "game" && Active && (
        <Active key={gameId + day} money={money} minBet={minBet} maxBet={maxBet} spend={spend} payout={payout} />
      )}

      {/* ===== NIGHT SHOP ===== */}
      {screen === "shop" && (
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "50px 20px 60px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Bungee',cursive", fontSize: 32, color: C.green }}>QUOTA MET</div>
          <p style={{ color: C.muted, margin: "14px 0 6px", lineHeight: 1.7 }}>
            Day {day} cleared. Tomorrow's quota is already locked in — spend some winnings at the{" "}
            <b style={{ color: C.gold }}>night shop</b> without it costing you a bigger target.
          </p>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 13,
              color: C.cream,
              marginBottom: 22,
            }}
          >
            bankroll {fmt(money)} → tomorrow's quota {fmt(previewQuota())}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 26 }}>
            {SHOP_ITEMS.map((it) => {
              const cost = it.costOf(quota);
              const has = owned.has(it.id);
              const afford = money >= cost;
              return (
                <button
                  key={it.id}
                  onClick={() => buy(it)}
                  disabled={has || !afford}
                  style={{
                    padding: "16px 12px",
                    borderRadius: 14,
                    border: `2px solid ${has ? C.green : afford ? C.line : "#2A2F3C"}`,
                    background: has ? "rgba(61,220,132,.1)" : C.panel,
                    color: C.cream,
                    cursor: has || !afford ? "default" : "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{it.icon}</div>
                  <div style={{ fontFamily: "'Rubik',sans-serif", fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, margin: "6px 0", lineHeight: 1.5 }}>{it.desc}</div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontWeight: 700,
                      fontSize: 13,
                      color: has ? C.green : afford ? C.gold : "#5A6170",
                    }}
                  >
                    {has ? "PURCHASED ✓" : fmt(cost)}
                  </div>
                </button>
              );
            })}
          </div>
          <Btn onClick={nextDay} style={{ fontSize: 17, padding: "14px 34px" }}>
            START DAY {day + 1}
          </Btn>
        </div>
      )}

      {/* ===== GAME OVER ===== */}
      {screen === "gameover" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Bungee',cursive", fontSize: 36, color: C.red }}>THE HOUSE WINS</div>
          <p style={{ color: C.muted, margin: "18px 0", lineHeight: 1.7 }}>
            {failReason}
            <br />
            You made it to <b style={{ color: C.cream }}>Day {day}</b>. Best run: Day {best}.
          </p>
          <Btn onClick={restart} kind="red" style={{ fontSize: 17, padding: "14px 34px" }}>
            RESTART FROM DAY 1
          </Btn>
        </div>
      )}
    </div>
  );
}
