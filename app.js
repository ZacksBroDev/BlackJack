"use strict";

/**
 * Blackjack First-Decision Trainer
 * Rules: 6 decks, Dealer stands on all 17s (S17), no splits, no surrender.
 * Grades only the first decision using basic strategy for hard/soft totals.
 */

// -------------------- State --------------------
const RULES = {
  decks: 6,
  dealerStandsSoft17: true,
  reshuffleAt: 52, // reshuffle when <= 1 deck remains
};

let shoe = [];
let player = [];
let dealer = [];
let firstDecisionOpen = false; // only grade the first decision
let handOver = true;

// -------------------- DOM --------------------
const el = (id) => document.getElementById(id);

const dealerCardsEl = el("dealerCards");
const playerCardsEl = el("playerCards");
const dealerMetaEl = el("dealerMeta");
const playerMetaEl = el("playerMeta");
const msgEl = el("msg");

const accEl = el("acc");
const streakEl = el("streak");
const bestEl = el("best");

const dealBtn = el("dealBtn");
const hitBtn = el("hitBtn");
const standBtn = el("standBtn");
const doubleBtn = el("doubleBtn");
const nextBtn = el("nextBtn");
const resetBtn = el("resetBtn");

// -------------------- Stats --------------------
const STATS_KEY = "bj_trainer_stats_v1";
const stats = loadStats();

function loadStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STATS_KEY));
    return s ?? { decisions: 0, correct: 0, streak: 0, best: 0 };
  } catch {
    return { decisions: 0, correct: 0, streak: 0, best: 0 };
  }
}

function saveStats() {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const acc = stats.decisions
    ? ((100 * stats.correct) / stats.decisions).toFixed(1)
    : "0.0";
  accEl.textContent = `${acc}%`;
  streakEl.textContent = String(stats.streak);
  bestEl.textContent = String(stats.best);
}

// -------------------- Cards / Shoe --------------------
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function newShoe() {
  shoe = [];
  for (let d = 0; d < RULES.decks; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        shoe.push({ r, s });
      }
    }
  }
  shuffle(shoe);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function dealCard() {
  if (shoe.length <= RULES.reshuffleAt) newShoe();
  return shoe.pop();
}

function rankValue(r) {
  if (r === "A") return 11;
  if (r === "K" || r === "Q" || r === "J") return 10;
  return Number(r);
}

function handTotals(hand) {
  let sum = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.r === "A") aces++;
    else sum += rankValue(c.r);
  }
  // all aces as 1
  let total = sum + aces;
  let isSoft = false;
  // upgrade one ace to 11 if it fits
  if (aces > 0 && total + 10 <= 21) {
    total += 10;
    isSoft = true;
  }
  return { total, isSoft };
}

function dealerUpColumn(card) {
  if (card.r === "A") return "A";
  if (card.r === "K" || card.r === "Q" || card.r === "J" || card.r === "10")
    return "10";
  return card.r; // 2..9
}

// -------------------- Basic Strategy (first decision only) --------------------
// From the chart class: multi-deck, S17. No surrender, no splits.
// Returns: 'H' | 'S' | 'D' (Double if allowed else fallback to H/S where appropriate)
function recommendedFirstAction(pHand, dUpCard, canDouble) {
  const up = dealerUpColumn(dUpCard);
  const { total, isSoft } = handTotals(pHand);

  // Hard totals
  if (!isSoft) {
    const t = total;
    if (t <= 8) return "H";
    if (t === 9)
      return ["3", "4", "5", "6"].includes(up) ? (canDouble ? "D" : "H") : "H";
    if (t === 10)
      return ["2", "3", "4", "5", "6", "7", "8", "9"].includes(up)
        ? canDouble
          ? "D"
          : "H"
        : "H";
    if (t === 11) return up !== "A" ? (canDouble ? "D" : "H") : "H";
    if (t === 12) return ["4", "5", "6"].includes(up) ? "S" : "H";
    if (t === 13 || t === 14)
      return ["2", "3", "4", "5", "6"].includes(up) ? "S" : "H";
    if (t === 15) return ["2", "3", "4", "5", "6"].includes(up) ? "S" : "H"; // ignoring surrender
    if (t === 16) return ["2", "3", "4", "5", "6"].includes(up) ? "S" : "H"; // ignoring surrender
    return "S"; // 17+
  }

  // Soft totals (A counted as 11)
  const t = total;
  if (t === 13 || t === 14)
    return ["5", "6"].includes(up) ? (canDouble ? "D" : "H") : "H"; // A,2 / A,3
  if (t === 15 || t === 16)
    return ["4", "5", "6"].includes(up) ? (canDouble ? "D" : "H") : "H"; // A,4 / A,5
  if (t === 17)
    return ["3", "4", "5", "6"].includes(up) ? (canDouble ? "D" : "H") : "H"; // A,6
  if (t === 18) {
    // A,7 : Double vs 3–6 else Stand vs 2,7,8 else Hit
    if (["3", "4", "5", "6"].includes(up)) return canDouble ? "D" : "S";
    if (["2", "7", "8"].includes(up)) return "S";
    return "H";
  }
  return "S"; // A,8 (19) and A,9 (20)
}

function explain(rec, dUp) {
  const up = dealerUpColumn(dUp);
  if (rec === "D")
    return `Double: your hand has strong equity vs dealer ${up}. Press the advantage.`;
  if (rec === "S")
    return `Stand: you’re in a stable position and dealer ${up} is weak enough.`;
  return `Hit: standing is too passive versus dealer ${up}. Improve your total.`;
}

