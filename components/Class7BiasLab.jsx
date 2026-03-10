"use client";

import { useState, useRef, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ComposedChart, Scatter, Cell, Area, AreaChart } from "recharts";

// ============================================================
// CONSTANTS & CONFIG
// ============================================================
const BIAS_TYPES = [
  {
    id: "selection",
    label: "Selection",
    full: "Selection Bias",
    color: "#f87171",
    icon: "🎯",
    tagline: "When groups differ before the program even starts.",
    keyConcepts: ["Pre-existing differences", "Confounding", "Self-selection", "Systematic differences", "Comparability"],
    definitions: {
      colloquial: "Selection bias happens when the people who end up in your program are already different from the people who don't, in ways that matter. Imagine a job training program where only the most motivated people sign up. If they get better jobs afterward, was it the training or was it that go-getters were always going to do well? You are comparing apples to oranges and calling it a fair test.",
      basic: "Selection bias occurs when treatment and comparison groups differ systematically on pre-existing characteristics that also influence the outcome. In program evaluation, this often arises from self-selection (participants choose to enroll) or administrative selection (eligibility criteria correlate with outcomes). Because group differences exist before the intervention, any observed post-program difference confounds the treatment effect with baseline inequalities. Addressing selection bias requires methods such as randomization, matching, or statistical adjustment.",
      advanced: "Selection bias arises when E[Y(0)|D=1] ≠ E[Y(0)|D=0], meaning the expected untreated potential outcome differs across treatment groups. The naive estimator E[Y|D=1] - E[Y|D=0] = ATT + {E[Y(0)|D=1] - E[Y(0)|D=0]}, where the second term is the selection bias. Randomization eliminates this by ensuring (Y(1),Y(0)) ⊥ D. In observational studies, identification strategies include conditional independence (CIA/unconfoundedness), instrumental variables (IV), or regression discontinuity. The direction and magnitude of selection bias depend on the correlation between the selection mechanism and potential outcomes.",
    },
  },
  {
    id: "attrition",
    label: "Attrition",
    full: "Attrition Bias",
    color: "#fbbf24",
    icon: "🚪",
    tagline: "When people drop out, and it's not random who leaves.",
    keyConcepts: ["Differential dropout", "Loss to follow-up", "Missing data", "Intention-to-treat", "Survivor bias"],
    definitions: {
      colloquial: "Attrition bias is what happens when people leave your study and the ones who leave are different from the ones who stay. Say you are testing a tough exercise program. The people who quit are probably the ones struggling most. So at the end, your 'results' only reflect the people who could handle it. It looks like the program worked great, but you lost everyone it was failing.",
      basic: "Attrition bias occurs when participants drop out of a study at different rates or for different reasons across treatment and comparison groups. If dropout is related to the outcome (e.g., sicker patients leave a health study), the remaining sample no longer represents the original population. This threatens internal validity because the groups are no longer comparable. Researchers address attrition through intention-to-treat (ITT) analysis, sensitivity analyses, and imputation methods for missing data.",
      advanced: "Attrition bias arises when missingness is non-ignorable: P(R=1|Y,D) ≠ P(R=1|D), where R indicates whether the outcome is observed. If attrition is differential (attrition rates or mechanisms differ by treatment status), the observed treatment effect is biased. Under MCAR (Missing Completely at Random), attrition reduces power but not bias. Under MAR (Missing at Random), inverse probability weighting (IPW) or multiple imputation can recover unbiased estimates. Under MNAR (Missing Not at Random), identification requires sensitivity analyses or instrumental approaches. ITT analysis preserves randomization but estimates a diluted effect; per-protocol analysis risks reintroducing selection bias.",
    },
  },
  {
    id: "secular",
    label: "Secular Trends",
    full: "Secular Trends",
    color: "#34d399",
    icon: "📈",
    tagline: "The world changes too, not just your program.",
    keyConcepts: ["Time trends", "Historical changes", "Confounding with time", "Pre-post fallacy", "Comparison groups"],
    definitions: {
      colloquial: "Secular trends are changes that happen over time to everyone, whether they are in your program or not. If smoking rates are already dropping nationwide and you launch a local anti-smoking campaign, it might look like your campaign is working brilliantly. But the decline was happening anyway. Without a comparison group, you cannot tell how much of the change was your program versus the world just moving in that direction on its own.",
      basic: "Secular trends are long-term patterns or systematic changes in an outcome that occur independently of the intervention. They affect entire populations over time and can either inflate or mask true program effects. For example, declining crime rates nationwide could make a local policing program appear more effective than it is. A simple pre-post comparison cannot distinguish the program effect from the secular trend. Using a comparison group experiencing the same trend (as in difference-in-differences) helps isolate the actual intervention effect.",
      advanced: "Secular trends confound the treatment effect when outcomes evolve over time independent of D. In a pre-post design without controls, the estimated effect conflates the ATT with the time trend: E[Y_post - Y_pre|D=1] = ATT + E[Y(0)_post - Y(0)_pre|D=1]. The second term is the counterfactual time trend for the treated. DiD addresses this by assuming parallel trends: E[Y(0)_post - Y(0)_pre|D=1] = E[Y(0)_post - Y(0)_pre|D=0]. Interrupted time series (ITS) models the pre-intervention trend explicitly with segmented regression: Y_t = β₀ + β₁t + β₂D_t + β₃(t - T*)D_t + ε_t, where β₂ captures the level change and β₃ the slope change at intervention time T*.",
    },
  },
  {
    id: "maturation",
    label: "Maturation",
    full: "Maturation",
    color: "#60a5fa",
    icon: "🌱",
    tagline: "People change naturally over time, program or not.",
    keyConcepts: ["Developmental change", "Natural progression", "Aging effects", "Learning effects", "Time-dependent change"],
    definitions: {
      colloquial: "Maturation is the natural change that happens in people just because time passes. Kids get better at reading as they grow up. Adults recover from colds on their own. If you run a reading program for 7-year-olds and they read better six months later, some of that improvement was just them growing up. The tricky part is figuring out how much was your program and how much was just nature taking its course.",
      basic: "Maturation refers to natural, developmental changes within individuals over time that affect outcomes independently of any intervention. These changes can include physical growth, cognitive development, emotional regulation, or recovery from illness. In program evaluation, maturation threatens internal validity because observed improvements may reflect natural progression rather than program effects. This is especially relevant in educational and developmental interventions. A comparison group of similar individuals who do not receive the program helps control for maturation effects.",
      advanced: "Maturation represents systematic within-person change over time: E[Y(0)_t₂ - Y(0)_t₁] ≠ 0 even absent treatment. In developmental contexts, the maturation function m(t) may be nonlinear (e.g., logarithmic growth curves in early childhood). The pre-post estimator conflates treatment with maturation: Δ_observed = τ + m(t₂) - m(t₁). Latent growth curve models (LGCMs) can separate treatment effects from individual growth trajectories by modeling Y_it = η₀ᵢ + η₁ᵢt + τD_it + ε_it, where η₀ᵢ and η₁ᵢ are random intercepts and slopes. Comparison group designs remain the primary defense, controlling for maturation under the assumption that treated and comparison units share similar developmental trajectories.",
    },
  },
  {
    id: "rtm",
    label: "RTM",
    full: "Regression to the Mean",
    color: "#e879f9",
    icon: "📉",
    tagline: "Extreme scores naturally bounce back toward average.",
    keyConcepts: ["Statistical artifact", "Extreme scores", "Natural fluctuation", "Measurement error", "Repeated measurement"],
    definitions: {
      colloquial: "Regression to the mean is a statistical trick that fools a lot of people. If you pick the worst-performing students for a tutoring program, many of them will score better next time even without help, just because they had a bad day the first time. Their low score was partly bad luck, and luck tends to even out. So the 'improvement' you see might just be scores bouncing back to where they normally are, not your program working.",
      basic: "Regression to the mean (RTM) is a statistical phenomenon where extreme scores on one measurement tend to be closer to the average on a subsequent measurement. This occurs because any single score contains both a true component and random error. When participants are selected based on extreme scores (e.g., highest blood pressure, lowest test scores), their next measurement will likely be less extreme, purely due to chance. RTM creates the illusion of a treatment effect in pre-post designs where participants are selected for extreme baseline values. Using a comparison group selected with the same criteria is the primary remedy.",
      advanced: "RTM arises from measurement error: Y = τ + ε, where τ is the true score and ε is random error with E[ε]=0. When selecting on Y > c (a high threshold), E[τ|Y>c] < E[Y|Y>c] because E[ε|Y>c] > 0 (conditional on extreme observed scores, the error component is expected to be positive). On remeasurement, E[Y₂|Y₁>c] = E[τ|Y₁>c] + E[ε₂] = E[τ|Y₁>c] < E[Y₁|Y₁>c]. The magnitude of RTM depends on the reliability coefficient ρ = σ²_τ/(σ²_τ + σ²_ε). Lower reliability produces greater RTM. The expected regression effect is (1-ρ)(Y₁ - μ), where μ is the population mean. A comparison group selected with the same cutoff experiences the same RTM, so the between-group difference eliminates RTM as a confounder.",
    },
  },
];

