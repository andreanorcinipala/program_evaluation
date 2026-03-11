"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, ComposedChart, Scatter, Cell
} from "recharts";

// ============================================================
// CONSTANTS & CONFIG
// ============================================================
const DESIGNS = [
  {
    id: "naive",
    label: "Naïve",
    full: "Naïve Estimates",
    color: "#c2410c",
    icon: "📊",
    strength: 1,
    tagline: "Simple before-and-after with no adjustments.",
    addressesBias: [],
    keyConcepts: ["Pre-post comparison", "No control group", "Confounded estimate", "Baseline vs. endline", "Observed change"],
    definitions: {
      colloquial: "A naïve estimate is the simplest way to check if a program worked: just compare outcomes before and after. Did test scores go up? Did employment increase? The problem is you have no idea whether those changes would have happened anyway. Maybe the economy improved, or people naturally got better over time. Without any adjustment or comparison group, you are basically guessing that every change was caused by your program.",
      basic: "Naïve estimates compare outcomes before and after an intervention (or between participants and non-participants) without any statistical adjustment. The observed difference is taken as the program effect. While easy to compute, this approach conflates the true treatment effect with all sources of bias: selection differences, secular trends, maturation, and regression to the mean. Any or all of these can inflate or deflate the estimate. Naïve estimates serve as a starting point but should never be the final word in a rigorous evaluation.",
      advanced: "The naïve pre-post estimator is Δ_naive = Ȳ_post - Ȳ_pre = τ + [E(Y(0)_post) - E(Y(0)_pre)], where the second term captures all time-varying confounds (secular trends, maturation, regression to the mean). The naïve cross-sectional estimator Ȳ_T - Ȳ_C adds selection bias: E[Y(0)|D=1] - E[Y(0)|D=0]. Without random assignment or adjustment, these estimators are inconsistent for the ATT. They provide a useful benchmark for comparison with more rigorous designs.",
    },
  },
  {
    id: "regression",
    label: "Regression",
    full: "Regression Adjustment",
    color: "#2563eb",
    icon: "📈",
    strength: 2,
    tagline: "Statistically control for observed differences.",
    addressesBias: ["Selection (observed)"],
    keyConcepts: ["Covariate control", "OLS estimation", "Model specification", "Observed confounders", "Adjusted estimate"],
    definitions: {
      colloquial: "Regression adjustment is like trying to make an unfair comparison fairer using math. Say you are comparing a job training program's participants to non-participants, but participants are younger and more educated. Regression lets you statistically 'hold constant' age and education, so you are comparing people with similar backgrounds. The catch? It only works for differences you can see and measure. If there are hidden differences (like motivation), regression cannot fix that.",
      basic: "Regression adjustment uses statistical models to control for observed differences between treatment and comparison groups. By including covariates (baseline characteristics, demographics, prior outcomes) in a regression equation, the method isolates the program effect while holding other factors constant. This improves on naïve estimates by reducing bias from observed confounders. However, it cannot address bias from unmeasured variables, and the results depend on correct model specification (linearity, functional form).",
      advanced: "The regression-adjusted estimator specifies Y_i = α + τD_i + X_i'β + ε_i, where D is the treatment indicator, X is a vector of covariates, and τ is the treatment effect conditional on X. Under the conditional independence assumption (CIA), (Y(0),Y(1)) ⊥ D | X, τ̂_OLS is consistent for the ATE. Without CIA, omitted variable bias persists: plim(τ̂) = τ + Cov(D,U)/Var(D|X), where U represents unobserved confounders. Sensitivity to functional form can be assessed via specification tests. Augmented estimators (AIPW) combine regression with propensity score weighting for double robustness.",
    },
  },
  {
    id: "matching",
    label: "Matching",
    full: "Matching Designs",
    color: "#7c3aed",
    icon: "🔗",
    strength: 3,
    tagline: "Find comparable pairs based on observed characteristics.",
    addressesBias: ["Selection (observed)"],
    keyConcepts: ["Exact matching", "Propensity score", "Covariate balance", "Common support", "Standardized mean difference"],
    definitions: {
      colloquial: "Matching is like finding a 'twin' for every person in your program. You look at people who did not participate and find ones who look just like your participants in every measurable way: same age, same income, same education. Then you compare each pair. If the program participant did better than their twin, that is evidence the program worked. The key limitation? You can only match on things you can measure. Two people might look identical on paper but differ in ways you cannot see.",
      basic: "Matching designs pair each treated individual with one or more untreated individuals who share similar observed characteristics. Exact matching requires identical values on key covariates; propensity score matching (PSM) uses the estimated probability of treatment to summarize multiple covariates into a single score. After matching, the treatment and comparison groups should be balanced on observed variables, approximating the conditions of a randomized experiment. Balance is assessed using standardized mean differences (SMD), with values below 0.1 indicating good balance.",
      advanced: "Matching estimates the ATT = E[Y(1)-Y(0)|D=1] by constructing a counterfactual from matched controls. PSM matches on ê(X) = P̂(D=1|X), leveraging the Rosenbaum-Rubin theorem: if (Y(0),Y(1)) ⊥ D | X (strong ignorability) and 0 < e(X) < 1 (overlap), then (Y(0),Y(1)) ⊥ D | e(X). Balance diagnostics use standardized mean differences: SMD = (X̄_T - X̄_C) / √[(s²_T + s²_C)/2]. Caliper matching restricts matches within |e_i - e_j| < δ. Variance estimation requires Abadie-Imbens standard errors. Sensitivity analysis (Rosenbaum bounds, Γ) quantifies robustness to hidden bias.",
    },
  },
  {
    id: "its",
    label: "ITS",
    full: "Interrupted Time Series",
    color: "#065f46",
    icon: "⏱️",
    strength: 4,
    tagline: "Use the pre-trend to separate program effects from time.",
    addressesBias: ["Secular trends", "Maturation", "Regression to the mean"],
    keyConcepts: ["Segmented regression", "Level change", "Slope change", "Pre-intervention trend", "Counterfactual projection"],
    definitions: {
      colloquial: "Interrupted time series is like watching a movie of your outcome over time, then pressing pause when the program starts. Before the program, you can see the trend: maybe test scores were slowly going up on their own. After the program, you check: did scores jump up suddenly? Did the upward trend get steeper? By knowing what was already happening, you can figure out what the program actually added. You need lots of data points before and after to make this work.",
      basic: "Interrupted Time Series (ITS) analyzes data collected at multiple time points before and after an intervention. By modeling the pre-intervention trend and extrapolating it forward, ITS creates a counterfactual: what would have happened without the program. The program's effect is estimated as the deviation from this counterfactual, decomposed into a level change (immediate jump at intervention) and a slope change (change in the rate of improvement). ITS controls for secular trends and maturation but is vulnerable to concurrent events that coincide with the intervention.",
      advanced: "ITS uses segmented regression: Y_t = β₀ + β₁t + β₂D_t + β₃(t-T*)D_t + ε_t, where t is time, T* is the intervention point, D_t = I(t ≥ T*), β₂ captures the level change, and β₃ the slope change. The counterfactual is Ŷ_t(0) = β̂₀ + β̂₁t for t ≥ T*. Autocorrelation in the errors requires Newey-West standard errors or ARIMA modeling. Comparative ITS (CITS) adds a control series for stronger identification. The number of pre-intervention time points affects power; at least 8-12 are recommended.",
    },
  },
  {
    id: "did",
    label: "DiD",
    full: "DiD & Panel Methods",
    color: "#1e3a8a",
    icon: "📐",
    strength: 5,
    tagline: "Subtract the common trend, isolate the program effect.",
    addressesBias: ["Selection (time-invariant)", "Secular trends", "Maturation"],
    keyConcepts: ["Parallel trends", "Double difference", "Fixed effects", "Panel data", "Counterfactual trend"],
    definitions: {
      colloquial: "Difference-in-differences is one of the most powerful tools in your evaluation toolkit. You watch two groups over time: one that gets the program and one that does not. Before the program, both groups are changing at about the same rate. After the program, if the treatment group pulls ahead faster than the comparison group, that extra improvement is your program effect. You are subtracting out everything that was happening to both groups equally, leaving just the program's contribution.",
      basic: "Difference-in-Differences (DiD) compares the change over time in a treatment group to the change over time in a comparison group. The 'double difference' removes both time-invariant group differences and common time trends. The key assumption is parallel trends: absent the intervention, both groups would have continued on the same trajectory. Fixed effects models extend this logic to panel data, controlling for all time-invariant characteristics of each unit by comparing each unit to itself over time.",
      advanced: "DiD estimates δ = [E(Y|G=1,T=1) - E(Y|G=1,T=0)] - [E(Y|G=0,T=1) - E(Y|G=0,T=0)] under parallel trends: E[Y(0)_{t=1} - Y(0)_{t=0}|G=1] = E[Y(0)_{t=1} - Y(0)_{t=0}|G=0]. In a regression framework: Y_it = α + γG_i + λT_t + δ(G_i × T_t) + ε_it. Fixed effects generalize: Y_it = α_i + λ_t + δD_it + ε_it, where α_i absorbs all time-invariant unit heterogeneity. For staggered adoption, Callaway-Sant'Anna or Sun-Abraham estimators avoid bias from heterogeneous treatment effects across cohorts.",
    },
  },
];

