"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ComposedChart, Scatter, Cell } from "recharts";

// ============================================================
// CONSTANTS & CONFIG
// ============================================================

const METHODS = [
  {
    id: "rct",
    label: "RCT",
    full: "Randomized Controlled Trial",
    color: "#1e3a8a",
    icon: "🎲",
    tagline: "The gold standard: randomize, then compare.",
    keyConcepts: ["Random assignment", "Control group", "Treatment group", "Average treatment effect (ATE)", "Internal validity"],
    definitions: {
      colloquial: "An RCT is like flipping a coin to decide who gets a new program and who doesn't. Because the coin doesn't care who you are, the two groups end up being basically the same kind of people. So if the program group does better, you know it was the program that made the difference, not something else about who they are.",
      basic: "An RCT randomly assigns participants to either a treatment or control condition. Randomization ensures the groups are statistically equivalent on both observed and unobserved characteristics at baseline. Any difference in outcomes between groups at follow-up can therefore be attributed to the intervention itself, providing an unbiased estimate of the average treatment effect (ATE).",
      advanced: "An RCT identifies the ATE by leveraging random assignment to satisfy the independence assumption: (Y(1), Y(0)) ⊥ D, where D is the treatment indicator and Y(1), Y(0) are potential outcomes. This eliminates both observed and unobserved confounding, yielding an unbiased estimator: ATE = E[Y|D=1] - E[Y|D=0]. Key threats include noncompliance (requiring ITT vs. CACE estimation), differential attrition, spillover effects, and Hawthorne effects. Statistical power depends on sample size, effect size, ICC (for clustered designs), and allocation ratio.",
    },
  },
  {
    id: "did",
    label: "DiD",
    full: "Difference-in-Differences",
    color: "#c2410c",
    icon: "📐",
    tagline: "Subtract the trend, isolate the effect.",
    keyConcepts: ["Parallel trends assumption", "Treatment group", "Comparison group", "Pre/post periods", "Counterfactual"],
    definitions: {
      colloquial: "DiD works by watching two groups over time: one that gets a program and one that doesn't. Both groups are changing naturally (maybe things are getting better or worse for everyone). You figure out how much of the change in the program group would have happened anyway by looking at the other group. Whatever's left over is the program's actual effect.",
      basic: "Difference-in-Differences compares the change in outcomes over time between a treatment group that receives an intervention and a comparison group that does not. By subtracting the comparison group's change from the treatment group's change, DiD removes time-invariant confounders and shared temporal trends. The key identifying assumption is parallel trends: absent the intervention, both groups would have followed the same trajectory.",
      advanced: "DiD estimates the ATT via the double-difference: δ = [E(Y|G=1,T=1) - E(Y|G=1,T=0)] - [E(Y|G=0,T=1) - E(Y|G=0,T=0)], where G indexes group and T indexes time. Identification requires the parallel trends assumption: E[Y(0)|G=1,T=1] - E[Y(0)|G=1,T=0] = E[Y(0)|G=0,T=1] - E[Y(0)|G=0,T=0]. This is fundamentally untestable for the post-period but can be assessed with pre-treatment trend data. Extensions include staggered adoption (Callaway-Sant'Anna, Sun-Abraham), event studies, and triple-difference designs. Standard errors should account for serial correlation (clustering at the unit level).",
    },
  },
  {
    id: "rd",
    label: "RD",
    full: "Regression Discontinuity",
    color: "#7c3aed",
    icon: "📏",
    tagline: "A threshold rule creates a natural experiment.",
    keyConcepts: ["Running variable", "Cutoff/threshold", "Bandwidth", "Local average treatment effect (LATE)", "Continuity assumption"],
    definitions: {
      colloquial: "RD takes advantage of an arbitrary cutoff. Imagine a program that's only available to people who score below some number on a test. People who just barely missed the cutoff are almost identical to people who just barely made it. By comparing those two groups, you can figure out what the program actually did, because the cutoff is essentially acting like a coin flip for people right around that line.",
      basic: "Regression Discontinuity exploits a threshold rule where treatment is assigned based on whether a continuous variable (the running variable) falls above or below a cutoff. People just above and just below the cutoff are nearly identical, creating a quasi-experimental comparison. The treatment effect is estimated as the discontinuity (jump) in the outcome at the threshold. The result is a local average treatment effect (LATE) that applies specifically to units near the cutoff.",
      advanced: "The sharp RD design identifies the LATE at the cutoff: τ_RD = lim(x→c+) E[Y|X=x] - lim(x→c-) E[Y|X=x], where X is the running variable and c is the cutoff. Identification requires continuity of the conditional expectation functions E[Y(0)|X=x] and E[Y(1)|X=x] at c, meaning potential outcomes do not jump at the threshold. Implementation involves local polynomial regression within a bandwidth h around c, with bias-correction and robust confidence intervals (Calonico, Cattaneo, Titiunik). Key diagnostics include McCrary density tests for manipulation, covariate balance at the cutoff, and sensitivity to bandwidth and polynomial order. Fuzzy RD extends to imperfect compliance using the cutoff as an instrument.",
    },
  },
  {
    id: "psm",
    label: "PSM",
    full: "Propensity Score Matching",
    color: "#065f46",
    icon: "🔗",
    tagline: "Find comparable pairs in observational data.",
    keyConcepts: ["Propensity score", "Matching", "Covariate balance", "Ignorability/unconfoundedness", "Common support"],
    definitions: {
      colloquial: "PSM is like finding a twin for each person in your program. Someone signed up for job training? Let's find someone who looks just like them (same age, same education, same background) but who didn't sign up. Then we compare their outcomes. If the person who got training did better than their 'twin,' that's evidence the training worked. The trick is making sure the matches are actually good.",
      basic: "Propensity Score Matching estimates treatment effects from observational data by pairing each treated individual with an untreated individual who had a similar probability (propensity score) of receiving treatment. The propensity score, estimated via logistic regression, summarizes multiple confounders into a single number. After matching, the treatment and control groups should be balanced on observed covariates, approximating what random assignment would have achieved. The key assumption is that no unmeasured confounders drive both treatment selection and the outcome.",
      advanced: "PSM estimates the ATT by matching on the propensity score e(X) = P(D=1|X). By the Rosenbaum-Rubin theorem, if (Y(0),Y(1)) ⊥ D | X (strong ignorability), then (Y(0),Y(1)) ⊥ D | e(X), reducing the dimensionality problem. The ATT = E[Y(1)-Y(0)|D=1] is estimated as the average difference in outcomes within matched pairs. Critical requirements include overlap/common support (0 < e(X) < 1), correct specification of the propensity model, and balance verification via standardized mean differences. Alternatives to nearest-neighbor matching include kernel matching, inverse probability weighting (IPW), and doubly robust estimators (AIPW). Sensitivity analysis (Rosenbaum bounds) quantifies how much unmeasured confounding would be needed to explain away the result.",
    },
  },
];

