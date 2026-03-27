import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile, GoalWithTimeline, PortfolioItem } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

/* ───── helpers ───── */
function formatINR(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>Question {current} of {total}</span>
        <span>{Math.round((current / total) * 100)}% complete</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-gradient-gold rounded-full transition-all duration-500" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function OptionCard({ selected, onClick, children, emoji }: { selected: boolean; onClick: () => void; children: React.ReactNode; emoji?: string }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selected ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/30 hover:bg-secondary/50"}`}>
      <span className="text-sm font-medium flex items-center gap-2">
        {emoji && <span className="text-lg">{emoji}</span>}
        {children}
      </span>
    </button>
  );
}

function ChipSelect({ options, selected, onToggle, multi = false }: { options: { id: string; label: string; emoji?: string }[]; selected: string[]; onToggle: (id: string) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onToggle(opt.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selected.includes(opt.id) ? "border-primary bg-primary/15 text-primary" : "border-border/50 bg-card hover:border-primary/30 text-muted-foreground"}`}
        >
          {opt.emoji && <span className="mr-1">{opt.emoji}</span>}{opt.label}
        </button>
      ))}
    </div>
  );
}

/* ───── employment types ───── */
const employmentTypes = [
  { id: "salaried_private", label: "I work at a company (IT, startup, MNC, etc.)", emoji: "💻" },
  { id: "salaried_govt", label: "I work for the government or a PSU", emoji: "🏛️" },
  { id: "self_employed", label: "I'm a doctor, CA, lawyer or professional", emoji: "⚕️" },
  { id: "business", label: "I run my own business", emoji: "🏪" },
  { id: "freelancer", label: "I work on projects for different clients", emoji: "🎯" },
  { id: "gig", label: "I drive cab, deliver food, or do gig tasks", emoji: "🛵" },
  { id: "nri", label: "I live and work abroad", emoji: "✈️" },
  { id: "retired", label: "I'm retired and living on savings/pension", emoji: "🌅" },
  { id: "homemaker", label: "I manage home — planning with family income", emoji: "🏠" },
];

const ageMessages: Record<string, string> = {
  "18-25": "Great — starting early is the biggest financial superpower! 🚀",
  "26-35": "The decade where habits get locked in. Perfect time for this. 💪",
  "36-45": "Mid-journey. Let's make sure you're on track. 🎯",
  "46-55": "The home stretch. Every decision matters more now. ⏰",
  "55+": "Let's make sure your money outlasts you. 🕊️",
};

function getAgeRange(age: number): string {
  if (age <= 25) return "18-25";
  if (age <= 35) return "26-35";
  if (age <= 45) return "36-45";
  if (age <= 55) return "46-55";
  return "55+";
}

const expenseCategories = [
  { id: "rent", label: "Rent / Home loan EMI", emoji: "🏠" },
  { id: "food", label: "Food & groceries", emoji: "🍱" },
  { id: "transport", label: "Transport", emoji: "🛵" },
  { id: "bills", label: "Phone, internet, OTT", emoji: "📱" },
  { id: "shopping", label: "Shopping, dining, fun", emoji: "👗" },
  { id: "health", label: "Medicine, doctor visits", emoji: "💊" },
  { id: "family", label: "Family support", emoji: "👨‍👩‍👧" },
];

const loanTypes = [
  { id: "home", label: "Home loan", emoji: "🏠" },
  { id: "car", label: "Car loan", emoji: "🚗" },
  { id: "education", label: "Education loan", emoji: "📚" },
  { id: "credit_card", label: "Credit card dues", emoji: "💳" },
  { id: "gadget", label: "Phone / gadget EMI", emoji: "📱" },
  { id: "personal", label: "Personal loan", emoji: "💸" },
  { id: "family", label: "Borrowed from family", emoji: "👨‍👩‍👧" },
];

