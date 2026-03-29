import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, CheckCircle2, AlertTriangle, FileText, ArrowRight, ArrowLeft, Clock, Home } from "lucide-react";
import MentorChat from "@/components/MentorChat";
import NumberInput, { formatINR } from "@/components/NumberInput";

const lifeEvents = [
  { id: "bonus", label: "I just got a big bonus / salary hike", emoji: "💰" },
  { id: "marriage", label: "I'm getting married soon", emoji: "💍" },
  { id: "baby", label: "I'm expecting / just had a baby", emoji: "👶" },
  { id: "job_change", label: "I'm switching jobs", emoji: "💼" },
  { id: "inheritance", label: "I received money or property from family", emoji: "🏛️" },
  { id: "property_sale", label: "I sold / am selling a property", emoji: "🏠" },
  { id: "business_income", label: "I got a big freelance / business payment", emoji: "💹" },
  { id: "vrs", label: "I'm taking early retirement or VRS", emoji: "🚪" },
  { id: "medical", label: "I had / facing a medical emergency", emoji: "🏥" },
  { id: "relocation", label: "I'm moving abroad for work", emoji: "✈️" },
];

interface EventAdvice {
  cheatSheet: { taxInOneLine: string; mostImportantAction: string; biggestMistake: string };
  urgency: string;
  immediateActions: string[];
  allocation: string[];
  taxImpact: string[];
  risks: string[];
  documents: string[];
  mentorNote: string;
}