// ============================================================
// NOTATION TOOLTIPS
// ============================================================
const NOTATION_GLOSSARY = [
  // RCT
  { pattern: "(Y(1), Y(0)) ⊥ D", tip: "The potential outcomes (what would happen with and without treatment) are statistically independent of who actually gets treated. In plain terms: treatment assignment is unrelated to how someone would respond." },
  { pattern: "ATE = E[Y|D=1] - E[Y|D=0]", tip: "The Average Treatment Effect equals the expected outcome for the treated group minus the expected outcome for the control group. Simply: the average difference in results between the two groups." },
  { pattern: "Y(1), Y(0)", tip: "Potential outcomes: Y(1) is the outcome if a person receives treatment, Y(0) is the outcome if they do not. We can only ever observe one of these for each person." },
  { pattern: "ITT vs. CACE", tip: "Intent-to-Treat (ITT) compares groups as originally assigned, regardless of whether participants actually followed through. Complier Average Causal Effect (CACE) estimates the effect only among those who complied with their assignment." },
  { pattern: "ICC", tip: "Intraclass Correlation Coefficient: measures how similar individuals within the same cluster (e.g., school, clinic) are to each other. Higher ICC means you need larger sample sizes in clustered designs." },
  // DiD
  { pattern: "δ = [E(Y|G=1,T=1) - E(Y|G=1,T=0)] - [E(Y|G=0,T=1) - E(Y|G=0,T=0)]", tip: "The DiD estimator: take the before-to-after change in the treatment group, subtract the before-to-after change in the control group. What remains is the estimated effect of the intervention." },
  { pattern: "E[Y(0)|G=1,T=1] - E[Y(0)|G=1,T=0] = E[Y(0)|G=0,T=1] - E[Y(0)|G=0,T=0]", tip: "The parallel trends assumption in math: without treatment, the treatment group would have changed by the same amount as the control group. Both groups were on the same trajectory before the intervention." },
  { pattern: "ATT", tip: "Average Treatment Effect on the Treated: the average impact of the program specifically on those who received it (not the entire population)." },
  // RD
  { pattern: "τ_RD = lim(x→c+) E[Y|X=x] - lim(x→c-) E[Y|X=x]", tip: "The RD treatment effect: compare the expected outcome just above the cutoff to the expected outcome just below it. The size of the 'jump' at the cutoff is the estimated effect." },
  { pattern: "E[Y(0)|X=x]", tip: "The expected outcome without treatment for individuals at score x. If this function is smooth (no jumps) at the cutoff, then any jump in actual outcomes must be caused by the treatment." },
  { pattern: "E[Y(1)|X=x]", tip: "The expected outcome with treatment for individuals at score x." },
  { pattern: "LATE", tip: "Local Average Treatment Effect: the treatment effect estimated specifically for individuals right around the cutoff, not necessarily generalizable to everyone." },
  // PSM
  { pattern: "e(X) = P(D=1|X)", tip: "The propensity score: the probability of receiving treatment given a person's observed characteristics X. It boils down many variables (age, education, etc.) into a single number." },
  { pattern: "(Y(0),Y(1)) ⊥ D | X", tip: "Strong ignorability (or unconfoundedness): once you account for observed characteristics X, treatment assignment is as good as random. There are no hidden factors driving both who gets treated and the outcome." },
  { pattern: "(Y(0),Y(1)) ⊥ D | e(X)", tip: "A key result: if strong ignorability holds given X, it also holds given just the propensity score. This means you can match on one number instead of many variables." },
  { pattern: "ATT = E[Y(1)-Y(0)|D=1]", tip: "The Average Treatment Effect on the Treated: the average difference between what treated individuals actually experienced and what they would have experienced without treatment." },
  { pattern: "0 < e(X) < 1", tip: "The overlap (common support) condition: every individual must have some chance of being treated and some chance of not being treated. If certain people always or never get treated, we cannot find good matches for them." },
  { pattern: "ATE", tip: "Average Treatment Effect: the average causal impact of treatment across the entire population." },
  { pattern: "IPW", tip: "Inverse Probability Weighting: instead of matching, you reweight observations by the inverse of their propensity score to create a balanced pseudo-population." },
  { pattern: "AIPW", tip: "Augmented Inverse Probability Weighting (doubly robust): combines a regression model with propensity score weighting. If either model is correctly specified, you still get a consistent estimate." },
  { pattern: "Rosenbaum bounds", tip: "A sensitivity analysis that asks: how strong would an unmeasured confounder need to be to change your conclusion? If the result holds even with large hypothetical confounding, it is more credible." },
  { pattern: "Hawthorne effects", tip: "When people change their behavior simply because they know they are being observed or studied, not because of the treatment itself." },
  { pattern: "Callaway-Sant'Anna", tip: "A modern DiD estimator designed for settings where different groups receive treatment at different times (staggered adoption). It avoids the biases of traditional two-way fixed effects." },
  { pattern: "Sun-Abraham", tip: "Another modern DiD estimator for staggered adoption that uses an interaction-weighted approach to avoid contamination across cohorts." },
  { pattern: "McCrary density tests", tip: "A diagnostic test for RD that checks whether people are bunching just above or below the cutoff. If they are, it suggests manipulation of the running variable, which would violate the RD design." },
  { pattern: "Calonico, Cattaneo, Titiunik", tip: "Researchers who developed the standard modern toolkit for RD analysis, including optimal bandwidth selection, bias correction, and robust confidence intervals." },
];

function NotationText({ text, color }) {
  // Sort patterns by length (longest first) to match greedily
  const sorted = [...NOTATION_GLOSSARY].sort((a, b) => b.pattern.length - a.pattern.length);

  // Find all matches with their positions
  const matches = [];
  const used = new Set();
  for (const entry of sorted) {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(entry.pattern, searchFrom);
      if (idx === -1) break;
      const end = idx + entry.pattern.length;
      // Check no overlap with existing matches
      let overlaps = false;
      for (const m of matches) {
        if (idx < m.end && end > m.start) { overlaps = true; break; }
      }
      if (!overlaps) {
        matches.push({ start: idx, end, pattern: entry.pattern, tip: entry.tip });
      }
      searchFrom = idx + 1;
    }
  }
  matches.sort((a, b) => a.start - b.start);

  if (matches.length === 0) return <>{text}</>;

  const parts = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) parts.push(<span key={`t${cursor}`}>{text.slice(cursor, m.start)}</span>);
    parts.push(<NotationSpan key={`n${m.start}`} notation={m.pattern} tip={m.tip} color={color} />);
    cursor = m.end;
  }
  if (cursor < text.length) parts.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

