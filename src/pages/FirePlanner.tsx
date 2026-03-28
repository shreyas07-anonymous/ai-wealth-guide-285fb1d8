import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flame, ArrowLeft, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { ETTrendingFIRE } from "@/components/ETTrending";
import MentorChat from "@/components/MentorChat";

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
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

  // Step-up SIP
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

  const handleCalculate = () => {
    setResult(calculateFIRE(
      parseFloat(monthlyExpenses) || 0,
      parseInt(currentAge) || 30,
      parseInt(targetAge) || 45,
      parseFloat(currentSavings) || 0,
    ));
  };

  const progressPercent = result ? Math.min(100, Math.round((result.futureValueSavings / result.fireCorpus) * 100)) : 0;
  const numCurrentSavings = parseFloat(currentSavings) || 0;

  // What-if calculation
  const whatIfExtra = useMemo(() => {
    if (!result || extraMonthly <= 0) return 0;
    const r = 0.12 / 12;
    const n = result.yearsToFIRE * 12;
    return extraMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
  }, [result, extraMonthly]);

  // Stress test calculation
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
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Flame className="w-6 h-6 text-destructive" />
          <h1 className="font-display text-3xl font-bold">Your Freedom Number</h1>
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
                <strong>What does this mean?</strong> If you save 25× your future yearly expenses (adjusted for inflation at 6%/year), you can live off the returns forever without touching the main amount. At 4% safe withdrawal rate on {formatINR(result.fireCorpus)}, you get {formatINR(Math.round(result.fireCorpus * 0.04))}/year.
              </p>
            </CardContent>
          </Card>

          {/* Progress Bar */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Your progress</span>
                <span className="font-semibold text-primary">{progressPercent}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-gold rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
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
                  Invest this same amount every month for {result.yearsToFIRE} years. At 12% yearly growth, it becomes {formatINR(result.corpusGap)}.
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
              <button
                onClick={() => setShowStressTest(!showStressTest)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="font-display font-semibold flex items-center gap-2">🔬 Stress Test Your Plan</h3>
                {showStressTest ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {showStressTest && (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Inflation Rate</span>
                      <span className="font-semibold text-primary">{stressInflation}%</span>
                    </div>
                    <input type="range" min={4} max={12} step={0.5} value={stressInflation}
                      onChange={(e) => setStressInflation(parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>4%</span><span>12%</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Investment Returns</span>
                      <span className="font-semibold text-primary">{stressReturns}%</span>
                    </div>
                    <input type="range" min={6} max={18} step={0.5} value={stressReturns}
                      onChange={(e) => setStressReturns(parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>6%</span><span>18%</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Lifestyle Multiplier</span>
                      <span className="font-semibold text-primary">{stressLifestyle}x</span>
                    </div>
                    <input type="range" min={1} max={3} step={0.25} value={stressLifestyle}
                      onChange={(e) => setStressLifestyle(parseFloat(e.target.value))}
                      className="w-full accent-primary" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>1x (same)</span><span>3x (upgrade)</span></div>
                  </div>

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
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-muted-foreground shrink-0">Extra ₹/month:</span>
                <input type="range" min={0} max={10000} step={500} value={extraMonthly}
                  onChange={(e) => setExtraMonthly(parseInt(e.target.value))}
                  className="flex-1 accent-primary" />
                <span className="text-sm font-semibold text-primary w-20 text-right">{formatINR(extraMonthly)}</span>
              </div>
              {extraMonthly > 0 && (
                <Card className="bg-primary/5 border-primary/20">
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
                    <li>• Nifty 50 Index Fund (top 50 companies)</li>
                    <li>• Nifty Next 50 (more growth potential)</li>
                    <li>• International Fund (US/global diversification)</li>
                    <li>• ELSS (tax-saving mutual fund, 3-year lock-in)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-teal">Safe & Stable ({result.debtPercent}%)</p>
                  <ul className="text-muted-foreground text-xs mt-1 space-y-0.5">
                    <li>• PPF (government-backed, tax-free returns)</li>
                    <li>• NPS (pension with extra tax deduction)</li>
                    <li>• Debt Mutual Funds (low risk, better than FD)</li>
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
                <div><p className="font-display text-lg font-bold text-foreground">12%</p><p>Stock market growth</p></div>
                <div><p className="font-display text-lg font-bold text-foreground">7%</p><p>Safe investment returns</p></div>
                <div><p className="font-display text-lg font-bold text-foreground">6%</p><p>Inflation rate</p></div>
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