function getAdvice(eventId: string, amount: number, name: string, locationChange?: string): EventAdvice {
  const fmt = (n: number) => formatINR(n);

  // ... same event data as before but with location change awareness for job_change
  const eventData: Record<string, EventAdvice> = {
    bonus: {
      cheatSheet: { taxInOneLine: "Your bonus is taxed as salary — TDS is already deducted by your employer.", mostImportantAction: `Invest ${fmt(Math.round(amount * 0.5))} (50%) into equity mutual funds via STP to grow it long-term.`, biggestMistake: "Spending the entire bonus on lifestyle upgrades that create recurring expenses." },
      urgency: "this_month",
      immediateActions: [`Park ${fmt(Math.round(amount * 0.2))} (20%) in emergency fund if you don't have 6 months saved`, `Invest ${fmt(Math.round(amount * 0.5))} (50%) in index mutual funds`, `Use ${fmt(Math.round(amount * 0.15))} (15%) for tax-saving investments (ELSS/NPS)`, `Keep ${fmt(Math.round(amount * 0.15))} (15%) for something you've been wanting — you earned it!`],
      allocation: ["50% Long-term investments", "20% Emergency fund", "15% Tax-saving investments", "15% Personal reward"],
      taxImpact: ["Bonus is taxed as regular salary income at your slab rate", "TDS is already deducted — check your payslip", "Investing in ELSS or NPS can reduce the tax impact"],
      risks: ["Don't upgrade your lifestyle permanently based on a one-time bonus", "Avoid lump-sum stock market investment — use STP over 3-6 months"],
      documents: ["Updated Form 16", "Investment receipts for tax proof", "Bank statement showing bonus credit"],
      mentorNote: `Nice work, ${name}! A bonus is a chance to jump ahead financially. Split it: safety net first, then grow, then enjoy. 💪`,
    },
    marriage: {
      cheatSheet: { taxInOneLine: "Wedding gifts from relatives are completely tax-free. Gifts from non-relatives above ₹50,000 are taxable.", mostImportantAction: "Set a realistic budget, update all insurance nominees, and open a joint account.", biggestMistake: "Taking a personal loan for the wedding — the 14-18% interest haunts you for years." },
      urgency: "this_month",
      immediateActions: ["Set a realistic wedding budget — average is ₹10-25L depending on city", "Update nominee on all insurance policies to your spouse", `Budget: ${fmt(Math.round(amount * 0.6))} for wedding, save the rest`, "Open a joint savings account for household expenses"],
      allocation: ["60% Wedding expenses", "20% Emergency fund boost", "10% Insurance upgrades", "10% Joint investments"],
      taxImpact: ["Gifts from relatives are 100% tax-free", "Cash gifts from non-relatives above ₹50K are taxable", "After marriage, combine incomes for smarter tax planning"],
      risks: ["Never take a personal loan for the wedding", "Don't break existing investments to fund the wedding"],
      documents: ["Marriage certificate", "Joint bank account documents", "Updated nominations", "New health insurance with spouse"],
      mentorNote: `Congratulations, ${name}! 💍 Marriage is a great financial planning opportunity. Just don't overspend on the wedding at the cost of your financial future.`,
    },
    baby: {
      cheatSheet: { taxInOneLine: "No immediate tax impact. Future benefits: school tuition under 80C, Sukanya Samriddhi for daughters is fully tax-free.", mostImportantAction: `Increase term life insurance to ₹1-2 Cr immediately.`, biggestMistake: "Not buying adequate term insurance." },
      urgency: "immediate",
      immediateActions: ["Get/upgrade health insurance with maternity and newborn cover ASAP", "Increase term life insurance to 15-20x annual income", "Start a child education fund — even ₹2,000/month grows to ₹20L+ in 18 years", `Set aside ${fmt(Math.round(amount * 0.3))} for first-year baby expenses`],
      allocation: ["30% First-year expenses", "30% Child education fund", "20% Insurance upgrades", "20% Emergency buffer"],
      taxImpact: ["School tuition fees qualify under Section 80C", "Sukanya Samriddhi for daughters — completely tax-free", "Health insurance premium for child deductible under 80D"],
      risks: ["Underinsurance is the #1 financial risk new parents face", "Education costs increase 10-12% per year"],
      documents: ["Birth certificate", "Health insurance with newborn cover", "Updated will", "Sukanya Samriddhi or PPF account"],
      mentorNote: `Welcome to parenthood, ${name}! 👶 The single most important thing: insurance. Get term + health cover this week.`,
    },
    job_change: {
      cheatSheet: { taxInOneLine: "Get Form 16 from BOTH employers. If EPF is withdrawn before 5 years, it's taxable.", mostImportantAction: "Transfer your EPF to the new employer — DO NOT withdraw it.", biggestMistake: "Withdrawing EPF. That money is growing tax-free at 8.25%." },
      urgency: "this_month",
      immediateActions: [
        "Transfer EPF to new employer using Form 13 — never withdraw!",
        "Get health insurance immediately if losing employer coverage",
        "Negotiate tax-friendly CTC: higher HRA, NPS employer contribution, LTA",
        "Compare actual in-hand salary, not just gross CTC",
        ...(locationChange && locationChange !== "none" ? [`${locationChange.includes("Metro") ? "Your HRA benefit changes — metro cities get 50% of basic, non-metro 40%." : "Factor in cost-of-living changes when evaluating your new salary."}`] : []),
      ],
      allocation: ["Build 3-month buffer during transition", "Continue all existing SIPs", "If joining bonus: 50% invest, 50% park in FD"],
      taxImpact: [
        "EPF withdrawal before 5 years is fully taxable",
        "Gratuity is tax-free up to ₹20 lakh if you served 5+ years",
        "Collect Form 16 from BOTH employers for ITR filing",
        ...(locationChange && locationChange !== "none" ? ["HRA tax benefit changes based on metro vs non-metro city classification"] : []),
      ],
      risks: ["Gap in health insurance can be catastrophic", "Don't inflate lifestyle just because salary went up", "Don't ignore PF transfer"],
      documents: ["Relieving letter", "Form 16 from both employers", "EPF transfer Form 13", "New offer letter"],
      mentorNote: `Job switch done, ${name}! 💼 First things first: health insurance and EPF transfer.${locationChange && locationChange !== "none" ? ` Since you're relocating, factor in the cost-of-living change — your higher salary might not feel as high in a more expensive city.` : ""}`,
    },
    inheritance: {
      cheatSheet: { taxInOneLine: "Inheritance itself is completely tax-free in India. But any INCOME from inherited assets IS taxable.", mostImportantAction: `Park ${fmt(Math.round(amount * 0.3))} in a liquid fund while you plan.`, biggestMistake: "Making impulsive purchases immediately." },
      urgency: "this_year",
      immediateActions: ["Inheritance is TAX-FREE in India", `Park ${fmt(Math.round(amount * 0.3))} in FD or liquid fund while planning`, "Get legal transfer of all assets done", "Consult a CA for income from inherited assets"],
      allocation: ["30% Liquid parking", "40% Long-term equity", "15% Safe investments", "15% Personal goals"],
      taxImpact: ["The inheritance amount is NOT taxable", "Rental income from inherited property IS taxable", "Capital gains on selling use original owner's purchase date"],
      risks: ["Don't make big decisions for 3 months", "Legal disputes can arise", "Inherited property has ongoing costs"],
      documents: ["Will or succession certificate", "Legal heir certificate", "Property mutation documents", "Asset valuation"],
      mentorNote: `${name}, there's no rush. Park the money safely, take 3 months to plan.`,
    },
    property_sale: {
      cheatSheet: { taxInOneLine: "Profit on property sold after 2 years is taxed at 20% (LTCG), but you can avoid it by buying another property within 2 years.", mostImportantAction: "Reinvest in another property (Section 54) or park in Capital Gains Account Scheme.", biggestMistake: "Spending the sale proceeds without planning for capital gains tax." },
      urgency: "immediate",
      immediateActions: ["Calculate capital gains: Sale price minus costs", "If held 2+ years: LTCG at 20% with indexation", "Reinvest in another property within 2 years for zero tax (Section 54)", "Or invest in Capital Gains Bonds (54EC) within 6 months — max ₹50L"],
      allocation: ["Tax-saving reinvestment first", "30% Long-term equity", "20% Debt investments", "Keep 6-month emergency fund"],
      taxImpact: ["Property <2 years: short-term gains at slab rate", "Property 2+ years: 20% LTCG with indexation", "Section 54: Buy house within 2 years = zero tax", "Section 54EC: Invest up to ₹50L in bonds within 6 months"],
      risks: ["Missing the 2-year window for Section 54", "Not maintaining documentation", "Spending proceeds without tax planning"],
      documents: ["Sale deed", "Original purchase deed", "Improvement receipts", "Capital gains computation"],
      mentorNote: `${name}, property sale proceeds can be a game-changer. Consult a CA within the first week.`,
    },
    business_income: {
      cheatSheet: { taxInOneLine: "Business income is taxed at your slab rate after deducting business expenses.", mostImportantAction: `Set aside ${fmt(Math.round(amount * 0.3))} (30%) for advance tax.`, biggestMistake: "Not paying advance tax quarterly — 1% interest per month penalty." },
      urgency: "immediate",
      immediateActions: [`Set aside ${fmt(Math.round(amount * 0.3))} for taxes immediately`, "Pay advance tax by the next quarterly deadline", "Document ALL business expenses", `Invest ${fmt(Math.round(amount * 0.3))} in growth assets`],
      allocation: ["30% Tax reserve", "30% Business reinvestment", "25% Long-term investments", "15% Personal reward"],
      taxImpact: ["All business expenses reduce taxable income", "Advance tax deadlines: Jun 15, Sep 15, Dec 15, Mar 15", "If turnover < ₹2Cr, presumptive taxation simplifies filing"],
      risks: ["Not maintaining expense records", "Missing advance tax deadlines", "Mixing personal and business finances"],
      documents: ["Invoice copies", "Business expense receipts", "Bank statements", "Advance tax challans"],
      mentorNote: `Great earnings, ${name}! 💹 Set aside 30% for tax NOW and document every business expense.`,
    },
    vrs: {
      cheatSheet: { taxInOneLine: "VRS compensation up to ₹5L is tax-free. Gratuity up to ₹20L is also tax-free.", mostImportantAction: "Don't touch your retirement corpus for at least 1 year.", biggestMistake: "Starting a business with your entire VRS payout." },
      urgency: "this_month",
      immediateActions: ["Understand your full VRS package", "Get health insurance before employer coverage lapses", "Don't make big investment decisions for 3 months", "Calculate monthly income needs"],
      allocation: ["40% Safe income-generating", "30% Equity for growth", "20% Emergency buffer (2 years)", "10% Personal goals"],
      taxImpact: ["VRS up to ₹5L exempt under Section 10(10C)", "Gratuity up to ₹20L tax-free", "PF tax-free if 5+ years", "Leave encashment up to ₹25L tax-free"],
      risks: ["Don't invest in risky ventures", "Health insurance gap is devastating", "Inflation will erode corpus"],
      documents: ["VRS offer letter", "Gratuity calculation", "PF forms", "Health insurance", "Updated will"],
      mentorNote: `${name}, this is a new chapter. Get health insurance FIRST, then spend 3 months planning.`,
    },
    medical: {
      cheatSheet: { taxInOneLine: "Medical expenses for specified diseases can be claimed under Section 80DDB. Insurance payouts are tax-free.", mostImportantAction: "File health insurance claim immediately.", biggestMistake: "Selling long-term investments to pay medical bills." },
      urgency: "immediate",
      immediateActions: ["File health insurance claim immediately", "If uninsured: ask hospital about payment plans", "Check government schemes: Ayushman Bharat", "Document ALL medical expenses"],
      allocation: ["Use insurance first", "Emergency fund second", "Consider medical loan rather than breaking investments"],
      taxImpact: ["Insurance payouts are tax-free", "Uninsured medical expenses: deduction under 80DDB", "Preventive check-up: ₹5,000 under 80D"],
      risks: ["Don't panic-sell investments", "Get second medical opinion", "Medical loans have lower interest than personal loans"],
      documents: ["Hospital bills", "Doctor prescriptions", "Insurance claim forms", "Disability certificate if applicable"],
      mentorNote: `${name}, health comes first — always. Focus on recovery. Financially, use insurance, then emergency fund. 💙`,
    },
    relocation: {
      cheatSheet: { taxInOneLine: "NRI status changes your tax rules — only India-sourced income is taxable.", mostImportantAction: "Convert bank accounts to NRO/NRE.", biggestMistake: "Not converting to NRI bank accounts — it's illegal to operate regular accounts as NRI." },
      urgency: "this_month",
      immediateActions: ["Convert savings account to NRO and open NRE", "Inform all mutual fund houses about NRI status", "Check DTAA with destination country", "Get international health insurance"],
      allocation: ["Maintain India investments for diversification", "Build emergency fund in destination currency", "Continue NPS if applicable"],
      taxImpact: ["NRI: Only India-sourced income taxable", "Foreign salary NOT taxable in India", "DTAA prevents double taxation", "NRE interest is tax-free"],
      risks: ["Operating regular accounts as NRI is illegal", "Some MFs don't allow NRI from certain countries", "Health insurance gap is dangerous"],
      documents: ["Passport and visa copies", "NRO/NRE forms", "FEMA declarations", "International health insurance", "Power of attorney"],
      mentorNote: `${name}, exciting move! ✈️ Convert bank accounts week 1, inform investments week 2, sort insurance week 3.`,
    },
  };

  return eventData[eventId] || eventData.bonus;
}

