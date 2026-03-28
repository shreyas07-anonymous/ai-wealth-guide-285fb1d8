import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";
import NumberInput from "@/components/NumberInput";

function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function getGrade(score: number) {
  if (score >= 85) return { grade: "A", label: "Excellent", color: "text-score-excellent" };
  if (score >= 70) return { grade: "B", label: "Good", color: "text-score-good" };
  if (score >= 50) return { grade: "C", label: "Fair", color: "text-score-fair" };
  if (score >= 30) return { grade: "D", label: "Needs Work", color: "text-score-poor" };
  return { grade: "F", label: "Critical", color: "text-score-critical" };
}

function getScoreColor(score: number) {
  if (score >= 85) return "stroke-score-excellent";
  if (score >= 70) return "stroke-score-good";
  if (score >= 50) return "stroke-score-fair";
  if (score >= 30) return "stroke-score-poor";
  return "stroke-score-critical";
}

export default function QuickScore() {
  const navigate = useNavigate();
  const { updateProfile } = useUserProfile();

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [age, setAge] = useState(0);
  const [showScore, setShowScore] = useState(false);

  // Anomaly detection
  const incomeAnnualLikely = income > 500000;
  const expenseAnomaly = income > 100000 && expenses > 0 && (expenses / income) < 0.10;
  const expenseOverflow = expenses > income && income > 0;

  const [dismissedAnomaly, setDismissedAnomaly] = useState(false);
  const [dismissedAnnual, setDismissedAnnual] = useState(false);

  const handleCalculate = () => {
    updateProfile({ monthlyIncome: income, monthlyExpenses: expenses, age });
    setShowScore(true);
  };

  const handleUnlock = () => {
    navigate("/onboarding?continue=true");
  };

  // Quick score logic
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  const quickScore = Math.min(100, Math.max(0,
    (savingsRate >= 30 ? 40 : savingsRate >= 20 ? 30 : savingsRate >= 10 ? 20 : 10) +
    (age < 30 ? 30 : age < 40 ? 25 : age < 50 ? 20 : 15) +
    (income >= 100000 ? 20 : income >= 50000 ? 15 : 10)
  ));
  const { grade, label, color } = getGrade(quickScore);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (quickScore / 100) * circumference;

  const incomeChips = [
    { label: "₹25K", value: 25000 },
    { label: "₹50K", value: 50000 },
    { label: "₹1L", value: 100000 },
    { label: "₹2L", value: 200000 },
    { label: "₹5L", value: 500000 },
  ];

  const expenseChips = [
    { label: "₹10K", value: 10000 },
    { label: "₹25K", value: 25000 },
    { label: "₹50K", value: 50000 },
    { label: "₹1L", value: 100000 },
    { label: "₹2L", value: 200000 },
  ];

  const ageChips = [
    { label: "22", value: 22 },
    { label: "28", value: 28 },
    { label: "35", value: 35 },
    { label: "45", value: 45 },
    { label: "55", value: 55 },
  ];

  if (showScore) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg min-h-screen">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold mb-2">Here's your quick snapshot 📊</h1>
        </div>

        <Card className="bg-gradient-card border-border/50 mb-6">
          <CardContent className="p-8 flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-secondary" />
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"
                  className={`${getScoreColor(quickScore)} animate-score-fill`}
                  strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl font-bold">{quickScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <div className={`font-display text-2xl font-bold ${color}`}>Grade {grade} — {label}</div>
            <p className="text-sm text-muted-foreground mt-2">
              You save {savingsRate}% of your income. {savingsRate >= 20 ? "That's solid! 💪" : "There's room to grow. 📈"}
            </p>
          </CardContent>
        </Card>

        {/* Locked features */}
        <div className="space-y-3 mb-6">
          {[
            { label: "Tax Optimizer — Find deductions you're missing", icon: "🧾" },
            { label: "FIRE Freedom Number — Your retirement target", icon: "🔥" },
            { label: "Life Event Advisor — Smart money moves", icon: "💡" },
          ].map((item, i) => (
            <Card key={i} className="bg-secondary/30 border-border/50 opacity-60">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span>{item.icon}</span> {item.label}
                </span>
                <Lock className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button variant="hero" className="w-full" size="lg" onClick={handleUnlock}>
          Unlock Full Analysis — 12 more questions
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          Takes about 3 minutes. Your answers stay private.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg min-h-screen">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl font-bold mb-2">Quick Score ⚡</h1>
        <p className="text-muted-foreground text-sm">3 questions. 60 seconds. Your instant financial snapshot.</p>
      </div>

      <div className="flex gap-1 mb-8">
        {[0, 1, 2].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-secondary"}`} />
        ))}
      </div>

      <div className="space-y-6 mb-8">
        {step >= 0 && (
          <div className="space-y-3">
            <NumberInput
              label="Monthly take-home income"
              value={income}
              onChange={(v) => { setIncome(v); if (step === 0) setStep(1); }}
              quickOptions={incomeChips}
              hint="After all deductions — check your last salary SMS"
              min={1000}
              max={50000000}
            />
            {/* Annual income anomaly */}
            {incomeAnnualLikely && !dismissedAnnual && (
              <Card className="bg-score-fair/5 border-score-fair/30">
                <CardContent className="p-3 text-sm">
                  <p>Did you mean <strong>{formatINR(Math.round(income / 12))}/month</strong>? That would be {formatINR(income)} per year.</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setDismissedAnnual(true)} className="px-3 py-1 rounded-lg border border-border/50 text-xs hover:bg-secondary/50">Yes, it's monthly</button>
                    <button onClick={() => { setIncome(Math.round(income / 12)); setDismissedAnnual(true); }} className="px-3 py-1 rounded-lg border border-primary/30 text-xs text-primary hover:bg-primary/10">Convert to monthly</button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step >= 1 && (
          <div className="space-y-3">
            <NumberInput
              label="Monthly expenses (rent, food, bills, everything)"
              value={expenses}
              onChange={(v) => { setExpenses(v); if (step === 1) setStep(2); }}
              quickOptions={expenseChips}
              min={500}
            />
            {/* Expense anomaly */}
            {expenseAnomaly && !dismissedAnomaly && (
              <Card className="bg-score-fair/5 border-score-fair/30">
                <CardContent className="p-3 text-sm">
                  <p>⚠️ You're earning {formatINR(income)}/month but spending only {formatINR(expenses)}? That's a {Math.round((1 - expenses/income) * 100)}% savings rate. Is this correct?</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setDismissedAnomaly(true)} className="px-3 py-1 rounded-lg border border-border/50 text-xs hover:bg-secondary/50">Yes, that's correct</button>
                    <button onClick={() => { setExpenses(0); setDismissedAnomaly(true); }} className="px-3 py-1 rounded-lg border border-primary/30 text-xs text-primary hover:bg-primary/10">Let me fix it</button>
                  </div>
                </CardContent>
              </Card>
            )}
            {expenseOverflow && (
              <Card className="bg-score-critical/5 border-score-critical/30">
                <CardContent className="p-3 text-xs text-score-critical">
                  🚨 Your expenses ({formatINR(expenses)}) exceed your income ({formatINR(income)}). Please double-check.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step >= 2 && (
          <NumberInput
            label="Your age"
            value={age}
            onChange={setAge}
            prefix=""
            quickOptions={ageChips}
            showFormatted={false}
            min={18}
            max={85}
          />
        )}
      </div>

      {step >= 2 && age > 0 && income > 0 && expenses > 0 && (
        <Button variant="hero" className="w-full" size="lg" onClick={handleCalculate}>
          Get My Score <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
