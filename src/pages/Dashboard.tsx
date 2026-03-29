import { Link } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Flame, Heart, TrendingUp, Shield, ExternalLink } from "lucide-react";
import { formatINR } from "@/components/NumberInput";

function getGrade(score: number) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

const ET_URL = "https://economictimes.indiatimes.com/?from=mdr";

function getETNews(profile: ReturnType<typeof useUserProfile>["profile"]) {
  const news: { headline: string; impact: string; impactColor: string; tag: string }[] = [];

  if (profile.loans.types.includes("home")) {
    news.push({ headline: "RBI holds Repo Rate at 6.5% — Your home loan EMI stays unchanged for now.", impact: "Your EMI won't change this quarter", impactColor: "text-score-excellent", tag: "2 hours ago" });
  }

  const annual = profile.monthlyIncome * 12;
  if (annual > 1500000) {
    news.push({ headline: "Budget 2025: Section 80C limit likely to be raised to ₹2L — Here's how it would affect you.", impact: `Could save you additional ${formatINR(50000 * 0.3)}/year in tax`, impactColor: "text-score-excellent", tag: "5 hours ago" });
  }

  if (profile.safetyNets.mutualFunds === "Yes") {
    news.push({ headline: "Nifty hits new all-time high — LTCG harvesting window open.", impact: "Consider booking ₹1L in long-term gains tax-free", impactColor: "text-primary", tag: "1 day ago" });
  }

  if (profile.goals.some((g) => g.id === "home")) {
    news.push({ headline: "Home loan rates expected to drop by Q2 — Lock in now or wait?", impact: "Waiting could save ₹2-5L over loan tenure", impactColor: "text-score-good", tag: "3 hours ago" });
  }

  if (news.length < 3) {
    news.push({ headline: "NPS subscribers cross 7 Cr — why the extra ₹50K deduction is India's best-kept tax secret.", impact: "You could save ₹15,600/year with NPS", impactColor: "text-primary", tag: "6 hours ago" });
  }

  return news.slice(0, 3);
}

export default function Dashboard() {
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";
  const etNews = getETNews(profile);

  const savingsRate = profile.monthlyIncome > 0 ? Math.round(((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100) : 0;
  const quickScore = Math.min(100, Math.max(0, Math.round(savingsRate * 1.5 + 20)));

  const actions = [
    { icon: Calculator, label: "Tax Optimizer", desc: "Find tax savings", path: "/tax", color: "text-primary", bg: "bg-primary/10" },
    { icon: Flame, label: "FIRE Plan", desc: "Freedom number", path: "/fire", color: "text-destructive", bg: "bg-destructive/10" },
    { icon: Heart, label: "Life Events", desc: "Get advice", path: "/life-event", color: "text-teal", bg: "bg-teal/10" },
    { icon: TrendingUp, label: "Full Score", desc: "11 dimensions", path: "/score", color: "text-score-excellent", bg: "bg-score-excellent/10" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome, {name}! 👋</h1>
          <p className="text-sm text-muted-foreground">Your financial dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-score-excellent" />
          <span className="text-xs text-muted-foreground">Private</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-primary">{getGrade(quickScore)}</p>
            <p className="text-xs text-muted-foreground">Grade</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-foreground">{quickScore}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-score-excellent">{savingsRate}%</p>
            <p className="text-xs text-muted-foreground">Savings</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-foreground">{formatINR(profile.monthlyIncome * 12)}</p>
            <p className="text-xs text-muted-foreground">Income/yr</p>
          </CardContent>
        </Card>
      </div>

      {/* ET News Feed */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-[#E2621B] flex items-center justify-center">
            <span className="text-white text-xs font-bold">ET</span>
          </div>
          <h2 className="font-display font-semibold text-sm">News filtered for your portfolio</h2>
        </div>
        <div className="space-y-3">
          {etNews.map((news, i) => (
            <a key={i} href={ET_URL} target="_blank" rel="noopener noreferrer">
              <Card className="bg-gradient-card border-border/50 hover:border-[#E2621B]/30 transition-colors cursor-pointer mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded bg-[#E2621B]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#E2621B] text-xs font-bold">ET</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{news.headline}</p>
                      <p className={`text-xs ${news.impactColor} mt-1 font-medium`}>{news.impact}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{news.tag}</span>
                        <span className="text-xs text-[#E2621B] flex items-center gap-1">
                          Read on ET <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Powered by ET Intelligence</p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {actions.map((action) => (
          <Link key={action.path} to={action.path}>
            <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all hover:shadow-elevated">
              <CardContent className="p-5 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mb-3`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <p className="font-display font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-secondary/30 border-border/50">
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Our AI gives you a head start — built on real Indian tax law and SEBI guidelines.
            For big decisions, please confirm with a CA or SEBI-registered advisor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
