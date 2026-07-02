"use client";

import React, { useState } from "react";

export function KundaliDashboard({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState("Basic");

  const tabs = ["Basic", "Kundli", "Planetary Positions", "Dasha", "Free Report"];

  return (
    <div className="bg-white text-navy rounded-2xl overflow-hidden shadow-card border border-border w-full max-w-5xl mx-auto font-poppins">
      
      {/* Header Profile Section */}
      <div className="text-center py-8 border-b border-border bg-cream/30">
        <h2 className="text-3xl font-extrabold mb-2 text-navy">
          {data.name || "Your"} Kundli
        </h2>
        <p className="text-sm text-muted bg-white border border-border inline-block px-4 py-1.5 rounded-full shadow-sm">
          {new Date(data.birthDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} • {data.birthTime} • {data.birthPlace || "Unknown Location"}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border px-4 pt-4 pb-0 bg-gray-50/50 justify-center">
        <div className="flex gap-2 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-navy text-white shadow-md"
                  : "text-muted hover:text-navy hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-4 md:p-8 min-h-[400px] bg-white">
        {activeTab === "Basic" && <BasicTab data={data} />}
        {activeTab === "Kundli" && <KundliTab data={data} />}
        {activeTab === "Planetary Positions" && <PlanetsTab data={data} />}
        {activeTab === "Dasha" && <DashaTab data={data} />}
        {activeTab === "Free Report" && (
          <div className="text-center py-20 text-muted">
            <h3 className="text-xl font-bold text-navy mb-2">Free Report</h3>
            <p>A personalized reading based on your birth chart will be available soon.</p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-6 border-t border-border bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow border border-border">
            <span className="text-2xl">📄</span>
          </div>
          <div>
            <h4 className="font-bold text-navy">Get your full Kundli as a PDF</h4>
            <p className="text-xs text-muted">Download every section in a single printable report.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 rounded-full border border-navy text-navy font-semibold hover:bg-navy hover:text-white transition-colors text-sm">
          ↓ View PDF Report
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Sub-Components (Tabs)
// -------------------------------------------------------------

function BasicTab({ data }: { data: any }) {
  const panchang = data.panchang || {};
  const avakhada = data.avakhada || {};

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SectionCard title="Birth Details">
        <DataGrid>
          <DataRow label="Name" value={data.name || "-"} />
          <DataRow label="Gender" value={data.gender || "Male"} />
          <DataRow label="Date of Birth" value={data.birthDate} />
          <DataRow label="Time of Birth" value={data.birthTime} />
          <DataRow label="Place of Birth" value={data.birthPlace || "-"} />
          <DataRow label="Latitude" value={data.latitude?.toFixed(4) || "-"} />
          <DataRow label="Longitude" value={data.longitude?.toFixed(4) || "-"} />
          <DataRow label="Timezone" value={data.timezone || "-"} />
        </DataGrid>
      </SectionCard>

      <SectionCard title="Panchang">
        <DataGrid>
          <DataRow label="Tithi" value={panchang.tithi || "-"} />
          <DataRow label="Karana" value={panchang.karana || "-"} />
          <DataRow label="Yoga" value={panchang.yoga || "-"} />
          <DataRow label="Nakshatra" value={panchang.nakshatra || "-"} />
          <DataRow label="Nakshatra Lord" value={panchang.nakshatraLord || "-"} />
          <DataRow label="Ascendant" value={panchang.ascendant || "-"} />
          <DataRow label="Ascendant Lord" value={panchang.ascendantLord || "-"} />
          <DataRow label="Sunrise" value={panchang.sunrise || "-"} />
          <DataRow label="Sunset" value={panchang.sunset || "-"} />
        </DataGrid>
      </SectionCard>

      <div className="md:col-span-2">
        <SectionCard title="Avakhada Details">
          <DataGrid cols={2}>
            <DataRow label="Varna" value={avakhada.varna || "-"} />
            <DataRow label="Vashya" value={avakhada.vashya || "-"} />
            <DataRow label="Yoni" value={avakhada.yoni || "-"} />
            <DataRow label="Gan" value={avakhada.gana || "-"} />
            <DataRow label="Nadi" value={avakhada.nadi || "-"} />
            <DataRow label="Sign" value={avakhada.sign || "-"} />
            <DataRow label="Sign Lord" value={avakhada.signLord || "-"} />
            <DataRow label="Charan" value={avakhada.charan || "-"} />
            <DataRow label="Tatva" value={avakhada.tatva || "-"} />
            <DataRow label="Name Alphabet" value={avakhada.nameAlphabet || "-"} />
            <DataRow label="Paya" value={avakhada.paya || "-"} />
            <DataRow label="Yunja" value={avakhada.yunja || "-"} />
          </DataGrid>
        </SectionCard>
      </div>
    </div>
  );
}

function KundliTab({ data }: { data: any }) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <SectionCard title="Lagna Chart (D1)">
        <div className="flex justify-center p-4">
          <ChartVisualizer houses={data.chartHouses || Array.from({length: 12}, () => [])} />
        </div>
      </SectionCard>
      <SectionCard title="Navamsa Chart (D9)">
        <div className="flex justify-center p-4">
          <ChartVisualizer houses={data.navamsaChartHouses || Array.from({length: 12}, () => [])} />
        </div>
      </SectionCard>
    </div>
  );
}

function PlanetsTab({ data }: { data: any }) {
  const planets = data.planets || {};
  const planetList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto'];
  
  return (
    <SectionCard title="Planetary Positions">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50">
            <tr className="border-b border-border text-navy font-bold text-[10px] uppercase">
              <th className="py-3 px-4">Planet</th>
              <th className="py-3 px-4">Sign</th>
              <th className="py-3 px-4">Sign Lord</th>
              <th className="py-3 px-4">Nakshatra</th>
              <th className="py-3 px-4">Naksh Lord</th>
              <th className="py-3 px-4">Degree</th>
              <th className="py-3 px-4">Retro</th>
              <th className="py-3 px-4">House</th>
              <th className="py-3 px-4">State</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-gray-50/50">
              <td className="py-3 px-4 font-bold text-navy">Ascendant</td>
              <td className="py-3 px-4">{data.ascendant?.rashi || "-"}</td>
              <td className="py-3 px-4">{data.lagna?.rulingPlanet || "-"}</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4 text-xs font-medium text-navy/70">{(data.ascendant?.longitude % 30)?.toFixed(2)}°</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4 font-semibold">1</td>
              <td className="py-3 px-4">-</td>
              <td className="py-3 px-4">-</td>
            </tr>
            {planetList.map((p) => {
              const pData = planets[p];
              if (!pData) return null;
              return (
                <tr key={p} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy uppercase">{p}</td>
                  <td className="py-3 px-4">{pData.rashi}</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4">{pData.nakshatra}</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4 text-xs font-medium text-navy/70">{pData.degree || ((pData.longitude % 30)?.toFixed(2) + "°")}</td>
                  <td className="py-3 px-4">
                    {pData.isRetrograde ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold">YES</span> : <span className="text-muted">No</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold">{pData.house}</td>
                  <td className="py-3 px-4">{pData.state || "-"}</td>
                  <td className="py-3 px-4">{pData.status || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function DashaTab({ data }: { data: any }) {
  const dasha = data.dasha?.mahadashas || [];

  return (
    <SectionCard title="Vimshottari Dasha">
      <p className="text-xs text-muted mb-4">
        Tap any period to drill down through Mahadasha → Antardasha → Pratyantar → Sookshma.
      </p>
      
      <div className="flex gap-4 mb-4 text-xs font-bold text-muted uppercase overflow-x-auto pb-2">
        <span className="text-navy bg-navy/5 px-3 py-1 rounded-full border border-navy/10 shadow-sm">1 Mahadasha</span>
        <span className="px-3 py-1">2 Antardasha</span>
        <span className="px-3 py-1">3 Pratyantar</span>
        <span className="px-3 py-1">4 Sookshma</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b border-border text-navy font-bold text-[10px] uppercase">
              <th className="py-3 px-4">Planet</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4">End Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {dasha.map((d: any, idx: number) => {
              const start = new Date(d.startDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
              const end = new Date(d.endDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
              
              return (
                <tr key={idx} className={`transition-colors ${d.isActive ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-3 px-4 font-bold text-navy">
                    {d.planet.substring(0, 2).toUpperCase()} ({d.planet.toUpperCase()})
                    {d.isActive && <span className="ml-2 bg-navy text-white text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">Active</span>}
                  </td>
                  <td className="py-3 px-4 font-medium">{start}</td>
                  <td className="py-3 px-4 font-medium">{end}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-4 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-gray-100 hover:text-navy transition-colors">
                      Drill in
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// -------------------------------------------------------------
// UI Utilities
// -------------------------------------------------------------

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-navy border-l-4 border-navy pl-3">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DataGrid({ children, cols = 1 }: { children: React.ReactNode, cols?: number }) {
  const colClass = cols === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";
  return (
    <div className={`grid ${colClass} gap-y-0 md:gap-x-8`}>
      {children}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-border border-dashed last:border-0 items-center hover:bg-gray-50/50 px-1 -mx-1 rounded transition-colors">
      <span className="text-[10px] uppercase font-bold text-muted tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-navy text-right">{value}</span>
    </div>
  );
}

function ChartVisualizer({ houses }: { houses: any[][] }) {
  const ascSignIndex = houses.findIndex(h => h.some(p => p.name === 'Asc')) >= 0 
    ? houses.findIndex(h => h.some(p => p.name === 'Asc'))
    : 0;
  
  const houseSigns = Array.from({length: 12}, (_, i) => (ascSignIndex + i) % 12);
  
  const formatPlanets = (signIndex: number) => {
    const planets = houses[signIndex] || [];
    return planets.filter(p => p.name !== 'Asc').map(p => {
      let symbol = p.name.substring(0, 2);
      if (p.name === 'Sun') symbol = 'Su';
      if (p.name === 'Moon') symbol = 'Mo';
      if (p.name === 'Mars') symbol = 'Ma';
      if (p.name === 'Mercury') symbol = 'Me';
      if (p.name === 'Jupiter') symbol = 'Ju';
      if (p.name === 'Venus') symbol = 'Ve';
      if (p.name === 'Saturn') symbol = 'Sa';
      if (p.name === 'Rahu') symbol = 'Ra';
      if (p.name === 'Ketu') symbol = 'Ke';
      if (p.name === 'Uranus') symbol = 'Ur';
      if (p.name === 'Neptune') symbol = 'Ne';
      if (p.name === 'Pluto') symbol = 'Pl';
      
      const isRet = p.isRetrograde ? "®" : "";
      return symbol + isRet;
    }).join(" ");
  };

  const positions = [
    { x: 50, y: 25 },  // H1 (Top)
    { x: 25, y: 12.5 }, // H2 (Top Left 1)
    { x: 12.5, y: 25 }, // H3 (Top Left 2)
    { x: 25, y: 50 },  // H4 (Left)
    { x: 12.5, y: 75 }, // H5 (Bottom Left 1)
    { x: 25, y: 87.5 }, // H6 (Bottom Left 2)
    { x: 50, y: 75 },  // H7 (Bottom)
    { x: 75, y: 87.5 }, // H8 (Bottom Right 1)
    { x: 87.5, y: 75 }, // H9 (Bottom Right 2)
    { x: 75, y: 50 },  // H10 (Right)
    { x: 87.5, y: 25 }, // H11 (Top Right 1)
    { x: 75, y: 12.5 }  // H12 (Top Right 2)
  ];

  return (
    <div className="relative w-full aspect-square max-w-[320px] bg-cream/10 rounded-xl border border-border shadow-sm p-4">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer Box */}
        <rect x="2" y="2" width="96" height="96" fill="white" stroke="#1c253c" strokeWidth="0.8" />
        
        {/* Diagonals */}
        <line x1="2" y1="2" x2="98" y2="98" stroke="#1c253c" strokeWidth="0.8" />
        <line x1="2" y1="98" x2="98" y2="2" stroke="#1c253c" strokeWidth="0.8" />
        
        {/* Diamond Box */}
        <polygon points="50,2 98,50 50,98 2,50" fill="none" stroke="#1c253c" strokeWidth="0.8" />

        {/* Text Rendering */}
        {positions.map((pos, idx) => {
          const signIndex = houseSigns[idx];
          const planetsStr = formatPlanets(signIndex);
          return (
            <g key={idx}>
              <text x={pos.x} y={pos.y + 4} fontSize="4" fill="#64748b" fontWeight="bold" textAnchor="middle">
                {signIndex + 1}
              </text>
              <text x={pos.x} y={pos.y - 1} fontSize="5" fill="#1c253c" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                {planetsStr}
              </text>
            </g>
          );
        })}
        {/* Ascendant Label */}
        <text x="50" y="32" fontSize="3.5" fill="#dc2626" fontWeight="bold" textAnchor="middle">
          Asc
        </text>
      </svg>
    </div>
  );
}
