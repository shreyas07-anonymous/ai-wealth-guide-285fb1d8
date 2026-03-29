import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ETArticle {
  chip: string;
  title: string;
  summary: string;
}

const taxArticles: ETArticle[] = [
  { chip: "Budget 2025: 80C limit update", title: "Section 80C Limit May Rise to ₹2 Lakh", summary: "The Finance Ministry is considering raising the 80C deduction limit from ₹1.5L to ₹2L in Budget 2025. This could save taxpayers in the 30% bracket an additional ₹15,000/year. The last revision was in 2014." },
  { chip: "Nifty at 52-week high — harvest LTCG", title: "LTCG Harvesting: Book Tax-Free Gains Now", summary: "With Nifty at all-time highs, consider selling ₹1 lakh worth of long-term equity gains tax-free (Section 112A). Then reinvest immediately. This resets your cost basis and reduces future tax liability." },
  { chip: "Repo Rate unchanged — EMI impact", title: "RBI Holds Repo Rate: What It Means for Your EMIs", summary: "The RBI kept the repo rate unchanged at 6.5%. Your existing floating-rate home loan EMI won't change. However, analysts expect a 25bps cut in the next review, which could reduce a ₹50L home loan EMI by ~₹900/month." },
];

const fireArticles: ETArticle[] = [
  { chip: "Best ELSS funds 2025 — ET Rankings", title: "Top ELSS Funds for Tax Saving in 2025", summary: "Quant Tax Plan, Mirae Asset Tax Saver, and Canara Robeco ELSS have delivered 18-22% CAGR over 5 years. ELSS gives you 80C deduction with the shortest lock-in period (3 years) among all tax-saving instruments." },
  { chip: "NPS vs ELSS: Which wins for 80C?", title: "NPS vs ELSS: The Ultimate 80C Comparison", summary: "ELSS wins on liquidity (3-year lock-in vs NPS retirement lock-in) and returns (15%+ vs 10-12%). NPS wins on extra ₹50K deduction under 80CCD(1B). Best strategy: Use BOTH — ELSS for 80C, NPS for the extra ₹50K." },
  { chip: "Index fund SIP returns over 10 years", title: "₹10,000/Month SIP in Nifty 50: 10-Year Results", summary: "A ₹10,000/month SIP in a Nifty 50 index fund started in 2015 would be worth ₹28.5L today (invested: ₹12L). That's a 14.2% XIRR. Even through COVID crash, disciplined SIP investors came out ahead." },
];

const ET_URL = "https://economictimes.indiatimes.com/?from=mdr";

export function ETTrendingTax() {
  return <ETTrending articles={taxArticles} />;
}

export function ETTrendingFIRE() {
  return <ETTrending articles={fireArticles} />;
}

function ETTrending({ articles }: { articles: ETArticle[] }) {
  const [selectedArticle, setSelectedArticle] = useState<ETArticle | null>(null);

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-[#E2621B] flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">ET</span>
          </div>
          <p className="text-xs font-semibold text-muted-foreground">📰 Trending on ET</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {articles.map((article) => (
            <button
              key={article.chip}
              onClick={() => setSelectedArticle(article)}
              className="flex-shrink-0 px-3 py-2 rounded-lg border border-[#E2621B]/20 bg-[#E2621B]/5 text-xs text-foreground hover:border-[#E2621B]/50 transition-colors flex items-center gap-1"
            >
              {article.chip}
              <span className="text-[#E2621B] text-[10px] font-bold ml-1">ET</span>
            </button>
          ))}
        </div>
      </div>

      {/* Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedArticle(null)}>
          <Card className="max-w-md w-full bg-card border-border/50" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#E2621B] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">ET</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Economic Times</span>
                </div>
                <button onClick={() => setSelectedArticle(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-semibold mb-3">{selectedArticle.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{selectedArticle.summary}</p>
              <a
                href={ET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#E2621B] font-medium hover:underline"
              >
                Read full article on ET ↗ <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
