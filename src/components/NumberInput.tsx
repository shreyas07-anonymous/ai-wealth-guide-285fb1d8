import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check, X, Pencil } from "lucide-react";

interface QuickOption {
  label: string;
  value: number;
}

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  quickOptions?: QuickOption[];
  showFormatted?: boolean;
  min?: number;
  max?: number;
}

function parseShorthand(str: string): number {
  const cleaned = str.replace(/,/g, "").trim().toLowerCase();
  if (cleaned.endsWith("cr") || cleaned.endsWith("crore"))
    return Math.round(parseFloat(cleaned) * 10000000);
  if (cleaned.endsWith("l") || cleaned.endsWith("lakh") || cleaned.endsWith("lac"))
    return Math.round(parseFloat(cleaned) * 100000);
  if (cleaned.endsWith("k"))
    return Math.round(parseFloat(cleaned) * 1000);
  return parseInt(cleaned.replace(/[^0-9]/g, ""), 10) || 0;
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function safeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return isNaN(n) || !isFinite(n) ? fallback : n;
}

export default function NumberInput({
  label,
  value,
  onChange,
  placeholder = "0",
  prefix = "₹",
  hint,
  error,
  quickOptions = [],
  showFormatted = true,
  min,
  max,
}: NumberInputProps) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherRaw, setOtherRaw] = useState("");
  const [otherParsed, setOtherParsed] = useState<number | null>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const isOtherValue = value > 0 && !quickOptions.some((o) => o.value === value);

  useEffect(() => {
    if (showOtherInput && otherInputRef.current) otherInputRef.current.focus();
  }, [showOtherInput]);

  const handleOtherChange = (raw: string) => {
    // Sanitize: allow digits, ., commas, and shorthand letters
    const sanitized = raw.replace(/[^0-9.,kKlLcCrRoOeEaAhH ]/g, "");
    setOtherRaw(sanitized);
    const parsed = parseShorthand(sanitized);
    setOtherParsed(parsed > 0 ? parsed : null);
  };

  const handleOtherApply = () => {
    if (otherParsed && otherParsed > 0) {
      onChange(otherParsed);
      setShowOtherInput(false);
    }
  };

  const handlePresetClick = (optVal: number) => {
    setShowOtherInput(false);
    setOtherRaw("");
    setOtherParsed(null);
    onChange(optVal);
  };

  const handleOtherChipClick = () => {
    setShowOtherInput(true);
    setOtherRaw("");
    setOtherParsed(null);
  };

  const otherChipLabel = isOtherValue && !showOtherInput ? `✏️ ${formatINR(value)}` : "✏️ Other";

  const validationError =
    error ||
    (value > 0 && min !== undefined && value < min ? `Minimum: ${formatINR(min)}` : "") ||
    (value > 0 && max !== undefined && value > max ? `Maximum: ${formatINR(max)}` : "");

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      {showFormatted && value > 0 && (
        <div className="text-sm font-semibold text-primary">{formatINR(value)}</div>
      )}

      {quickOptions.length > 0 && (
        <div className="space-y-2">
          <div className={`flex flex-wrap gap-2 ${showOtherInput ? "opacity-50" : ""}`}>
            {quickOptions.map(({ label: optLabel, value: optVal }) => (
              <button
                key={optVal}
                type="button"
                onClick={() => handlePresetClick(optVal)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                  value === optVal && !isOtherValue
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                {optLabel}
              </button>
            ))}

            <button
              type="button"
              onClick={handleOtherChipClick}
              aria-label="Enter a custom value"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                isOtherValue || showOtherInput
                  ? "border-purple-500 bg-purple-500/15 text-purple-400"
                  : "border-border/50 bg-card text-muted-foreground hover:border-purple-400/30"
              }`}
            >
              {otherChipLabel}
            </button>
          </div>

          {showOtherInput && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {prefix}
                  </span>
                  <input
                    ref={otherInputRef}
                    type="text"
                    inputMode="numeric"
                    aria-label="Custom amount input"
                    value={otherRaw}
                    onChange={(e) => handleOtherChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleOtherApply();
                      if (e.key === "Escape") {
                        setShowOtherInput(false);
                        setOtherRaw("");
                        setOtherParsed(null);
                      }
                    }}
                    placeholder="e.g. 27000 or 27K"
                    className="w-full pl-8 pr-4 py-2.5 text-sm font-medium rounded-xl border-2 border-purple-500/50 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleOtherApply}
                  disabled={!otherParsed || otherParsed <= 0}
                  aria-label="Apply custom value"
                  className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowOtherInput(false); setOtherRaw(""); setOtherParsed(null); }}
                  className="px-2 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {otherParsed && otherParsed > 0 && (
                <p className="text-xs text-primary font-medium">= {formatINR(otherParsed)}</p>
              )}
              <p className="text-xs text-muted-foreground">
                💡 Tip: Type 27K for ₹27,000 · 1.5L for ₹1,50,000 · 2.5Cr for ₹2,50,00,000
              </p>
            </div>
          )}
        </div>
      )}

      {hint && !validationError && <p className="text-xs text-muted-foreground">{hint}</p>}
      {validationError && <p className="text-xs text-score-critical">{validationError}</p>}
    </div>
  );
}

export { parseShorthand, formatINR };
