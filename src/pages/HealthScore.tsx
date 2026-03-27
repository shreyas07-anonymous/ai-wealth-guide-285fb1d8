import { useState, useMemo } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ───── scoring logic ───── */
interface DimensionResult {
  id: string;
  plainEnglishLabel: string;
  whatThisMeans: string;
  score: number;
  weight: number;
  yourSituation: string;
  exactTarget: string;
  howToGetThere: string[];
}

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

function getBarColor(score: number) {
  if (score >= 70) return "bg-score-excellent";
  if (score >= 50) return "bg-score-fair";
  return "bg-score-poor";
}

export default function HealthScore() {
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const name = profile.firstName || "Friend";

  const dimensions = useMemo(() => {
    const d: DimensionResult[] = [];
    const monthlyIncome = profile.monthlyIncome;
    const monthlyExpenses = profile.monthlyExpenses;
    const sixMonths = monthlyExpenses * 6;

    // 1. Emergency Fund (15%)
    const emMap: Record<string, number> = { "None": 0, "1-2 months": 30, "3-5 months": 70, "6+ months": 100 };
    const emScore = emMap[profile.safetyNets.emergencyMonths] ?? 0;
    d.push({
      id: "emergency", plainEnglishLabel: "Emergency Savings Buffer", weight: 15,
      whatThisMeans: "Money kept aside for sudden job loss, medical crisis, or unexpected expenses.",
      score: emScore,
      yourSituation: emScore >= 70 ? `You have a solid emergency buffer. Great job, ${name}!` : emScore > 0 ? "You've started, but your safety net isn't thick enough yet." : "You have no emergency savings — this is your #1 priority.",
      exactTarget: `Save ${formatINR(sixMonths)} (6 months of your expenses)`,
      howToGetThere: ["Open a separate savings account or liquid fund", `Set up auto-transfer of ${formatINR(Math.round(sixMonths / 12))}/month`, "Don't touch this money for anything except real emergencies"],
    });

    // 2. Insurance (20%)
    let insScore = 0;
    if (profile.safetyNets.healthInsurance === "Yes" || profile.safetyNets.healthInsurance === "Employer covers me") insScore += 40;
    if (profile.safetyNets.termInsurance === "Yes") insScore += 60;
    else if (profile.safetyNets.termInsurance === "No") insScore += 0;
    d.push({
      id: "insurance", plainEnglishLabel: "Protection Coverage", weight: 20,
      whatThisMeans: "Insurance that protects your family's finances if something bad happens — hospital bills or worse.",
      score: Math.min(100, insScore),
      yourSituation: insScore >= 80 ? "You're well protected." : insScore >= 40 ? "You have some coverage but gaps remain." : "You're financially exposed — one bad event could wipe out your savings.",
      exactTarget: `₹1 Cr term insurance + ₹10L+ health cover`,
      howToGetThere: ["Get term life insurance (10x annual income) — costs just ₹700-1000/month", "Get personal health insurance even if employer covers you", "Add critical illness cover if budget allows"],
    });

    // 3. Investments (20%)
    const behMap: Record<string, number> = { spender: 5, saver: 20, fd_rd: 35, sip: 65, active: 85, clueless: 10 };
    const invScore = behMap[profile.currentBehavior] ?? 20;
    d.push({
      id: "investments", plainEnglishLabel: "Investment Health", weight: 20,
      whatThisMeans: "How well your money is growing beyond a savings account — beating inflation over time.",
      score: invScore,
      yourSituation: invScore >= 65 ? "You're investing — now let's check if it's optimized." : invScore >= 35 ? "FDs are safe but barely beat inflation. Time to explore mutual funds." : "Your money is sitting idle and losing value to inflation every day.",
      exactTarget: `Invest at least ${formatINR(Math.round(monthlyIncome * 0.2))}/month (20% of income)`,
      howToGetThere: ["Start a ₹500/month SIP (monthly investment) in a Nifty 50 index fund", "Use apps like Groww, Zerodha Coin, or Kuvera — takes 10 minutes to set up", "Increase SIP by 10% every year when salary grows"],
    });

    // 4. Debt Management (15%)
    const emiRatio = monthlyIncome > 0 ? (profile.loans.totalEMI / monthlyIncome) * 100 : 0;
    let debtScore = 100;
    if (profile.loans.types.includes("credit_card")) debtScore -= 30;
    if (emiRatio > 50) debtScore = 10;
    else if (emiRatio > 40) debtScore = 30;
    else if (emiRatio > 30) debtScore = 50;
    else if (emiRatio > 10) debtScore = 70;
    if (!profile.loans.types.length) debtScore = 100;
    d.push({
      id: "debt", plainEnglishLabel: "Debt & Loan Health", weight: 15,
      whatThisMeans: "How much of your income goes toward loan repayments — and whether any loans are hurting you.",
      score: Math.max(0, debtScore),
      yourSituation: debtScore >= 80 ? "Your debt is under control." : debtScore >= 50 ? `${Math.round(emiRatio)}% of income goes to EMIs — manageable but watch it.` : `${Math.round(emiRatio)}% of income goes to EMIs — this is too high.`,
      exactTarget: "Keep total EMIs below 30% of take-home income",
      howToGetThere: ["Pay off credit card dues first (36-42% interest!)", "Consider prepaying high-interest personal loans", "Don't take new loans until existing ones are manageable"],
    });

    // 5. Tax Planning (15%)
    const totalDed = profile.deductions.c80 + profile.deductions.d80 + profile.deductions.nps + profile.deductions.hra + profile.deductions.homeLoanInterest;
    const maxPossible = 150000 + 50000 + 75000 + 200000;
    const taxScore = Math.min(100, Math.round((totalDed / maxPossible) * 100));
    d.push({
      id: "tax", plainEnglishLabel: "Tax Savings", weight: 15,
      whatThisMeans: "How well you're using legal tax deductions to keep more money in your pocket.",
      score: taxScore,
      yourSituation: taxScore >= 70 ? "You're using most available deductions — check if you can squeeze out more." : taxScore >= 30 ? "You're leaving tax savings on the table." : "You're likely paying lakhs more in tax than needed.",
      exactTarget: `Maximize deductions to save up to ${formatINR(Math.round(maxPossible * 0.3))} in tax`,
      howToGetThere: ["Max out 80C (₹1.5L) with ELSS or PPF", "Open NPS for extra ₹50K deduction", "Get health insurance to claim 80D"],
    });

    // 6. Retirement Planning (10%)
    const hasRetPlan = profile.safetyNets.epf === "Yes" || profile.safetyNets.nps === "Yes" || profile.safetyNets.mutualFunds === "Yes";
    const retScore = hasRetPlan ? (profile.safetyNets.nps === "Yes" ? 80 : 50) : 10;
    d.push({
      id: "retirement", plainEnglishLabel: "Retirement Readiness", weight: 10,
      whatThisMeans: "Whether you're building enough savings to live comfortably when you stop earning.",
      score: retScore,
      yourSituation: retScore >= 70 ? "You're on track for retirement." : retScore >= 40 ? "You have basics (EPF) but need more active planning." : "You haven't started planning for retirement — every year of delay costs you lakhs.",
      exactTarget: `Build a retirement fund of ${formatINR(monthlyExpenses * 12 * 25)} (25x annual expenses)`,
      howToGetThere: ["Your EPF is a start but not enough on its own", "Start NPS for extra tax benefit + retirement savings", "Add equity SIPs for long-term wealth building"],
    });

    // 7. Income Diversification (5%)
    const incDivScore = profile.employmentType === "freelancer" || profile.employmentType === "business" ? 70 : 20;
    d.push({
      id: "income_div", plainEnglishLabel: "Income Sources", weight: 5,
      whatThisMeans: "How many ways you earn money — more sources = more financial security.",
      score: incDivScore,
      yourSituation: incDivScore >= 60 ? "You have multiple income streams — great for security." : "You depend on a single salary — risky if that stops.",
      exactTarget: "Build at least one additional income source",
      howToGetThere: ["Explore freelancing in your skill area", "Consider rental income or dividend-paying investments", "Start a small side project or content creation"],
    });

    // 8. Spending Habits (5%)
    const spendScore = profile.savingsRate >= 30 ? 90 : profile.savingsRate >= 20 ? 70 : profile.savingsRate >= 10 ? 40 : 15;
    const adjustedSpend = profile.currentBehavior === "clueless" ? Math.max(0, spendScore - 20) : spendScore;
    d.push({
      id: "spending", plainEnglishLabel: "Spending Habits", weight: 5,
      whatThisMeans: "How much of your income you save vs spend — and whether you track where your money goes.",
      score: adjustedSpend,
      yourSituation: adjustedSpend >= 70 ? `You save ${profile.savingsRate}% of income — that's solid!` : adjustedSpend >= 40 ? `You save ${profile.savingsRate}% — try to get this above 20%.` : "You're spending almost everything you earn.",
      exactTarget: "Save at least 20% of take-home income every month",
      howToGetThere: ["Track spending for 1 month — you'll find ₹3,000-8,000 in surprise expenses", "Set up auto-transfer to savings on salary day", "Cut 1-2 subscriptions you don't actively use"],
    });

    // 9. Goal Alignment (5%)
    const hasGoalSavings = profile.safetyNets.mutualFunds === "Yes" && profile.goals.length > 0;
    const goalScore = hasGoalSavings ? 70 : profile.goals.length > 0 ? 30 : 10;
    d.push({
      id: "goals", plainEnglishLabel: "Goal Alignment", weight: 5,
      whatThisMeans: "Whether your investments are actually aimed at your life goals, or just random.",
      score: goalScore,
      yourSituation: goalScore >= 60 ? "Your goals and investments are reasonably aligned." : goalScore >= 30 ? "You have goals but no dedicated savings for them." : "Set clear financial goals — it makes saving 2x more effective.",
      exactTarget: "Create one SIP per major life goal",
      howToGetThere: ["Pick your top goal and calculate how much it costs", "Start a dedicated SIP just for that goal", "Review goal progress every 6 months"],
    });

    // 10. Knowledge & Awareness (5%)
    let knowScore = 50;
    if (profile.safetyNets.nps === "Never heard of it") knowScore -= 15;
    if (profile.safetyNets.termInsurance === "Not sure what this is") knowScore -= 15;
    if (profile.currentBehavior === "active") knowScore += 30;
    if (profile.currentBehavior === "sip") knowScore += 15;
    if (profile.deductions.unknowns.length > 2) knowScore -= 10;
    d.push({
      id: "knowledge", plainEnglishLabel: "Financial Awareness", weight: 5,
      whatThisMeans: "How familiar you are with basic financial tools and concepts — not a test, just helps us adjust our advice.",
      score: Math.max(10, Math.min(100, knowScore)),
      yourSituation: knowScore >= 60 ? "You know the basics — let's go deeper." : "No worries if this is new — that's exactly why we're here.",
      exactTarget: "Understand the 5 financial basics: emergency fund, insurance, SIP, tax deductions, EPF",
      howToGetThere: ["We'll explain every term in plain English as we go", "Start with understanding SIP — it's the single most powerful tool", "Read one financial tip per day — we'll show them to you"],
    });

    return d;
  }, [profile]);

  const totalScore = useMemo(() => {
    let weighted = 0, totalWeight = 0;
    dimensions.forEach((d) => { weighted += d.score * d.weight; totalWeight += d.weight; });
    return Math.round(weighted / totalWeight);
  }, [dimensions]);

  const { grade, label, color } = getGrade(totalScore);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (totalScore / 100) * circumference;

  // Insights
  const weakest = [...dimensions].sort((a, b) => a.score - b.score).slice(0, 3);
  const strongest = [...dimensions].sort((a, b) => b.score - a.score).slice(0, 2);

  const oneThingThisWeek = weakest[0]?.howToGetThere[0] || "Start tracking your expenses for one week.";
  const oneThingThisMonth = weakest[0]?.howToGetThere[1] || weakest[1]?.howToGetThere[0] || "Set up one SIP.";
  const oneThingThisYear = weakest[0]?.howToGetThere[2] || weakest[1]?.howToGetThere[1] || "Build 6 months emergency fund.";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Personalized greeting */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">{name}, here's your financial health report</h1>
        <p className="text-muted-foreground">Scored across {dimensions.length} dimensions of financial wellness</p>
      </div>

      {/* Score Circle */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative w-40 h-40 mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-secondary" />
              <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"
                className={`${getScoreColor(totalScore)} animate-score-fill`}
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-bold">{totalScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className={`font-display text-2xl font-bold ${color}`}>Grade {grade} — {label}</div>
        </CardContent>
      </Card>

      {/* Key Strengths */}
      <Card className="bg-gradient-card border-border/50 mb-4">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold mb-3">💪 What you're doing well</h3>
          {strongest.map((d) => (
            <div key={d.id} className="flex items-start gap-2 text-sm mb-2">
              <CheckCircle2 className="w-4 h-4 text-score-excellent mt-0.5 shrink-0" />
              <span className="text-muted-foreground"><strong className="text-foreground">{d.plainEnglishLabel}:</strong> {d.yourSituation}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Biggest Opportunity */}
      <Card className="bg-primary/5 border-primary/30 mb-4">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold mb-2 text-primary">🎯 Your biggest opportunity</h3>
          <p className="text-sm text-foreground mb-2"><strong>{weakest[0]?.plainEnglishLabel}:</strong> {weakest[0]?.yourSituation}</p>
          <p className="text-sm text-muted-foreground">Target: {weakest[0]?.exactTarget}</p>
        </CardContent>
      </Card>

      {/* Action Plan */}
      <Card className="bg-gradient-card border-border/50 mb-4">
        <CardContent className="p-6">
          <h3 className="font-display font-semibold mb-4">📋 Your action plan</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-primary font-semibold mb-1">⚡ THIS WEEK</p>
              <p className="text-sm text-muted-foreground">{oneThingThisWeek}</p>
            </div>
            <div>
              <p className="text-xs text-score-fair font-semibold mb-1">📅 THIS MONTH</p>
              <p className="text-sm text-muted-foreground">{oneThingThisMonth}</p>
            </div>
            <div>
              <p className="text-xs text-score-good font-semibold mb-1">🎯 THIS YEAR</p>
              <p className="text-sm text-muted-foreground">{oneThingThisYear}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Breakdown */}
      <Card className="bg-gradient-card border-border/50 mb-4">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-display font-semibold">📊 Full breakdown</h3>
          {dimensions.map((d) => (
            <div key={d.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">{d.plainEnglishLabel}</span>
                <span className={`font-medium ${d.score >= 70 ? "text-score-excellent" : d.score >= 50 ? "text-score-fair" : "text-score-poor"}`}>{d.score}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                <div className={`h-full rounded-full transition-all duration-700 ${getBarColor(d.score)}`} style={{ width: `${d.score}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{d.whatThisMeans}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Red Flags */}
      {weakest.filter((d) => d.score < 30).length > 0 && (
        <Card className="bg-score-critical/5 border-score-critical/30 mb-4">
          <CardContent className="p-6">
            <h3 className="font-display font-semibold mb-3 text-score-critical">🚨 Needs immediate attention</h3>
            {weakest.filter((d) => d.score < 30).map((d) => (
              <div key={d.id} className="mb-3">
                <p className="text-sm font-medium text-foreground">{d.plainEnglishLabel}</p>
                <p className="text-sm text-muted-foreground">{d.yourSituation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Encouragement */}
      <Card className="bg-gradient-card border-border/50 mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {name}, by completing this assessment you're already ahead of 95% of Indians who never check their financial health. {profile.biggestMistake ? `You mentioned "${profile.biggestMistake}" — that awareness is your strength now. ` : ""} Every expert was once a beginner. Let's build from here. 💪
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground px-4 mb-8">
        <p>Our analysis gives you a head start — it's built on real Indian tax law and SEBI guidelines. But for big decisions (selling property, starting a business, large investments), please confirm with a CA or SEBI-registered advisor. We tell you what to look into, they help you execute.</p>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="hero" onClick={() => navigate("/tax")}>Optimize My Taxes →</Button>
        <Button variant="hero-outline" onClick={() => navigate("/fire")}>Plan FIRE Journey →</Button>
      </div>
    </div>
  );
}