const urgencyBadge: Record<string, { label: string; color: string; icon: string }> = {
  immediate: { label: "Do this immediately", color: "bg-score-critical/15 text-score-critical border-score-critical/30", icon: "🚨" },
  this_month: { label: "Handle this month", color: "bg-score-fair/15 text-score-fair border-score-fair/30", icon: "⏳" },
  this_year: { label: "Plan this year", color: "bg-score-good/15 text-score-good border-score-good/30", icon: "📅" },
  informational: { label: "Good to know", color: "bg-primary/15 text-primary border-primary/30", icon: "💡" },
};

const amountChips: Record<string, { label: string; value: number }[]> = {
  bonus: [{ label: "₹50K", value: 50000 }, { label: "₹1L", value: 100000 }, { label: "₹3L", value: 300000 }, { label: "₹5L", value: 500000 }],
  marriage: [{ label: "₹5L", value: 500000 }, { label: "₹10L", value: 1000000 }, { label: "₹25L", value: 2500000 }, { label: "₹50L", value: 5000000 }],
  baby: [{ label: "₹2L", value: 200000 }, { label: "₹5L", value: 500000 }, { label: "₹10L", value: 1000000 }],
  inheritance: [{ label: "₹10L", value: 1000000 }, { label: "₹50L", value: 5000000 }, { label: "₹1Cr", value: 10000000 }],
  property_sale: [{ label: "₹25L", value: 2500000 }, { label: "₹50L", value: 5000000 }, { label: "₹1Cr", value: 10000000 }],
  business_income: [{ label: "₹1L", value: 100000 }, { label: "₹5L", value: 500000 }, { label: "₹10L", value: 1000000 }],
};

