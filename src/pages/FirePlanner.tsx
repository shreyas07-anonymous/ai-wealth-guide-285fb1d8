import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flame, ArrowLeft, TrendingUp, ChevronDown, ChevronUp, Home, Minus, Plus, Settings } from "lucide-react";
import { ETTrendingFIRE } from "@/components/ETTrending";
import MentorChat from "@/components/MentorChat";
import { formatINR } from "@/components/NumberInput";

function SliderWithButtons({ value, onChange, min, max, step: stepVal = 1, label, suffix = "" }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; label: string; suffix?: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-primary">{value}{suffix}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, +(value - stepVal).toFixed(1)))}
          className="w-9 h-9 rounded-full border-2 border-border/50 flex items-center justify-center text-muted-foreground hover:bg-secondary/50 transition" aria-label="Decrease">
          <Minus className="w-4 h-4" />
        </button>
        <input type="range" min={min} max={max} step={stepVal} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))} className="flex-1 accent-primary" />
        <button onClick={() => onChange(Math.min(max, +(value + stepVal).toFixed(1)))}
          className="w-9 h-9 rounded-full border-2 border-border/50 flex items-center justify-center text-muted-foreground hover:bg-secondary/50 transition" aria-label="Increase">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-0.5"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
    </div>
  );
}

function calculateFIRE(monthlyExpenses: number, currentAge: number, targetAge: number, currentSavings: number, inflation = 0.06, returns = 0.12, lifestyleMultiplier = 1) {
  const annualExpenses = monthlyExpenses * 12 * lifestyleMultiplier;
  const yearsToFIRE = Math.max(1, targetAge - currentAge);
  const futureAnnualExpenses = annualExpenses * Math.pow(1 + inflation, yearsToFIRE);
  const fireCorpus = futureAnnualExpenses * 25;
  const futureValueSavings = currentSavings * Math.pow(1 + returns, yearsToFIRE);
  const corpusGap = Math.max(0, fireCorpus - futureValueSavings);
  const monthlyRate = returns / 12;
  const months = yearsToFIRE * 12;
  const sipNeeded = months > 0 ? corpusGap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1) : 0;

  let stepUpSIP = sipNeeded * 0.5;
  for (let iter = 0; iter < 100; iter++) {
    let accumulated = 0;
    let currentSIP = stepUpSIP;
    for (let year = 0; year < yearsToFIRE; year++) {
      for (let month = 0; month < 12; month++) accumulated = (accumulated + currentSIP) * (1 + monthlyRate);
      currentSIP *= 1.10;
    }
    accumulated += futureValueSavings;
    if (Math.abs(accumulated - fireCorpus) < 1000) break;
    stepUpSIP *= fireCorpus / accumulated;
  }
  stepUpSIP = Math.max(0, stepUpSIP);

  const equityPercent = Math.max(30, Math.min(80, 100 - currentAge));
  return { fireCorpus, futureAnnualExpenses, futureValueSavings, corpusGap, sipNeeded: Math.max(0, sipNeeded), stepUpSIP, equityPercent, debtPercent: 100 - equityPercent, yearsToFIRE };
}