// ============================================================
// NOTATION TOOLTIPS (Class 7 specific)
// ============================================================
const NOTATION_GLOSSARY = [
  // Selection bias
  { pattern: "E[Y(0)|D=1] ≠ E[Y(0)|D=0]", tip: "The average untreated outcome differs between the treatment and control groups. In plain terms: even without the program, the two groups would have had different outcomes because they were different to begin with." },
  { pattern: "E[Y|D=1] - E[Y|D=0] = ATT + {E[Y(0)|D=1] - E[Y(0)|D=0]}", tip: "The naive comparison (treated minus untreated outcomes) equals the true treatment effect PLUS the selection bias. You cannot separate the two without a proper design." },
  { pattern: "(Y(1),Y(0)) ⊥ D", tip: "Treatment assignment is independent of potential outcomes. This is what randomization achieves: who gets treated has nothing to do with how they would respond." },
  { pattern: "CIA", tip: "Conditional Independence Assumption (also called unconfoundedness): once you control for observed covariates X, treatment assignment is as good as random." },
  { pattern: "IV", tip: "Instrumental Variables: a technique that uses an external variable (instrument) correlated with treatment but not directly with the outcome to identify causal effects despite selection bias." },
  // Attrition
  { pattern: "P(R=1|Y,D) ≠ P(R=1|D)", tip: "The probability of being observed (R=1) depends on the outcome Y, not just on treatment status D. In other words, whether someone drops out is related to how they were doing, which biases results." },
  { pattern: "MCAR", tip: "Missing Completely at Random: dropout has nothing to do with the outcome or any observed characteristics. The safest assumption, but often unrealistic." },
  { pattern: "MAR", tip: "Missing at Random: dropout can depend on observed characteristics but not on the unobserved outcome itself. Allows correction through weighting or imputation." },
  { pattern: "MNAR", tip: "Missing Not at Random: dropout depends on the unobserved outcome. The hardest case. For example, the sickest patients drop out because they are too ill, but you do not observe their worsening outcome." },
  { pattern: "ITT", tip: "Intention-to-Treat analysis: analyzes everyone as originally assigned, regardless of whether they completed the program. Preserves the benefits of randomization but estimates a diluted effect." },
  { pattern: "IPW", tip: "Inverse Probability Weighting: reweights remaining observations to represent the full original sample, correcting for differential dropout." },
  // Secular trends
  { pattern: "E[Y_post - Y_pre|D=1] = ATT + E[Y(0)_post - Y(0)_pre|D=1]", tip: "A pre-post comparison for the treated group captures both the true treatment effect AND how the outcome would have changed over time without the program." },
  { pattern: "Y_t = β₀ + β₁t + β₂D_t + β₃(t - T*)D_t + ε_t", tip: "The interrupted time series (ITS) regression model. β₀ is the baseline level, β₁ is the pre-intervention trend, β₂ is the immediate level change at the intervention, and β₃ is the change in slope after the intervention." },
  { pattern: "β₂", tip: "In the ITS model, this is the immediate level change (jump or drop) in the outcome at the point when the intervention was introduced." },
  { pattern: "β₃", tip: "In the ITS model, this is the change in the slope (trend) of the outcome after the intervention compared to before." },
  { pattern: "T*", tip: "The time point at which the intervention was introduced in an interrupted time series design." },
  // Maturation
  { pattern: "E[Y(0)_t₂ - Y(0)_t₁] ≠ 0", tip: "Even without treatment, the expected outcome changes over time. People naturally improve (or decline) just from growing, learning, or aging." },
  { pattern: "Y_it = η₀ᵢ + η₁ᵢt + τD_it + ε_it", tip: "A latent growth curve model: each person i has their own starting point (η₀) and growth rate (η₁). The treatment effect τ is estimated after accounting for these individual trajectories." },
  { pattern: "η₀ᵢ", tip: "The random intercept: each individual's starting point. Different people begin at different levels." },
  { pattern: "η₁ᵢ", tip: "The random slope: each individual's natural rate of change over time. Some people grow faster than others." },
  { pattern: "LGCM", tip: "Latent Growth Curve Model: a statistical model that estimates individual trajectories of change, separating natural growth from treatment effects." },
  // RTM
  { pattern: "Y = τ + ε", tip: "Any observed score (Y) is made up of the true score (τ) plus random error (ε). The error is why scores fluctuate from one measurement to the next." },
  { pattern: "E[ε|Y>c] > 0", tip: "When you select people with extreme high scores, their random error component tends to be positive (lucky). On remeasurement, that luck evaporates and scores drop." },
  { pattern: "ρ = σ²_τ/(σ²_τ + σ²_ε)", tip: "The reliability coefficient: the proportion of observed score variance that is true variance. Lower reliability means more measurement error and stronger regression to the mean." },
  { pattern: "(1-ρ)(Y₁ - μ)", tip: "The expected regression to the mean effect. The further the initial score is from the mean (Y₁ - μ), and the lower the reliability (1-ρ), the bigger the bounce-back." },
  { pattern: "ATT", tip: "Average Treatment Effect on the Treated: the average causal impact of the program on those who actually received it." },
  { pattern: "ATE", tip: "Average Treatment Effect: the average causal impact of treatment across the entire population." },
  { pattern: "DiD", tip: "Difference-in-Differences: a quasi-experimental method that compares changes over time between a treatment and comparison group." },
  { pattern: "ITS", tip: "Interrupted Time Series: a design that uses multiple pre- and post-intervention time points to detect changes in level and trend attributable to the program." },
  { pattern: "SEM", tip: "Structural Equation Modeling: a statistical framework for testing complex relationships among variables, including direct and indirect effects." },
];