// ============================================================
// NOTATION TOOLTIPS
// ============================================================
const NOTATION_GLOSSARY = [
  { pattern: "Δ_naive = Ȳ_post - Ȳ_pre", tip: "The naïve estimator: subtract the pre-program average from the post-program average. Any change is attributed to the program." },
  { pattern: "E(Y(0)_post) - E(Y(0)_pre)", tip: "The change in the untreated potential outcome over time. This is everything that would have changed without the program." },
  { pattern: "Ȳ_T - Ȳ_C", tip: "The naïve cross-sectional comparison: treatment group mean minus control group mean, with no adjustments." },
  { pattern: "E[Y(0)|D=1] - E[Y(0)|D=0]", tip: "Selection bias: the difference in untreated outcomes between groups. If this is not zero, groups were different before the program." },
  { pattern: "Y_i = α + τD_i + X_i'β + ε_i", tip: "The regression model: outcome Y depends on treatment D, covariates X, and random error ε. τ estimates the treatment effect after controlling for X." },
  { pattern: "(Y(0),Y(1)) ⊥ D | X", tip: "Strong ignorability: potential outcomes are independent of treatment, conditional on observed covariates. Treatment is as-good-as-random after controlling for X." },
  { pattern: "τ̂_OLS", tip: "The OLS estimate of the treatment effect. Consistent only if the model is correctly specified and unconfoundedness holds." },
  { pattern: "plim(τ̂) = τ + Cov(D,U)/Var(D|X)", tip: "If unobserved confounders U exist, the estimate is biased by the ratio of their covariance with treatment to treatment variance." },
  { pattern: "AIPW", tip: "Augmented Inverse Probability Weighting: a doubly robust estimator combining regression and propensity score weighting." },
  { pattern: "CIA", tip: "Conditional Independence Assumption: treatment assignment is independent of potential outcomes given observed covariates X." },
  { pattern: "ê(X) = P̂(D=1|X)", tip: "The estimated propensity score: predicted probability of receiving treatment given observed characteristics X." },
  { pattern: "0 < e(X) < 1", tip: "Overlap condition: every individual must have some chance of being treated and some chance of not being treated." },
  { pattern: "ATT = E[Y(1)-Y(0)|D=1]", tip: "Average Treatment Effect on the Treated: the program's average impact on those who actually received it." },
  { pattern: "ATT", tip: "Average Treatment Effect on the Treated: the average impact specifically on program participants." },
  { pattern: "SMD = (X̄_T - X̄_C) / √[(s²_T + s²_C)/2]", tip: "Standardized Mean Difference: measures covariate imbalance between groups. Values below 0.1 indicate good balance." },
  { pattern: "SMD", tip: "Standardized Mean Difference: a scale-free measure of how different two groups are on a variable. Below 0.1 is considered balanced." },
  { pattern: "Rosenbaum bounds", tip: "Sensitivity analysis: how strong would unmeasured confounding need to be to change your conclusion?" },
  { pattern: "Y_t = β₀ + β₁t + β₂D_t + β₃(t-T*)D_t + ε_t", tip: "Segmented regression. β₀ = baseline level, β₁ = pre-trend slope, β₂ = level change at intervention, β₃ = slope change after intervention." },
  { pattern: "Ŷ_t(0) = β̂₀ + β̂₁t", tip: "The counterfactual: the projected pre-trend. The gap between this and actual post-values is the estimated effect." },
  { pattern: "D_t = I(t ≥ T*)", tip: "Indicator variable: equals 1 after the intervention time T*, 0 before." },
  { pattern: "Newey-West standard errors", tip: "Standard errors correcting for autocorrelation in time series data, giving more accurate confidence intervals." },
  { pattern: "ARIMA", tip: "AutoRegressive Integrated Moving Average: a time series model accounting for autocorrelation patterns." },
  { pattern: "CITS", tip: "Comparative Interrupted Time Series: ITS with a control series, combining trend modeling with a comparison group." },
  { pattern: "δ = [E(Y|G=1,T=1) - E(Y|G=1,T=0)] - [E(Y|G=0,T=1) - E(Y|G=0,T=0)]", tip: "The DiD estimator: treatment group's change minus control group's change. The double difference removes common trends." },
  { pattern: "E[Y(0)_{t=1} - Y(0)_{t=0}|G=1] = E[Y(0)_{t=1} - Y(0)_{t=0}|G=0]", tip: "Parallel trends assumption: without the program, both groups would have changed by the same amount over time." },
  { pattern: "Y_it = α + γG_i + λT_t + δ(G_i × T_t) + ε_it", tip: "DiD regression: α = baseline, γ = group difference, λ = time effect, δ (the interaction) = the treatment effect." },
  { pattern: "Y_it = α_i + λ_t + δD_it + ε_it", tip: "Two-way fixed effects: α_i absorbs time-constant unit differences, λ_t absorbs common time shocks, δ = treatment effect." },
  { pattern: "α_i", tip: "Unit fixed effects: separate intercepts for each unit capturing all their time-invariant characteristics." },
  { pattern: "Callaway-Sant'Anna", tip: "A modern DiD estimator for staggered treatment that avoids using already-treated units as controls." },
  { pattern: "Sun-Abraham", tip: "An interaction-weighted DiD estimator for staggered timing that avoids contamination across cohorts." },
  { pattern: "PSM", tip: "Propensity Score Matching: matching treated and untreated individuals based on their estimated probability of receiving treatment." },
  { pattern: "OLS", tip: "Ordinary Least Squares: the most common method for estimating regression coefficients by minimizing the sum of squared residuals." },
  { pattern: "ATE", tip: "Average Treatment Effect: the average causal impact of treatment across the entire population." },
  { pattern: "IPW", tip: "Inverse Probability Weighting: reweights observations by the inverse of their propensity score to create a balanced sample." },
];