const behaviorOptions = [
  { id: "spender", label: "I spend most of what I earn. I save almost nothing.", emoji: "💸" },
  { id: "saver", label: "I keep money in my savings account — that's my 'investment'.", emoji: "🏦" },
  { id: "fd_rd", label: "I have a few FDs or RDs — playing it safe.", emoji: "📊" },
  { id: "sip", label: "I invest in mutual funds/SIPs but I'm not sure if it's enough.", emoji: "📱" },
  { id: "active", label: "I actively invest — stocks, mutual funds, maybe crypto.", emoji: "📈" },
  { id: "clueless", label: "I honestly have no idea where my money goes.", emoji: "🤷" },
];

const worryOptions = [
  { id: "job_loss", label: "Not enough savings if I lose my job", emoji: "😟" },
  { id: "medical", label: "A medical emergency would wipe me out", emoji: "💊" },
  { id: "retirement", label: "Won't have enough money when I retire", emoji: "👴" },
  { id: "investments", label: "Not sure my investments will grow", emoji: "📉" },
  { id: "tax", label: "Paying too much tax", emoji: "🧾" },
  { id: "home", label: "Want to buy a home but can't figure out how", emoji: "🏠" },
  { id: "children", label: "Need to plan for children's future", emoji: "👶" },
  { id: "expenses", label: "Expenses keep rising, can't keep up", emoji: "💸" },
  { id: "investing_knowledge", label: "Don't understand investing at all", emoji: "📊" },
  { id: "debt", label: "Have debt I'm struggling to pay off", emoji: "💳" },
  { id: "dunno", label: "Don't even know what I should worry about", emoji: "🤷" },
];

const goalOptions = [
  { id: "home", label: "Buy a home", emoji: "🏠" },
  { id: "education", label: "Children's education", emoji: "🎓" },
  { id: "wedding", label: "Wedding", emoji: "💍" },
  { id: "travel", label: "Travel", emoji: "🌏" },
  { id: "car", label: "Buy a car or vehicle", emoji: "🚗" },
  { id: "early_retire", label: "Early retirement", emoji: "🏖️" },
  { id: "freedom", label: "Financial freedom", emoji: "🕊️" },
  { id: "business", label: "Start my own business", emoji: "💼" },
  { id: "parents", label: "Take care of parents", emoji: "👵" },
  { id: "health_fund", label: "Health emergency fund", emoji: "🏥" },
  { id: "wealth", label: "Just grow my wealth", emoji: "💎" },
];

const portfolioTypes = [
  { id: "mutual_funds", label: "Mutual Funds / SIPs", emoji: "📊" },
  { id: "fd", label: "Fixed Deposits", emoji: "🏦" },
  { id: "epf", label: "EPF / PF balance", emoji: "🏛️" },
  { id: "ppf", label: "PPF account", emoji: "📮" },
  { id: "property", label: "Property (not home)", emoji: "🏠" },
  { id: "gold", label: "Gold", emoji: "🥇" },
  { id: "nps", label: "NPS balance", emoji: "🏛️" },
  { id: "stocks", label: "Stocks", emoji: "📈" },
  { id: "crypto", label: "Crypto", emoji: "₿" },
  { id: "savings", label: "Savings account", emoji: "💰" },
];

const mistakeChips = [
  "Started investing earlier",
  "Took on too much debt",
  "Bought insurance I didn't need",
  "Trusted someone with my money",
  "Never learned how investing works",
  "Spent too much, saved too little",
];