function NotationText({ text, color }) {
  const sorted = [...NOTATION_GLOSSARY].sort((a, b) => b.pattern.length - a.pattern.length);
  const matches = [];
  for (const entry of sorted) {
    let searchFrom = 0;
    while (true) {
      const idx = text.indexOf(entry.pattern, searchFrom);
      if (idx === -1) break;
      const end = idx + entry.pattern.length;
      let overlaps = false;
      for (const m of matches) {
        if (idx < m.end && end > m.start) { overlaps = true; break; }
      }
      if (!overlaps) matches.push({ start: idx, end, pattern: entry.pattern, tip: entry.tip });
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
    <span ref={ref} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)} onClick={() => setShow(s => !s)}
      style={{ position: "relative", borderBottom: `2px dotted ${color || "#94a3b8"}`, cursor: "help", paddingBottom: 1 }}>
      {notation}
      {show && (
        <span style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          ...(pos === "above" ? { bottom: "calc(100% + 10px)" } : { top: "calc(100% + 10px)" }),
          width: 320, maxWidth: "90vw", padding: "12px 14px",
          background: "#1e293b", border: `1px solid ${color || "#94a3b8"}50`,
          borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          fontSize: "0.9rem", color: "#ffffff",
          fontFamily: "'Helvetica Neue', sans-serif", fontStyle: "normal",
          lineHeight: 1.55, fontWeight: 400, zIndex: 100, pointerEvents: "none", textAlign: "left",
        }}>
          <span style={{ display: "block", fontSize: "0.72rem", color: color || "#94a3b8", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>In plain terms</span>
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
  selection: "a voluntary job training program on employment outcomes",
  attrition: "an intensive weight loss program on BMI reduction over 12 months",
  secular: "a local anti-smoking campaign on smoking cessation rates",
  maturation: "an early childhood reading program on literacy scores",
  rtm: "a remedial math program targeting the lowest-scoring students",
};

const SYSTEM_PROMPT = `You are a program evaluation educator specializing in threats to internal validity. The student wants to understand a specific type of bias through a concrete program evaluation example they provide.

Return ONLY valid JSON (no markdown, no backticks, no preamble). The JSON must follow this exact schema:

{
  "example_framing": "A 1-2 sentence description showing how this bias could manifest in their specific program.",
  "scenario": "A concrete, vivid 2-3 sentence scenario illustrating the bias in action with their program.",
  "steps": [
    {
      "step_number": 1,
      "title": "Short step title",
      "explanation": "The explanation for this step. 2-4 sentences depending on difficulty.",
      "key_concept": "One key concept or term introduced in this step (null if none).",
      "analogy": "For colloquial level: a real-world analogy. null for other levels."
    }
  ],
  "how_to_detect": [
    {
      "method": "Name of detection method",
      "description": "How to check for this bias in their program context. 1-2 sentences."
    }
  ],
  "how_to_fix": [
    {
      "method": "Name of remedy",
      "description": "How to address this bias in their program context. 1-2 sentences."
    }
  ],
  "real_world_consequence": "1-2 sentences on what could go wrong if this bias goes undetected in their example."
}

RULES:
- For plain language: use analogies, zero jargon, conversational tone, explain like talking to a smart friend
- For basic: introduce technical terms when needed with brief definitions, suitable for an MPH or undergraduate research methods student
- For advanced: include statistical notation where helpful, discuss estimands, bias formulas, diagnostics, and solutions
- Always use their specific program as the running example throughout every step
- Selection Bias should have 4 steps: how groups form, why they differ, how this distorts results, what the true comparison should be
- Attrition Bias should have 4 steps: who drops out and why, how dropout relates to outcomes, what remains is not representative, corrective approaches
- Secular Trends should have 4 steps: the background trend, the intervention period, why pre-post confounds trend with effect, how comparison groups or ITS help
- Maturation should have 4 steps: natural change over time, how it overlaps with intervention timing, distinguishing program from development, design solutions
- Regression to the Mean should have 4 steps: why extreme scores were selected, the role of measurement error, why scores bounce back, how to avoid the trap
- Include 2-3 detection methods and 2-3 remedies for each bias
- Never use em dashes`;

// ============================================================
// SEEDED RNG + DATA
// ============================================================
function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Selection Bias: two groups with different baseline distributions
function genSelectionData() {
  const rand = makeRng(42);
  const treatment = [], control = [];
  for (let i = 0; i < 40; i++) {
    // Treatment group: higher motivation (self-selected)
    treatment.push({ x: +(50 + rand() * 35 + 10).toFixed(1), group: "T" });
    // Control group: lower baseline
    control.push({ x: +(30 + rand() * 35).toFixed(1), group: "C" });
  }
  const bins = Array.from({ length: 10 }, (_, i) => {
    const lo = 20 + i * 8, hi = lo + 8;
    return {
      range: `${lo}-${hi}`,
      mid: lo + 4,
      Treatment: treatment.filter(p => p.x >= lo && p.x < hi).length,
      Control: control.filter(p => p.x >= lo && p.x < hi).length,
    };
  });
  const avgT = +(treatment.reduce((a, p) => a + p.x, 0) / treatment.length).toFixed(1);
  const avgC = +(control.reduce((a, p) => a + p.x, 0) / control.length).toFixed(1);
  return { bins, avgT, avgC, gap: +(avgT - avgC).toFixed(1) };
}

// Attrition: sample shrinks differentially
function genAttritionData() {
  const rand = makeRng(99);
  const waves = ["Baseline", "Month 3", "Month 6", "Month 9", "Month 12"];
  const tStart = 50, cStart = 50;
  const tRetain = [50, 44, 38, 33, 28]; // treatment loses more
  const cRetain = [50, 48, 46, 44, 42]; // control stable
  // Outcome means: treatment dropouts were lower scorers
  const tMeans = [65.0, 67.2, 70.1, 73.5, 78.0]; // survivor bias inflates
  const cMeans = [64.5, 65.0, 65.5, 66.0, 66.5];
  const tTrue =  [65.0, 66.0, 67.0, 68.0, 69.0]; // what ITT would show
  const timeline = waves.map((w, i) => ({
    wave: w,
    Treatment: tMeans[i],
    Control: cMeans[i],
    "Treatment (ITT)": tTrue[i],
    tN: tRetain[i],
    cN: cRetain[i],
  }));
  return { timeline, tRetain, cRetain, waves };
}

// Secular Trends: outcome declining over time for everyone
function genSecularData() {
  const rand = makeRng(555);
  const months = [];
  for (let m = 1; m <= 24; m++) {
    const trend = 50 - 0.8 * m; // declining secular trend
    const noise = (rand() - 0.5) * 6;
    const intervention = m > 12 ? -5 : 0; // program starts month 13
    months.push({
      month: m,
      Observed: +(trend + intervention + noise).toFixed(1),
      "Secular Trend": +(trend + noise * 0.3).toFixed(1),
      "True Effect": m > 12 ? -5 : null,
      period: m <= 12 ? "pre" : "post",
    });
  }
  return { months, interventionMonth: 12 };
}

// Maturation: children improving naturally
function genMaturationData() {
  const rand = makeRng(123);
  const ages = [];
  for (let a = 5; a <= 10; a += 0.5) {
    const natural = 20 + 12 * Math.log(a - 3.5); // logarithmic growth
    const noise = (rand() - 0.5) * 5;
    const programEffect = a >= 7 ? 6 : 0;
    ages.push({
      age: a,
      "With Program": +(natural + programEffect + noise).toFixed(1),
      "Natural Growth": +(natural + noise * 0.3).toFixed(1),
      "Program Effect": a >= 7 ? 6 : null,
      period: a < 7 ? "pre" : "post",
    });
  }
  return { ages, interventionAge: 7 };
}

// Regression to the Mean: extreme scorers bounce back
function genRTMData() {
  const rand = makeRng(777);
  const students = [];
  for (let i = 0; i < 80; i++) {
    const trueScore = 40 + rand() * 40;
    const error1 = (rand() - 0.5) * 20;
    const error2 = (rand() - 0.5) * 20;
    const test1 = trueScore + error1;
    const test2 = trueScore + error2;
    students.push({
      id: i,
      true: +trueScore.toFixed(1),
      test1: +Math.max(10, Math.min(95, test1)).toFixed(1),
      test2: +Math.max(10, Math.min(95, test2)).toFixed(1),
      selected: test1 < 35,
    });
  }
  const selected = students.filter(s => s.selected);
  const notSelected = students.filter(s => !s.selected);
  const avgSel1 = +(selected.reduce((a, s) => a + s.test1, 0) / selected.length).toFixed(1);
  const avgSel2 = +(selected.reduce((a, s) => a + s.test2, 0) / selected.length).toFixed(1);
  const avgTrue = +(selected.reduce((a, s) => a + s.true, 0) / selected.length).toFixed(1);
  return { students, selected, notSelected, avgSel1, avgSel2, avgTrue, rtmEffect: +(avgSel2 - avgSel1).toFixed(1) };
}

const selD = genSelectionData();
const attD = genAttritionData();
const secD = genSecularData();
const matD = genMaturationData();
const rtmD = genRTMData();

// ============================================================
// CHART COMPONENTS
// ============================================================
const chartBox = {
  width: "100%", background: "linear-gradient(135deg, #111827 0%, #0f172a 100%)",
  borderRadius: 14, border: "1px solid #1e293b", padding: "1rem 0.5rem 0.5rem",
  marginBottom: "1.25rem", position: "relative",
};
const ax = { fill: "#e8ecf2", fontSize: 13, fontFamily: "Georgia" };
const gs = "#1e293b";

function SelectionChart({ step }) {
  if (step <= 1) {
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={selD.bins} margin={{ top: 15, right: 30, left: 15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey="range" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Baseline Score Range", position: "insideBottom", offset: -2, ...ax }} />
            <YAxis tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Count", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            {step === 0 ? (
              <Bar dataKey="Treatment" fill="#f87171" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            ) : (
              <>
                <Bar dataKey="Treatment" fill="#f87171" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Control" fill="#60a5fa" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
        {step === 1 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#f87171" text={`Treatment avg: ${selD.avgT}`} /><Pill color="#60a5fa" text={`Control avg: ${selD.avgC}`} /><Pill color="#fbbf24" text={`Gap: ${selD.gap}`} /></div>}
        <ChartLegend items={step === 0 ? [{ color: "#f87171", label: "Treatment group" }] : [{ color: "#f87171", label: "Treatment" }, { color: "#60a5fa", label: "Control" }]} />
      </div>
    );
  }
  // Steps 2-3: show the bias in the comparison
  const data = [
    { label: "Naive Estimate", value: 15.2, color: "#f87171" },
    { label: "True Effect", value: 5.0, color: "#34d399" },
    { label: "Selection Bias", value: 10.2, color: "#fbbf24" },
  ];
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="label" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis domain={[0, 20]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Effect Size", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#fbbf24" text="Naive = True Effect + Selection Bias" /></div>
    </div>
  );
}

function AttritionChart({ step }) {
  if (step <= 1) {
    const data = attD.waves.map((w, i) => ({ wave: w, Treatment: attD.tRetain[i], Control: attD.cRetain[i] }));
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis dataKey="wave" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} />
            <YAxis domain={[0, 55]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Participants", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <Line type="linear" dataKey="Treatment" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 5, fill: "#fbbf24" }} />
            <Line type="linear" dataKey="Control" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 5, fill: "#60a5fa" }} />
          </LineChart>
        </ResponsiveContainer>
        {step === 1 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#fbbf24" text="Treatment: 50 → 28 (44% lost)" /><Pill color="#60a5fa" text="Control: 50 → 42 (16% lost)" /></div>}
        <ChartLegend items={[{ color: "#fbbf24", label: "Treatment" }, { color: "#60a5fa", label: "Control" }]} />
      </div>
    );
  }
  // Show survivor bias vs ITT
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={attD.timeline} margin={{ top: 15, right: 30, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="wave" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis domain={[60, 82]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Outcome", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <Line type="linear" dataKey="Treatment" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 5, fill: "#fbbf24" }} />
          <Line type="linear" dataKey="Control" stroke="#60a5fa" strokeWidth={2.5} dot={{ r: 5, fill: "#60a5fa" }} />
          {step >= 3 && <Line type="linear" dataKey="Treatment (ITT)" stroke="#fbbf24" strokeWidth={2} strokeDasharray="8 4" dot={{ r: 4, fill: "#fbbf24", strokeDasharray: "0" }} />}
        </LineChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        <Pill color="#fbbf24" text="Survivors look great" />
        {step >= 3 && <Pill color="#34d399" text="ITT tells the real story" />}
      </div>
      <ChartLegend items={[{ color: "#fbbf24", label: "Treatment (survivors)" }, { color: "#60a5fa", label: "Control" }, ...(step >= 3 ? [{ color: "#fbbf24", label: "Treatment (ITT)", dashed: true }] : [])]} />
    </div>
  );
}

function SecularChart({ step }) {
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={secD.months} margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="month" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Month", position: "insideBottom", offset: -10, ...ax }} />
          <YAxis domain={[15, 55]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Outcome", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <ReferenceLine x={12} stroke="#fbbf24" strokeWidth={2} strokeDasharray="6 4" label={{ value: "Intervention", position: "top", fill: "#fbbf24", fontSize: 12, fontWeight: 700 }} />
          <Line type="monotone" dataKey="Observed" stroke="#34d399" strokeWidth={2.5} dot={false} />
          {step >= 2 && <Line type="monotone" dataKey="Secular Trend" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        {step === 0 && <Pill color="#34d399" text="Outcome drops after intervention" />}
        {step === 1 && <Pill color="#fbbf24" text="But was it already dropping?" />}
        {step >= 2 && <Pill color="#94a3b8" text="Secular trend was declining anyway" />}
        {step >= 3 && <Pill color="#34d399" text="True effect = observed - trend" />}
      </div>
      <ChartLegend items={[{ color: "#34d399", label: "Observed" }, ...(step >= 2 ? [{ color: "#94a3b8", label: "Secular trend", dashed: true }] : []), { color: "#fbbf24", label: "Intervention start", dashed: true }]} />
    </div>
  );
}

function MaturationChart({ step }) {
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={matD.ages} margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="age" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Age (years)", position: "insideBottom", offset: -10, ...ax }} />
          <YAxis domain={[15, 55]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Reading Score", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <ReferenceLine x={7} stroke="#fbbf24" strokeWidth={2} strokeDasharray="6 4" label={{ value: "Program starts", position: "top", fill: "#fbbf24", fontSize: 12, fontWeight: 700 }} />
          <Line type="monotone" dataKey="With Program" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
          {step >= 2 && <Line type="monotone" dataKey="Natural Growth" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} />}
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        {step <= 1 && <Pill color="#60a5fa" text="Scores improve after program starts" />}
        {step >= 2 && <Pill color="#94a3b8" text="But kids naturally improve too" />}
        {step >= 3 && <Pill color="#34d399" text="True effect = gap between curves" />}
      </div>
      <ChartLegend items={[{ color: "#60a5fa", label: "With program" }, ...(step >= 2 ? [{ color: "#94a3b8", label: "Natural growth", dashed: true }] : []), { color: "#fbbf24", label: "Program start", dashed: true }]} />
    </div>
  );
}

function RTMChart({ step }) {
  if (step <= 1) {
    // Show the scatter of test1 vs test2
    const DotRTM = ({ cx, cy, payload }) => {
      if (!cx || !cy) return null;
      return <circle cx={cx} cy={cy} r={payload.selected ? 5 : 3} fill={payload.selected ? "#e879f9" : "#475569"} fillOpacity={payload.selected ? 0.8 : 0.3} />;
    };
    const scatter = rtmD.students.map(s => ({ x: s.test1, y: s.test2, selected: s.selected }));
    return (
      <div style={chartBox}>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart margin={{ top: 15, right: 30, left: 15, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gs} />
            <XAxis type="number" dataKey="x" domain={[10, 95]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Test 1 Score", position: "insideBottom", offset: -10, ...ax }} />
            <YAxis type="number" dataKey="y" domain={[10, 95]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Test 2 Score", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
            <ReferenceLine segment={[{ x: 10, y: 10 }, { x: 95, y: 95 }]} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />
            {step >= 1 && <ReferenceLine x={35} stroke="#e879f9" strokeWidth={2} strokeDasharray="6 4" label={{ value: "Cutoff", position: "top", fill: "#e879f9", fontSize: 12, fontWeight: 700 }} />}
            <Scatter data={scatter} shape={<DotRTM />} />
          </ComposedChart>
        </ResponsiveContainer>
        {step >= 1 && <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}><Pill color="#e879f9" text={`Selected: scored < 35 (n=${rtmD.selected.length})`} /></div>}
        <ChartLegend items={[{ color: "#e879f9", label: "Selected (low scorers)" }, { color: "#475569", label: "Not selected" }, { color: "#334155", label: "No change line", dashed: true }]} />
      </div>
    );
  }
  // Steps 2-3: show the bounce-back
  const data = [
    { label: "Test 1 (selected)", value: rtmD.avgSel1, color: "#e879f9" },
    { label: "Test 2 (retest)", value: rtmD.avgSel2, color: "#60a5fa" },
    { label: "True Score", value: rtmD.avgTrue, color: "#34d399" },
  ];
  return (
    <div style={chartBox}>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={data} margin={{ top: 15, right: 30, left: 15, bottom: 5 }} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" stroke={gs} />
          <XAxis dataKey="label" tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} />
          <YAxis domain={[0, 55]} tick={ax} axisLine={{ stroke: "#334155" }} tickLine={false} label={{ value: "Score", angle: -90, position: "insideLeft", ...ax, dx: -5 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>{data.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        <Pill color="#e879f9" text={`RTM effect: +${rtmD.rtmEffect} points`} />
        {step >= 3 && <Pill color="#fbbf24" text="This is NOT a program effect!" />}
      </div>
    </div>
  );
}

function BiasChart({ biasId, step }) {
  switch (biasId) {
    case "selection": return <SelectionChart step={step} />;
    case "attrition": return <AttritionChart step={step} />;
    case "secular": return <SecularChart step={step} />;
    case "maturation": return <MaturationChart step={step} />;
    case "rtm": return <RTMChart step={step} />;
    default: return null;
  }
}

// ============================================================
// API
// ============================================================
async function generateExplanation(bias, level, program) {
  const userMessage = `Bias type: ${bias.full} (${bias.id})\nDifficulty: ${level.id} (${level.desc})\nProgram to evaluate: ${program}\n\nGenerate a structured, step-by-step explanation of how ${bias.full} could threaten the validity of evaluating "${program}". Tailor the language and depth to the ${level.id} difficulty level.`;
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
function Pill({ color, text }) {
  return <div style={{ background: color + "18", border: `1px solid ${color}55`, color, padding: "5px 13px", borderRadius: 8, fontSize: "0.88rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{text}</div>;
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginTop: 6, paddingBottom: 4 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 16, height: 0, borderTop: `2.5px ${it.dashed ? "dashed" : "solid"} ${it.color}` }} />
          <span style={{ fontSize: "0.82rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function BiasCard({ bias, selected, onClick }) {
  const isA = selected?.id === bias.id;
  return (
    <button onClick={() => onClick(bias)} style={{
      flex: "1 1 130px", maxWidth: 170, padding: "1.1rem 0.8rem",
      background: isA ? `linear-gradient(135deg, ${bias.color}18, ${bias.color}08)` : "rgba(255,255,255,0.02)",
      border: isA ? `2px solid ${bias.color}` : "1px solid #1e293b",
      borderRadius: 14, cursor: "pointer", transition: "all 0.25s ease", textAlign: "center",
      transform: isA ? "translateY(-2px)" : "none", boxShadow: isA ? `0 8px 24px ${bias.color}15` : "none",
    }}>
      <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>{bias.icon}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: isA ? bias.color : "#f0f0f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", letterSpacing: "0.03em", marginBottom: 3 }}>{bias.label}</div>
      <div style={{ fontSize: "0.78rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: 1.35 }}>{bias.full}</div>
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
          border: level.id === l.id ? `1.5px solid ${accentColor}` : "1px solid #1e293b",
          borderRadius: 10, cursor: "pointer", transition: "all 0.2s", textAlign: "center",
        }}>
          <div style={{ fontSize: "1.25rem", marginBottom: 2 }}>{l.emoji}</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, color: level.id === l.id ? accentColor : "#f0f0f0", fontFamily: "'Helvetica Neue', sans-serif" }}>{l.label}</div>
          <div style={{ fontSize: "0.8rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", marginTop: 2, lineHeight: 1.3 }}>{l.desc}</div>
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
      border: isActive ? `1px solid ${color}40` : "1px solid #1e293b",
      borderRadius: 12, cursor: "pointer", transition: "all 0.25s", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isActive ? color : "#1e293b",
          color: isActive ? "#0a0f1a" : "#c0c8d4",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.95rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
        }}>{step.step_number}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: isActive ? "#ffffff" : "#f0f0f0", fontFamily: "'Georgia', serif", marginBottom: isActive ? 8 : 0 }}>{step.title}</div>
          {isActive && (
            <div>
              <p style={{ fontSize: "1.05rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: 1.75, margin: "0 0 10px" }}>{step.explanation}</p>
              {step.key_concept && <div style={{ display: "inline-block", padding: "5px 12px", background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 6, fontSize: "0.88rem", color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginBottom: step.analogy ? 8 : 0 }}>Key concept: {step.key_concept}</div>}
              {step.analogy && <div style={{ marginTop: 8, padding: "10px 14px", background: "#1c191740", borderLeft: `3px solid ${color}50`, borderRadius: "0 8px 8px 0", fontSize: "0.95rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: 1.6, fontStyle: "italic" }}>💡 {step.analogy}</div>}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function DetectFixCard({ item, color, type }) {
  return (
    <div style={{ padding: "0.85rem 1.1rem", background: "rgba(255,255,255,0.02)", border: "1px solid #1e293b", borderRadius: 10, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: "0.9rem", color: type === "detect" ? "#fbbf24" : "#34d399" }}>{type === "detect" ? "🔍" : "🛠️"}</span>
        <span style={{ fontSize: "1rem", fontWeight: 600, color, fontFamily: "'Georgia', serif" }}>{item.method}</span>
      </div>
      <p style={{ fontSize: "0.95rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: 1.6, margin: 0 }}>{item.description}</p>
    </div>
  );
}

function LoadingAnimation({ color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: color, animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}</div>
      <p style={{ color: "#ffffff", fontSize: "1rem", fontFamily: "'Helvetica Neue', sans-serif" }}>Building your personalized explanation...</p>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.5); opacity: 1; } }`}</style>
    </div>
  );
}

function SectionLabel({ number, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: "0.88rem", color: "#ffffff", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, padding: "3px 8px" }}>{number}</span>
      <span style={{ fontSize: "0.95rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
    </div>
  );
}

function navBtnStyle(disabled, color, primary = false) {
  return { padding: "0.55rem 1.4rem", borderRadius: 8, border: `1px solid ${disabled ? "#1e293b" : primary ? color : "#334155"}`, background: disabled ? "#0f172a" : primary ? color : "#1e293b", color: disabled ? "#475569" : primary ? "#0a0f1a" : "#ffffff", cursor: disabled ? "default" : "pointer", fontFamily: "'Helvetica Neue', sans-serif", fontSize: "0.95rem", fontWeight: primary ? 700 : 500, transition: "all 0.2s" };
}

// ============================================================
// MAIN APP
// ============================================================
export default function Class7BiasLab() {
  const [bias, setBias] = useState(null);
  const [level, setLevel] = useState(LEVELS[1]);
  const [program, setProgram] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);
  const accentColor = bias?.color || "#94a3b8";

  useEffect(() => { if (bias && !program) setProgram(EXAMPLE_PROGRAMS[bias.id]); }, [bias]);
  useEffect(() => { setResult(null); setActiveStep(0); setError(null); }, [bias, level]);

  const handleGenerate = async () => {
    if (!bias || !program.trim()) return;
    setLoading(true); setError(null); setResult(null); setActiveStep(0);
    const res = await generateExplanation(bias, level, program.trim());
    if (res) { setResult(res); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200); }
    else setError("Something went wrong generating the explanation. Please try again.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060a13", color: "#ffffff", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff06 1px, transparent 0)`, backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <a href="/" style={{ fontSize: "1.1rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontWeight: 600 }}>← Class 6: Causal Inference Methods</a>
          <a href="/class7/designs" style={{ fontSize: "1.1rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#1e293b", border: "1px solid #334155", borderRadius: 10, fontWeight: 600 }}>Comparison Group Designs →</a>
        </div>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#ffffff", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Interactive Learning Platform (Work in Progress)</div>
          <h1 style={{ fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.01em" }}>Bias in Impact Evaluation</h1>
          <p style={{ fontSize: "1.1rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>Select a type of bias, choose your difficulty level, and describe a program. The AI explains how that bias could threaten your evaluation, with detection strategies and remedies.</p>
        </header>

        {/* Step 1: Choose bias */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel number="1" text="Choose a type of bias" />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>{BIAS_TYPES.map(b => <BiasCard key={b.id} bias={b} selected={bias} onClick={setBias} />)}</div>
          {bias && (
            <div style={{ textAlign: "center", marginTop: 16, padding: "14px 20px", background: `${bias.color}08`, borderRadius: 10, border: `1px solid ${bias.color}20` }}>
              <span style={{ fontSize: "1rem", color: bias.color, fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 500, fontStyle: "italic" }}>{bias.tagline}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
                <span style={{ fontSize: "0.85rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, marginRight: 4, lineHeight: "28px" }}>Key concepts:</span>
                {bias.keyConcepts.map((c, i) => <span key={i} style={{ display: "inline-block", padding: "4px 12px", background: `${bias.color}12`, border: `1px solid ${bias.color}30`, borderRadius: 20, fontSize: "0.85rem", color: bias.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{c}</span>)}
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Difficulty */}
        {bias && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="2" text="Set the difficulty level" />
            <LevelSelector level={level} setLevel={setLevel} accentColor={accentColor} />
            {bias.definitions && level && (
              <div style={{ marginTop: 16, padding: "1.1rem 1.4rem", background: "#0f172a", borderRadius: 12, border: `1px solid ${accentColor}25`, borderLeft: `3px solid ${accentColor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.85rem", color: accentColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>What is {bias.full}?</span>
                  <span style={{ fontSize: "0.78rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", background: "#1e293b", padding: "3px 10px", borderRadius: 4 }}>{level.label} level</span>
                </div>
                <p style={{ fontSize: "1.05rem", color: "#ffffff", fontFamily: "'Georgia', serif", lineHeight: 1.75, margin: 0 }}>
                  {level.id === "advanced" ? <NotationText text={bias.definitions[level.id]} color={accentColor} /> : bias.definitions[level.id]}
                </p>
                {level.id === "advanced" && <div style={{ marginTop: 10, fontSize: "0.78rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", fontStyle: "italic" }}>Hover or tap dotted terms for plain-language explanations.</div>}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Program */}
        {bias && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="3" text="Describe your program" />
            <p style={{ fontSize: "0.95rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: 12, lineHeight: 1.5 }}>Enter a program, policy, or intervention. The AI will explain how {bias.full.toLowerCase()} could affect your evaluation.</p>
            <div style={{ position: "relative", background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b", overflow: "hidden" }}>
              <textarea value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g., a community health worker home visiting program on childhood vaccination rates" rows={3} style={{ width: "100%", padding: "1rem 1.25rem", background: "transparent", border: "none", color: "#ffffff", fontSize: "1.05rem", fontFamily: "'Georgia', serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1.25rem 0.75rem", borderTop: "1px solid #1e293b10" }}>
                <span style={{ fontSize: "0.82rem", color: "#ffffff", fontFamily: "'JetBrains Mono', monospace" }}>{bias.full} · {level.label}</span>
                <button onClick={handleGenerate} disabled={loading || !program.trim()} style={{ padding: "0.6rem 1.6rem", background: loading || !program.trim() ? "#1e293b" : accentColor, color: loading || !program.trim() ? "#475569" : "#0a0f1a", border: "none", borderRadius: 8, cursor: loading || !program.trim() ? "default" : "pointer", fontSize: "0.95rem", fontWeight: 700, fontFamily: "'Helvetica Neue', sans-serif", transition: "all 0.2s", letterSpacing: "0.02em" }}>{loading ? "Generating..." : "Generate Explanation →"}</button>
              </div>
            </div>
          </section>
        )}

        {loading && <LoadingAnimation color={accentColor} />}
        {error && <div style={{ padding: "1rem 1.25rem", background: "#f8717115", border: "1px solid #f8717130", borderRadius: 12, color: "#ffffff", fontSize: "1rem", fontFamily: "'Helvetica Neue', sans-serif", textAlign: "center", marginBottom: "2rem" }}>{error}</div>}

        {/* RESULTS */}
        {result && !loading && (
          <div ref={resultRef} style={{ animation: "fadeIn 0.5s ease" }}>
            {/* Scenario framing */}
            <section style={{ padding: "1.25rem 1.5rem", background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: 14, marginBottom: "2rem" }}>
              <div style={{ fontSize: "0.82rem", color: accentColor, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>How this bias affects your evaluation</div>
              <p style={{ fontSize: "1.1rem", color: "#ffffff", fontFamily: "'Georgia', serif", lineHeight: 1.65, margin: 0 }}>{result.example_framing}</p>
              {result.scenario && <p style={{ fontSize: "1rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", marginTop: 10, marginBottom: 0, lineHeight: 1.6, fontStyle: "italic", borderLeft: `3px solid ${accentColor}40`, paddingLeft: 14 }}>{result.scenario}</p>}
            </section>

            {/* Steps */}
            <section style={{ marginBottom: "2.5rem" }}>
              <SectionLabel number="✦" text="Step-by-step walkthrough" />
              <BiasChart biasId={bias.id} step={activeStep} />
              {result.steps.map((s, i) => <StepCard key={i} step={s} color={accentColor} isActive={activeStep === i} onClick={() => setActiveStep(i)} />)}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                <button onClick={() => setActiveStep(s => Math.max(0, s - 1))} disabled={activeStep === 0} style={navBtnStyle(activeStep === 0, accentColor)}>← Previous</button>
                <button onClick={() => setActiveStep(s => Math.min(result.steps.length - 1, s + 1))} disabled={activeStep === result.steps.length - 1} style={navBtnStyle(activeStep === result.steps.length - 1, accentColor, true)}>Next →</button>
              </div>
            </section>

            {/* Detection & Remedies */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: "2.5rem" }}>
              {result.how_to_detect?.length > 0 && (
                <section>
                  <SectionLabel number="🔍" text="How to detect" />
                  {result.how_to_detect.map((d, i) => <DetectFixCard key={i} item={d} color={accentColor} type="detect" />)}
                </section>
              )}
              {result.how_to_fix?.length > 0 && (
                <section>
                  <SectionLabel number="🛠️" text="How to fix" />
                  {result.how_to_fix.map((f, i) => <DetectFixCard key={i} item={f} color={accentColor} type="fix" />)}
                </section>
              )}
            </div>

            {/* Consequence */}
            {result.real_world_consequence && (
              <div style={{ padding: "1rem 1.25rem", background: "#f8717108", border: "1px solid #f8717120", borderRadius: 12, marginBottom: "2.5rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#f87171", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>What could go wrong</div>
                <p style={{ fontSize: "1rem", color: "#ffffff", fontFamily: "'Helvetica Neue', sans-serif", lineHeight: 1.6, margin: 0 }}>{result.real_world_consequence}</p>
              </div>
            )}

            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setResult(null); setProgram(""); setActiveStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ padding: "0.65rem 2.2rem", background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#ffffff", fontSize: "1rem", fontFamily: "'Helvetica Neue', sans-serif", cursor: "pointer" }}>↻ Try a different example</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        textarea::placeholder { color: #94a3b8; }
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
      `}</style>
    </div>
  );
}
