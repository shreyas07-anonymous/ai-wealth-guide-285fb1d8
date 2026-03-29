import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowRight, ArrowLeft, Eye, EyeOff, Lightbulb, X, Home } from "lucide-react";
import { ETTrendingTax } from "@/components/ETTrending";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import MentorChat from "@/components/MentorChat";
import { formatINR } from "@/components/NumberInput";

function taxEquivalent(amount: number): string {
  if (amount >= 100000) return `${Math.round(amount / 25000)} international flights`;
  if (amount >= 50000) return `${Math.round(amount / 12000)} months of groceries`;
  if (amount >= 20000) return `${Math.round(amount / 500)} months of Netflix`;
  if (amount >= 5000) return `a nice weekend trip`;
  return "a few good dinners out";
}

function calcOldRegime(income: number, deductions: { c80: number; d80: number; nps: number; hra: number; homeLoan: number }) {
  const totalDeductions = Math.min(deductions.c80, 150000) + Math.min(deductions.d80, 75000) + Math.min(deductions.nps, 50000) + deductions.hra + Math.min(deductions.homeLoan, 200000);
  const standardDeduction = 50000;
  const taxableIncome = Math.max(0, income - totalDeductions - standardDeduction);
  let tax = 0;
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
  if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
  if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.05;
  if (taxableIncome <= 500000) tax = 0;
  const cess = tax * 0.04;
  return { taxableIncome, tax, cess, total: tax + cess, deductionsUsed: totalDeductions + standardDeduction };
}

function calcOldTaxAtDeduction(income: number, totalDed: number) {
  const standardDeduction = 50000;
  const taxableIncome = Math.max(0, income - totalDed - standardDeduction);
  let tax = 0;
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.3;
  if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
  if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.05;
  if (taxableIncome <= 500000) tax = 0;
  return tax + tax * 0.04;
}

function calcNewRegime(income: number) {
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, income - standardDeduction);
  let tax = 0;
  const slabs = [
    { limit: 400000, rate: 0 }, { limit: 800000, rate: 0.05 }, { limit: 1200000, rate: 0.10 },
    { limit: 1600000, rate: 0.15 }, { limit: 2000000, rate: 0.20 }, { limit: 2400000, rate: 0.25 },
    { limit: Infinity, rate: 0.30 },
  ];
  let prev = 0;
  for (const slab of slabs) {
    if (taxableIncome > prev) { tax += (Math.min(taxableIncome, slab.limit) - prev) * slab.rate; prev = slab.limit; }
  }
  if (taxableIncome <= 1200000) tax = 0;
  if (taxableIncome > 1200000 && taxableIncome <= 1275000) tax = Math.min(tax, taxableIncome - 1200000);
  const cess = tax * 0.04;
  return { taxableIncome, tax, cess, total: tax + cess };
}

interface MissedDeduction {
  whatItIs: string;
  techName: string;
  youSave: string;
  costToYou: string;
  timeToSetUp: string;
  maxBenefit: number;
}

