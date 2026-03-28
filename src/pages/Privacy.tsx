import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";

export default function Privacy() {
  const navigate = useNavigate();
  const { updateProfile, profile } = useUserProfile();
  const [showWhy, setShowWhy] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const handleContinue = () => {
    if (anonymous) updateProfile({ firstName: "User" });
    navigate("/onboarding");
  };

  const checks = [
    "Everything is processed in your browser session only",
    "We never store your income, expenses, or personal details",
    "No account required — no email, no phone number",
    "Your data is deleted when you close this tab",
    "AI analysis happens on encrypted servers",
    "We never sell data to banks, insurers, or advertisers",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Your data stays private</h1>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-6 space-y-3">
            {checks.map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-score-excellent mt-0.5">✅</span>
                <span className="text-foreground">{text}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <button
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors mx-auto"
        >
          {showWhy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Why do we ask for income data?
        </button>

        {showWhy && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-sm text-foreground">
              Without it, we can't calculate tax, suggest investments, or assess your plan.
              Like a doctor asking your age before prescribing medicine. 🩺
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Anonymous Mode</p>
            <p className="text-xs text-muted-foreground">Rounds income to nearest ₹25K in analysis</p>
          </div>
          <button
            onClick={() => setAnonymous(!anonymous)}
            className={`relative w-12 h-6 rounded-full transition-colors ${anonymous ? "bg-primary" : "bg-secondary"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${anonymous ? "translate-x-6" : "translate-x-0.5"}`} />
          </button>
        </div>

        {anonymous && (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-xs text-muted-foreground">
              🕶️ Anonymous Mode Active
            </span>
          </div>
        )}

        <Button variant="hero" className="w-full" size="lg" onClick={handleContinue}>
          I understand — Let's start <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Powered by ET Intelligence
        </p>
      </div>
    </div>
  );
}