const CHART_STEPS = {
  naive: [
    "Pre-program and post-program outcomes for participants only.",
    "A comparison group shows changes that happened without the program.",
    "Decomposing the naïve estimate into true effect versus bias.",
  ],
  regression: [
    "Raw average outcomes: the treatment group scores higher.",
    "But treatment participants also had higher baselines to begin with.",
    "After adjusting for baseline differences, the estimated effect shrinks.",
  ],
  matching: [
    "Before matching: groups differ on key covariates (bars exceed the 0.1 threshold).",
    "After matching: covariates are balanced (bars fall below the threshold).",
    "Comparing both: matching dramatically reduces group imbalances.",
  ],
  its: [
    "Outcome tracked over many time points, with intervention marked.",
    "The pre-trend is projected forward as the counterfactual (dashed line).",
    "The gap between counterfactual and actual outcomes reveals the effect.",
  ],
  did: [
    "Two groups tracked over time. In the pre-period, they trend in parallel.",
    "After the program, the treatment group pulls ahead of the control.",
    "The dashed counterfactual shows what would have happened. The gap is the effect.",
  ],
};

const LEVELS = [
  { id: "colloquial", label: "Plain Language", desc: "Everyday language, no jargon" },
  { id: "basic", label: "Basic", desc: "Standard evaluation terminology" },
  { id: "advanced", label: "Advanced", desc: "Formal notation and equations" },
];