function getMissedDeductions(deductions: { c80: number; d80: number; nps: number; hra: number; homeLoan: number }, taxRate: number): MissedDeduction[] {
  const missed: MissedDeduction[] = [];
  if (deductions.c80 < 150000) {
    const gap = 150000 - deductions.c80;
    const save = Math.round(gap * taxRate);
    missed.push({
      whatItIs: "Investments that grow your money AND reduce your tax — like EPF, PPF, tax-saving mutual funds, or LIC premium.",
      techName: "Section 80C", youSave: formatINR(save) + "/year",
      costToYou: `${formatINR(gap)} goes into investments — but you get ${formatINR(save)} back as tax savings. Net: ${formatINR(gap - save)} actually invested.`,
      timeToSetUp: "10 minutes online via Groww, Zerodha, or your bank",
      maxBenefit: gap,
    });
  }
  if (deductions.nps < 50000) {
    const gap = 50000 - deductions.nps;
    const save = Math.round(gap * taxRate);
    missed.push({
      whatItIs: "A pension account the government runs. You put money in, they give you a tax discount, AND your money grows for retirement.",
      techName: "NPS — Section 80CCD(1B)", youSave: formatINR(save) + "/year",
      costToYou: `${formatINR(gap)} goes into pension — ${formatINR(save)} back in tax. Net: ${formatINR(gap - save)} locked in pension.`,
      timeToSetUp: "10 minutes online at enps.nsdl.com",
      maxBenefit: gap,
    });
  }
  if (deductions.d80 < 25000) {
    const gap = 25000 - deductions.d80;
    const save = Math.round(gap * taxRate);
    missed.push({
      whatItIs: "Your health insurance premium. The government lets you deduct it from taxable income — and you get health protection too.",
      techName: "Health Insurance — Section 80D", youSave: formatINR(save) + "/year",
      costToYou: `₹15,000-25,000/year for a ₹5-10L cover. You save ${formatINR(save)} in tax — it practically pays for itself.`,
      timeToSetUp: "15 minutes via PolicyBazaar or directly from insurer website",
      maxBenefit: gap,
    });
  }
  if (deductions.hra === 0) {
    missed.push({
      whatItIs: "If you pay rent and get HRA in your salary, a portion is tax-deductible. This could significantly shift your break-even.",
      techName: "HRA (House Rent Allowance)", youSave: "Varies",
      costToYou: "No extra cost — just claim what you're already paying as rent.",
      timeToSetUp: "Submit rent receipts to your employer",
      maxBenefit: 0,
    });
  }
  if (deductions.homeLoan < 200000 && deductions.homeLoan === 0) {
    missed.push({
      whatItIs: "If you took a home loan and pay EMI, the interest part of your EMI is deductible up to ₹2,00,000/year.",
      techName: "Home Loan Interest — Section 24(b)", youSave: formatINR(Math.round(200000 * taxRate)) + "/year (max)",
      costToYou: "No extra cost — you're already paying the interest. Just claim the deduction.",
      timeToSetUp: "Get interest certificate from your bank",
      maxBenefit: 200000,
    });
  }
  return missed;
}

