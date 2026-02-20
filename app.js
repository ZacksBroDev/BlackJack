"use strict";

/**
 * Blackjack First-Decision Trainer
 * Rules: 6 decks, Dealer stands on all 17s (S17), splits allowed, no surrender.
 * Grades only the first decision using basic strategy for hard/soft totals and pairs.
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
let splitHands = []; // for split gameplay
let currentHandIndex = 0; // which split hand is active

// -------------------- Card Counting State --------------------
const countState = {
  runningCount: 0,
  lowsSeen: 0, // 2-6
  neutralsSeen: 0, // 7-9
  highsSeen: 0, // 10-A
  lastCard: null,
  lastDelta: 0,
  dealerHoleCounted: false,
};

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
const splitBtn = el("splitBtn");
const nextBtn = el("nextBtn");
const resetBtn = el("resetBtn");

const runningCountEl = el("runningCount");
const trueCountEl = el("trueCount");
const decksRemainingEl = el("decksRemaining");
const lastCardTextEl = el("lastCardText");
const lowsSeenEl = el("lowsSeen");
const neutralsSeenEl = el("neutralsSeen");
const highsSeenEl = el("highsSeen");
const coachTextEl = el("coachText");
const showCountingEl = el("showCounting");
const coachModeEl = el("coachMode");
const countingDisplayEl = el("countingDisplay");
const countCoachEl = el("countCoach");
const countCoachTextEl = el("countCoachText");

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
  resetCount();
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

function isPair(hand) {
  if (hand.length !== 2) return false;
  const v1 = rankValue(hand[0].r);
  const v2 = rankValue(hand[1].r);
  return v1 === v2;
}

function getPairRank(hand) {
  if (!isPair(hand)) return null;
  const val = rankValue(hand[0].r);
  if (val === 11) return "A";
  return String(val);
}

// -------------------- Basic Strategy (first decision only) --------------------
// From the chart class: multi-deck, S17. No surrender, includes splits.
// Returns: 'H' | 'S' | 'D' | 'SP' (Double if allowed else fallback to H/S where appropriate)
function recommendedFirstAction(pHand, dUpCard, canDouble, canSplit) {
  const up = dealerUpColumn(dUpCard);
  const { total, isSoft } = handTotals(pHand);

  // Check for pairs first
  if (canSplit && isPair(pHand)) {
    const pairRank = getPairRank(pHand);

    // Pair splitting strategy (basic strategy)
    if (pairRank === "A" || pairRank === "8") return "SP"; // Always split A,A and 8,8
    if (pairRank === "10") return "S"; // Never split 10,10
    if (pairRank === "9") {
      // Split 9,9 vs 2-9 except 7
      return ["2", "3", "4", "5", "6", "8", "9"].includes(up) ? "SP" : "S";
    }
    if (pairRank === "7") {
      // Split 7,7 vs 2-7
      return ["2", "3", "4", "5", "6", "7"].includes(up) ? "SP" : "H";
    }
    if (pairRank === "6") {
      // Split 6,6 vs 2-6
      return ["2", "3", "4", "5", "6"].includes(up) ? "SP" : "H";
    }
    if (pairRank === "5") {
      // Never split 5,5 (treat as 10)
      return ["2", "3", "4", "5", "6", "7", "8", "9"].includes(up)
        ? canDouble
          ? "D"
          : "H"
        : "H";
    }
    if (pairRank === "4") {
      // Split 4,4 vs 5-6
      return ["5", "6"].includes(up) ? "SP" : "H";
    }
    if (pairRank === "3" || pairRank === "2") {
      // Split 2,2 and 3,3 vs 2-7
      return ["2", "3", "4", "5", "6", "7"].includes(up) ? "SP" : "H";
    }
  }

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
  if (rec === "SP")
    return `Split: splitting this pair vs dealer ${up} is optimal for long-term EV.`;
  return `Hit: standing is too passive versus dealer ${up}. Improve your total.`;
}
// -------------------- Card Counting --------------------
function getHiLoValue(rank) {
  // 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = -1
  if (["2", "3", "4", "5", "6"].includes(rank)) return 1;
  if (["7", "8", "9"].includes(rank)) return 0;
  return -1; // 10, J, Q, K, A
}

function revealCard(card) {
  if (!card) return;

  const delta = getHiLoValue(card.r);
  countState.runningCount += delta;
  countState.lastCard = card;
  countState.lastDelta = delta;

  // Update breakdown
  if (delta === 1) countState.lowsSeen++;
  else if (delta === 0) countState.neutralsSeen++;
  else countState.highsSeen++;

  updateCountingDisplay();
}

function getTrueCount() {
  const decksLeft = Math.max(shoe.length / 52, 0.25);
  return countState.runningCount / decksLeft;
}

function getDecksRemaining() {
  return Math.max(shoe.length / 52, 0.25);
}

function resetCount() {
  countState.runningCount = 0;
  countState.lowsSeen = 0;
  countState.neutralsSeen = 0;
  countState.highsSeen = 0;
  countState.lastCard = null;
  countState.lastDelta = 0;
  countState.dealerHoleCounted = false;
  updateCountingDisplay();
}

function updateCountingDisplay() {
  if (!runningCountEl) return; // UI not loaded yet

  runningCountEl.textContent = countState.runningCount;
  trueCountEl.textContent = getTrueCount().toFixed(2);
  decksRemainingEl.textContent = getDecksRemaining().toFixed(2);

  if (countState.lastCard) {
    const sign = countState.lastDelta > 0 ? "+" : "";
    lastCardTextEl.textContent = `Last: ${countState.lastCard.r}${countState.lastCard.s} → ${sign}${countState.lastDelta}`;
  } else {
    lastCardTextEl.textContent = "Last: —";
  }

  lowsSeenEl.textContent = countState.lowsSeen;
  neutralsSeenEl.textContent = countState.neutralsSeen;
  highsSeenEl.textContent = countState.highsSeen;

  // Coach mode hint
  if (coachModeEl?.checked && coachTextEl) {
    const tc = getTrueCount();
    let hint = "";
    if (tc >= 2) hint = "Favorable count! Consider increasing bet size.";
    else if (tc <= -2) hint = "Unfavorable count. Minimum bet recommended.";
    else hint = "Neutral count. Standard strategy applies.";

    coachTextEl.textContent = hint;
    coachTextEl.style.display = "block";
  } else if (coachTextEl) {
    coachTextEl.style.display = "none";
  }

  // Update count coach suggestions if in hand
  updateCountCoach();
}

function updateCountCoach() {
  if (!countCoachEl || !countCoachTextEl) return;
  if (handOver || !firstDecisionOpen) {
    countCoachEl.style.display = "none";
    return;
  }

  const tc = getTrueCount();
  const up = dealerUpColumn(dealer[0]);
  const { total, isSoft } = handTotals(player);
  let suggestions = [];

  // Betting advice
  if (tc >= 3)
    suggestions.push(
      `💰 High count (TC +${tc.toFixed(1)})! This is a great time to increase your bet.`,
    );
  else if (tc >= 2)
    suggestions.push(
      `💰 Favorable count (TC +${tc.toFixed(1)}). Consider raising your bet.`,
    );
  else if (tc <= -2)
    suggestions.push(
      `⚠️ Unfavorable count (TC ${tc.toFixed(1)}). Bet minimum or take a break.`,
    );

  // Playing deviations (Illustrious 18 - simplified)
  if (!isSoft) {
    if (total === 16 && up === "10" && tc >= 0) {
      suggestions.push(
        `🎯 16 vs 10: With TC ${tc.toFixed(1)}, STAND (basic says hit, but count favors standing).`,
      );
    }
    if (total === 15 && up === "10" && tc >= 4) {
      suggestions.push(
        `🎯 15 vs 10: With high TC ${tc.toFixed(1)}, consider STANDING (deviation from basic).`,
      );
    }
    if (total === 12 && up === "3" && tc >= 2) {
      suggestions.push(
        `🎯 12 vs 3: With TC ${tc.toFixed(1)}, STAND (basic says hit).`,
      );
    }
    if (total === 12 && up === "2" && tc >= 3) {
      suggestions.push(
        `🎯 12 vs 2: With TC ${tc.toFixed(1)}, STAND (basic says hit).`,
      );
    }
    if (total === 13 && up === "2" && tc <= -1) {
      suggestions.push(
        `🎯 13 vs 2: With negative TC ${tc.toFixed(1)}, HIT (basic says stand).`,
      );
    }
    if (total === 10 && up === "10" && tc >= 4) {
      suggestions.push(
        `🎯 10 vs 10: With high TC ${tc.toFixed(1)}, DOUBLE (basic says hit).`,
      );
    }
    if (total === 10 && up === "A" && tc >= 4) {
      suggestions.push(
        `🎯 10 vs A: With high TC ${tc.toFixed(1)}, DOUBLE (basic says hit).`,
      );
    }
  }

  // Insurance (if dealer shows A)
  if (up === "A" && tc >= 3) {
    suggestions.push(
      `🛡️ Dealer shows Ace with TC ${tc.toFixed(1)}+. Insurance would be profitable!`,
    );
  }

  if (suggestions.length > 0) {
    countCoachTextEl.innerHTML = suggestions.join("<br><br>");
    countCoachEl.style.display = "block";
  } else {
    countCoachEl.style.display = "none";
  }
}
// -------------------- Gameplay --------------------
function startHand() {
  if (shoe.length <= RULES.reshuffleAt || shoe.length === 0) newShoe();

  countState.dealerHoleCounted = false;
  splitHands = [];
  currentHandIndex = 0;

  // Deal cards
  player = [dealCard(), dealCard()];
  dealer = [dealCard(), dealCard()];

  // Reveal player cards and dealer upcard (NOT hole card)
  revealCard(player[0]);
  revealCard(player[1]);
  revealCard(dealer[0]); // upcard
  // dealer[1] is hole card - NOT revealed yet

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
  splitBtn.disabled = handOver || !isPair(player) || player.length !== 2;

  // If first decision already happened, double and split should remain disabled.
  if (!firstDecisionOpen) {
    doubleBtn.disabled = true;
    splitBtn.disabled = true;
  }
}

function gradeIfFirstDecision(actionLetter) {
  if (!firstDecisionOpen) return;

  const canDouble = player.length === 2;
  const canSplit = isPair(player) && player.length === 2;
  const rec = recommendedFirstAction(player, dealer[0], canDouble, canSplit);

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

  const newCard = dealCard();
  player.push(newCard);
  revealCard(newCard); // Reveal immediately

  const pt = handTotals(player);

  if (pt.total > 21) {
    // If we're in a split and bust
    if (splitHands.length > 0 && currentHandIndex === 0) {
      msgEl.textContent = `Hand 1 busted with ${pt.total}. Moving to hand 2...`;
      setTimeout(() => playNextSplitHand(), 800);
      return;
    }
    endHand(`You busted with ${pt.total}. Dealer wins.`);
    return;
  }

  if (splitHands.length > 0) {
    msgEl.textContent = `Hit taken. Hand ${currentHandIndex + 1} total: ${pt.total}`;
  } else {
    msgEl.textContent = firstDecisionOpen
      ? msgEl.textContent
      : `Hit taken. Your total is ${pt.total}.`;
  }
  enableActionsForState();
  render();
}

function playNextSplitHand() {
  currentHandIndex++;
  if (currentHandIndex < splitHands.length) {
    player = splitHands[currentHandIndex];
    msgEl.textContent = `Playing split hand ${currentHandIndex + 1} of ${splitHands.length}. Total: ${handTotals(player).total}`;
    enableActionsForState();
    render();
  } else {
    // Both hands played, now dealer plays
    dealerPlay();
    settleSplit();
  }
}

function stand() {
  gradeIfFirstDecision("S");

  // If we're in a split hand
  if (splitHands.length > 0 && currentHandIndex === 0) {
    msgEl.textContent = `Hand 1 stands. Moving to hand 2...`;
    setTimeout(() => playNextSplitHand(), 800);
    return;
  }

  dealerPlay();
  if (splitHands.length > 0) {
    settleSplit();
  } else {
    settle();
  }
}

function split() {
  gradeIfFirstDecision("SP");

  // Create two hands from the pair
  splitHands = [
    [player[0], dealCard()],
    [player[1], dealCard()],
  ];

  // Reveal the two new cards
  revealCard(splitHands[0][1]);
  revealCard(splitHands[1][1]);

  // Play first hand
  player = splitHands[0];
  currentHandIndex = 0;
  firstDecisionOpen = false; // Already graded the split decision

  msgEl.textContent = `Playing split hand 1 of 2. Total: ${handTotals(player).total}`;
  enableActionsForState();
  render();
}

function doubleDown() {
  // double: one card then stand
  gradeIfFirstDecision("D");

  const newCard = dealCard();
  player.push(newCard);
  revealCard(newCard); // Reveal immediately

  const pt = handTotals(player);
  if (pt.total > 21) {
    endHand(`You doubled and busted with ${pt.total}. Dealer wins.`);
    return;
  }
  dealerPlay();
  settle(true);
}

function dealerPlay() {
  // Reveal dealer hole card
  if (!countState.dealerHoleCounted && dealer.length >= 2) {
    revealCard(dealer[1]);
    countState.dealerHoleCounted = true;
  }

  while (true) {
    const dt = handTotals(dealer);
    const hit =
      dt.total < 17 ||
      (!RULES.dealerStandsSoft17 && dt.total === 17 && dt.isSoft);

    if (!hit) break;
    const newCard = dealCard();
    dealer.push(newCard);
    revealCard(newCard); // Reveal dealer draws immediately
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

function settleSplit() {
  const dt = handTotals(dealer);
  let outcomes = [];

  for (let i = 0; i < splitHands.length; i++) {
    const pt = handTotals(splitHands[i]);
    let result = "";

    if (pt.total > 21) {
      result = `Hand ${i + 1}: Bust (${pt.total})`;
    } else if (dt.total > 21) {
      result = `Hand ${i + 1}: Win (${pt.total} vs dealer bust)`;
    } else if (pt.total > dt.total) {
      result = `Hand ${i + 1}: Win (${pt.total} vs ${dt.total})`;
    } else if (pt.total < dt.total) {
      result = `Hand ${i + 1}: Lose (${pt.total} vs ${dt.total})`;
    } else {
      result = `Hand ${i + 1}: Push (${pt.total})`;
    }
    outcomes.push(result);
  }

  endHand(outcomes.join(" | "));
}

function settleSplit() {
  const dt = handTotals(dealer);
  let outcomes = [];

  for (let i = 0; i < splitHands.length; i++) {
    const pt = handTotals(splitHands[i]);
    let result = "";

    if (pt.total > 21) {
      result = `Hand ${i + 1}: Bust (${pt.total})`;
    } else if (dt.total > 21) {
      result = `Hand ${i + 1}: Win (${pt.total} vs dealer bust)`;
    } else if (pt.total > dt.total) {
      result = `Hand ${i + 1}: Win (${pt.total} vs ${dt.total})`;
    } else if (pt.total < dt.total) {
      result = `Hand ${i + 1}: Lose (${pt.total} vs ${dt.total})`;
    } else {
      result = `Hand ${i + 1}: Push (${pt.total})`;
    }
    outcomes.push(result);
  }

  endHand(outcomes.join(" | "));
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
  const dealerShown = showDealerHole || handOver;

  if (dealerShown && dealer.length > 0) {
    const dt = handTotals(dealer);
    dealerMetaEl.textContent = `Total: ${dt.isSoft ? "Soft " : ""}${dt.total}`;
  } else {
    dealerMetaEl.textContent = `Upcard: ${dealer[0]?.r ?? "—"}`;
  }

  for (let i = 0; i < dealer.length; i++) {
    const c = dealer[i];
    const div = document.createElement("div");
    div.className = "card" + (!dealerShown && i === 1 ? " back" : "");
    div.textContent = !dealerShown && i === 1 ? "■" : `${c.r}${c.s}`;
    dealerCardsEl.appendChild(div);
  }

  // Player
  playerCardsEl.innerHTML = "";

  // If we have split hands, show the current hand being played
  const displayHand = splitHands.length > 0 ? player : player;
  const pt = displayHand.length
    ? handTotals(displayHand)
    : { total: "—", isSoft: false };

  if (splitHands.length > 0 && !handOver) {
    playerMetaEl.textContent = `Hand ${currentHandIndex + 1}/${splitHands.length}: ${pt.isSoft ? "Soft " : ""}${pt.total}`;
  } else if (displayHand.length) {
    playerMetaEl.textContent = `Total: ${pt.isSoft ? "Soft " : ""}${pt.total}`;
  } else {
    playerMetaEl.textContent = "Total: —";
  }

  for (const c of displayHand) {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = `${c.r}${c.s}`;
    playerCardsEl.appendChild(div);
  }

  // If hand is over and we had splits, show both hands
  if (handOver && splitHands.length > 0) {
    playerCardsEl.innerHTML = "";
    for (let i = 0; i < splitHands.length; i++) {
      const handDiv = document.createElement("div");
      handDiv.style.display = "flex";
      handDiv.style.gap = "6px";
      handDiv.style.marginBottom = "8px";

      const label = document.createElement("div");
      label.textContent = `H${i + 1}:`;
      label.style.fontSize = "11px";
      label.style.color = "var(--muted)";
      label.style.marginRight = "4px";
      label.style.alignSelf = "center";
      handDiv.appendChild(label);

      for (const c of splitHands[i]) {
        const div = document.createElement("div");
        div.className = "card";
        div.style.width = "56px";
        div.style.height = "76px";
        div.style.fontSize = "16px";
        div.textContent = `${c.r}${c.s}`;
        handDiv.appendChild(div);
      }
      playerCardsEl.appendChild(handDiv);
    }

    const totals = splitHands
      .map((h, i) => {
        const t = handTotals(h);
        return `H${i + 1}: ${t.isSoft ? "S" : ""}${t.total}`;
      })
      .join(" | ");
    playerMetaEl.textContent = totals;
  }

  enableActionsForState();
}

// -------------------- Wiring --------------------
dealBtn.addEventListener("click", () => startHand());
nextBtn.addEventListener("click", () => startHand());
hitBtn.addEventListener("click", () => hit());
standBtn.addEventListener("click", () => stand());
doubleBtn.addEventListener("click", () => doubleDown());
splitBtn.addEventListener("click", () => split());

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

  // Set up counting UI toggles
  if (showCountingEl && countingDisplayEl) {
    showCountingEl.addEventListener("change", function () {
      if (this.checked) {
        countingDisplayEl.classList.remove("hidden");
      } else {
        countingDisplayEl.classList.add("hidden");
      }
    });
  }

  if (coachModeEl) {
    coachModeEl.addEventListener("change", function () {
      updateCountingDisplay();
    });
  }
}
init();