// -------------------- Gameplay --------------------
function startHand() {
  if (shoe.length <= RULES.reshuffleAt || shoe.length === 0) newShoe();

  player = [dealCard(), dealCard()];
  dealer = [dealCard(), dealCard()];

  handOver = false;
  firstDecisionOpen = true;

  msgEl.textContent = "Make your first decision (this one is graded).";
  enableActionsForState();
  render();
}

function enableActionsForState() {
  const pt = handTotals(player);

  dealBtn.disabled = !handOver; // only deal when hand over
  nextBtn.disabled = !handOver;

  hitBtn.disabled = handOver || pt.total >= 21;
  standBtn.disabled = handOver;
  doubleBtn.disabled = handOver || player.length !== 2; // only first decision

  // If first decision already happened, double should remain disabled.
  if (!firstDecisionOpen) doubleBtn.disabled = true;
}

function gradeIfFirstDecision(actionLetter) {
  if (!firstDecisionOpen) return;

  const canDouble = player.length === 2;
  const rec = recommendedFirstAction(player, dealer[0], canDouble);

  stats.decisions++;
  const correct = actionLetter === rec;

  if (correct) {
    stats.correct++;
    stats.streak++;
    stats.best = Math.max(stats.best, stats.streak);
    msgEl.textContent = `✅ Correct. Recommended: ${rec}. ${explain(rec, dealer[0])}`;
  } else {
    stats.streak = 0;
    msgEl.textContent = `❌ Not quite. Recommended: ${rec}. ${explain(rec, dealer[0])}`;
  }

  saveStats();
  firstDecisionOpen = false; // grade only once per hand
}

function hit() {
  gradeIfFirstDecision("H");

  player.push(dealCard());
  const pt = handTotals(player);

  if (pt.total > 21) {
    endHand(`You busted with ${pt.total}. Dealer wins.`);
    return;
  }
  msgEl.textContent = firstDecisionOpen
    ? msgEl.textContent
    : `Hit taken. Your total is ${pt.total}.`;
  enableActionsForState();
  render();
}

function stand() {
  gradeIfFirstDecision("S");
  dealerPlay();
  settle();
}

function doubleDown() {
  // double: one card then stand
  gradeIfFirstDecision("D");

  player.push(dealCard());
  const pt = handTotals(player);
  if (pt.total > 21) {
    endHand(`You doubled and busted with ${pt.total}. Dealer wins.`);
    return;
  }
  dealerPlay();
  settle(true);
}

function dealerPlay() {
  while (true) {
    const dt = handTotals(dealer);
    const hit =
      dt.total < 17 ||
      (!RULES.dealerStandsSoft17 && dt.total === 17 && dt.isSoft);

    if (!hit) break;
    dealer.push(dealCard());
  }
}

function settle(doubled = false) {
  const pt = handTotals(player);
  const dt = handTotals(dealer);

  // dealer blackjack check is simplified; MVP
  let outcome = "";

  if (dt.total > 21)
    outcome = `Dealer busts with ${dt.total}. You win${doubled ? " (double)" : ""}.`;
  else if (pt.total > dt.total)
    outcome = `You win ${pt.total} vs dealer ${dt.total}${doubled ? " (double)" : ""}.`;
  else if (pt.total < dt.total)
    outcome = `You lose ${pt.total} vs dealer ${dt.total}${doubled ? " (double)" : ""}.`;
  else outcome = `Push: ${pt.total} vs ${dt.total}.`;

  endHand(outcome);
}

function endHand(text) {
  handOver = true;
  firstDecisionOpen = false;
  msgEl.textContent = text + "  Click “Next Hand” or “Deal”.";
  enableActionsForState();
  render(true);
}

function render(showDealerHole = false) {
  // Dealer
  dealerCardsEl.innerHTML = "";
  dealerMetaEl.textContent = `Upcard: ${dealer[0]?.r ?? "—"}`;
  console.log((dealerMetaEl.textContent = `Upcard: ${dealer[0]?.r ?? "—"}`));
  const dealerShown = showDealerHole || handOver;

  for (let i = 0; i < dealer.length; i++) {
    const c = dealer[i];
    const div = document.createElement("div");
    div.className = "card" + (!dealerShown && i === 1 ? " back" : "");
    div.textContent = !dealerShown && i === 1 ? "■" : `${c.r}${c.s}`;
    dealerCardsEl.appendChild(div);
  }

  // Player
  playerCardsEl.innerHTML = "";
  const pt = player.length ? handTotals(player) : { total: "—", isSoft: false };
  playerMetaEl.textContent = player.length
    ? `Total: ${pt.isSoft ? "Soft " : ""}${pt.total}`
    : "Total: —";

  for (const c of player) {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = `${c.r}${c.s}`;
    playerCardsEl.appendChild(div);
  }

  enableActionsForState();
}

// -------------------- Wiring --------------------
dealBtn.addEventListener("click", () => startHand());
nextBtn.addEventListener("click", () => startHand());
hitBtn.addEventListener("click", () => hit());
standBtn.addEventListener("click", () => stand());
doubleBtn.addEventListener("click", () => doubleDown());

resetBtn.addEventListener("click", () => {
  stats.decisions = 0;
  stats.correct = 0;
  stats.streak = 0;
  stats.best = 0;
  saveStats();
  msgEl.textContent = "Stats reset.";
});

function init() {
  newShoe();
  renderStats();
  render();
}
init();
dealerCards;