const DEFAULT_PROGRAMS = {
  naive: "A city launches a job training program and compares employment rates before and after the program.",
  regression: "A school district implements a tutoring program and uses student demographics to adjust the effect estimate.",
  matching: "A nonprofit evaluates a mentorship program by matching participants to similar non-participants.",
  its: "A state bans texting while driving and tracks monthly accident rates for years before and after the law.",
  did: "A county raises the minimum wage while neighboring counties do not, and both track employment over time.",
};

// ============================================================
// SEEDED RANDOM NUMBER GENERATOR
// ============================================================
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateNaiveData(seed) {
  const rng = mulberry32(seed);
  const pre = 42 + rng() * 6;
  const preComp = pre - 1 + rng() * 2;
  const secularGain = 8 + rng() * 4;
  const trueEffect = 6 + rng() * 4;
  const postTreat = pre + secularGain + trueEffect;
  const postComp = preComp + secularGain;
  const naiveEffect = Math.round(postTreat - pre);
  return {
    pre: Math.round(pre),
    postTreat: Math.round(postTreat),
    preComp: Math.round(preComp),
    postComp: Math.round(postComp),
    trueEffect: Math.round(trueEffect),
    bias: naiveEffect - Math.round(trueEffect),
    naiveEffect,
  };
}

function generateRegressionData(seed) {
  const rng = mulberry32(seed);
  const tMeanBl = 56 + rng() * 6;
  const cMeanBl = 44 + rng() * 6;
  const trueEffect = 5 + rng() * 3;
  const baseRelation = 0.55;
  const tMeanOut = 15 + baseRelation * tMeanBl + trueEffect;
  const cMeanOut = 15 + baseRelation * cMeanBl;
  const rawEffect = tMeanOut - cMeanOut;
  return {
    tMeanOutcome: Math.round(tMeanOut * 10) / 10,
    cMeanOutcome: Math.round(cMeanOut * 10) / 10,
    tMeanBaseline: Math.round(tMeanBl),
    cMeanBaseline: Math.round(cMeanBl),
    rawEffect: Math.round(rawEffect * 10) / 10,
    adjustedEffect: Math.round(trueEffect * 10) / 10,
  };
}

function generateMatchingData(seed) {
  const rng = mulberry32(seed);
  const covariates = ["Age", "Education", "Income", "Baseline", "Work Exp"];
  return covariates.map((name) => ({
    name,
    before: Math.round((0.25 + rng() * 0.35) * 100) / 100,
    after: Math.round((0.02 + rng() * 0.07) * 100) / 100,
  }));
}

function generateITSData(seed) {
  const rng = mulberry32(seed);
  const T = 12;
  const b0 = 28 + rng() * 4;
  const b1 = 1.0 + rng() * 0.4;
  const levelChange = 7 + rng() * 3;
  const slopeChange = 0.6 + rng() * 0.4;
  const points = [];
  for (let t = 1; t <= 24; t++) {
    const pre = t <= T;
    const trend = b0 + b1 * t;
    const effect = pre ? 0 : levelChange + slopeChange * (t - T);
    const noise = (rng() - 0.5) * 5;
    points.push({
      t,
      y: Math.round((trend + effect + noise) * 10) / 10,
      preTrend: Math.round(trend * 10) / 10,
      postTrend: pre ? null : Math.round((trend + effect) * 10) / 10,
    });
  }
  return { points, T, levelChange: Math.round(levelChange * 10) / 10, slopeChange: Math.round(slopeChange * 100) / 100 };
}

function generateDiDData(seed) {
  const rng = mulberry32(seed);
  const tBase = 36 + rng() * 4;
  const cBase = 34 + rng() * 4;
  const trend = 5 + rng() * 2;
  const effect = 11 + rng() * 4;
  return [
    { time: "t\u2082", treatment: Math.round(tBase), control: Math.round(cBase) },
    { time: "t\u2081", treatment: Math.round(tBase + trend), control: Math.round(cBase + trend) },
    { time: "Pre", treatment: Math.round(tBase + 2 * trend), control: Math.round(cBase + 2 * trend) },
    { time: "Post", treatment: Math.round(tBase + 3 * trend + effect), control: Math.round(cBase + 3 * trend), counterfactual: Math.round(tBase + 3 * trend) },
  ];
}

// ============================================================
// CHART COMPONENTS
// ============================================================
const axisStyle = { stroke: "#64748b", fontSize: 11, fontFamily: "'Inter', sans-serif" };
const gridStyle = { strokeDasharray: "3 3", stroke: "#e2e8f0" };

