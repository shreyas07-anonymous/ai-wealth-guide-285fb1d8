import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calculator, Flame, Heart, ArrowRight, Shield, Brain, IndianRupee } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Money Health Score",
    description: "Get your financial fitness score across 8 key dimensions with AI-powered insights.",
    path: "/score",
    color: "text-score-excellent",
    bgColor: "bg-score-excellent/10",
  },
  {
    icon: Calculator,
    title: "Tax Optimizer",
    description: "Old vs New regime comparison for FY 2025-26. Find missed deductions instantly.",
    path: "/tax",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Flame,
    title: "FIRE Planner",
    description: "Calculate your Financial Independence number and build a SIP roadmap to get there.",
    path: "/fire",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: Heart,
    title: "Life Event Advisor",
    description: "Smart financial advice for bonuses, marriage, babies, job changes and more.",
    path: "/life-event",
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
];

const stats = [
  { value: "₹0–5Cr+", label: "All Income Levels" },
  { value: "11", label: "Financial Dimensions" },
  { value: "100%", label: "India Compliant" },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium">
              <Brain className="w-4 h-4" />
              AI-Powered Financial Intelligence
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
              Your Money,{" "}
              <span className="text-gradient-gold">Made Simple</span>
              <br />
              for India
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              No jargon. No confusion. Just clear, actionable advice to make your money work harder — whether you earn ₹15K or ₹5Cr a month.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/onboarding">
                  Check My Financial Health
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/tax">How Much Tax Can I Save?</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 md:gap-16 pt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display text-2xl md:text-3xl font-bold text-gradient-gold">
                    {stat.value}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-3">
            Complete Financial <span className="text-gradient-gold">Toolkit</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Four powerful modules designed specifically for Indian personal finance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {features.map((feature) => (
            <Link key={feature.path} to={feature.path} className="group">
              <Card className="h-full bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300 group-hover:shadow-elevated">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Get started <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto glass-card rounded-2xl p-8 text-center">
          <div className="flex justify-center gap-6 mb-4">
            <Shield className="w-8 h-8 text-teal" />
            <IndianRupee className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold mb-2">
            Built on Indian Financial Laws
          </h3>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Every recommendation is grounded in Income Tax Act 1961, SEBI guidelines, and RBI regulations.
            No generic advice — only actionable, legally compliant strategies with real ₹ values.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>AI Money Mentor — Smart Financial Guidance for Every Indian</p>
          <p className="mt-1 text-xs">Not financial advice. Consult a certified financial planner for personalized decisions.</p>
        </div>
      </footer>
    </div>
  );
}
