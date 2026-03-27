import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Eye, EyeOff, Lightbulb } from "lucide-react";
import { FinancialTerm } from "@/components/FinancialTooltip";

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

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
    });
  }
  return missed;
}

export default function TaxOptimizer() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";
  const [simpleMode, setSimpleMode] = useState(true);
  const [income, setIncome] = useState(profile.monthlyIncome > 0 ? String(profile.monthlyIncome * 12) : "");
  const [c80, setC80] = useState(String(profile.deductions.c80 || ""));
  const [d80, setD80] = useState(String(profile.deductions.d80 || ""));
  const [nps, setNps] = useState(String(profile.deductions.nps || ""));
  const [hra, setHra] = useState(String(profile.deductions.hra || ""));
  const [homeLoan, setHomeLoan] = useState(String(profile.deductions.homeLoanInterest || ""));
  const [result, setResult] = useState<any>(null);
  const [teachMe, setTeachMe] = useState<string | null>(null);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

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
            <Input type="number" placeholder="e.g. 1200000" value={income} onChange={(e) => setIncome(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Tax-saving investments" : "80C Investments"} (₹)</Label>
              <Input type="number" placeholder="Max 1,50,000" value={c80} onChange={(e) => setC80(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
              {simpleMode && <p className="text-xs text-muted-foreground mt-1">EPF, PPF, ELSS mutual funds, LIC, school fees</p>}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Health insurance premium" : "80D Health Insurance"} (₹)</Label>
              <Input type="number" placeholder="Max 75,000" value={d80} onChange={(e) => setD80(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Pension plan (NPS)" : "NPS 80CCD(1B)"} (₹)</Label>
              <Input type="number" placeholder="Max 50,000" value={nps} onChange={(e) => setNps(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
              {simpleMode && <p className="text-xs text-muted-foreground mt-1">Extra ₹50K deduction most people miss!</p>}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Rent tax benefit" : "HRA Exemption"} (₹)</Label>
              <Input type="number" placeholder="Calculated HRA" value={hra} onChange={(e) => setHra(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div className="col-span-2">
              <Label className="text-sm text-muted-foreground">{simpleMode ? "Home loan interest paid" : "Section 24 Home Loan Interest"} (₹)</Label>
              <Input type="number" placeholder="Max 2,00,000" value={homeLoan} onChange={(e) => setHomeLoan(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
          </div>
          <Button variant="hero" className="w-full" onClick={handleCalculate}>
            Find My Tax Savings <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {result && (
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

          {/* Regime Comparison */}
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
    </div>
  );
}