function ChartLegend({ items }) {
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 14, height: 3, background: it.color, borderRadius: 2, ...(it.dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 8px)`, background: "none" } : {}) }} />
          <span style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function NaiveChart({ step, seed }) {
  const d = generateNaiveData(seed);

  if (step <= 2) {
    const data = [
      { name: "Pre", treatment: d.pre, ...(step >= 2 ? { comparison: d.preComp } : {}) },
      { name: "Post", treatment: d.postTreat, ...(step >= 2 ? { comparison: d.postComp } : {}) },
    ];
    return (
      <div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis {...axisStyle} domain={[0, "auto"]} />
            <Bar dataKey="treatment" fill="#c2410c" name="Treatment" radius={[4, 4, 0, 0]} />
            {step >= 2 && <Bar dataKey="comparison" fill="#64748b" name="Comparison" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#c2410c", label: "Treatment group" }, ...(step >= 2 ? [{ color: "#64748b", label: "Comparison group" }] : [])]} />
      </div>
    );
  }

  const data = [
    { name: "Naïve Effect", value: d.naiveEffect, fill: "#c2410c" },
    { name: "True Effect", value: d.trueEffect, fill: "#065f46" },
    { name: "Bias", value: d.bias, fill: "#dc2626" },
  ];
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="name" {...axisStyle} />
          <YAxis {...axisStyle} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ color: "#c2410c", label: "Naïve (overstated)" }, { color: "#065f46", label: "True effect" }, { color: "#dc2626", label: "Bias" }]} />
    </div>
  );
}

function RegressionChart({ step, seed }) {
  const d = generateRegressionData(seed);

  if (step === 1) {
    const data = [
      { name: "Treatment", value: d.tMeanOutcome, fill: "#2563eb" },
      { name: "Control", value: d.cMeanOutcome, fill: "#64748b" },
    ];
    return (
      <div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis {...axisStyle} domain={[0, "auto"]} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#2563eb", label: "Treatment" }, { color: "#64748b", label: "Control" }]} />
        <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.85rem", color: "#c2410c", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Raw difference: {d.rawEffect} points</div>
      </div>
    );
  }

  if (step === 2) {
    const data = [
      { name: "Baseline", treatment: d.tMeanBaseline, control: d.cMeanBaseline },
      { name: "Outcome", treatment: Math.round(d.tMeanOutcome), control: Math.round(d.cMeanOutcome) },
    ];
    return (
      <div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="name" {...axisStyle} />
            <YAxis {...axisStyle} domain={[0, "auto"]} />
            <Bar dataKey="treatment" fill="#2563eb" name="Treatment" radius={[4, 4, 0, 0]} />
            <Bar dataKey="control" fill="#64748b" name="Control" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <ChartLegend items={[{ color: "#2563eb", label: "Treatment" }, { color: "#64748b", label: "Control" }]} />
        <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.85rem", color: "#92400e", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Treatment group started {d.tMeanBaseline - d.cMeanBaseline} points higher at baseline</div>
      </div>
    );
  }

  const data = [
    { name: "Raw Effect", value: d.rawEffect, fill: "#c2410c" },
    { name: "Adjusted Effect", value: d.adjustedEffect, fill: "#2563eb" },
  ];
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="name" {...axisStyle} />
          <YAxis {...axisStyle} domain={[0, "auto"]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ color: "#c2410c", label: "Raw (confounded)" }, { color: "#2563eb", label: "Adjusted (controlled)" }]} />
      <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.85rem", color: "#065f46", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>Adjustment reduced the estimate by {Math.round((d.rawEffect - d.adjustedEffect) * 10) / 10} points</div>
    </div>
  );
}

function MatchingChart({ step, seed }) {
  const data = generateMatchingData(seed);
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="name" {...axisStyle} tick={{ fontSize: 10 }} />
          <YAxis {...axisStyle} domain={[0, 0.7]} tickFormatter={(v) => v.toFixed(1)} />
          <ReferenceLine y={0.1} stroke="#92400e" strokeDasharray="5 5" />
          {(step === 1 || step === 3) && <Bar dataKey="before" fill="#dc2626" name="Before" radius={[4, 4, 0, 0]} opacity={step === 3 ? 0.4 : 1} />}
          {step >= 2 && <Bar dataKey="after" fill="#7c3aed" name="After" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend items={[...(step === 1 || step === 3 ? [{ color: "#dc2626", label: "Before matching" }] : []), ...(step >= 2 ? [{ color: "#7c3aed", label: "After matching" }] : []), { color: "#92400e", label: "Balance threshold (0.1)", dashed: true }]} />
    </div>
  );
}

function ITSChart({ step, seed }) {
  const d = generateITSData(seed);
  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={d.points}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="t" {...axisStyle} />
          <YAxis {...axisStyle} domain={["auto", "auto"]} />
          <ReferenceLine x={d.T} stroke="#92400e" strokeDasharray="5 5" />
          <Scatter dataKey="y" fill="#065f46" r={3} />
          {step >= 2 && <Line dataKey="preTrend" stroke="#64748b" strokeDasharray="6 4" dot={false} strokeWidth={2} />}
          {step >= 3 && <Line dataKey="postTrend" stroke="#065f46" dot={false} strokeWidth={2} connectNulls={false} />}
        </ComposedChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ color: "#065f46", label: "Observed data" }, ...(step >= 2 ? [{ color: "#64748b", label: "Counterfactual (pre-trend)", dashed: true }] : []), ...(step >= 3 ? [{ color: "#065f46", label: "Post-trend fit" }] : []), { color: "#92400e", label: "Intervention", dashed: true }]} />
    </div>
  );
}

function DiDChart({ step, seed }) {
  const data = generateDiDData(seed);
  const visible = step === 1 ? data.slice(0, 3) : data;
  const showCf = step >= 3;

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={visible}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="time" {...axisStyle} />
          <YAxis {...axisStyle} domain={[20, "auto"]} />
          <Line dataKey="treatment" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 5, fill: "#1e3a8a" }} />
          <Line dataKey="control" stroke="#64748b" strokeWidth={2} dot={{ r: 5, fill: "#64748b" }} />
          {showCf && <Line dataKey="counterfactual" stroke="#1e3a8a" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} />}
          {step >= 2 && <ReferenceLine x="Post" stroke="#92400e" strokeDasharray="5 5" />}
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend items={[{ color: "#1e3a8a", label: "Treatment" }, { color: "#64748b", label: "Control" }, ...(showCf ? [{ color: "#1e3a8a", label: "Counterfactual", dashed: true }] : []), ...(step >= 2 ? [{ color: "#92400e", label: "Program start", dashed: true }] : [])]} />
      {showCf && <div style={{ textAlign: "center", marginTop: 6, fontSize: "0.85rem", color: "#065f46", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>DiD effect = {data[3].treatment - data[3].counterfactual} points</div>}
    </div>
  );
}

function DesignChart({ designId, step, seed }) {
  switch (designId) {
    case "naive": return <NaiveChart step={step} seed={seed} />;
    case "regression": return <RegressionChart step={step} seed={seed} />;
    case "matching": return <MatchingChart step={step} seed={seed} />;
    case "its": return <ITSChart step={step} seed={seed} />;
    case "did": return <DiDChart step={step} seed={seed} />;
    default: return null;
  }
}

// ============================================================
// UI COMPONENTS
// ============================================================
function StrengthMeter({ level, color }) {
  return (
    <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i <= level ? color : "#e2e8f0", border: `1px solid ${i <= level ? color : "#cbd5e1"}`, transition: "all 0.2s" }} />
      ))}
    </div>
  );
}

function DesignCard({ design, selected, onClick }) {
  const active = selected?.id === design.id;
  return (
    <button onClick={() => onClick(design)} style={{ flex: "1 1 140px", maxWidth: 170, padding: "14px 10px 10px", background: active ? `${design.color}15` : "#f1f5f9", border: `1.5px solid ${active ? design.color : "#000000"}`, borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.2s", outline: "none" }}>
      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{design.icon}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: active ? design.color : "#000000", fontFamily: "'Inter', sans-serif" }}>{design.label}</div>
      <div style={{ fontSize: "0.72rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{design.full}</div>
      <StrengthMeter level={design.strength} color={design.color} />
    </button>
  );
}

function LevelSelector({ level, setLevel, accentColor }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
      {LEVELS.map((l) => {
        const active = level?.id === l.id;
        return (
          <button key={l.id} onClick={() => setLevel(l)} style={{ padding: "10px 16px", background: active ? `${accentColor}18` : "#f1f5f9", border: `1.5px solid ${active ? accentColor : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.2s", outline: "none", minWidth: 140 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: active ? accentColor : "#000000", fontFamily: "'Inter', sans-serif" }}>{l.label}</div>
            <div style={{ fontSize: "0.78rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{l.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

function StepNav({ step, setStep, maxSteps, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", margin: "12px 0" }}>
      <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step <= 1} style={{ padding: "6px 14px", background: step <= 1 ? "#f1f5f9" : `${color}18`, border: `1px solid ${step <= 1 ? "#e2e8f0" : color}`, borderRadius: 8, color: step <= 1 ? "#94a3b8" : color, cursor: step <= 1 ? "default" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600 }}>← Prev</button>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: maxSteps }, (_, i) => (
          <div key={i} onClick={() => setStep(i + 1)} style={{ width: 10, height: 10, borderRadius: "50%", background: i + 1 <= step ? color : "#e2e8f0", border: `1.5px solid ${color}`, cursor: "pointer", transition: "all 0.2s" }} />
        ))}
      </div>
      <button onClick={() => setStep(Math.min(maxSteps, step + 1))} disabled={step >= maxSteps} style={{ padding: "6px 14px", background: step >= maxSteps ? "#f1f5f9" : `${color}18`, border: `1px solid ${step >= maxSteps ? "#e2e8f0" : color}`, borderRadius: 8, color: step >= maxSteps ? "#94a3b8" : color, cursor: step >= maxSteps ? "default" : "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600 }}>Next →</button>
    </div>
  );
}

function SectionLabel({ number, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: "0.88rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontWeight: 700, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px" }}>{number}</span>
      <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#000000", fontFamily: "'Inter', sans-serif" }}>{text}</span>
    </div>
  );
}