function NotationSpan({ notation, tip, color }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState("below");
  const ref = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos(rect.top < 200 ? "below" : "above");
    }
    setShow(true);
  };

  return (
    <span
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}
      style={{
        position: "relative",
        borderBottom: `2px dotted ${color || "#64748b"}`,
        cursor: "help",
        paddingBottom: 1,
      }}
    >
      {notation}
      {show && (
        <span style={{
          position: "absolute",
          left: "50%", transform: "translateX(-50%)",
          ...(pos === "above" ? { bottom: "calc(100% + 10px)" } : { top: "calc(100% + 10px)" }),
          width: 320, maxWidth: "90vw",
          padding: "12px 14px",
          background: "#f1f5f9", border: `1px solid ${color || "#64748b"}50`,
          borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          fontSize: "0.9rem", color: "#000000",
          fontFamily: "'Inter', sans-serif", fontStyle: "normal",
          lineHeight: 1.55, fontWeight: 400,
          zIndex: 100, pointerEvents: "none",
          textAlign: "left",
        }}>
          <span style={{ display: "block", fontSize: "0.72rem", color: color || "#64748b", fontFamily: "'Inter', sans-serif", fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>In plain terms</span>
          {tip}
        </span>
      )}
    </span>
  );
}

const LEVELS = [
  { id: "colloquial", label: "Plain Language", desc: "Analogies and everyday language, zero jargon", emoji: "💬" },
  { id: "basic", label: "Basic", desc: "Key terms introduced, accessible to undergrads", emoji: "📖" },
  { id: "advanced", label: "Advanced", desc: "Technical detail, assumptions, diagnostics", emoji: "🔬" },
];

const EXAMPLE_PROGRAMS = {
  rct: "a school-based mindfulness program on student test anxiety",
  did: "a city-wide paid sick leave policy on worker absenteeism",
  rd: "a need-based financial aid program (GPA cutoff) on college graduation rates",
  psm: "a voluntary after-school tutoring program on math achievement",
};

const SYSTEM_PROMPT = `You are a causal inference educator. The student wants to learn a specific method through a concrete program evaluation example they provide.

Return ONLY valid JSON (no markdown, no backticks, no preamble). The JSON must follow this exact schema:

{
  "example_framing": "A 1-2 sentence description reframing their program in the language of the method.",
  "running_variable": "Only for RD: what is the running variable and cutoff. null for other methods.",
  "steps": [
    {
      "step_number": 1,
      "title": "Short step title",
      "explanation": "The explanation for this step. 2-5 sentences depending on difficulty.",
      "key_concept": "One key concept or term introduced in this step (null if none).",
      "analogy": "For colloquial level: a real-world analogy. null for other levels."
    }
  ],
  "assumptions": [
    {
      "name": "Name of assumption",
      "plain_english": "What it means in plain English in the context of their example.",
      "what_breaks_it": "A concrete scenario showing how this assumption could be violated."
    }
  ],
  "limitations": "1-2 sentences on what this method cannot tell us in their example.",
  "connection_to_other_methods": "1-2 sentences on how another method could address this same question differently."
}

RULES:
- For plain language: use analogies, zero jargon, conversational tone, explain like talking to a smart friend
- For basic: introduce technical terms when needed with brief definitions, suitable for an MPH or undergraduate research methods student
- For advanced: include statistical notation where helpful, discuss estimands (ATE, ATT, LATE), bias, diagnostics, and robustness checks
- Always use their specific program as the running example throughout every step
- RCT should have 6 steps: recruitment, randomization, baseline check, intervention delivery, outcome measurement, effect estimation
- DiD should have 5 steps: two groups before, both change over time, treatment introduced, post-period comparison, difference of differences
- RD should have 6 steps: running variable, cutoff, bandwidth/local comparison, fit on each side, the jump, counterfactual
- PSM should have 7 steps: observational setup, naive comparison, covariate imbalance, propensity score estimation, matching, balance check, adjusted estimate
- Include 2-3 assumptions for each method
- Never use em dashes`;

// ============================================================
// SEEDED RNG + DATA
// ============================================================
function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function genRCTData() {
  const rand = makeRng(314);
  const parts = [];
  for (let i = 0; i < 60; i++) {
    const g = i < 30 ? "control" : "treatment";
    const bl = 55 + rand() * 30;
    const ep = g === "control" ? bl - 2 + (rand() - 0.5) * 16 : bl - 12 + (rand() - 0.5) * 16;
    parts.push({ id: i, group: g, baseline: +(bl).toFixed(1), endpoint: +(Math.max(20, Math.min(90, ep))).toFixed(1) });
  }
  const ctrl = parts.filter(p => p.group === "control"), trt = parts.filter(p => p.group === "treatment");
  const avg = (arr, k) => +(arr.reduce((a, p) => a + p[k], 0) / arr.length).toFixed(1);
  const mBC = avg(ctrl, "baseline"), mBT = avg(trt, "baseline"), mEC = avg(ctrl, "endpoint"), mET = avg(trt, "endpoint");
  const chgC = +(mEC - mBC).toFixed(1), chgT = +(mET - mBT).toFixed(1), ate = +(chgT - chgC).toFixed(1);
  return { parts, mBC, mBT, mEC, mET, chgC, chgT, ate };
}

