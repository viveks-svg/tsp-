export interface SolutionDetail {
  importance: string;
  importancePoints: string[];
  process: { title: string; description: string }[];
  spikyBadgeText: string;
}

export const SOLUTION_DETAILS: Record<string, SolutionDetail> = {
  "business-vastu": {
    importance: "Spatial alignment is the silent driver of business trajectory. In commercial facilities, structural defects block natural flow, leading to cognitive fatigue, financial leakages, and team friction. By harmonising the workspace, you establish a high-resonance environment that naturally attracts growth, operational coherence, and stable wealth creation.",
    importancePoints: [
      "Accelerate cash flow cycles and eliminate capital bottlenecks.",
      "Optimise the leadership zone to enhance strategic vision and decision-making.",
      "Harmonise employee zones to boost operational output and collaboration."
    ],
    process: [
      { title: "Spatial Diagnostics", description: "Complete direction mapping using precision grids to analyse floor plans, exits, and core quadrants." },
      { title: "Founder-Space Resonance", description: "Aligning the primary decision-makers' birth charts (horoscope) with their desk orientation for maximum clarity." },
      { title: "Remedial Architecture", description: "Implementing non-destructive remedies using micro-elements, metal rods, and colors to balance spatial zones." }
    ],
    spikyBadgeText: "94% Growth"
  },
  "office-vastu": {
    importance: "A corporate office is a brain center. Desk placement, entrance flow, and department mapping dictate whether your team executes with high focus or falls into internal friction. Aligning these elements creates a silent foundation for cognitive clarity and sustained performance.",
    importancePoints: [
      "Position executive cabins to command authority and clear vision.",
      "Structure finance desks to secure capital retention and prevent leaks.",
      "Design sales areas in high-energy zones to accelerate deal velocity."
    ],
    process: [
      { title: "Layout Mapping", description: "Creating a 16-zone energy map of the corporate space to locate blockages." },
      { title: "Desk Calibration", description: "Aligning individual workspace orientation based on corporate hierarchy and personal attributes." },
      { title: "Energy Balancing", description: "Applying botanical and color therapies to neutralize negative zones." }
    ],
    spikyBadgeText: "Peak Focus"
  },
  "factory-vastu": {
    importance: "Industrial spaces handle heavy machinery and raw mass, making them highly sensitive to geothermal and structural stresses. Factory Vastu aligns raw inputs, heavy processing units, and finished outputs to guarantee machine uptime, staff safety, and consistent production quality.",
    importancePoints: [
      "Map heating elements (boilers/furnaces) to fire quadrants to prevent breakdowns.",
      "Position raw material intake and dispatch zones to smooth out supply chains.",
      "Ensure worker safety zones are placed in low-stress sectors."
    ],
    process: [
      { title: "Geopathic Audit", description: "Checking the factory ground for geological faults and electromagnetic anomalies." },
      { title: "Machinery Zoning", description: "Strategically placing high-power, high-vibration equipment in grounding sectors." },
      { title: "Flow Calibration", description: "Aligning the raw-to-finished production path to flow clockwise for optimal kinetic energy." }
    ],
    spikyBadgeText: "High Yield"
  },
  "retail-vastu": {
    importance: "In retail, customer dwell time, conversion rates, and ticket sizes are governed by spatial psychology. Retail Vastu designs the flow so that customers are naturally drawn to high-margin zones, cashier counters are secure, and display windows radiate positive allure.",
    importancePoints: [
      "Position display zones to optimize customer circulation and interest.",
      "Orient cashier counters to face positive directions for cash accumulation.",
      "Design main entrance to project welcoming, high-frequency energy."
    ],
    process: [
      { title: "Entrance Vetting", description: "Evaluating the primary doorway to unlock high-frequency customer attraction." },
      { title: "Product Placement Map", description: "Designing circulation pathways to guide visitors to primary display cases." },
      { title: "Billing Quadrant Setup", description: "Setting up cash desks in stable sectors to prevent sudden losses and bad debts." }
    ],
    spikyBadgeText: "Max Sales"
  },
  "hotel-vastu": {
    importance: "Hospitality centers thrive on guest satisfaction, high occupancy, and smooth kitchens. Hotel Vastu structures guest flow, reception layout, and kitchen placement to ensure repeat stays, glowing reviews, and operational ease.",
    importancePoints: [
      "Place kitchens in fire-aligned zones to ensure food quality and service speed.",
      "Design reception lobbies to instantly calm and comfort arriving guests.",
      "Align bedrooms for deep sleep, ensuring guests wake up refreshed."
    ],
    process: [
      { title: "Lobby Restructuring", description: "Aligning reception counters to face growing directions, driving trust." },
      { title: "Kitchen Calibration", description: "Balancing the water elements (sinks) and fire elements (burners) to avoid kitchen conflicts." },
      { title: "Suite Optimisation", description: "Positioning master suites in grounding quadrants for VIP guest satisfaction." }
    ],
    spikyBadgeText: "Occupancy+"
  },
  "commercial-plot": {
    importance: "Before committing capital to land, vetting its energy blueprint is critical. Commercial Plot Selection ensures the soil structure, slope geometry, and surrounding environmental features support building life, preventing toxic investments.",
    importancePoints: [
      "Analyse boundary shapes to avoid irregular lands that cause legal disputes.",
      "Vet geological slope to ensure natural wealth accumulation.",
      "Identify surrounding structures (roads, power towers) that could block positive flow."
    ],
    process: [
      { title: "Soil Vigor Test", description: "Testing soil color, scent, and moisture absorption to judge land health." },
      { title: "Slope & Geometry Mapping", description: "Mapping plot elevations to secure positive north-east drainage." },
      { title: "Surrounding Aura Audit", description: "Assessing neighbouring junctions and flow streams to check for blockage issues." }
    ],
    spikyBadgeText: "Safe Capital"
  },
  "coworking-vastu": {
    importance: "Startup hubs and co-working spaces host highly dynamic, mixed energies. Creating zones that support both quiet focus and collaborative networking requires fluid, modern Vastu strategies that balance yin and yang.",
    importancePoints: [
      "Design quiet chambers in grounding sectors for strategy work.",
      "Structure open desk bays in high-communal zones to encourage networking.",
      "Align private founder cabins to support investor negotiations and scale."
    ],
    process: [
      { title: "Dynamic Flow Layout", description: "Designing open desks with clear pathways to ensure ideas flow freely." },
      { title: "Meeting Room Setup", description: "Structuring conference tables to promote alignment and agreements." },
      { title: "Refreshment Zone Balance", description: "Placing pantry elements carefully to maintain a positive corporate vibe." }
    ],
    spikyBadgeText: "Startup Seed"
  },
  "strategic-consulting": {
    importance: "Timing is the ultimate business leverage. A brilliant strategy launched under hostile planetary configurations can face heavy friction, while a standard plan launched at the right cosmic window can soar. Strategic Consulting aligns decisions with the cycles of time.",
    importancePoints: [
      "Determine precise windows for mergers, acquisitions, and launch dates.",
      "Identify corporate risk cycles to avoid premature expansion.",
      "Calibrate corporate timing with the primary founder's personal chart."
    ],
    process: [
      { title: "Karmic Mapping", description: "Analysing the company's birth chart alongside major market movements." },
      { title: "Transit Simulation", description: "Identifying high-fortune windows (Muhurata) for key launches." },
      { title: "Risk Mitigation", description: "Formulating strategies to safely navigate transit challenges." }
    ],
    spikyBadgeText: "Timeless"
  },
  "partnership-analysis": {
    importance: "Partnership compatibility goes beyond written contracts. It is an alignment of destiny and character. Partnership Analysis compares charts to predict alignment points, financial synergies, and potential friction areas before commitments are signed.",
    importancePoints: [
      "Map chart synergies to ensure long-term trust and alignment.",
      "Identify financial luck distribution between partners to assign roles.",
      "Understand mutual blindspots to prevent sudden corporate deadlocks."
    ],
    process: [
      { title: "Synastry Vetting", description: "Comparing birth charts of key partners to identify synergy sectors." },
      { title: "Role Distribution Check", description: "Determining who should lead execution versus strategy based on planetary focus." },
      { title: "Conflict Mitigation Plan", description: "Providing remedies to balance chart mismatches and maintain cooperation." }
    ],
    spikyBadgeText: "Synergy"
  },
  "expansion-timing": {
    importance: "Expansion requires heavy energy output. Launching new offices or entering new markets under adverse dasha cycles can drain reserves. We identify cosmic windows of maximum luck to support your geographical and market growth.",
    importancePoints: [
      "Target high-luck windows to ensure new branches yield returns quickly.",
      "Identify market entry points that match your corporate strengths.",
      "Protect core assets during astrological downtime cycles."
    ],
    process: [
      { title: "Dasha Timeline Analysis", description: "Calculating active cycles of main decision-makers to evaluate risk tolerance." },
      { title: "Geographical Direction Vetting", description: "Aligning target expansion directions with the corporate chart." },
      { title: "Launch Date Vetting", description: "Pinpointing the exact hour to open doors or go public." }
    ],
    spikyBadgeText: "Scale Safely"
  },
  "brand-analysis": {
    importance: "A name is a repeating sound frequency. When a brand name, logo shape, and color scheme resonate with the corporate core, the market adopts it quickly. We use sound vibration and numerological mapping to craft names that connect.",
    importancePoints: [
      "Tune your brand name numerology to attract target customer demographics.",
      "Select color palettes that trigger specific emotional responses (Vastu colors).",
      "Design logo shapes that match your corporate element (fire, earth, water, air, ether)."
    ],
    process: [
      { title: "Vibration Test", description: "Measuring the numerological spelling vibration of name options." },
      { title: "Element Mapping", description: "Aligning industry type (e.g. tech, real estate) with colors." },
      { title: "Symbol Audit", description: "Vetting logo graphics for positive geometric alignment." }
    ],
    spikyBadgeText: "Market Magnet"
  },
  "career-guidance": {
    importance: "Career growth is determined by placing yourself in your zone of genius. Astrological Career Guidance analyses your 10th house, planetary strengths, and dasha cycles to clarify whether you should choose corporate leadership, entrepreneurship, or specialized paths.",
    importancePoints: [
      "Discover industries that match your planetary signature.",
      "Understand transit timing to make career changes at high-luck windows.",
      "Learn specific remedies to overcome job blockages and corporate politics."
    ],
    process: [
      { title: "Horoscope Vetting", description: "Deep-dive analysis of your natal chart's career quadrant (Dashamsha)." },
      { title: "Timeline Calibration", description: "Mapping active planetary cycles to evaluate timing for job changes." },
      { title: "Action Remedies", description: "Providing gem, mantra, and alignment recommendations to remove path blocks." }
    ],
    spikyBadgeText: "High Growth"
  },
  "relationship-guidance": {
    importance: "Personal relationships are the foundation of executive focus. Friction at home drains vital energy. We use compatibility comparisons to identify relationship roots, restore communication flow, and guide couples to deep harmony.",
    importancePoints: [
      "Understand mutual charts to build communication bridges.",
      "Identify planetary mismatches that cause emotional distance.",
      "Learn timing cycles to plan major relationship decisions."
    ],
    process: [
      { title: "Dual Chart Analysis", description: "Comparing birth charts of both individuals to evaluate compatibility sectors." },
      { title: "Friction Point Diagnostics", description: "Pinpointing root causes of misunderstandings (e.g. ego clashes, expression blocks)." },
      { title: "Synergy Activation", description: "Providing subtle remedies and environmental tips to re-ignite warmth." }
    ],
    spikyBadgeText: "True Bond"
  },
  "health-wellness": {
    importance: "The physical body is your vehicle for worldly success. Planetary positions indicate energy centers that are prone to imbalances. We provide insights to align your body, mind, and spirit with natural cosmic rhythms.",
    importancePoints: [
      "Discover personal vulnerabilities before they manifest as physical issues.",
      "Identify the best times for medical procedures or detox programs.",
      "Learn custom botanical and gemstone recommendations to align energy flow."
    ],
    process: [
      { title: "Natal Health Analysis", description: "Vetting the chart's 6th and 8th houses for energy flow issues." },
      { title: "Cycle Timeline Mapping", description: "Tracing active dashas that could trigger physical fatigue." },
      { title: "Holistic Remedy Design", description: "Creating a personalized routine of Vastu adjustments and gemstones." }
    ],
    spikyBadgeText: "Vitality"
  },
  "family-harmony": {
    importance: "A home should be a sanctuary of peace. When family members' charts clash, domestic tension rise. We evaluate the family space and chart dynamics to dissolve arguments, align communication, and restore deep domestic peace.",
    importancePoints: [
      "Identify Vastu blocks in the home that trigger arguments.",
      "Align bedrooms to ensure peaceful family communication.",
      "Resolve generational conflicts by understanding chart dynamics."
    ],
    process: [
      { title: "Home Energy Mapping", description: "Evaluating the home layout for blocks that trigger stress." },
      { title: "Chart Harmony Vetting", description: "Reviewing family members' horoscopes to discover compatibility zones." },
      { title: "Sanctuary Activation", description: "Placing metallic and color correctors to bring peace to shared spaces." }
    ],
    spikyBadgeText: "Pure Peace"
  },
  "residential-vastu": {
    importance: "Your home is the soil where your energy grows. Poor residential Vastu drains health, causes financial blocks, and disrupts family dynamics. Residential Vastu aligns structural zones to unlock health, stability, and deep peace.",
    importancePoints: [
      "Align the master bedroom in stable zones to support rest and recovery.",
      "Structure the kitchen in fire sectors to promote family health and vitality.",
      "Design entryways to welcome positive energy and abundance."
    ],
    process: [
      { title: "Full Spatial Map", description: "Tracing the home layout using an energy grid to identify blocks." },
      { title: "Remedy Layout Vetting", description: "Placing elemental correctors to balance zones without breaking walls." },
      { title: "Bedroom & Kitchen Audit", description: "Fine-tuning sleeping positions and kitchen elements for health and harmony." }
    ],
    spikyBadgeText: "Dr. Choice"
  },
  "apartment-vastu": {
    importance: "Apartment living has structural limits. Renters or owners often cannot knock down walls or move bathrooms. Apartment Vastu uses furniture adjustments, micro-remedies, and color zones to balance energy within apartment layouts.",
    importancePoints: [
      "Balance energy entries when you cannot modify doors.",
      "Use color zones to offset negative bathroom placements.",
      "Structure workspace desks in small rooms to maximize focus."
    ],
    process: [
      { title: "Micro-Grid Mapping", description: "Anatomizing the specific apartment layout to locate energy sectors." },
      { title: "Furniture Calibration", description: "Re-arranging furniture and mirror positions to channel positive flow." },
      { title: "Elemental Balancing", description: "Using salt, copper, and plant elements to resolve structural defects." }
    ],
    spikyBadgeText: "Renter Safe"
  },
  "villa-planning": {
    importance: "Building a luxury villa is a significant lifetime project. Ground-up Vastu planning ensures your dream home is designed for luck from day one. We collaborate with your architects to build Vastu directly into your floor plans.",
    importancePoints: [
      "Position compound entries, main gates, and elevations for long-term luck.",
      "Map out high-ceiling zones and balconies to invite positive energies.",
      "Incorporate pools, water features, and gardens in sectors of wealth."
    ],
    process: [
      { title: "Land Selection Audit", description: "Evaluating the plot geometry and soil strength before building." },
      { title: "Architect Collaboration", description: "Working directly with layout drafts to align doorways and rooms." },
      { title: "Ceremonial Timing Vetting", description: "Selecting dates for foundation laying (Bhoomi Pujan) to secure peace." }
    ],
    spikyBadgeText: "Luxury Standard"
  },
  "new-construction": {
    importance: "New builds offer a blank canvas. Integrating Vastu from the first brick ensures every bedroom, staircase, and support beam is placed in its optimal quadrant, establishing a foundation for generations of health and growth.",
    importancePoints: [
      "Structure load-bearing pillars to prevent heavy pressure in energy zones.",
      "Place water tanks and drainage in sectors that prevent financial leaks.",
      "Design roof slope geometry to invite clean solar energy flow."
    ],
    process: [
      { title: "Vastu Plan Review", description: "Drafting the ideal structural plan before architectural drawings start." },
      { title: "Phase-Wise Checks", description: "Vetting the construction at key stages (foundation, columns, roof) to ensure alignment." },
      { title: "Energy Activation", description: "Performing energy activation ceremonies upon building completion." }
    ],
    spikyBadgeText: "Generational"
  }
};