const locationChangeOptions = [
  { id: "none", label: "No, staying in the same city" },
  { id: "tier2_to_metro", label: "Yes — moving from Tier-2 to Metro" },
  { id: "metro_to_tier2", label: "Yes — moving from Metro to Tier-2/smaller city" },
  { id: "metro_to_metro", label: "Yes — relocating within Metro cities" },
];

export default function LifeEventAdvisor() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [amount, setAmount] = useState(0);
  const [advice, setAdvice] = useState<EventAdvice | null>(null);
  const [locationChange, setLocationChange] = useState("none");

  const handleGetAdvice = () => {
    if (selectedEvent) setAdvice(getAdvice(selectedEvent, amount, name, selectedEvent === "job_change" ? locationChange : undefined));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-primary hover:underline font-medium">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <span>/</span>
        <span className="text-foreground font-semibold">Life Event Advisor</span>
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <Heart className="w-6 h-6 text-teal" />
          <h1 className="font-display text-3xl font-bold">Life Event Advisor</h1>
        </div>
        <p className="text-muted-foreground">Something big happening? Let's figure out the money side together.</p>
      </div>

      <div className="space-y-2 mb-6">
        {lifeEvents.map((event) => (
          <button key={event.id} onClick={() => { setSelectedEvent(event.id); setAdvice(null); }}
            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedEvent === event.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/30"}`}>
            <span className="text-sm font-medium flex items-center gap-2">
              <span className="text-lg">{event.emoji}</span> {event.label}
            </span>
          </button>
        ))}
      </div>

      {selectedEvent && (
        <Card className="bg-gradient-card border-border/50 mb-6">
          <CardContent className="p-6 space-y-4">
            <NumberInput
              label="Amount involved (₹) — approximate is fine"
              value={amount}
              onChange={setAmount}
              quickOptions={amountChips[selectedEvent] || [{ label: "₹1L", value: 100000 }, { label: "₹5L", value: 500000 }, { label: "₹10L", value: 1000000 }]}
            />

            {/* Job switch: Location change question */}
            {selectedEvent === "job_change" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Will you be moving to a different city?</p>
                <div className="space-y-1">
                  {locationChangeOptions.map((opt) => (
                    <button key={opt.id} onClick={() => setLocationChange(opt.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${locationChange === opt.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/30"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button variant="hero" className="w-full" onClick={handleGetAdvice}>
              Get My Action Plan <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {advice && (
        <div className="space-y-4">
          {urgencyBadge[advice.urgency] && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${urgencyBadge[advice.urgency].color}`}>
              {urgencyBadge[advice.urgency].icon} {urgencyBadge[advice.urgency].label}
            </div>
          )}

          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-4">📋 Your 3-point cheat sheet</h3>
              <div className="space-y-3 text-sm">
                <div><span className="text-primary font-semibold">💰 Tax situation:</span> <span className="text-foreground">{advice.cheatSheet.taxInOneLine}</span></div>
                <div><span className="text-score-excellent font-semibold">✅ Most important:</span> <span className="text-foreground">{advice.cheatSheet.mostImportantAction}</span></div>
                <div><span className="text-score-critical font-semibold">⚠️ Don't do this:</span> <span className="text-foreground">{advice.cheatSheet.biggestMistake}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground italic">{advice.mentorNote}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-score-excellent" /> Your action plan
              </h3>
              <ol className="space-y-2">
                {advice.immediateActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    <span className="text-muted-foreground">{a}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3">💰 Tax impact</h3>
              <ul className="space-y-2">
                {advice.taxImpact.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-primary">•</span> {a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-3">📊 How to split the money</h3>
                {advice.allocation.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" /> {a}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-6">
                <h3 className="font-display font-semibold mb-3">⚠️ Watch out for</h3>
                {advice.risks.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
                    <span className="text-score-poor">•</span> {a}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal" /> Documents you'll need
              </h3>
              {advice.documents.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
                  <span className="text-teal">✓</span> {a}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <MentorChat />
    </div>
  );
}