function genRDData() {
  const rand = makeRng(77);
  const pts = [];
  for (let i = 0; i < 100; i++) {
    const score = 20 + rand() * 60;
    const noise = (rand() - 0.5) * 12;
    const y = score < 50 ? 30 + 0.5 * score + noise : 30 + 0.5 * score + 12 + noise;
    pts.push({ x: +(score).toFixed(1), y: +(Math.max(15, y)).toFixed(1), side: score < 50 ? "below" : "above" });
  }
  const below = pts.filter(p => p.side === "below"), above = pts.filter(p => p.side === "above");
  const fit = (arr) => {
    const n = arr.length, sx = arr.reduce((a, p) => a + p.x, 0), sy = arr.reduce((a, p) => a + p.y, 0);
    const sxx = arr.reduce((a, p) => a + p.x * p.x, 0), sxy = arr.reduce((a, p) => a + p.x * p.y, 0);
    const sl = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    return { slope: sl, intercept: (sy - sl * sx) / n };
  };
  const fB = fit(below), fA = fit(above);
  const lineB = [{ x: 20, y: fB.intercept + fB.slope * 20 }, { x: 50, y: fB.intercept + fB.slope * 50 }];
  const lineA = [{ x: 50, y: fA.intercept + fA.slope * 50 }, { x: 80, y: fA.intercept + fA.slope * 80 }];
  const yB50 = fB.intercept + fB.slope * 50, yA50 = fA.intercept + fA.slope * 50;
  const jump = +(yA50 - yB50).toFixed(1);
  const lineC = [{ x: 50, y: yB50 }, { x: 68, y: fB.intercept + fB.slope * 68 }];
  return { pts, lineB, lineA, lineC, yB50, yA50, jump };
}

function genPSMData() {
  const rand = makeRng(2024);
  const people = [];
  for (let i = 0; i < 100; i++) {
    const ed = 8 + Math.floor(rand() * 10), age = 22 + Math.floor(rand() * 30);
    const logit = -2.5 + 0.25 * ed - 0.04 * age + (rand() - 0.5) * 1.5;
    const ps = 1 / (1 + Math.exp(-logit));
    const enrolled = rand() < ps ? 1 : 0;
    const earnings = Math.round(22000 + 2800 * ed + 300 * age + (rand() - 0.5) * 12000 + (enrolled ? 5500 : 0));
    people.push({ id: i, ed, age, ps: +(ps).toFixed(3), enrolled, earnings, group: enrolled ? "T" : "C" });
  }
  const T = people.filter(p => p.enrolled === 1), C = people.filter(p => p.enrolled === 0);
  const naiveT = Math.round(T.reduce((a, p) => a + p.earnings, 0) / T.length);
  const naiveC = Math.round(C.reduce((a, p) => a + p.earnings, 0) / C.length);
  const matches = []; const pool = [...C];
  for (const t of T) {
    let bi = 0, bd = Infinity;
    for (let j = 0; j < pool.length; j++) { const d = Math.abs(t.ps - pool[j].ps); if (d < bd) { bd = d; bi = j; } }
    if (pool.length > 0) { matches.push({ t, c: pool[bi] }); pool.splice(bi, 1); }
  }
  const mT = matches.map(m => m.t), mC = matches.map(m => m.c);
  const adjT = Math.round(mT.reduce((a, p) => a + p.earnings, 0) / mT.length);
  const adjC = Math.round(mC.reduce((a, p) => a + p.earnings, 0) / mC.length);
  const scatterT = T.map(p => ({ x: p.ps, y: p.earnings / 1000, group: "T" }));
  const scatterC = C.map(p => ({ x: p.ps, y: p.earnings / 1000, group: "C" }));
  const matchLines = matches.slice(0, 15).map((m, i) => ({ id: i, x1: m.t.ps, y1: m.t.earnings / 1000, x2: m.c.ps, y2: m.c.earnings / 1000 }));
  const mEdT = +(T.reduce((a, p) => a + p.ed, 0) / T.length).toFixed(1);
  const mEdC = +(C.reduce((a, p) => a + p.ed, 0) / C.length).toFixed(1);
  const mAgeT = +(T.reduce((a, p) => a + p.age, 0) / T.length).toFixed(1);
  const mAgeC = +(C.reduce((a, p) => a + p.age, 0) / C.length).toFixed(1);
  const mEdTa = +(mT.reduce((a, p) => a + p.ed, 0) / mT.length).toFixed(1);
  const mEdCa = +(mC.reduce((a, p) => a + p.ed, 0) / mC.length).toFixed(1);
  return { scatterT, scatterC, matchLines, naiveT, naiveC, adjT, adjC, mEdT, mEdC, mAgeT, mAgeC, mEdTa, mEdCa };
}

const rctD = genRCTData();
const didD = {
  timeline: [
    { time: "Before", Control: 40, Treatment: 50, Counterfactual: null },
    { time: "After", Control: 50, Treatment: 80, Counterfactual: 60 },
  ],
};
const rdD = genRDData();
const psmD = genPSMData();

// ============================================================
// CHART COMPONENTS
// ============================================================

const chartBox = {
  width: "100%", background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
  borderRadius: 14, border: "1px solid #e2e8f0", padding: "1rem 0.5rem 0.5rem",
  marginBottom: "1.25rem", position: "relative",
};
const ax = { fill: "#64748b", fontSize: 13, fontFamily: "Inter" };
const gs = "#e2e8f0";