// Notation tooltip: parse advanced text and add interactive tooltips for matched patterns
function NotationTooltip({ text, glossary }) {
  if (!glossary || glossary.length === 0) return <span>{text}</span>;
  const sorted = [...glossary].sort((a, b) => b.pattern.length - a.pattern.length);
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let earliest = null;
    let earliestIdx = remaining.length;
    for (const entry of sorted) {
      const idx = remaining.indexOf(entry.pattern);
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        earliest = entry;
      }
    }
    if (!earliest) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (earliestIdx > 0) parts.push(<span key={key++}>{remaining.slice(0, earliestIdx)}</span>);
    parts.push(<NotationTerm key={key++} pattern={earliest.pattern} tip={earliest.tip} />);
    remaining = remaining.slice(earliestIdx + earliest.pattern.length);
  }
  return <span>{parts}</span>;
}

function NotationTerm({ pattern, tip }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span onClick={() => setShow(!show)} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ borderBottom: "1.5px dotted #7c3aed", cursor: "help", color: "#6d28d9", padding: "0 1px" }}>{pattern}</span>
      {show && (
        <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px", fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.45, maxWidth: 320, minWidth: 180, zIndex: 100, whiteSpace: "normal", boxShadow: "0 4px 20px #00000015", pointerEvents: "none" }}>{tip}</span>
      )}
    </span>
  );
}