/* ───── Main Component ───── */
export default function Onboarding() {
  const navigate = useNavigate();
  const { updateProfile, setOnboarded } = useUserProfile();
  const [step, setStep] = useState(0);

  // State for all 15 questions
  const [firstName, setFirstName] = useState("");
  const [employment, setEmployment] = useState("");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [cityType, setCityType] = useState("");
  const [expenses, setExpenses] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState<Record<string, string>>({});
  const [hasLoans, setHasLoans] = useState<boolean | null>(null);
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [totalEMI, setTotalEMI] = useState("");
  const [safetyNets, setSafetyNets] = useState({
    emergencyMonths: "", termInsurance: "", termCoverage: "",
    healthInsurance: "", healthCoverage: "", epf: "", nps: "",
    mutualFunds: "", sipAmount: "",
  });
  const [behavior, setBehavior] = useState("");
  const [deductions, setDeductions] = useState({ c80: "", d80: "", nps: "", hra: "", homeLoan: "" });
  const [deductionUnknowns, setDeductionUnknowns] = useState<string[]>([]);
  const [selectedWorries, setSelectedWorries] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<GoalWithTimeline[]>([]);
  const [retireAge, setRetireAge] = useState("55");
  const [portfolioItems, setPortfolioItems] = useState<Record<string, string>>({});
  const [selectedPortfolio, setSelectedPortfolio] = useState<string[]>([]);
  const [mistake, setMistake] = useState("");

  const totalSteps = 15;
  const numAge = parseInt(age) || 0;
  const numIncome = parseFloat(income) || 0;
  const numExpenses = parseFloat(expenses) || 0;
  const savingsRate = numIncome > 0 ? Math.round(((numIncome - numExpenses) / numIncome) * 100) : 0;

  const canNext = (): boolean => {
    switch (step) {
      case 0: return firstName.trim().length > 0;
      case 1: return employment !== "";
      case 2: return numAge >= 16 && numAge <= 80;
      case 3: return numIncome > 0;
      case 4: return cityType !== "";
      case 5: return numExpenses > 0;
      case 6: return hasLoans !== null;
      case 7: return true; // safety nets are optional
      case 8: return behavior !== "";
      case 9: return true; // deductions optional
      case 10: return selectedWorries.length > 0;
      case 11: return selectedGoals.length > 0;
      case 12: return parseInt(retireAge) > numAge;
      case 13: return true; // portfolio optional
      case 14: return true; // mistake optional
      default: return true;
    }
  };

  const handleFinish = () => {
    const expBreakdown: Record<string, number> = {};
    for (const [k, v] of Object.entries(breakdown)) {
      if (v) expBreakdown[k] = parseFloat(v) || 0;
    }

    updateProfile({
      firstName: firstName.trim(),
      employmentType: employment,
      age: numAge,
      monthlyIncome: numIncome,
      cityType,
      monthlyExpenses: numExpenses,
      expenseBreakdown: expBreakdown,
      loans: { types: selectedLoans, totalEMI: parseFloat(totalEMI) || 0 },
      safetyNets: {
        ...safetyNets,
        sipAmount: parseFloat(safetyNets.sipAmount) || 0,
      },
      currentBehavior: behavior,
      deductions: {
        c80: parseFloat(deductions.c80) || 0,
        d80: parseFloat(deductions.d80) || 0,
        nps: parseFloat(deductions.nps) || 0,
        hra: parseFloat(deductions.hra) || 0,
        homeLoanInterest: parseFloat(deductions.homeLoan) || 0,
        unknowns: deductionUnknowns,
      },
      worries: selectedWorries,
      goals: selectedGoals,
      retirementAge: parseInt(retireAge) || 55,
      portfolio: selectedPortfolio.map((id) => ({
        id,
        label: portfolioTypes.find((p) => p.id === id)?.label || id,
        emoji: portfolioTypes.find((p) => p.id === id)?.emoji || "",
        amount: parseFloat(portfolioItems[id] || "0"),
      })),
      biggestMistake: mistake,
    });
    setOnboarded(true);
    navigate("/score");
  };

  const next = () => { if (step < totalSteps - 1) setStep(step + 1); else handleFinish(); };
  const back = () => { if (step > 0) setStep(step - 1); };

  const toggleWorry = (id: string) => {
    setSelectedWorries((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => {
      if (prev.find((g) => g.id === id)) return prev.filter((g) => g.id !== id);
      const opt = goalOptions.find((o) => o.id === id)!;
      return [...prev, { id, label: opt.label, emoji: opt.emoji, years: "", amount: "" }];
    });
  };

  const updateGoal = (id: string, field: "years" | "amount", value: string) => {
    setSelectedGoals((prev) => prev.map((g) => g.id === id ? { ...g, [field]: value } : g));
  };

  const togglePortfolio = (id: string) => {
    setSelectedPortfolio((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const renderStep = () => {
    switch (step) {
      /* Q1 — Name */
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Hey there! 👋</h2>
              <p className="text-muted-foreground">What should we call you? We'll use this to make the advice feel less robotic.</p>
            </div>
            <Input
              placeholder="Your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="text-lg py-6 bg-secondary/50 border-border/50"
              autoFocus
            />
          </div>
        );

      /* Q2 — Employment */
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">What do you do, {firstName}?</h2>
              <p className="text-muted-foreground">This helps us understand your income type and tax situation.</p>
            </div>
            <div className="space-y-2">
              {employmentTypes.map((t) => (
                <OptionCard key={t.id} selected={employment === t.id} onClick={() => setEmployment(t.id)} emoji={t.emoji}>
                  {t.label}
                </OptionCard>
              ))}
            </div>
          </div>
        );

      /* Q3 — Age */
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">How old are you?</h2>
              <p className="text-muted-foreground">Age changes everything — from risk appetite to tax rules.</p>
            </div>
            <Input type="number" placeholder="e.g. 28" value={age} onChange={(e) => setAge(e.target.value)} className="text-lg py-6 bg-secondary/50 border-border/50" />
            {numAge > 0 && numAge >= 16 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-sm text-foreground">{ageMessages[getAgeRange(numAge)]}</CardContent>
              </Card>
            )}
          </div>
        );

      /* Q4 — Income */
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">How much hits your bank account every month?</h2>
              <p className="text-muted-foreground">After all cuts — salary after TDS, PF, etc. Not sure? Check your last salary credit SMS.</p>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input type="number" placeholder="e.g. 50000" value={income} onChange={(e) => setIncome(e.target.value)} className="text-lg py-6 pl-8 bg-secondary/50 border-border/50" />
            </div>
            {numIncome > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-sm">
                  <span className="text-foreground">This puts you in the <span className="font-semibold text-primary">{formatINR(numIncome * 12)}/year</span> income group. </span>
                </CardContent>
              </Card>
            )}
          </div>
        );

      /* Q5 — City */
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Where do you live?</h2>
              <p className="text-muted-foreground">This helps us figure out your realistic living costs and rent tax benefits.</p>
            </div>
            <div className="space-y-3">
              <OptionCard selected={cityType === "metro"} onClick={() => setCityType("metro")} emoji="🏙️">Metro city (Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Pune)</OptionCard>
              <OptionCard selected={cityType === "tier2"} onClick={() => setCityType("tier2")} emoji="🌆">Tier-2 city (Jaipur, Lucknow, Surat, Indore, Nagpur, etc.)</OptionCard>
              <OptionCard selected={cityType === "small"} onClick={() => setCityType("small")} emoji="🏘️">Small town or village</OptionCard>
            </div>
          </div>
        );

      /* Q6 — Expenses */
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Roughly how much do you spend every month?</h2>
              <p className="text-muted-foreground">Include rent, food, transport, bills — everything.</p>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input type="number" placeholder="e.g. 30000" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="text-lg py-6 pl-8 bg-secondary/50 border-border/50" />
            </div>

            <button onClick={() => setShowBreakdown(!showBreakdown)} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Want help calculating? Break it down (optional)
            </button>

            {showBreakdown && (
              <div className="space-y-3 bg-secondary/30 rounded-xl p-4">
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-sm w-40 shrink-0">{cat.emoji} {cat.label}</span>
                    <Input type="number" placeholder="₹" value={breakdown[cat.id] || ""} onChange={(e) => {
                      const newB = { ...breakdown, [cat.id]: e.target.value };
                      setBreakdown(newB);
                      const total = Object.values(newB).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                      if (total > 0) setExpenses(String(total));
                    }} className="bg-secondary/50 border-border/50" />
                  </div>
                ))}
              </div>
            )}

            {numIncome > 0 && numExpenses > 0 && (
              <Card className={`border ${savingsRate >= 30 ? "border-score-excellent/30 bg-score-excellent/5" : savingsRate >= 20 ? "border-score-good/30 bg-score-good/5" : savingsRate >= 10 ? "border-score-fair/30 bg-score-fair/5" : "border-score-critical/30 bg-score-critical/5"}`}>
                <CardContent className="p-4 text-sm">
                  You save about <span className="font-semibold">{formatINR(numIncome - numExpenses)}/month</span>. That's <span className={`font-bold ${savingsRate >= 30 ? "text-score-excellent" : savingsRate >= 20 ? "text-score-good" : savingsRate >= 10 ? "text-score-fair" : "text-score-critical"}`}>{savingsRate}%</span> of your income.
                  {savingsRate >= 30 && " ⭐ Excellent!"}
                  {savingsRate >= 20 && savingsRate < 30 && " 👍 Good!"}
                  {savingsRate >= 10 && savingsRate < 20 && " ⚠️ Room to improve."}
                  {savingsRate < 10 && " 🚨 Let's work on this."}
                </CardContent>
              </Card>
            )}
          </div>
        );

      /* Q7 — Loans */
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Do you have any loans or EMIs?</h2>
              <p className="text-muted-foreground">Loans aren't bad — but if total EMI is more than 40% of income, it limits your ability to save.</p>
            </div>
            <div className="flex gap-3">
              <OptionCard selected={hasLoans === true} onClick={() => setHasLoans(true)}>Yes, I have loans/EMIs</OptionCard>
              <OptionCard selected={hasLoans === false} onClick={() => setHasLoans(false)}>Nope, debt-free! 🎉</OptionCard>
            </div>
            {hasLoans && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">What kind? (select all that apply)</p>
                <ChipSelect
                  options={loanTypes}
                  selected={selectedLoans}
                  onToggle={(id) => setSelectedLoans((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id])}
                  multi
                />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total monthly EMI for all loans?</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input type="number" placeholder="e.g. 15000" value={totalEMI} onChange={(e) => setTotalEMI(e.target.value)} className="pl-8 bg-secondary/50 border-border/50" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      /* Q8 — Safety Nets */
      case 7:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Do you have these safety nets?</h2>
              <p className="text-muted-foreground">Be honest — this helps us find the gaps and fix them.</p>
            </div>

            {/* Emergency Fund */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">🛡️ Emergency savings <span className="text-muted-foreground font-normal">— money for sudden job loss or medical crisis</span></p>
                <div className="flex flex-wrap gap-2">
                  {["None", "1-2 months", "3-5 months", "6+ months"].map((opt) => (
                    <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, emergencyMonths: opt }))}
                      className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets.emergencyMonths === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Term Insurance */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">📋 Term life insurance <span className="text-muted-foreground font-normal">— pays your family if something happens to you</span></p>
                <div className="flex flex-wrap gap-2">
                  {["Yes", "No", "Not sure what this is"].map((opt) => (
                    <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, termInsurance: opt }))}
                      className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets.termInsurance === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {safetyNets.termInsurance === "Yes" && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["₹25L", "₹50L", "₹1Cr", "₹1Cr+"].map((opt) => (
                      <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, termCoverage: opt }))}
                        className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets.termCoverage === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Insurance */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">🏥 Health insurance <span className="text-muted-foreground font-normal">— covers hospital bills</span></p>
                <div className="flex flex-wrap gap-2">
                  {["Yes", "No", "Employer covers me"].map((opt) => (
                    <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, healthInsurance: opt }))}
                      className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets.healthInsurance === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {safetyNets.healthInsurance === "Yes" && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {["₹3L", "₹5L", "₹10L", "₹10L+"].map((opt) => (
                      <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, healthCoverage: opt }))}
                        className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets.healthCoverage === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* EPF, NPS, MF */}
            <Card className="bg-card border-border/50">
              <CardContent className="p-4 space-y-3">
                {[
                  { key: "epf" as const, label: "🏛️ EPF / PF", desc: "retirement savings from employer" },
                  { key: "nps" as const, label: "📋 NPS", desc: "government pension plan with tax benefits" },
                  { key: "mutualFunds" as const, label: "📊 Mutual funds / SIPs", desc: "regular investments in the market" },
                ].map(({ key, label, desc }) => (
                  <div key={key}>
                    <p className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">— {desc}</span></p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Yes", "No", "Never heard of it"].map((opt) => (
                        <button key={opt} onClick={() => setSafetyNets((p) => ({ ...p, [key]: opt }))}
                          className={`px-3 py-1.5 text-xs rounded-full border ${safetyNets[key] === opt ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {safetyNets[key] === "Yes" && key === "mutualFunds" && (
                      <div className="mt-2 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹/month</span>
                        <Input type="number" placeholder="SIP amount" value={safetyNets.sipAmount}
                          onChange={(e) => setSafetyNets((p) => ({ ...p, sipAmount: e.target.value }))}
                          className="pl-20 bg-secondary/50 border-border/50 text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      /* Q9 — Current Behavior */
      case 8:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Which describes you best right now, {firstName}?</h2>
              <p className="text-muted-foreground">No judgment — this helps us calibrate the advice.</p>
            </div>
            <div className="space-y-2">
              {behaviorOptions.map((opt) => (
                <OptionCard key={opt.id} selected={behavior === opt.id} onClick={() => setBehavior(opt.id)} emoji={opt.emoji}>
                  {opt.label}
                </OptionCard>
              ))}
            </div>
          </div>
        );

      /* Q10 — Deductions */
      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">Tax deductions you already use</h2>
              <Card className="bg-primary/5 border-primary/20 mt-3">
                <CardContent className="p-4 text-sm text-foreground">
                  💡 <strong>What are tax deductions?</strong> The government lets you SUBTRACT certain investments or expenses from your income before calculating tax. Less taxable income = less tax. This section helps us find deductions you're MISSING.
                </CardContent>
              </Card>
            </div>

            {[
              { key: "c80", label: "80C Investments", max: "₹1,50,000", tooltip: "EPF, PPF, ELSS mutual funds, LIC premium, children's tuition, 5-year FD, home loan principal — any combo up to ₹1.5 lakh" },
              { key: "nps", label: "NPS Extra (80CCD1B)", max: "₹50,000", tooltip: "If you put money into NPS, you get an EXTRA ₹50,000 deduction OVER the ₹1.5L limit above. Most people miss this!" },
              { key: "d80", label: "Health Insurance (80D)", max: "₹75,000", tooltip: "Your health insurance premium — you pay ₹X/year, government lets you deduct it" },
              { key: "hra", label: "HRA (Rent benefit)", max: "varies", tooltip: "If you pay rent and get HRA in salary, a portion is tax-deductible" },
              { key: "homeLoan", label: "Home Loan Interest", max: "₹2,00,000", tooltip: "The interest part of your home loan EMI is deductible up to ₹2 lakh/year" },
            ].map(({ key, label, max, tooltip }) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{label} <span className="text-muted-foreground font-normal">(max {max})</span></label>
                  <button onClick={() => setDeductionUnknowns((p) => p.includes(key) ? p.filter((d) => d !== key) : [...p, key])}
                    className={`text-xs px-2 py-1 rounded-full border ${deductionUnknowns.includes(key) ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                    I have no idea
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-1">ℹ️ {tooltip}</p>
                {!deductionUnknowns.includes(key) && (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input type="number" placeholder="0"
                      value={deductions[key as keyof typeof deductions]}
                      onChange={(e) => setDeductions((p) => ({ ...p, [key]: e.target.value }))}
                      className="pl-8 bg-secondary/50 border-border/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      /* Q11 — Worries */
      case 10:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">What keeps you up at night about money?</h2>
              <p className="text-muted-foreground">Pick up to 4. These are real concerns — here's what we'll focus on for you.</p>
            </div>
            <div className="space-y-2">
              {worryOptions.map((opt) => (
                <OptionCard key={opt.id} selected={selectedWorries.includes(opt.id)} onClick={() => toggleWorry(opt.id)} emoji={opt.emoji}>
                  {opt.label}
                </OptionCard>
              ))}
            </div>
            {selectedWorries.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedWorries.length}/4 selected</p>
            )}
          </div>
        );

      /* Q12 — Goals */
      case 11:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">What are you saving for, {firstName}?</h2>
              <p className="text-muted-foreground">Select your goals. You can add timelines and amounts after.</p>
            </div>
            <div className="space-y-2">
              {goalOptions.map((opt) => {
                const isSelected = selectedGoals.find((g) => g.id === opt.id);
                return (
                  <div key={opt.id}>
                    <OptionCard selected={!!isSelected} onClick={() => toggleGoal(opt.id)} emoji={opt.emoji}>
                      {opt.label}
                    </OptionCard>
                    {isSelected && (
                      <div className="flex gap-2 mt-2 ml-8 mb-2">
                        <select value={isSelected.years} onChange={(e) => updateGoal(opt.id, "years", e.target.value)}
                          className="bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground">
                          <option value="">When?</option>
                          <option value="5">5 years</option>
                          <option value="10">10 years</option>
                          <option value="15">15 years</option>
                          <option value="20">20+ years</option>
                        </select>
                        <Input type="number" placeholder="How much? (optional)" value={isSelected.amount}
                          onChange={(e) => updateGoal(opt.id, "amount", e.target.value)}
                          className="bg-secondary/50 border-border/50 text-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* Q13 — Retirement Age */
      case 12:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">At what age do you want to stop depending on a salary?</h2>
              <p className="text-muted-foreground">This doesn't mean you'll stop working — just that you won't HAVE to.</p>
            </div>
            <Input type="number" placeholder="e.g. 50" value={retireAge} onChange={(e) => setRetireAge(e.target.value)} className="text-lg py-6 bg-secondary/50 border-border/50" />
            <input type="range" min={numAge + 5 || 35} max={70} value={parseInt(retireAge) || 55}
              onChange={(e) => setRetireAge(e.target.value)}
              className="w-full accent-primary" />
            {parseInt(retireAge) > numAge && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 text-sm">That's <span className="font-bold text-primary">{parseInt(retireAge) - numAge} years</span> from now. Let's make it count.</CardContent>
              </Card>
            )}
          </div>
        );

      /* Q14 — Portfolio */
      case 13:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">What do you already have saved or invested?</h2>
              <p className="text-muted-foreground">This helps us calculate your actual progress. All optional — stays on your device.</p>
            </div>
            <div className="space-y-2">
              {portfolioTypes.map((p) => {
                const isSelected = selectedPortfolio.includes(p.id);
                return (
                  <div key={p.id}>
                    <OptionCard selected={isSelected} onClick={() => togglePortfolio(p.id)} emoji={p.emoji}>
                      {p.label}
                    </OptionCard>
                    {isSelected && (
                      <div className="ml-8 mt-2 mb-2 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input type="number" placeholder="Approximate value"
                          value={portfolioItems[p.id] || ""}
                          onChange={(e) => setPortfolioItems((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          className="pl-8 bg-secondary/50 border-border/50 text-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      /* Q15 — Biggest Mistake */
      case 14:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold mb-2">One last thing, {firstName}...</h2>
              <p className="text-muted-foreground">Optionally — is there anything you wish you'd done differently with money? (Skip if you prefer)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mistakeChips.map((chip) => (
                <button key={chip} onClick={() => setMistake(mistake === chip ? "" : chip)}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${mistake === chip ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground"}`}>
                  {chip}
                </button>
              ))}
            </div>
            <Input placeholder="Or type your own..." value={mistakeChips.includes(mistake) ? "" : mistake}
              onChange={(e) => setMistake(e.target.value)}
              className="bg-secondary/50 border-border/50" maxLength={200} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl min-h-screen">
      <ProgressBar current={step + 1} total={totalSteps} />

      <div className="mb-8">{renderStep()}</div>

      <div className="flex items-center gap-3">
        {step > 0 && (
          <Button variant="ghost" onClick={back} className="shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        <Button variant="hero" className="flex-1" onClick={next} disabled={!canNext()}>
          {step === totalSteps - 1 ? "See My Financial Health →" : "Continue"}
          {step < totalSteps - 1 && <ArrowRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
