import { useState, useMemo } from "react";

const fmt = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtCurrency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const SCENARIOS: Record<string, { label: string; conversionRate: number; attendanceRate: number }> = {
  slow: { label: "Slow Night", conversionRate: 0.07, attendanceRate: 0.80 },
  average: { label: "Average Night", conversionRate: 0.15, attendanceRate: 0.90 },
  busy: { label: "Busy Fri/Sat", conversionRate: 0.25, attendanceRate: 1.00 },
  peak: { label: "Peak Night", conversionRate: 0.40, attendanceRate: 1.00 },
};

const VAPER_FILTER = [
  { reason: "Already have their own device", pct: 0.60 },
  { reason: "Not interested in buying tonight", pct: 0.15 },
  { reason: "Price sensitive / no impulse buy", pct: 0.10 },
  { reason: "Non-disposable users (pod/mod)", pct: 0.05 },
];

const SliderInput = ({ label, value, min, max, step = 1, onChange, format = fmt, suffix = "" }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string; suffix?: string;
}) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 13, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>{format(value)}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "#22d3ee" }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 2 }}>
      <span>{format(min)}{suffix}</span><span>{format(max)}{suffix}</span>
    </div>
  </div>
);

export default function VapeProforma() {
  const [capacity, setCapacity] = useState(500);
  const [vaperRate, setVaperRate] = useState(9.5);
  const [costPerUnit, setCostPerUnit] = useState(6);
  const [sellPrice, setSellPrice] = useState(15);
  const [nightsPerWeek, setNightsPerWeek] = useState(5);

  const calc = useMemo(() => {
    const vaperPct = vaperRate / 100;
    const results: Record<string, any> = {};
    for (const [key, s] of Object.entries(SCENARIOS)) {
      const attendees = capacity * s.attendanceRate;
      const vapers = attendees * vaperPct;
      const salesFinal = Math.round(vapers * s.conversionRate);
      const revenue = salesFinal * sellPrice;
      const cogs = salesFinal * costPerUnit;
      const grossProfit = revenue - cogs;
      const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      results[key] = { attendees, vapers, sales: salesFinal, revenue, cogs, grossProfit, margin };
    }
    return results;
  }, [capacity, vaperRate, costPerUnit, sellPrice]);

  const weeklyProjection = useMemo(() => {
    const weights: Record<string, number> = { slow: 0.20, average: 0.40, busy: 0.30, peak: 0.10 };
    const avgSales = Object.entries(weights).reduce((sum, [k, w]) => sum + calc[k].sales * w, 0);
    const avgRevenue = Object.entries(weights).reduce((sum, [k, w]) => sum + calc[k].revenue * w, 0);
    const avgProfit = Object.entries(weights).reduce((sum, [k, w]) => sum + calc[k].grossProfit * w, 0);
    return {
      perNight: { sales: avgSales, revenue: avgRevenue, profit: avgProfit },
      perWeek: { sales: avgSales * nightsPerWeek, revenue: avgRevenue * nightsPerWeek, profit: avgProfit * nightsPerWeek },
      perMonth: { sales: avgSales * nightsPerWeek * 4.33, revenue: avgRevenue * nightsPerWeek * 4.33, profit: avgProfit * nightsPerWeek * 4.33 },
      perYear: { sales: avgSales * nightsPerWeek * 52, revenue: avgRevenue * nightsPerWeek * 52, profit: avgProfit * nightsPerWeek * 52 },
    };
  }, [calc, nightsPerWeek]);

  const margin = sellPrice > 0 ? ((sellPrice - costPerUnit) / sellPrice * 100) : 0;

  return (
    <div style={{ background: "#030712", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#f9fafb", padding: "32px 20px", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, color: "#22d3ee", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>Bar Retail · Vape Sales</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Nightly Sales Proforma</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>Based on single vape vending machine and google search adult vaping rate (~8%-15%) applied to bar attendance.</p>
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "24px 24px 12px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>📊 Venue & Product Inputs</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
          <SliderInput label="Bar Capacity" value={capacity} min={50} max={2000} step={50} onChange={setCapacity} />
          <SliderInput label="Adult Vape Rate (%)" value={vaperRate} min={5} max={25} step={0.5} onChange={setVaperRate} suffix="%" format={(v) => v.toFixed(1)} />
          <SliderInput label="Cost Per Unit ($)" value={costPerUnit} min={1} max={20} step={0.5} onChange={setCostPerUnit} format={(v) => `$${v.toFixed(2)}`} />
          <SliderInput label="Sell Price ($)" value={sellPrice} min={5} max={40} step={0.5} onChange={setSellPrice} format={(v) => `$${v.toFixed(2)}`} />
          <SliderInput label="Nights Open Per Week" value={nightsPerWeek} min={1} max={7} onChange={setNightsPerWeek} />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ background: margin > 50 ? "#052e16" : "#431407", border: `1px solid ${margin > 50 ? "#166534" : "#9a3412"}`, borderRadius: 8, padding: "6px 14px", fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>Unit Margin: </span>
            <span style={{ color: margin > 50 ? "#4ade80" : "#fb923c", fontWeight: 700 }}>{fmtCurrency(sellPrice - costPerUnit)} ({margin.toFixed(0)}%)</span>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "6px 14px", fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>Vapers in full house: </span>
            <span style={{ color: "#f9fafb", fontWeight: 700 }}>{Math.round(capacity * vaperRate / 100)} people</span>
          </div>
        </div>
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>🔽 Vaper Attrition Funnel (Full House)</div>
        {(() => {
          const totalVapers = Math.round(capacity * vaperRate / 100);
          let remaining = totalVapers;
          return (
            <div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ background: "#1e3a5f", borderRadius: 6, padding: "8px 14px", fontSize: 14 }}>
                  <span style={{ color: "#93c5fd" }}>Total vapers in venue</span>
                  <span style={{ float: "right", fontWeight: 700, color: "#dbeafe" }}>{totalVapers}</span>
                </div>
              </div>
              {VAPER_FILTER.map((f, i) => {
                const lost = Math.round(totalVapers * f.pct);
                remaining -= lost;
                return (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginBottom: 3 }}>
                      <span>− {f.reason}</span>
                      <span style={{ color: "#ef4444" }}>−{lost} ({(f.pct * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 4, background: "#1f2937", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${100 - f.pct * 100}%`, background: "#374151", borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ background: "#0c2a1a", border: "1px solid #166534", borderRadius: 6, padding: "8px 14px", marginTop: 12, fontSize: 14 }}>
                <span style={{ color: "#86efac" }}>Qualified potential buyers</span>
                <span style={{ float: "right", fontWeight: 800, color: "#4ade80" }}>{Math.max(0, remaining)} people</span>
              </div>
            </div>
          );
        })()}
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "24px", marginBottom: 28, overflowX: "auto" }}>
        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18 }}>📋 Nightly Scenario Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              {["Scenario","Attendees","Vapers","Conv. Rate","Units Sold","Revenue","COGS","Gross Profit","Margin"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Scenario" ? "left" : "right", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(SCENARIOS).map(([key, s]) => {
              const r = calc[key];
              const isHighlight = key === "busy";
              return (
                <tr key={key} style={{ background: isHighlight ? "#0c1a2e" : "transparent", borderBottom: "1px solid #111827" }}>
                  <td style={{ padding: "10px 12px", color: isHighlight ? "#38bdf8" : "#e5e7eb", fontWeight: isHighlight ? 700 : 400 }}>
                    {s.label}{isHighlight && <span style={{ marginLeft: 6, fontSize: 10, background: "#0e4f7a", color: "#7dd3fc", borderRadius: 4, padding: "2px 6px" }}>TYPICAL</span>}
                  </td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#9ca3af" }}>{fmt(r.attendees)}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#9ca3af" }}>{fmt(r.vapers, 0)}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#9ca3af" }}>{(s.conversionRate * 100).toFixed(0)}%</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#f9fafb", fontWeight: 700 }}>{r.sales}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#f9fafb" }}>{fmtCurrency(r.revenue)}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#ef4444" }}>{fmtCurrency(r.cogs)}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: "#4ade80", fontWeight: 700 }}>{fmtCurrency(r.grossProfit)}</td>
                  <td style={{ textAlign: "right", padding: "10px 12px", color: r.margin > 50 ? "#4ade80" : "#fb923c" }}>{r.margin.toFixed(0)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "24px", marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>📈 Weighted Revenue Projections</div>
        <div style={{ fontSize: 11, color: "#374151", marginBottom: 18 }}>Weighted mix: 20% slow · 40% average · 30% busy · 10% peak</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #1e293b" }}>
              {["Period","Avg Units","Revenue","Gross Profit"].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: h === "Period" ? "left" : "right", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {([["Per Night", weeklyProjection.perNight],["Per Week", weeklyProjection.perWeek],["Per Month", weeklyProjection.perMonth],["Per Year", weeklyProjection.perYear]] as [string, any][]).map(([label, d], i) => (
              <tr key={label} style={{ borderBottom: "1px solid #111827", background: i === 3 ? "#0c2a1a" : "transparent" }}>
                <td style={{ padding: "10px 12px", color: i === 3 ? "#86efac" : "#e5e7eb", fontWeight: i === 3 ? 700 : 400 }}>{label}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#f9fafb" }}>{fmt(d.sales, i < 2 ? 1 : 0)}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#f9fafb", fontWeight: i === 3 ? 700 : 400 }}>{fmtCurrency(d.revenue)}</td>
                <td style={{ textAlign: "right", padding: "10px 12px", color: "#4ade80", fontWeight: i === 3 ? 700 : 400 }}>{fmtCurrency(d.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11, color: "#374151", textAlign: "center" }}>Model assumptions: google adult e-cigarette use rate (~8 to 15%%). For illustrative purposes only.</div>
    </div>
  );
}