function RCTChart({ step }) {
  if (step <= 1) {
    const isRand = step === 1;
    const ctrl = rctD.parts.filter(p => p.group === "control");
    const trt = rctD.parts.filter(p => p.group === "treatment");
    return (
      <div style={chartBox}>
        <div style={{ display: "flex", justifyContent: "center", gap: isRand ? 24 : 0, flexWrap: "wrap", padding: "1.5rem 1rem" }}>
          {isRand ? (
            <>
              <DotGroup dots={ctrl} color="#2563eb" label="Control (n=30)" />
              <div style={{ width: 1, background: "#cbd5e1", alignSelf: "stretch" }} />
              <DotGroup dots={trt} color="#1e3a8a" label="Treatment (n=30)" />
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 7 }}>
              {rctD.parts.map((_, i) => <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: "#64748b", opacity: 0.5 }} />)}
            </div>
          )}
        </div>
        <ChartLegend items={isRand ? [{ color: "#2563eb", label: "Control" }, { color: "#1e3a8a", label: "Treatment" }] : [{ color: "#64748b", label: "Participants" }]} />
      </div>
    );
  }
  if (step === 2) {
    const data = [{ group: "Control", mean: rctD.mBC }, { group: "Treatment", mean: rctD.mBT }];
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={70}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey="group" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
            <YAxis domain={[0, 80]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Baseline Score", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <Bar dataKey="mean" radius={[6, 6, 0, 0]}><Cell fill="#2563eb" /><Cell fill="#1e3a8a" /></Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#2563eb", label: "Control" }, { color: "#1e3a8a", label: "Treatment" }]} />
      </div>
    );
  }
  if (step === 3 || step === 4) {
    const tl = [{ time: "Baseline", Control: rctD.mBC, Treatment: rctD.mBT }, { time: "Follow-up", Control: rctD.mEC, Treatment: rctD.mET }];
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={tl} margin={{ top: 15, right: 30, left: 15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey="time" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
            <YAxis domain={[35, 80]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Score", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <Line type="linear" dataKey="Control" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5, fill: "#2563eb" }} />
            <Line type="linear" dataKey="Treatment" stroke="#1e3a8a" strokeWidth={2.5} dot={{ r: 5, fill: "#1e3a8a" }} />
          </LineChart>
        </ResponsiveContainer>
        {step === 4 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#2563eb" text={`Control: ${rctD.chgC}`} /><Pill color="#1e3a8a" text={`Treatment: ${rctD.chgT}`} /></div>}
        <ChartLegend items={[{ color: "#2563eb", label: "Control" }, { color: "#1e3a8a", label: "Treatment" }]} />
      </div>
    );
  }
  const data = [{ group: "Control", mean: rctD.chgC }, { group: "Treatment", mean: rctD.chgT }];
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={70}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="group" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
          <YAxis domain={[-20, 5]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Change", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <ReferenceLine y={0} stroke="#cbd5e1" /><Bar dataKey="mean" radius={[6, 6, 0, 0]}><Cell fill="#2563eb" /><Cell fill="#1e3a8a" /></Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}><Pill color="#065f46" text={`ATE = ${rctD.ate}`} /></div>
      <ChartLegend items={[{ color: "#2563eb", label: "Control" }, { color: "#1e3a8a", label: "Treatment" }, { color: "#065f46", label: "Treatment Effect" }]} />
    </div>
  );
}

function DiDChart({ step }) {
  const showCf = step >= 3, showFx = step >= 4, showChg = step >= 2;
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={didD.timeline} margin={{ top: 15, right: 30, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="time" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
          <YAxis domain={[25, 90]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Outcome", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <Line type="linear" dataKey="Control" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 5, fill: "#2563eb" }} />
          <Line type="linear" dataKey="Treatment" stroke="#c2410c" strokeWidth={2.5} dot={{ r: 5, fill: "#c2410c" }} />
          {showCf && <ReferenceLine segment={[{ x: "Before", y: 50 }, { x: "After", y: 60 }]} stroke="#c2410c" strokeDasharray="8 4" strokeWidth={2} />}
          {showFx && <ReferenceLine segment={[{ x: "After", y: 60 }, { x: "After", y: 80 }]} stroke="#065f46" strokeWidth={3} />}
        </ComposedChart>
      </ResponsiveContainer>
      {showChg && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#c2410c" text="Treatment: +30" /><Pill color="#2563eb" text="Control: +10" />{showFx && <Pill color="#065f46" text="DiD = 20" />}</div>}
      <ChartLegend items={[{ color: "#c2410c", label: "Treatment" }, { color: "#2563eb", label: "Control" }, ...(showCf ? [{ color: "#c2410c", label: "Counterfactual", dashed: true }] : []), ...(showFx ? [{ color: "#065f46", label: "Effect" }] : [])]} />
    </div>
  );
}

function RDChart({ step }) {
  const showCut = step >= 1, showLines = step >= 3, showJump = step >= 4, showCf = step >= 5, hl = step === 2;
  const DotRD = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
    const color = step >= 1 ? (payload.side === "below" ? "#2563eb" : "#7c3aed") : "#64748b";
    const inB = payload.x >= 43 && payload.x <= 57;
    return <circle cx={cx} cy={cy} r={hl && inB ? 4.5 : 3.5} fill={color} fillOpacity={hl ? (inB ? 0.9 : 0.15) : 0.6} />;
  };
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={270}>
        <ComposedChart margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis type="number" dataKey="x" domain={[15, 85]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Running Variable", position: "insideBottom", offset: -10, ...ax }} />
          <YAxis type="number" dataKey="y" domain={[20, 70]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Outcome", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          {showCut && <ReferenceLine x={50} stroke="#92400e" strokeWidth={2} strokeDasharray="6 4" label={{ value: "Cutoff", position: "top", fill: "#92400e", fontSize: 13, fontWeight: 700 }} />}
          <Scatter data={rdD.pts} shape={<DotRD />} />
          {showLines && <Scatter data={rdD.lineB} line={{ stroke: "#2563eb", strokeWidth: 2.5 }} shape={() => null} />}
          {showLines && <Scatter data={rdD.lineA} line={{ stroke: "#7c3aed", strokeWidth: 2.5 }} shape={() => null} />}
          {showCf && <Scatter data={rdD.lineC} line={{ stroke: "#2563eb", strokeWidth: 2, strokeDasharray: "8 4" }} shape={() => null} />}
          {showJump && <ReferenceLine segment={[{ x: 50, y: rdD.yB50 }, { x: 50, y: rdD.yA50 }]} stroke="#065f46" strokeWidth={3.5} />}
        </ComposedChart>
      </ResponsiveContainer>
      {showJump && <div style={{ display: "flex", justifyContent: "center", marginTop: 2 }}><Pill color="#065f46" text={`LATE ≈ ${rdD.jump}`} /></div>}
      <ChartLegend items={[...(step >= 1 ? [{ color: "#2563eb", label: "Below cutoff" }, { color: "#7c3aed", label: "Above cutoff" }] : [{ color: "#64748b", label: "Individuals" }]), ...(showCut ? [{ color: "#92400e", label: "Cutoff", dashed: true }] : []), ...(showJump ? [{ color: "#065f46", label: "Effect" }] : []), ...(showCf ? [{ color: "#2563eb", label: "Counterfactual", dashed: true }] : [])]} />
    </div>
  );
}

function PSMChart({ step }) {
  const DotPSM = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
    return <circle cx={cx} cy={cy} r={3.5} fill={payload.group === "T" ? "#065f46" : "#2563eb"} fillOpacity={0.6} />;
  };
  if (step <= 0 || step === 3) {
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis type="number" dataKey="x" domain={[0, 1]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Propensity Score", position: "insideBottom", offset: -10, ...ax }} />
            <YAxis type="number" dataKey="y" domain={[20, 75]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Outcome ($k)", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <Scatter data={psmD.scatterC} shape={<DotPSM />} /><Scatter data={psmD.scatterT} shape={<DotPSM />} />
          </ComposedChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#065f46", label: "Treated" }, { color: "#2563eb", label: "Untreated" }]} />
      </div>
    );
  }
  if (step === 1) {
    const data = [{ group: "Untreated", val: psmD.naiveC / 1000 }, { group: "Treated", val: psmD.naiveT / 1000 }];
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={70}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey="group" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
            <YAxis domain={[0, 65]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Earnings ($k)", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <Bar dataKey="val" radius={[6, 6, 0, 0]}><Cell fill="#2563eb" /><Cell fill="#065f46" /></Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}><Pill color="#92400e" text={`Naive diff: $${((psmD.naiveT - psmD.naiveC) / 1000).toFixed(1)}k (confounded)`} /></div>
      </div>
    );
  }
  if (step === 2 || step === 5) {
    const aft = step === 5;
    return (
      <div style={chartBox}>
        <div style={{ padding: "1rem" }}>
          <table style={{ width: "100%", maxWidth: 440, margin: "0 auto", borderCollapse: "collapse", fontFamily: "'Inter', sans-serif" }}>
            <thead><tr>
              <th style={thS}>Covariate</th><th style={{ ...thS, color: "#065f46" }}>Treated</th><th style={{ ...thS, color: "#2563eb" }}>Untreated</th><th style={{ ...thS, color: aft ? "#065f46" : "#dc2626" }}>Gap</th>
            </tr></thead>
            <tbody>
              <tr><td style={tdS}>Education (yrs)</td><td style={{ ...tdS, color: "#065f46", textAlign: "center", fontWeight: 700 }}>{aft ? psmD.mEdTa : psmD.mEdT}</td><td style={{ ...tdS, color: "#2563eb", textAlign: "center", fontWeight: 700 }}>{aft ? psmD.mEdCa : psmD.mEdC}</td><td style={{ ...tdS, color: aft ? "#065f46" : "#dc2626", textAlign: "center", fontWeight: 700 }}>{aft ? (psmD.mEdTa - psmD.mEdCa).toFixed(1) : (psmD.mEdT - psmD.mEdC).toFixed(1)}</td></tr>
              <tr><td style={tdS}>Age (yrs)</td><td style={{ ...tdS, color: "#065f46", textAlign: "center", fontWeight: 700 }}>{psmD.mAgeT}</td><td style={{ ...tdS, color: "#2563eb", textAlign: "center", fontWeight: 700 }}>{psmD.mAgeC}</td><td style={{ ...tdS, color: aft ? "#065f46" : "#dc2626", textAlign: "center", fontWeight: 700 }}>{(psmD.mAgeT - psmD.mAgeC).toFixed(1)}</td></tr>
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><Pill color={aft ? "#065f46" : "#dc2626"} text={aft ? "Matching reduced the imbalance" : "Groups are NOT comparable"} /></div>
        </div>
      </div>
    );
  }
  if (step === 4) {
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis type="number" dataKey="x" domain={[0, 1]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Propensity Score", position: "insideBottom", offset: -10, ...ax }} />
            <YAxis type="number" dataKey="y" domain={[20, 75]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Outcome ($k)", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            {psmD.matchLines.map(m => <ReferenceLine key={m.id} segment={[{ x: m.x1, y: m.y1 }, { x: m.x2, y: m.y2 }]} stroke="#64748b" strokeWidth={0.8} strokeOpacity={0.5} />)}
            <Scatter data={psmD.scatterC} shape={<DotPSM />} /><Scatter data={psmD.scatterT} shape={<DotPSM />} />
          </ComposedChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#065f46", label: "Treated" }, { color: "#2563eb", label: "Matched control" }, { color: "#64748b", label: "Match link", dashed: true }]} />
      </div>
    );
  }
  const data = [{ label: "Naive", value: (psmD.naiveT - psmD.naiveC) / 1000, color: "#dc2626" }, { label: "PSM", value: (psmD.adjT - psmD.adjC) / 1000, color: "#065f46" }];
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={70}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="label" tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} />
          <YAxis domain={[0, 18]} tick={ax} axisLine={{ stroke: "#cbd5e1" }} tickLine={false} label={{ value: "Effect ($k)", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#dc2626" text={`Naive: $${((psmD.naiveT - psmD.naiveC) / 1000).toFixed(1)}k`} /><Pill color="#065f46" text={`PSM: $${((psmD.adjT - psmD.adjC) / 1000).toFixed(1)}k`} /></div>
    </div>
  );
}

const thS = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid #cbd5e1", color: "#000000", fontSize: "0.92rem", fontWeight: 600 };
const tdS = { padding: "8px 10px", borderBottom: "1px solid #e2e8f0", color: "#000000", fontSize: "1rem" };

function MethodChart({ methodId, step }) {
  switch (methodId) {
    case "rct": return <RCTChart step={step} />;
    case "did": return <DiDChart step={step} />;
    case "rd": return <RDChart step={step} />;
    case "psm": return <PSMChart step={step} />;
    default: return null;
  }
}

// ============================================================
// API
// ============================================================
async function generateExplanation(method, level, program) {
  const userMessage = `Method: ${method.full} (${method.id.toUpperCase()})\nDifficulty: ${level.id} (${level.desc})\nProgram to evaluate: ${program}\n\nGenerate a structured, step-by-step explanation of how to apply ${method.full} to evaluate "${program}". Tailor the language and depth to the ${level.id} difficulty level.`;
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: SYSTEM_PROMPT, userMessage }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return JSON.parse(data.text.replace(/```json|```/g, "").trim());
  } catch (err) { console.error("API error:", err); return null; }
}

// ============================================================
// SHARED UI
// ============================================================

function DotGroup({ dots, color, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 5, marginBottom: 8 }}>
        {dots.map(d => <div key={d.id} style={{ width: 20, height: 20, borderRadius: "50%", background: color, opacity: 0.7 }} />)}
      </div>
      <span style={{ fontSize: "0.9rem", color, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Pill({ color, text }) {
  return <div style={{ background: color + "18", border: `1px solid ${color}55`, color, padding: "5px 13px", borderRadius: 8, fontSize: "0.88rem", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{text}</div>;
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 6, paddingBottom: 4 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 16, height: 0, borderTop: `2.5px ${it.dashed ? "dashed" : "solid"} ${it.color}` }} />
          <span style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function MethodCard({ method, selected, onClick }) {
  const isA = selected?.id === method.id;
  return (
    <button onClick={() => onClick(method)} style={{
      flex: "1 1 140px", maxWidth: 200, padding: "1.25rem 1rem",
      background: isA ? `linear-gradient(135deg, ${method.color}18, ${method.color}08)` : "rgba(255,255,255,0.02)",
      border: isA ? `2px solid ${method.color}` : "1.5px solid #000000",
      borderRadius: 14, cursor: "pointer", transition: "all 0.25s ease", textAlign: "center",
      transform: isA ? "translateY(-2px)" : "none", boxShadow: isA ? `0 8px 24px ${method.color}15` : "none",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: 6 }}>{method.icon}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: isA ? method.color : "#000000", fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em", marginBottom: 4 }}>{method.label}</div>
      <div style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>{method.full}</div>
    </button>
  );
}

function LevelSelector({ level, setLevel, accentColor }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {LEVELS.map(l => (
        <button key={l.id} onClick={() => setLevel(l)} style={{
          flex: "1 1 120px", padding: "0.7rem 0.8rem",
          background: level.id === l.id ? `${accentColor}15` : "rgba(255,255,255,0.02)",
          border: level.id === l.id ? `1.5px solid ${accentColor}` : "1px solid #e2e8f0",
          borderRadius: 10, cursor: "pointer", transition: "all 0.2s", textAlign: "center",
        }}>
          <div style={{ fontSize: "1.25rem", marginBottom: 2 }}>{l.emoji}</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: level.id === l.id ? accentColor : "#000000", fontFamily: "'Inter', sans-serif" }}>{l.label}</div>
          <div style={{ fontSize: "0.8rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginTop: 2, lineHeight: 1.3 }}>{l.desc}</div>
        </button>
      ))}
    </div>
  );
}

function StepCard({ step, color, isActive, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", padding: "1rem 1.25rem",
      background: isActive ? `${color}10` : "transparent",
      border: isActive ? `1px solid ${color}40` : "1px solid #e2e8f0",
      borderRadius: 12, cursor: "pointer", transition: "all 0.25s", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isActive ? color : "#e2e8f0",
          color: isActive ? "#0a0f1a" : "#c0c8d4",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Inter', sans-serif", flexShrink: 0,
        }}>{step.step_number}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: isActive ? "#000000" : "#000000", fontFamily: "'Inter', sans-serif", marginBottom: isActive ? 8 : 0 }}>{step.title}</div>
          {isActive && (
            <div>
              <p style={{ fontSize: "1.05rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.75, margin: "0 0 10px" }}>{step.explanation}</p>
              {step.key_concept && <div style={{ display: "inline-block", padding: "5px 12px", background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, fontSize: "0.88rem", color, fontFamily: "'Inter', sans-serif", fontWeight: 600, marginBottom: step.analogy ? 8 : 0 }}>Key concept: {step.key_concept}</div>}
              {step.analogy && <div style={{ marginTop: 8, padding: "10px 14px", background: "#f1f5f920", borderLeft: `3px solid ${color}50`, borderRadius: "0 8px 8px 0", fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, fontStyle: "italic" }}>💡 {step.analogy}</div>}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function AssumptionCard({ assumption, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: "0.9rem 1.1rem", background: "rgba(255,255,255,0.02)", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 8, cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.02rem", fontWeight: 600, color, fontFamily: "'Inter', sans-serif" }}>{assumption.name}</div>
        <span style={{ color: "#000000", fontSize: "0.9rem", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>▶</span>
      </div>
      {open && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: "1rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.65, margin: "0 0 8px" }}>{assumption.plain_english}</p>
          <div style={{ padding: "10px 14px", background: "#dc262615", border: "1px solid #dc262630", borderRadius: 8, fontSize: "0.92rem", color: "#fecaca", fontFamily: "'Inter', sans-serif", lineHeight: 1.55 }}>⚠️ Violation: {assumption.what_breaks_it}</div>
        </div>
      )}
    </div>
  );
}

function LoadingAnimation({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: color, animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div>
      <p style={{ color: "#000000", fontSize: "1rem", fontFamily: "'Inter', sans-serif" }}>Building your personalized explanation...</p>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.5); opacity: 1; } }`}</style>
    </div>
  );
}

function SectionLabel({ number, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: "0.88rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontWeight: 700, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px" }}>{number}</span>
      <span style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}

function navBtnStyle(disabled, color, primary = false) {
  return { padding: "0.55rem 1.4rem", borderRadius: 8, border: `1px solid ${disabled ? "#e2e8f0" : primary ? color : "#cbd5e1"}`, background: disabled ? "#f1f5f9" : primary ? color : "#e2e8f0", color: disabled ? "#94a3b8" : primary ? "#0a0f1a" : "#000000", cursor: disabled ? "default" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: primary ? 700 : 500, transition: "all 0.2s" };
}

// ============================================================
// MAIN APP
// ============================================================

export default function CausalInferenceLab() {
  const [method, setMethod] = useState(null);
  const [level, setLevel] = useState(LEVELS[1]);
  const [program, setProgram] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);
  const accentColor = method?.color || "#64748b";

  useEffect(() => { if (method && !program) setProgram(EXAMPLE_PROGRAMS[method.id]); }, [method]);
  useEffect(() => { setResult(null); setActiveStep(0); setError(null); }, [method, level]);

  const handleGenerate = async () => {
    if (!method || !program.trim()) return;
    setLoading(true); setError(null); setResult(null); setActiveStep(0);
    const res = await generateExplanation(method, level, program.trim());
    if (res) { setResult(res); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }
    else setError("Something went wrong generating the explanation. Please try again.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", color: "#000000", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, #00000006 1px, transparent 0)`, backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
          <a href="/class7" style={{ fontSize: "1.1rem", color: "#000000", fontFamily: "'Inter', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 10, transition: "all 0.2s", fontWeight: 600 }}>Class 7: Bias in Impact Evaluation →</a>
        </div>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Interactive Learning Platform (Work in Progress)</div>
          <div style={{ display: "inline-block", padding: "4px 14px", background: "#f1f5f9", borderRadius: 6, fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", color: "#000000", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Class 6</div>
          <h1 style={{ fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)", fontWeight: 700, color: "#000000", lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.01em" }}>Causal Inference Methods</h1>
          <p style={{ fontSize: "1.1rem", color: "#000000", fontFamily: "'Inter', sans-serif", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>Choose a method, set your difficulty level, and describe a program you want to evaluate. The AI builds a personalized, step-by-step explanation using your example.</p>
        </header>

        {/* Step 1 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel number="1" text="Choose a method" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>{METHODS.map(m => <MethodCard key={m.id} method={m} selected={method} onClick={setMethod} />)}</div>
          {method && (
            <div style={{ textAlign: "center", marginTop: 16, padding: "14px 20px", background: `${method.color}08`, borderRadius: 10, border: `1px solid ${method.color}20` }}>
              <span style={{ fontSize: "1rem", color: method.color, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontStyle: "italic" }}>{method.tagline}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
                <span style={{ fontSize: "0.85rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontWeight: 700, marginRight: 4, lineHeight: "28px" }}>Key concepts:</span>
                {method.keyConcepts.map((c, i) => <span key={i} style={{ display: "inline-block", padding: "4px 12px", background: `${method.color}12`, border: `1px solid ${method.color}30`, borderRadius: 20, fontSize: "0.85rem", color: method.color, fontFamily: "'Inter', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>{c}</span>)}
              </div>
            </div>
          )}
        </section>

        {/* Step 2 */}
        {method && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="2" text="Set the difficulty level" />
            <LevelSelector level={level} setLevel={setLevel} accentColor={accentColor} />
            {method.definitions && level && (
              <div style={{ marginTop: 16, padding: "1.1rem 1.4rem", background: "#f1f5f9", borderRadius: 12, border: `1px solid ${accentColor}25`, borderLeft: `3px solid ${accentColor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.85rem", color: accentColor, fontFamily: "'Inter', sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>What is {method.full}?</span>
                  <span style={{ fontSize: "0.78rem", color: "#000000", fontFamily: "'Inter', sans-serif", background: "#f1f5f9", padding: "3px 10px", borderRadius: 4 }}>{level.label} level</span>
                </div>
                <p style={{ fontSize: "1.05rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.75, margin: 0 }}>
                  {level.id === "advanced" ? <NotationText text={method.definitions[level.id]} color={accentColor} /> : method.definitions[level.id]}
                </p>
                {level.id === "advanced" && <div style={{ marginTop: 10, fontSize: "0.78rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontStyle: "italic" }}>Hover or tap dotted terms for plain-language explanations.</div>}
              </div>
            )}
          </section>
        )}

        {/* Step 3 */}
        {method && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="3" text="Describe your program" />
            <p style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginBottom: 12, lineHeight: 1.5 }}>Enter a program, policy, or intervention you want to evaluate. A default example is provided, but feel free to replace it with your own.</p>
            <div style={{ position: "relative", background: "#f1f5f9", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <textarea value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g., a community health worker home visiting program on childhood vaccination rates" rows={3} style={{ width: "100%", padding: "1rem 1.25rem", background: "transparent", border: "none", color: "#000000", fontSize: "1.05rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1.25rem 0.75rem", borderTop: "1px solid #e2e8f010" }}>
                <span style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>{method.full} · {level.label}</span>
                <button onClick={handleGenerate} disabled={loading || !program.trim()} style={{ padding: "0.6rem 1.6rem", background: loading || !program.trim() ? "#e2e8f0" : accentColor, color: loading || !program.trim() ? "#94a3b8" : "#ffffff", border: "none", borderRadius: 8, cursor: loading || !program.trim() ? "default" : "pointer", fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Inter', sans-serif", transition: "all 0.2s", letterSpacing: "0.02em" }}>{loading ? "Generating..." : "Generate Explanation →"}</button>
              </div>
            </div>
          </section>
        )}

        {loading && <LoadingAnimation color={accentColor} />}
        {error && <div style={{ padding: "1rem 1.25rem", background: "#dc262615", border: "1px solid #dc262630", borderRadius: 12, color: "#000000", fontSize: "1rem", fontFamily: "'Inter', sans-serif", textAlign: "center", marginBottom: "2rem" }}>{error}</div>}

        {/* RESULTS */}
        {result && !loading && (
          <div ref={resultRef} style={{ animation: "fadeIn 0.5s ease" }}>
            <section style={{ padding: "1.25rem 1.5rem", background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: 14, marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.82rem", color: accentColor, fontFamily: "'Inter', sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Your evaluation scenario</div>
              <p style={{ fontSize: "1.1rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.65, margin: 0 }}>{result.example_framing}</p>
              {result.running_variable && <p style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginTop: 8, marginBottom: 0, lineHeight: 1.5 }}>📏 {result.running_variable}</p>}
            </section>

            <section style={{ marginBottom: "2.5rem" }}>
              <SectionLabel number="✦" text="Step-by-step walkthrough" />
              {/* ★ SYNCED CHART */}
              <MethodChart methodId={method.id} step={activeStep} />
              {result.steps.map((s, i) => <StepCard key={i} step={s} color={accentColor} isActive={activeStep === i} onClick={() => setActiveStep(i)} />)}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button onClick={() => setActiveStep(s => Math.max(0, s - 1))} disabled={activeStep === 0} style={navBtnStyle(activeStep === 0, accentColor)}>← Previous</button>
                <button onClick={() => setActiveStep(s => Math.min(result.steps.length - 1, s + 1))} disabled={activeStep === result.steps.length - 1} style={navBtnStyle(activeStep === result.steps.length - 1, accentColor, true)}>Next →</button>
              </div>
            </section>

            {result.assumptions?.length > 0 && (
              <section style={{ marginBottom: "2.5rem" }}>
                <SectionLabel number="⚡" text="Key assumptions" />
                <p style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginBottom: 12 }}>Click each assumption to expand.</p>
                {result.assumptions.map((a, i) => <AssumptionCard key={i} assumption={a} color={accentColor} />)}
              </section>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: "2.5rem" }}>
              {result.limitations && (
                <div style={{ padding: "1rem 1.25rem", background: "#dc262608", border: "1px solid #dc262620", borderRadius: 12 }}>
                  <div style={{ fontSize: "0.85rem", color: "#dc2626", fontFamily: "'Inter', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Limitations</div>
                  <p style={{ fontSize: "1rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, margin: 0 }}>{result.limitations}</p>
                </div>
              )}
              {result.connection_to_other_methods && (
                <div style={{ padding: "1rem 1.25rem", background: "#065f4608", border: "1px solid #065f4620", borderRadius: 12 }}>
                  <div style={{ fontSize: "0.85rem", color: "#065f46", fontFamily: "'Inter', sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Connection to other methods</div>
                  <p style={{ fontSize: "1rem", color: "#d1fae5", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, margin: 0 }}>{result.connection_to_other_methods}</p>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setResult(null); setProgram(""); setActiveStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "0.65rem 2.2rem", background: "transparent", border: "1px solid #cbd5e1", borderRadius: 8, color: "#000000", fontSize: "1rem", fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>↻ Try a different example</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #94a3b8; }

      `}</style>
    </div>
  );
}