export default function FirePlanner() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";

  const [monthlyExpenses, setMonthlyExpenses] = useState(profile.monthlyExpenses > 0 ? String(profile.monthlyExpenses) : "");
  const [currentAge, setCurrentAge] = useState(profile.age > 0 ? String(profile.age) : "");
  const [targetAge, setTargetAge] = useState(profile.retirementAge > 0 ? String(profile.retirementAge) : "45");
  const [currentSavings, setCurrentSavings] = useState(() => {
    const total = profile.portfolio.reduce((s, p) => s + p.amount, 0);
    return total > 0 ? String(total) : "";
  });
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof calculateFIRE> | null>(null);
  const [showStressTest, setShowStressTest] = useState(false);
  const [stressInflation, setStressInflation] = useState(6);
  const [stressReturns, setStressReturns] = useState(12);
  const [stressLifestyle, setStressLifestyle] = useState(1);

  // Customizable assumptions
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [assumptions, setAssumptions] = useState({ stockGrowth: 12, safeReturns: 7, inflationRate: 6 });
  const isNonDefaultAssumptions = assumptions.stockGrowth !== 12 || assumptions.safeReturns !== 7 || assumptions.inflationRate !== 6;

  const handleCalculate = () => {
    setResult(calculateFIRE(
      parseFloat(monthlyExpenses) || 0,
      parseInt(currentAge) || 30,
      parseInt(targetAge) || 45,
      parseFloat(currentSavings) || 0,
      assumptions.inflationRate / 100,
      assumptions.stockGrowth / 100,
    ));
  };

  const progressPercent = result ? Math.min(100, Math.round((result.futureValueSavings / result.fireCorpus) * 100)) : 0;
  const numCurrentSavings = parseFloat(currentSavings) || 0;

  const whatIfExtra = useMemo(() => {
    if (!result || extraMonthly <= 0) return 0;
    const r = (assumptions.stockGrowth / 100) / 12;
    const n = result.yearsToFIRE * 12;
    return extraMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }, [result, extraMonthly, assumptions.stockGrowth]);

  const stressResult = useMemo(() => {
    if (!result) return null;
    return calculateFIRE(
      parseFloat(monthlyExpenses) || 0,
      parseInt(currentAge) || 30,
      parseInt(targetAge) || 45,
      parseFloat(currentSavings) || 0,
      stressInflation / 100,
      stressReturns / 100,
      stressLifestyle,
    );
  }, [result, stressInflation, stressReturns, stressLifestyle, monthlyExpenses, currentAge, targetAge, currentSavings]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-primary hover:underline font-medium">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <span>/</span>
        <span className="text-foreground font-semibold">FIRE Planner</span>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-destructive" />
          <h1 className="font-display text-3xl font-bold">Your Freedom Number</h1>
          {isNonDefaultAssumptions && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">🔬 Stress Test Mode</span>}
        </div>
        <p className="text-muted-foreground">The amount you need to never HAVE to work for money again</p>
      </div>

      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Monthly expenses (₹)</label>
              <Input type="text" inputMode="numeric" placeholder="e.g. 50000" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Total savings so far (₹)</label>
              <Input type="text" inputMode="numeric" placeholder="e.g. 1000000" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Your age</label>
              <Input type="text" inputMode="numeric" placeholder="e.g. 28" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Want to be free by age</label>
              <Input type="text" inputMode="numeric" placeholder="e.g. 45" value={targetAge} onChange={(e) => setTargetAge(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
          </div>

          {/* Customizable Assumptions */}
          <button onClick={() => setShowAssumptions(!showAssumptions)}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
            <Settings className="w-4 h-4" /> Customize Assumptions
            {showAssumptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showAssumptions && (
            <div className="space-y-3 bg-secondary/30 rounded-xl p-4">
              <SliderWithButtons value={assumptions.stockGrowth} onChange={(v) => setAssumptions(p => ({ ...p, stockGrowth: v }))} min={6} max={18} step={0.5} label="Stock Market Growth" suffix="%" />
              <SliderWithButtons value={assumptions.safeReturns} onChange={(v) => setAssumptions(p => ({ ...p, safeReturns: v }))} min={4} max={10} step={0.5} label="Safe Investment Returns" suffix="%" />
              <SliderWithButtons value={assumptions.inflationRate} onChange={(v) => setAssumptions(p => ({ ...p, inflationRate: v }))} min={4} max={10} step={0.5} label="Inflation Rate" suffix="%" />
              <button onClick={() => setAssumptions({ stockGrowth: 12, safeReturns: 7, inflationRate: 6 })}
                className="text-xs text-muted-foreground hover:text-foreground">Reset to defaults</button>
            </div>
          )}

          <Button variant="hero" className="w-full" onClick={handleCalculate}>
            Calculate My Freedom Number <Flame className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Freedom Number Reveal */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">To never HAVE to work again, {name}, you need:</p>
              <p className="font-display text-5xl font-bold text-gradient-gold mb-3">{formatINR(result.fireCorpus)}</p>
              <p className="text-sm text-muted-foreground">That's your freedom number.</p>
            </CardContent>
          </Card>

          {/* Explainer */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <p className="text-sm text-foreground">
                <strong>What does this mean?</strong> If you save 25× your future yearly expenses (adjusted for inflation at {assumptions.inflationRate}%/year), you can live off the returns forever. At 4% safe withdrawal rate on {formatINR(result.fireCorpus)}, you get {formatINR(Math.round(result.fireCorpus * 0.04))}/year.
              </p>
            </CardContent>
          </Card>

          {/* Progress Bar with target marker */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your progress</span>
                <span className="font-semibold text-primary">{progressPercent}%</span>
              </div>
              <div className="relative w-full h-4 bg-secondary rounded-full overflow-visible mb-3">
                <div className="h-full bg-gradient-gold rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                {/* 100% target marker */}
                <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-foreground/40 rounded-full" style={{ left: "100%" }} />
              </div>
              <p className="text-sm text-muted-foreground">
                You have {formatINR(numCurrentSavings)} saved. {progressPercent < 5 ? "Everyone starts at zero — let's build from here!" : progressPercent < 25 ? "Good start! Keep the momentum." : progressPercent < 50 ? "You're making real progress!" : "You're well on your way! 🚀"}
              </p>
            </CardContent>
          </Card>

          {/* SIP Plan */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Fixed monthly investment</p>
                <p className="font-display text-2xl font-bold text-primary">{formatINR(result.sipNeeded)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Invest this same amount every month for {result.yearsToFIRE} years. At {assumptions.stockGrowth}% yearly growth, it becomes {formatINR(result.corpusGap)}.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Start smaller, grow 10%/year</p>
                <p className="font-display text-2xl font-bold text-teal">{formatINR(result.stepUpSIP)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Start at {formatINR(result.stepUpSIP)}/month, increase 10% each year as salary grows.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stress Test */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <button onClick={() => setShowStressTest(!showStressTest)} className="flex items-center justify-between w-full">
                <h3 className="font-display font-semibold flex items-center gap-2">🔬 Stress Test Your Plan</h3>
                {showStressTest ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {showStressTest && (
                <div className="mt-4 space-y-4">
                  <SliderWithButtons value={stressInflation} onChange={setStressInflation} min={4} max={12} step={0.5} label="Inflation Rate" suffix="%" />
                  <SliderWithButtons value={stressReturns} onChange={setStressReturns} min={6} max={18} step={0.5} label="Investment Returns" suffix="%" />
                  <SliderWithButtons value={stressLifestyle} onChange={setStressLifestyle} min={1} max={3} step={0.25} label="Lifestyle Multiplier" suffix="x" />

                  {stressResult && (
                    <Card className="bg-secondary/30 border-border/50">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">New FIRE Number</p>
                            <p className="font-display font-bold text-primary">{formatINR(stressResult.fireCorpus)}</p>
                            <p className="text-xs text-muted-foreground">
                              {stressResult.fireCorpus > result.fireCorpus ? `+${formatINR(stressResult.fireCorpus - result.fireCorpus)} more` : stressResult.fireCorpus < result.fireCorpus ? `${formatINR(result.fireCorpus - stressResult.fireCorpus)} less` : "Same"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Monthly SIP Needed</p>
                            <p className="font-display font-bold text-foreground">{formatINR(stressResult.sipNeeded)}</p>
                            <p className="text-xs text-muted-foreground">
                              {stressResult.sipNeeded > result.sipNeeded ? `+${formatINR(stressResult.sipNeeded - result.sipNeeded)}/mo` : stressResult.sipNeeded < result.sipNeeded ? `-${formatINR(result.sipNeeded - stressResult.sipNeeded)}/mo` : "Same"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What If Calculator */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3">🤔 What if I could save a little more?</h3>
              <SliderWithButtons value={extraMonthly} onChange={setExtraMonthly} min={0} max={10000} step={500} label="Extra ₹/month" />
              {extraMonthly > 0 && (
                <Card className="bg-primary/5 border-primary/20 mt-3">
                  <CardContent className="p-3 text-sm text-foreground">
                    Just {formatINR(extraMonthly)} more per month adds <strong className="text-primary">{formatINR(whatIfExtra)}</strong> to your freedom fund over {result.yearsToFIRE} years!
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Asset Allocation */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Where to invest
              </h3>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-4">
                <div className="bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground" style={{ width: `${result.equityPercent}%` }}>
                  Stocks {result.equityPercent}%
                </div>
                <div className="bg-teal flex items-center justify-center text-xs font-medium text-accent-foreground" style={{ width: `${result.debtPercent}%` }}>
                  Safe {result.debtPercent}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-primary">Stocks & Equity ({result.equityPercent}%)</p>
                  <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                    <li>• Nifty 50 Index Fund</li>
                    <li>• Nifty Next 50</li>
                    <li>• International Fund</li>
                    <li>• ELSS (tax-saving, 3-year lock-in)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-teal">Safe & Stable ({result.debtPercent}%)</p>
                  <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                    <li>• PPF (government-backed)</li>
                    <li>• NPS (extra tax deduction)</li>
                    <li>• Debt Mutual Funds</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivation */}
          {profile.goals.length > 0 && (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {name}, you said you want to {profile.goals[0]?.label?.toLowerCase() || "be financially free"}.
                  {result.yearsToFIRE <= 20 ? ` That's ${result.yearsToFIRE} years away. ` : " "}
                  If you start {formatINR(result.stepUpSIP)}/month today, you'll have {formatINR(result.fireCorpus)} — enough to live on your own terms. 💪
                </p>
              </CardContent>
            </Card>
          )}

          {/* Assumptions */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-2 text-sm">Assumptions we used</h3>
              <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
                <div><p className="font-display text-lg font-bold text-foreground">{assumptions.stockGrowth}%</p><p>Stock market growth</p></div>
                <div><p className="font-display text-lg font-bold text-foreground">{assumptions.safeReturns}%</p><p>Safe investment returns</p></div>
                <div><p className="font-display text-lg font-bold text-foreground">{assumptions.inflationRate}%</p><p>Inflation rate</p></div>
              </div>
            </CardContent>
          </Card>

          <ETTrendingFIRE />
        </div>
      )}

      <MentorChat />
    </div>
  );
}
