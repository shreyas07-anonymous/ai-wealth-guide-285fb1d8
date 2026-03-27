import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heart, CheckCircle2, AlertTriangle, FileText, ArrowRight, ArrowLeft, Clock } from "lucide-react";

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

function getAdvice(eventId: string, amount: number, name: string): EventAdvice {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const eventData: Record<string, EventAdvice> = {
    bonus: {
      cheatSheet: {
        taxInOneLine: "Your bonus is taxed as salary — TDS is already deducted by your employer.",
        mostImportantAction: `Invest ${fmt(Math.round(amount * 0.5))} (50%) into equity mutual funds via STP to grow it long-term.`,
        biggestMistake: "Spending the entire bonus on lifestyle upgrades that create recurring expenses.",
      },
      urgency: "this_month",
      immediateActions: [
        `Park ${fmt(Math.round(amount * 0.2))} (20%) in emergency fund if you don't have 6 months saved`,
        `Invest ${fmt(Math.round(amount * 0.5))} (50%) in index mutual funds — start a Systematic Transfer Plan`,
        `Use ${fmt(Math.round(amount * 0.15))} (15%) for tax-saving investments (ELSS/NPS) if not maxed`,
        `Keep ${fmt(Math.round(amount * 0.15))} (15%) for something you've been wanting — you earned it!`,
      ],
      allocation: ["50% Long-term investments", "20% Emergency fund", "15% Tax-saving investments", "15% Personal reward"],
      taxImpact: ["Bonus is taxed as regular salary income at your slab rate", "TDS is already deducted — check your payslip", "Investing in ELSS or NPS can reduce the tax impact"],
      risks: ["Don't upgrade your lifestyle permanently based on a one-time bonus", "Avoid lump-sum stock market investment — use STP over 3-6 months", "Don't lend large amounts to friends/family without proper documentation"],
      documents: ["Updated Form 16", "Investment receipts for tax proof", "Bank statement showing bonus credit"],
      mentorNote: `Nice work, ${name}! A bonus is a chance to jump ahead financially. The smartest thing? Split it: safety net first, then grow, then enjoy. You deserve both security AND fun.`,
    },
    marriage: {
      cheatSheet: {
        taxInOneLine: "Wedding gifts from relatives are completely tax-free. Gifts from non-relatives above ₹50,000 are taxable.",
        mostImportantAction: "Set a realistic budget, update all insurance nominees, and open a joint account for household expenses.",
        biggestMistake: "Taking a personal loan for the wedding — the 14-18% interest haunts you for years.",
      },
      urgency: "this_month",
      immediateActions: [
        "Set a realistic wedding budget — average is ₹10-25L depending on city",
        "Update nominee on all insurance policies and investments to your spouse",
        `Budget: ${fmt(Math.round(amount * 0.6))} for wedding, save the rest`,
        "Open a joint savings account for household expenses after marriage",
      ],
      allocation: ["60% Wedding expenses", "20% Emergency fund boost", "10% Insurance upgrades", "10% Joint investments"],
      taxImpact: ["Gifts from relatives are 100% tax-free", "Cash gifts from non-relatives above ₹50K are taxable", "After marriage, combine incomes for smarter tax planning", "If renting, claim HRA (rent tax benefit) together"],
      risks: ["Never take a personal loan for the wedding", "Don't break existing investments to fund the wedding", "Update insurance immediately — it's more critical now"],
      documents: ["Marriage certificate", "Joint bank account documents", "Updated nominations on all investments", "New health insurance with spouse"],
      mentorNote: `Congratulations, ${name}! 💍 Marriage is beautiful — and also a great financial planning opportunity. Two incomes, shared expenses, combined tax planning. Just don't overspend on the wedding at the cost of your financial future.`,
    },
    baby: {
      cheatSheet: {
        taxInOneLine: "No immediate tax impact. Future benefits: school tuition under 80C, Sukanya Samriddhi for daughters is fully tax-free.",
        mostImportantAction: `Increase term life insurance to ₹1-2 Cr immediately — your family now depends on your income.`,
        biggestMistake: "Not buying adequate term insurance. If something happens to you, your family needs 15-20 years of income replacement.",
      },
      urgency: "immediate",
      immediateActions: [
        "Get/upgrade health insurance with maternity and newborn cover ASAP",
        "Increase term life insurance to 15-20x annual income — non-negotiable",
        "Start a child education fund — even ₹2,000/month grows to ₹20L+ in 18 years",
        `Set aside ${fmt(Math.round(amount * 0.3))} for first-year baby expenses`,
      ],
      allocation: ["30% First-year expenses", "30% Child education fund (equity SIP)", "20% Insurance upgrades", "20% Emergency buffer increase"],
      taxImpact: ["School tuition fees qualify under Section 80C (tax-saving investments)", "Sukanya Samriddhi for daughters — completely tax-free on deposit, growth, AND withdrawal", "Health insurance premium for child is deductible under 80D"],
      risks: ["Underinsurance is the #1 financial risk new parents face", "Education costs increase 10-12% per year — ₹10L today will be ₹50L in 18 years", "Don't compromise your retirement savings for the child — they can take education loans, you can't take retirement loans"],
      documents: ["Birth certificate", "Health insurance policy with newborn cover", "Updated will with child as beneficiary", "Sukanya Samriddhi or PPF account opening docs"],
      mentorNote: `Welcome to parenthood, ${name}! 👶 This is the most beautiful (and expensive!) journey. The single most important thing: insurance. Everything else can wait a month. Insurance can't. Get term + health cover this week.`,
    },
    job_change: {
      cheatSheet: {
        taxInOneLine: "Get Form 16 from BOTH employers. If EPF is withdrawn before 5 years, it's taxable. Gratuity is tax-free up to ₹20L.",
        mostImportantAction: "Transfer your EPF (provident fund) to the new employer — DO NOT withdraw it.",
        biggestMistake: "Withdrawing EPF. That money is growing tax-free at 8.25% — withdrawing it triggers tax AND kills compound growth.",
      },
      urgency: "this_month",
      immediateActions: [
        "Transfer EPF to new employer using Form 13 — never withdraw!",
        "Get health insurance immediately if losing employer coverage (even 1 day gap is risky)",
        "Negotiate tax-friendly CTC: higher HRA, NPS employer contribution, LTA",
        "Compare actual in-hand salary, not just gross CTC",
      ],
      allocation: ["Build 3-month buffer during transition", "Continue all existing SIPs without break", "If joining bonus: 50% invest, 50% park in FD"],
      taxImpact: ["EPF withdrawal before 5 years of service is fully taxable", "Gratuity is tax-free up to ₹20 lakh if you served 5+ years", "Notice period recovery/buyout may be tax-deductible", "Collect Form 16 from BOTH employers for ITR filing"],
      risks: ["Gap in health insurance can be catastrophic", "Don't inflate lifestyle just because salary went up", "Don't ignore your PF transfer — start it in week 1"],
      documents: ["Relieving letter from previous employer", "Form 16 from both employers", "EPF transfer Form 13", "New offer letter (needed for future loans)"],
      mentorNote: `Job switch done, ${name}! 💼 First things first: health insurance and EPF transfer. Then enjoy the raise — but save at least 50% of the increment. Future you will thank present you.`,
    },
    inheritance: {
      cheatSheet: {
        taxInOneLine: "Inheritance itself is completely tax-free in India. But any INCOME generated from inherited assets (rent, interest, dividends) IS taxable.",
        mostImportantAction: `Park ${fmt(Math.round(amount * 0.3))} in a liquid fund while you plan — don't make any big decisions for 3 months.`,
        biggestMistake: "Making impulsive purchases or investments immediately. Take 3 months to plan properly.",
      },
      urgency: "this_year",
      immediateActions: [
        "Inheritance is TAX-FREE in India — no inheritance tax exists",
        `Park ${fmt(Math.round(amount * 0.3))} in FD or liquid fund while planning (earns 6-7% safely)`,
        "Get legal transfer of all assets done properly with lawyer",
        "Consult a CA for income generated from inherited assets (rent, dividends)",
      ],
      allocation: ["30% Liquid parking (plan for 3 months)", "40% Long-term equity (index funds)", "15% Safe investments (debt funds, PPF)", "15% Personal goals"],
      taxImpact: ["The inheritance amount is NOT taxable", "Rental income from inherited property IS taxable", "Capital gains on selling inherited property — use original owner's purchase date", "Dividends from inherited stocks are taxable at your slab rate"],
      risks: ["Don't make ANY big financial decision for 3 months — park and plan", "Legal disputes can arise — ensure proper will/succession certificate", "Inherited property has ongoing maintenance and tax costs"],
      documents: ["Will or succession certificate", "Legal heir certificate", "Property mutation documents", "Asset valuation from a registered valuer"],
      mentorNote: `${name}, inheriting assets can be emotional and overwhelming. There's no rush. Park the money safely, take 3 months to plan, then invest systematically. The worst thing you can do is act impulsively.`,
    },
    property_sale: {
      cheatSheet: {
        taxInOneLine: "Profit on property sold after 2 years is taxed at 20% (LTCG), but you can legally AVOID it by buying another property within 2 years.",
        mostImportantAction: "If you made a profit, either reinvest in another property (Section 54) or park in Capital Gains Account Scheme within the deadline.",
        biggestMistake: "Spending the sale proceeds without planning for capital gains tax — the tax bill can be 20-30% of your profit.",
      },
      urgency: "immediate",
      immediateActions: [
        "Calculate your capital gains: Sale price minus (purchase price + improvement costs + transfer costs)",
        "If held 2+ years: Long-term capital gains taxed at 20% with indexation benefit",
        "Reinvest in another property within 2 years to avoid tax completely (Section 54)",
        "Or invest in Capital Gains Bonds (54EC) within 6 months — max ₹50L",
      ],
      allocation: ["Tax-saving reinvestment first", "30% Long-term equity", "20% Debt/safe investments", "Keep 6-month emergency fund"],
      taxImpact: ["Property held <2 years: Short-term gains taxed at your slab rate", "Property held 2+ years: 20% LTCG with indexation (reduces effective tax)", "Section 54: Buy another house within 2 years = zero tax on gains", "Section 54EC: Invest up to ₹50L in special bonds within 6 months"],
      risks: ["Missing the 2-year window for Section 54 exemption", "Not maintaining proper documentation of purchase price and improvements", "Spending proceeds without setting aside tax amount"],
      documents: ["Sale deed", "Original purchase deed", "Home improvement receipts", "Capital gains computation", "New property documents (if reinvesting)"],
      mentorNote: `${name}, property sale proceeds can be a game-changer. But the tax rules here are strict and have tight deadlines. If you made a profit, consult a CA within the first week. The reinvestment options can save you lakhs.`,
    },
    business_income: {
      cheatSheet: {
        taxInOneLine: "Business/freelance income is taxed at your slab rate after deducting legitimate business expenses.",
        mostImportantAction: `Set aside ${fmt(Math.round(amount * 0.3))} (30%) for advance tax — due 15th of every quarter.`,
        biggestMistake: "Not paying advance tax quarterly. You'll face 1% interest per month penalty on delayed tax.",
      },
      urgency: "immediate",
      immediateActions: [
        `Set aside ${fmt(Math.round(amount * 0.3))} for taxes immediately — don't spend this!`,
        "Pay advance tax by the next quarterly deadline (15th Jun/Sep/Dec/Mar)",
        "Document ALL business expenses — internet, phone, travel, equipment",
        `Invest ${fmt(Math.round(amount * 0.3))} in growth assets for long-term wealth`,
      ],
      allocation: ["30% Tax reserve", "30% Business reinvestment/growth", "25% Long-term investments", "15% Personal reward"],
      taxImpact: ["All legitimate business expenses reduce your taxable income", "Advance tax: Pay 15% by Jun 15, 45% by Sep 15, 75% by Dec 15, 100% by Mar 15", "If turnover < ₹2Cr, presumptive taxation (Section 44AD) simplifies everything", "GST may apply if annual revenue > ₹20L (₹40L for goods)"],
      risks: ["Not maintaining expense records = higher tax", "Missing advance tax deadlines = 1% monthly interest", "Mixing personal and business finances makes tax filing messy"],
      documents: ["Invoice copies", "Business expense receipts", "Bank statements", "GST returns if registered", "Advance tax challan receipts"],
      mentorNote: `Great earnings, ${name}! 💹 The #1 mistake freelancers make: spending everything and panicking at tax time. Set aside 30% for tax NOW, document every business expense, and you'll be fine.`,
    },
    vrs: {
      cheatSheet: {
        taxInOneLine: "VRS compensation up to ₹5L is tax-free under Section 10(10C). Gratuity up to ₹20L is also tax-free.",
        mostImportantAction: "Don't touch your retirement corpus for at least 1 year. Live on your VRS payout while your investments settle.",
        biggestMistake: "Starting a business with your entire VRS payout. Keep at least 70% in safe, income-generating investments.",
      },
      urgency: "this_month",
      immediateActions: ["Understand your full VRS package: compensation + gratuity + PF + pension", "Get health insurance before employer coverage lapses", "Don't make any big investment decisions for 3 months", "Calculate monthly income needs and set up systematic withdrawal"],
      allocation: ["40% Safe income-generating (debt funds, FDs)", "30% Equity (for growth, inflation protection)", "20% Emergency buffer (at least 2 years of expenses)", "10% Personal goals"],
      taxImpact: ["VRS compensation up to ₹5L is exempt under Section 10(10C)", "Gratuity up to ₹20L is tax-free", "PF balance withdrawal is tax-free if you served 5+ years", "Leave encashment up to ₹25L is tax-free"],
      risks: ["Don't invest in risky ventures or start a business with retirement money", "Health insurance gap can be devastating at this age", "Inflation will erode your corpus — keep some equity exposure"],
      documents: ["VRS offer letter and acceptance", "Gratuity calculation sheet", "PF withdrawal/transfer forms", "Health insurance continuation/new policy", "Updated will"],
      mentorNote: `${name}, this is a new chapter. The key is: don't rush. Your VRS payout needs to last decades. Get health insurance FIRST, then spend 3 months planning your investment strategy. You've earned this freedom.`,
    },
    medical: {
      cheatSheet: {
        taxInOneLine: "Medical expenses for specified diseases can be claimed under Section 80DDB (up to ₹1L for senior citizens). Health insurance payouts are tax-free.",
        mostImportantAction: "File health insurance claim immediately. If uninsured, document everything for potential tax deductions.",
        biggestMistake: "Selling long-term investments to pay medical bills. Explore hospital payment plans, insurance claims, and government schemes first.",
      },
      urgency: "immediate",
      immediateActions: ["File health insurance claim immediately — hospitals often help with paperwork", "If uninsured: ask hospital about payment plans or financial assistance", "Check government schemes: Ayushman Bharat, state health schemes", "Document ALL medical expenses with bills and prescriptions"],
      allocation: ["Use insurance first", "Emergency fund second", "Consider medical loan at low interest rather than breaking investments"],
      taxImpact: ["Health insurance payouts are completely tax-free", "Uninsured medical expenses for specified diseases: deduction under 80DDB", "Preventive health check-up: ₹5,000 deduction under 80D", "Disability-related expenses have additional deductions under 80U"],
      risks: ["Don't panic-sell investments", "Get a second medical opinion for major procedures", "If borrowing, medical loans have lower interest than personal loans"],
      documents: ["Hospital bills and discharge summary", "Doctor prescriptions and test reports", "Insurance claim forms", "Disability certificate if applicable"],
      mentorNote: `${name}, health comes first — always. Focus on recovery. Financially, use your insurance claim, then emergency fund. Don't touch long-term investments unless absolutely necessary. We can rebuild finances; health is irreplaceable. 💙`,
    },
    relocation: {
      cheatSheet: {
        taxInOneLine: "You'll likely become NRI for tax purposes. NRI status changes your tax rules significantly — only India-sourced income is taxable.",
        mostImportantAction: "Inform your bank to convert accounts to NRO/NRE, transfer investments, and understand double taxation treaty with your destination country.",
        biggestMistake: "Not converting to NRI bank accounts. Operating regular accounts as an NRI is illegal and creates tax complications.",
      },
      urgency: "this_month",
      immediateActions: ["Convert savings account to NRO (for India income) and open NRE (for foreign income)", "Inform all mutual fund houses about NRI status", "Check Double Taxation Avoidance Agreement (DTAA) with destination country", "Get comprehensive international health insurance"],
      allocation: ["Maintain India investments for rupee diversification", "Build emergency fund in destination country currency", "Continue NPS for India tax benefits if applicable"],
      taxImpact: ["NRI: Only India-sourced income (rent, capital gains) is taxable in India", "Foreign salary is NOT taxable in India", "DTAA prevents being taxed twice on same income", "NRE account interest is completely tax-free in India"],
      risks: ["Operating regular bank accounts as NRI is illegal", "Some mutual funds don't allow NRI investment from certain countries", "Health insurance gap during transition is dangerous"],
      documents: ["Passport and visa copies", "NRO/NRE account opening forms", "FEMA declarations", "International health insurance", "Power of attorney for India financial matters"],
      mentorNote: `${name}, exciting move! ✈️ The paperwork feels overwhelming, but it's mostly one-time setup. Convert bank accounts in week 1, inform investments in week 2, sort insurance in week 3. After that, you're set!`,
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

export default function LifeEventAdvisor() {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const name = profile.firstName || "Friend";
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [advice, setAdvice] = useState<EventAdvice | null>(null);

  const handleGetAdvice = () => {
    if (selectedEvent) setAdvice(getAdvice(selectedEvent, parseFloat(amount) || 0, name));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

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
            <div>
              <label className="text-sm text-muted-foreground">Amount involved (₹) — approximate is fine</label>
              <Input type="number" placeholder="e.g. 500000" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 bg-secondary/50 border-border/50" />
            </div>
            <Button variant="hero" className="w-full" onClick={handleGetAdvice}>
              Get My Action Plan <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {advice && (
        <div className="space-y-4">
          {/* Urgency Badge */}
          {urgencyBadge[advice.urgency] && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${urgencyBadge[advice.urgency].color}`}>
              {urgencyBadge[advice.urgency].icon} {urgencyBadge[advice.urgency].label}
            </div>
          )}

          {/* Cheat Sheet */}
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

          {/* Mentor Note */}
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground italic">{advice.mentorNote}</p>
            </CardContent>
          </Card>

          {/* Actions */}
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

          {/* Tax Impact */}
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

          {/* Allocation + Risks + Documents */}
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
    </div>
  );
}
