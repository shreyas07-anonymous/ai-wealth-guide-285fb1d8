import { useState } from "react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { MessageCircle, X, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/components/NumberInput";

function buildMentorContext(profile: ReturnType<typeof useUserProfile>["profile"]) {
  const insights: string[] = [];
  const chips: string[] = [];

  const savingsRate = profile.monthlyIncome > 0
    ? Math.round(((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100) : 0;

  const totalDed = profile.deductions.c80 + profile.deductions.d80 + profile.deductions.nps;
  const maxDed = 150000 + 75000 + 50000;
  if (totalDed < maxDed * 0.5) {
    const gap = maxDed - totalDed;
    const saving = Math.round(gap * 0.3);
    insights.push(`Your tax deductions are only ${formatINR(totalDed)} — you're leaving ${formatINR(gap)} unclaimed (= ${formatINR(saving)} in potential tax savings).`);
    chips.push("How do I save more tax?");
  }

  const emiRatio = profile.monthlyIncome > 0 ? (profile.loans.totalEMI / profile.monthlyIncome) * 100 : 0;
  if (emiRatio > 30) {
    insights.push(`Your EMI-to-income ratio is ${Math.round(emiRatio)}% — that's ${emiRatio > 40 ? "dangerously high" : "on the higher side"}.`);
    chips.push("Should I prepay my loans?");
  }

  if (savingsRate < 20) {
    insights.push(`You save ${savingsRate}% of income — ideally aim for 20%+.`);
    chips.push("How can I save more each month?");
  }

  if (profile.safetyNets.termInsurance !== "Yes") {
    insights.push("You don't have term life insurance — the single most important financial product for anyone with dependents.");
    chips.push("Tell me about term insurance");
  }

  if (profile.safetyNets.nps === "No" || profile.safetyNets.nps === "Never heard of it") {
    insights.push("You're not using NPS — it gives an extra ₹50,000 tax deduction that 80% of eligible Indians miss.");
    chips.push("What is NPS and should I get it?");
  }

  if (chips.length < 3) chips.push("What should I do first?");
  if (chips.length < 3) chips.push("Am I on track for retirement?");

  const contextMsg = `Hi ${profile.firstName || "there"}! I've reviewed your numbers. Here's what caught my attention:\n\n${insights.slice(0, 3).map(i => `• ${i}`).join("\n")}\n\nWhat would you like to explore?`;

  return { contextMsg, chips: chips.slice(0, 3) };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function MentorChat() {
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { contextMsg, chips } = buildMentorContext(profile);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        "How do I save more tax?": `Great question, ${profile.firstName}! Here are the top 3 things you can do:\n\n1. **Max out 80C** (₹1.5L) — ELSS mutual funds are the best option. Lock-in is just 3 years and returns average 12-15%.\n2. **Start NPS** — extra ₹50K deduction. At 30% tax bracket, that's ₹15,600 saved.\n3. **Get health insurance** (80D) — ₹25K deduction for self, ₹50K for parents above 60.\n\n**Do this today:** Open a Groww or Zerodha account and start a ₹5,000/month ELSS SIP. Takes 10 minutes.`,
        "Should I prepay my loans?": `${profile.firstName}, here's the simple rule:\n\n• **Credit card debt?** Pay it off FIRST. 36-42% interest is financial poison.\n• **Personal loan (14-18%)?** Prepay aggressively.\n• **Home loan (8-9%)?** Don't rush — invest the extra money instead. Your investments at 12% beat the 8% loan interest.\n\n**Do this today:** Check your credit card statement. If you have any outstanding balance, clear it this month.`,
        "How can I save more each month?": `${profile.firstName}, try the "50-30-20" starting point:\n\n• 50% → Needs (rent, food, bills)\n• 30% → Wants (shopping, dining, fun)\n• 20% → Savings & investments\n\nYour current split: ${Math.round((profile.monthlyExpenses/profile.monthlyIncome)*100)}% spending, ${100 - Math.round((profile.monthlyExpenses/profile.monthlyIncome)*100)}% saving.\n\n**Do this today:** Download a spending tracker app (Walnut or Money Manager). Track for just 1 week — you'll find ₹3,000-8,000 in expenses you didn't realize you had.`,
      };

      const reply = responses[text] || `${profile.firstName}, that's a great question! Based on your income of ${formatINR(profile.monthlyIncome)}/month and current savings rate of ${profile.monthlyIncome > 0 ? Math.round(((profile.monthlyIncome - profile.monthlyExpenses) / profile.monthlyIncome) * 100) : 0}%, here's what I'd suggest:\n\n1. First, ensure you have 6 months of expenses (${formatINR(profile.monthlyExpenses * 6)}) in a liquid fund\n2. Then maximize your tax deductions — you're leaving money on the table\n3. Start/increase SIPs for your goals\n\n**Do this today:** Set up an auto-transfer of ${formatINR(Math.round(profile.monthlyIncome * 0.1))} on salary day to a separate savings account.`;

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 1500);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-gold hover:shadow-elevated transition-all animate-pulse-gold"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Ask Mentor</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96">
      <Card className="bg-card border-border/50 shadow-elevated rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <p className="text-sm font-semibold">AI Money Mentor</p>
              <p className="text-xs text-muted-foreground">Your personal finance guide</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
          <div className="bg-secondary/50 rounded-xl p-3 text-sm text-foreground whitespace-pre-line">
            {contextMsg}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSend(chip)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`${msg.role === "user" ? "ml-auto bg-primary/15 text-foreground" : "bg-secondary/50 text-foreground"} rounded-xl p-3 text-sm max-w-[85%] whitespace-pre-line`}>
              {msg.content}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-center gap-2 py-2 px-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-muted-foreground">AI Mentor is thinking...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask anything about your finances..."
              className="flex-1 px-3 py-2 text-sm bg-secondary/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