export default function TaxOptimizer() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";
  const [simpleMode, setSimpleMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"compare" | "breakeven">("compare");
  const [income, setIncome] = useState(profile.monthlyIncome > 0 ? String(profile.monthlyIncome * 12) : "");
  const [c80, setC80] = useState(String(profile.deductions.c80 || ""));
  const [d80, setD80] = useState(String(profile.deductions.d80 || ""));
  const [nps, setNps] = useState(String(profile.deductions.nps || ""));
  const [hra, setHra] = useState(String(profile.deductions.hra || ""));
  const [homeLoan, setHomeLoan] = useState(String(profile.deductions.homeLoanInterest || ""));
  const [result, setResult] = useState<any>(null);
  const [teachMe, setTeachMe] = useState<string | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);

  const handleCalculate = () => {
    const inc = parseFloat(income) || 0;
    const ded = { c80: parseFloat(c80) || 0, d80: parseFloat(d80) || 0, nps: parseFloat(nps) || 0, hra: parseFloat(hra) || 0, homeLoan: parseFloat(homeLoan) || 0 };
    const oldR = calcOldRegime(inc, ded);
    const newR = calcNewRegime(inc);
    const savings = Math.abs(oldR.total - newR.total);
    const bestRegime = oldR.total <= newR.total ? "Old" : "New";
    const taxRate = inc > 1500000 ? 0.3 : inc > 1000000 ? 0.2 : inc > 500000 ? 0.1 : 0;
    const missed = getMissedDeductions(ded, taxRate);
    setResult({ oldR, newR, savings, bestRegime, missed, income: inc, taxRate });
  };

  // Break-even data
  const breakEvenData = useMemo(() => {
    if (!result) return null;
    const inc = result.income;
    const newTax = result.newR.total;
    const data = [];
    let breakEvenDed = 0;
    for (let ded = 0; ded <= 450000; ded += 25000) {
      const oldTax = calcOldTaxAtDeduction(inc, ded);
      data.push({ deductions: ded, old: Math.round(oldTax), new: Math.round(newTax) });
      if (breakEvenDed === 0 && oldTax <= newTax) breakEvenDed = ded;
    }
    return { data, breakEvenDed };
  }, [result]);

  const currentTotalDed = (parseFloat(c80) || 0) + (parseFloat(d80) || 0) + (parseFloat(nps) || 0) + (parseFloat(hra) || 0) + (parseFloat(homeLoan) || 0);

  // Dynamic break-even verdict
  const verdict = useMemo(() => {
    if (!result || !breakEvenData) return null;
    const beDed = (breakEvenData as any).breakEvenDed;
    const oldSaving = result.newR.total - result.oldR.total;
    const gap = beDed - currentTotalDed;

    if (oldSaving > 0) {
      return { color: "green" as const, emoji: "🟢", title: "You've crossed the break-even!", message: `Old Regime is saving you ${formatINR(oldSaving)} this year. Stick with it.` };
    } else if (gap > 0 && gap <= 50000) {
      return { color: "yellow" as const, emoji: "🟡", title: "You are close to the break-even.", message: `Adding ${formatINR(gap)} more in deductions (like NPS or 80C) will make Old Regime better for you.` };
    } else {
      return { color: "blue" as const, emoji: "🔵", title: "New Regime is clearly better for your income.", message: `To benefit from Old Regime, you'd need ${formatINR(Math.abs(gap))} more in deductions — which may not be realistic.` };
    }
  }, [result, breakEvenData, currentTotalDed]);

  const verdictStyles = {
    green: "bg-score-excellent/10 border-score-excellent/40 text-score-excellent",
    yellow: "bg-score-fair/10 border-score-fair/40 text-score-fair",
    blue: "bg-primary/10 border-primary/40 text-primary",
  };

  const verdictBorderStyles = {
    green: "border-l-4 border-l-score-excellent",
    yellow: "border-l-4 border-l-score-fair",
    blue: "border-l-4 border-l-primary",
  };

  // Chart rendering component
  const BreakEvenChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={(breakEvenData as any).data}>
        <XAxis dataKey="deductions" tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} stroke="hsl(215 20% 55%)" fontSize={10} />
        <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} stroke="hsl(215 20% 55%)" fontSize={10} />
        <Tooltip formatter={(v: number) => formatINR(v)} labelFormatter={(v: number) => `Deductions: ${formatINR(v)}`}
          contentStyle={{ background: "hsl(222 41% 10%)", border: "1px solid hsl(222 30% 18%)", borderRadius: "8px", fontSize: "12px" }} />
        <Line type="monotone" dataKey="old" name="Old Regime" stroke="hsl(210 100% 60%)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="new" name="New Regime" stroke="hsl(142 76% 46%)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
        {(breakEvenData as any).breakEvenDed > 0 && (
          <ReferenceLine x={(breakEvenData as any).breakEvenDed} stroke="hsl(43 96% 56%)" strokeDasharray="4 4"
            label={{ value: "📍 Break-even", fill: "hsl(43 96% 56%)", fontSize: 11, position: "top" }} />
        )}
        <ReferenceLine x={currentTotalDed} stroke="hsl(0 72% 51%)" strokeDasharray="4 4"
          label={{ value: "📍 You", fill: "hsl(0 72% 51%)", fontSize: 11, position: "top" }} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-primary hover:underline font-medium">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <span>/</span>
        <span className="text-foreground font-semibold">Tax Optimizer</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Tax Optimizer</h1>
        <p className="text-muted-foreground">FY 2025–26 — Find out how much tax you can legally save</p>
        <button onClick={() => setSimpleMode(!simpleMode)}
          className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:text-primary/80 transition-colors">
          {simpleMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {simpleMode ? "Showing plain English" : "Showing technical terms"} — tap to switch
        </button>
      </div>

      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Your yearly income (before any tax)</Label>
            <Input type="text" inputMode="numeric" placeholder="e.g. 1200000 or 12L" value={income} onChange={(e) => setIncome(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Tax-saving investments" : "80C Investments"} (₹)</Label>
              <Input type="text" inputMode="numeric" placeholder="Max 1,50,000" value={c80} onChange={(e) => setC80(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
              {simpleMode && <p className="text-xs text-muted-foreground mt-1">EPF, PPF, ELSS mutual funds, LIC, school fees</p>}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Health insurance premium" : "80D Health Insurance"} (₹)</Label>
              <Input type="text" inputMode="numeric" placeholder="Max 75,000" value={d80} onChange={(e) => setD80(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Pension plan (NPS)" : "NPS 80CCD(1B)"} (₹)</Label>
              <Input type="text" inputMode="numeric" placeholder="Max 50,000" value={nps} onChange={(e) => setNps(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
              {simpleMode && <p className="text-xs text-muted-foreground mt-1">Extra ₹50K deduction most people miss!</p>}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Rent tax benefit" : "HRA Exemption"} (₹)</Label>
              <Input type="text" inputMode="numeric" placeholder="Calculated HRA" value={hra} onChange={(e) => setHra(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Home loan interest paid" : "Section 24 Home Loan Interest"} (₹)</Label>
              <Input type="text" inputMode="numeric" placeholder="Max 2,00,000" value={homeLoan} onChange={(e) => setHomeLoan(e.target.value.replace(/[^0-9.,kKlLcCrR]/g, ""))} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
          </div>
          <Button variant="hero" className="w-full" onClick={handleCalculate}>
            Find My Tax Savings <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 bg-secondary/30 rounded-xl p-1">
            <button onClick={() => setActiveTab("compare")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "compare" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
              ⚖️ Compare
            </button>
            <button onClick={() => setActiveTab("breakeven")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === "breakeven" ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
              📊 Break-Even
            </button>
          </div>

          {activeTab === "compare" && (
            <>
              {/* Tax Savings Story */}
              <Card className="bg-primary/5 border-primary/30 mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-foreground mb-2">
                    {name}, right now you're paying <strong>{formatINR(Math.min(result.oldR.total, result.newR.total))}</strong> in tax per year with the best option.
                  </p>
                  {result.savings > 0 && (
                    <p className="text-sm text-muted-foreground">
                      The {result.bestRegime === "Old" ? "Option A (with deductions)" : "Option B (simpler, fewer deductions)"} saves you <strong className="text-primary">{formatINR(result.savings)}</strong> — that's enough for {taxEquivalent(result.savings)}!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Regime Comparison with Tap to Enlarge chart */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card className={`border-2 transition-colors ${result.bestRegime === "Old" ? "border-primary shadow-gold" : "border-border/50"} bg-gradient-card`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold">{simpleMode ? "Option A — With Deductions" : "Old Regime"}</h3>
                      {result.bestRegime === "Old" && <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">🏆 Saves More</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxable Income</span><span>{formatINR(result.oldR.taxableIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Deductions Used</span><span className="text-score-excellent">{formatINR(result.oldR.deductionsUsed)}</span></div>
                      <div className="flex justify-between pt-2 border-t border-border/50 font-semibold"><span>Total Tax</span><span className="text-primary">{formatINR(result.oldR.total)}</span></div>
                    </div>
                    {simpleMode && <p className="text-xs text-muted-foreground mt-3">More work to set up, but can save more if you have investments, insurance, home loan, etc.</p>}
                  </CardContent>
                </Card>

                <Card className={`border-2 transition-colors ${result.bestRegime === "New" ? "border-primary shadow-gold" : "border-border/50"} bg-gradient-card`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold">{simpleMode ? "Option B — Simple & Flat" : "New Regime"}</h3>
                      {result.bestRegime === "New" && <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">🏆 Saves More</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxable Income</span><span>{formatINR(result.newR.taxableIncome)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Standard Deduction</span><span className="text-score-excellent">₹75,000</span></div>
                      <div className="flex justify-between pt-2 border-t border-border/50 font-semibold"><span>Total Tax</span><span className="text-primary">{formatINR(result.newR.total)}</span></div>
                    </div>
                    {simpleMode && <p className="text-xs text-muted-foreground mt-3">Zero paperwork. Lower rates but no extra deductions. Best if you don't invest much yet.</p>}
                  </CardContent>
                </Card>
              </div>

              {/* Savings */}
              <Card className="bg-gradient-card border-border/50 mb-6">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-1">You save with {simpleMode ? (result.bestRegime === "Old" ? "Option A" : "Option B") : result.bestRegime + " Regime"}</p>
                  <p className="font-display text-3xl font-bold text-gradient-gold">{formatINR(result.savings)}</p>
                  <p className="text-xs text-muted-foreground mt-1">That's {formatINR(Math.round(result.savings / 12))}/month extra</p>
                </CardContent>
              </Card>

              {/* Missed Deductions with Teach Me */}
              {result.missed.length > 0 && (
                <Card className="bg-gradient-card border-border/50 mb-6">
                  <CardContent className="p-6">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" /> {simpleMode ? "Tax savings you're missing" : "Missed Deductions"}
                    </h3>
                    <div className="space-y-4">
                      {result.missed.map((m: MissedDeduction, i: number) => (
                        <div key={i} className="border border-border/50 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium">{simpleMode ? m.whatItIs.slice(0, 60) + "..." : m.techName}</p>
                              <p className="text-sm text-primary font-semibold">Save {m.youSave}</p>
                            </div>
                            <button onClick={() => setTeachMe(teachMe === m.techName ? null : m.techName)}
                              className="text-xs px-3 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0">
                              {teachMe === m.techName ? "Close" : "Teach me"}
                            </button>
                          </div>
                          {teachMe === m.techName && (
                            <div className="mt-3 bg-secondary/30 rounded-lg p-3 space-y-2 text-xs text-muted-foreground">
                              <p><strong className="text-foreground">What is this?</strong> {m.whatItIs}</p>
                              <p><strong className="text-foreground">What it costs you:</strong> {m.costToYou}</p>
                              <p><strong className="text-foreground">How long to set up:</strong> {m.timeToSetUp}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tax Saving To-Do */}
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold mb-3">✅ Your tax-saving to-do list for FY 2025-26</h3>
                  <div className="space-y-2">
                    {result.missed.map((m: MissedDeduction, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">Set up {m.techName} — saves {m.youSave} | ⏱ {m.timeToSetUp}</span>
                      </div>
                    ))}
                    {result.missed.length === 0 && (
                      <p className="text-sm text-muted-foreground">Great job, {name}! You're using most available deductions. 🎉</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Break-Even Tab — DYNAMIC TEXT-BASED INSIGHTS */}
          {activeTab === "breakeven" && breakEvenData && (
            <div className="space-y-4 mb-6">
              {/* 3A: Verdict Banner */}
              {verdict && (
                <Card className={`border ${verdictStyles[verdict.color]}`}>
                  <CardContent className="p-5">
                    <p className="font-display font-semibold text-lg mb-1">{verdict.emoji} {verdict.title}</p>
                    <p className="text-sm opacity-90">{verdict.message}</p>
                  </CardContent>
                </Card>
              )}

              {/* 3B: Gap Metric Block */}
              <Card className={`bg-card border-border/50 ${verdict ? verdictBorderStyles[verdict.color] : ""}`}>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-display font-semibold flex items-center gap-2">💡 The Verdict</h3>
                  <p className="text-sm text-foreground">
                    At your income of <strong>{formatINR(result.income)}</strong>, the <strong>{result.bestRegime} Regime</strong> is the mathematical winner.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><strong className="text-foreground">Why?</strong> To make the Old Regime better, you need total deductions of at least <strong className="text-primary">{formatINR((breakEvenData as any).breakEvenDed)}</strong>. You are currently at <strong>{formatINR(currentTotalDed)}</strong>.</p>
                    {(breakEvenData as any).breakEvenDed > currentTotalDed ? (
                      <p><strong className="text-foreground">How to switch the lead:</strong> If you invest an additional <strong className="text-primary">{formatINR((breakEvenData as any).breakEvenDed - currentTotalDed)}</strong> in tax-saving instruments, the Old Regime will start saving you money.</p>
                    ) : (
                      <p className="text-score-excellent font-medium">✅ You have already crossed the break-even. Your current deductions are working in your favour.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 3C: Missing Deductions Checklist */}
              <Card className="bg-card border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-display font-semibold mb-3">Deductions You Haven't Added Yet</h3>
                  {result.missed.length > 0 ? (
                    <div className="space-y-3">
                      {result.missed.map((m: MissedDeduction, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-full border-2 border-score-fair/50 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-foreground">{m.techName}</p>
                            <p className="text-xs text-muted-foreground">{m.whatItIs.slice(0, 80)}...</p>
                            {m.maxBenefit > 0 && <p className="text-xs text-primary mt-0.5">→ Potential saving: {m.youSave}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-score-excellent">✅ You've claimed all major deductions. Your plan looks optimized.</p>
                  )}
                </CardContent>
              </Card>

              {/* Chart with Tap to Enlarge */}
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="font-display font-semibold mb-4">📊 Visual: Old vs New Regime at different deduction levels</h3>
                  <div className="h-64 mb-4 cursor-pointer relative" onClick={() => setGraphExpanded(true)}>
                    <BreakEvenChart />
                    <div className="absolute bottom-2 right-2 bg-background/70 text-foreground text-xs px-2 py-1 rounded-full border border-border/50">
                      🔍 Tap to enlarge
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Old Regime</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-score-excellent inline-block" style={{ borderTop: "2px dashed" }} /> New Regime</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <ETTrendingTax />
        </>
      )}

      {/* Fullscreen graph overlay */}
      {graphExpanded && breakEvenData && (
        <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setGraphExpanded(false)}>
          <div className="bg-card rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-auto border border-border/50" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-foreground">Tax Comparison — Break-Even Chart</h3>
              <button onClick={() => setGraphExpanded(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96">
              <BreakEvenChart />
            </div>
          </div>
        </div>
      )}

      <MentorChat />
    </div>
  );
}