// ============================================================
// AI PROMPT
// ============================================================
function getSystemPrompt(design, level) {
  const lvl = level.id === "colloquial" ? "Plain Language (everyday language, no jargon, use analogies)" : level.id === "basic" ? "Basic (standard evaluation terminology, clear and precise)" : "Advanced (formal notation, estimating equations, identification assumptions)";
  return `You are an expert program evaluation instructor teaching comparison group designs.

Design: ${design.full}
Difficulty: ${lvl}

Return ONLY valid JSON (no markdown, no backticks):
{
  "scenario": "2-3 sentences framing the student's program in the context of this design.",
  "steps": [
    { "title": "Step title", "explanation": "Detailed explanation at the ${level.id} level", "analogy": "Optional real-world analogy or null" }
  ],
  "dataNeeds": "What specific data they would need to implement this design.",
  "strengths": "Why this design works (or does not) for their evaluation.",
  "limitations": "What this design cannot address and what stronger design to consider."
}

Include 4-5 steps walking through how to apply this design to their specific program.
${level.id === "colloquial" ? "Use everyday language. Avoid all jargon. Use lots of real-world analogies." : level.id === "basic" ? "Use standard evaluation terminology. Be clear and precise." : "Use formal notation and reference estimating equations. Discuss identification assumptions."}`;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ComparisonGroupLab() {
  const [design, setDesign] = useState(null);
  const [level, setLevel] = useState(null);
  const [step, setStep] = useState(1);
  const [program, setProgram] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [chartSeed] = useState(() => Math.floor(Math.random() * 100000));
  const resultRef = useRef(null);

  useEffect(() => { setStep(1); }, [design]);
  useEffect(() => { setResult(null); setError(null); }, [design, level]);
  useEffect(() => { if (design) setProgram(DEFAULT_PROGRAMS[design.id] || ""); }, [design]);

  const accentColor = design?.color || "#2563eb";
  const levelKey = level?.id || "colloquial";

  const handleGenerate = async () => {
    if (!design || !level || !program.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: program.trim(), systemPrompt: getSystemPrompt(design, level) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      let text = data.result || "";
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(text);
      setResult(parsed);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderDefinition = (text) => {
    if (levelKey === "advanced") return <NotationTooltip text={text} glossary={NOTATION_GLOSSARY} />;
    return <span>{text}</span>;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7f4", color: "#000000", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, #00000006 1px, transparent 0)`, backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: 10 }}>
          <a href="/class7" style={{ fontSize: "1.1rem", color: "#000000", fontFamily: "'Inter', sans-serif", textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 10, fontWeight: 600 }}>← Class 7: Bias in Impact Evaluation</a>
          <span style={{ fontSize: "0.85rem", color: "#000000", fontFamily: "'Inter', sans-serif", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontWeight: 600 }}>Class 7</span>
        </div>

        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Interactive Learning Platform (Work in Progress)</div>
          <h1 style={{ fontSize: "clamp(1.9rem, 4.5vw, 2.8rem)", fontWeight: 700, color: "#000000", lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.01em" }}>Comparison Group Designs</h1>
          <p style={{ fontSize: "1.1rem", color: "#000000", fontFamily: "'Inter', sans-serif", maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>Each design below builds on the previous one's limitations. They range from the simplest (naïve) to the most robust (DiD). The strength meter shows how well each design controls for bias.</p>
        </header>

        {/* Step 1: Choose Design */}
        <section style={{ marginBottom: "2.5rem" }}>
          <SectionLabel number="1" text="Choose a comparison group design" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {DESIGNS.map((d) => (<DesignCard key={d.id} design={d} selected={design} onClick={setDesign} />))}
          </div>
          {design && (
            <div style={{ textAlign: "center", marginTop: 16, padding: "14px 20px", background: `${design.color}08`, borderRadius: 10, border: `1px solid ${design.color}20` }}>
              <span style={{ fontSize: "1rem", color: design.color, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontStyle: "italic" }}>{design.tagline}</span>
              {design.addressesBias.length > 0 && (
                <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>
                  <span style={{ fontWeight: 700 }}>Addresses:</span>{" "}
                  {design.addressesBias.map((b, i) => (
                    <span key={i} style={{ display: "inline-block", padding: "2px 10px", margin: "2px 3px", background: `${design.color}12`, border: `1px solid ${design.color}30`, borderRadius: 20, fontSize: "0.82rem", color: design.color, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{b}</span>
                  ))}
                </div>
              )}
              {design.addressesBias.length === 0 && (
                <div style={{ marginTop: 8, fontSize: "0.85rem", color: "#dc2626", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>⚠ Vulnerable to all biases. Use only as a starting benchmark.</div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 12 }}>
                <span style={{ fontSize: "0.85rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontWeight: 700, marginRight: 4, lineHeight: "28px" }}>Key concepts:</span>
                {design.keyConcepts.map((c, i) => (
                  <span key={i} style={{ display: "inline-block", padding: "4px 12px", background: `${design.color}12`, border: `1px solid ${design.color}30`, borderRadius: 20, fontSize: "0.85rem", color: design.color, fontFamily: "'Inter', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Set Level */}
        {design && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="2" text="Set the difficulty level" />
            <LevelSelector level={level} setLevel={setLevel} accentColor={accentColor} />
            {design.definitions && level && (
              <div style={{ marginTop: 16, padding: "16px 20px", background: "#ffffff", border: "1px solid #000000", borderRadius: 12, fontSize: "1rem", lineHeight: 1.7, color: "#000000", fontFamily: "'Inter', sans-serif" }}>
                {renderDefinition(design.definitions[level.id])}
                {level.id === "advanced" && <div style={{ marginTop: 10, fontSize: "0.78rem", color: "#000000", fontFamily: "'Inter', sans-serif", fontStyle: "italic" }}>Hover or tap dotted terms for plain-language explanations.</div>}
              </div>
            )}
          </section>
        )}

        {/* Interactive Chart */}
        {design && level && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="3" text="Explore how it works" />
            <div style={{ background: "#ffffff", border: "1px solid #000000", borderRadius: 14, padding: "20px 16px 16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "0.82rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>{design.full} · {level.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.75rem", color: "#000000", fontFamily: "'Inter', sans-serif" }}>Strength:</span>
                  <StrengthMeter level={design.strength} color={design.color} />
                </div>
              </div>
              <DesignChart designId={design.id} step={step} seed={chartSeed + DESIGNS.indexOf(design) * 1000} />
              <StepNav step={step} setStep={setStep} maxSteps={3} color={design.color} />
              <div style={{ textAlign: "center", fontSize: "0.88rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.5, padding: "0 10px" }}>{CHART_STEPS[design.id]?.[step - 1]}</div>
            </div>
          </section>
        )}

        {/* Step 4: Describe Program */}
        {design && level && (
          <section style={{ marginBottom: "2.5rem", animation: "fadeIn 0.4s ease" }}>
            <SectionLabel number="4" text="Describe your program" />
            <p style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginBottom: 12, lineHeight: 1.5 }}>Enter a program, policy, or intervention. The AI will explain how to apply the {design.full.toLowerCase()} design to your evaluation.</p>
            <textarea value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Describe a program you want to evaluate..." rows={3} style={{ width: "100%", padding: "14px 16px", background: "#ffffff", border: "1px solid #000000", borderRadius: 12, color: "#000000", fontSize: "1rem", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={handleGenerate} disabled={loading || !program.trim()} style={{ padding: "12px 32px", background: loading ? "#e2e8f0" : accentColor, color: loading ? "#64748b" : "#ffffff", border: "none", borderRadius: 10, fontSize: "1rem", fontWeight: 700, fontFamily: "'Inter', sans-serif", cursor: loading ? "default" : "pointer", transition: "all 0.2s" }}>
                {loading ? "Generating..." : "Generate Explanation"}
              </button>
            </div>
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${accentColor}30`, borderTopColor: accentColor, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "#000000", fontSize: "1rem", fontFamily: "'Inter', sans-serif" }}>Building your personalized explanation...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: "16px 20px", background: "#fef2f2", border: "1px solid #7f1d1d", borderRadius: 12, color: "#991b1b", fontSize: "0.95rem", fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>Error: {error}</div>
        )}

        {/* Result */}
        {result && (
          <section ref={resultRef} style={{ animation: "fadeIn 0.5s ease", marginBottom: "2rem" }}>
            <SectionLabel number="5" text="Your personalized explanation" />
            <div style={{ background: "#ffffff", border: `1px solid #000000`, borderRadius: 14, padding: "24px 20px" }}>
              {result.scenario && <p style={{ fontSize: "1rem", color: "#000000", fontFamily: "'Inter', sans-serif", marginTop: 0, marginBottom: 16, lineHeight: 1.6, fontStyle: "italic", borderLeft: `3px solid ${accentColor}40`, paddingLeft: 14 }}>{renderDefinition(result.scenario)}</p>}

              {result.steps?.map((s, i) => (
                <div key={i} style={{ marginBottom: 16, padding: "14px 16px", background: `${accentColor}06`, border: `1px solid ${accentColor}15`, borderRadius: 10 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: accentColor, fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>Step {i + 1}: {s.title}</div>
                  <div style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.65 }}>{renderDefinition(s.explanation)}</div>
                  {s.analogy && <div style={{ marginTop: 8, padding: "10px 14px", background: "#f1f5f920", borderLeft: `3px solid ${accentColor}50`, borderRadius: "0 8px 8px 0", fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.6, fontStyle: "italic" }}>💡 {s.analogy}</div>}
                </div>
              ))}

              {/* Data Needs, Strengths, Limitations */}
              {[
                { key: "dataNeeds", label: "Data you would need", icon: "📋" },
                { key: "strengths", label: "Strengths for your evaluation", icon: "✓" },
                { key: "limitations", label: "Limitations to consider", icon: "⚠" },
              ].map(({ key, label, icon }) => result[key] && (
                <div key={key} style={{ marginTop: 14, padding: "14px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#000000", fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>{icon} {label}</div>
                  <div style={{ fontSize: "0.95rem", color: "#000000", fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>{renderDefinition(result[key])}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus { border-color: ${accentColor} !important; }
        button:hover:not(:disabled) { opacity: 0.9; }
      `}</style>
    </div>
  );
}
