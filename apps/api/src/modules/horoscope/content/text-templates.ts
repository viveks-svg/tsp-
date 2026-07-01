import { ThemeTag } from './planet-transit-rules';

type Category = 'love' | 'career' | 'health' | 'finance' | 'overall';

/**
 * Manually-authored text templates for every ThemeTag × Category combination.
 * 3-5 paragraph variants per entry. Written in Dr. Pradeep Sharma's established tone —
 * warm, guiding, empowering, with cosmic metaphor layered over practical advice.
 *
 * The content assembler picks from these deterministically per (sign + date + category)
 * so re-renders of the same day are stable, but different signs get different sentences.
 */
export const TEXT_TEMPLATES: Record<ThemeTag, Record<Category, string[]>> = {
  'career-growth': {
    career: [
      'Professional momentum builds today — a project you have been steering quietly starts drawing the right attention. Trust the rhythm you have established and let your work speak for itself.',
      'This is a favorable window to put forward ideas at work; decision-makers are more receptive than usual. Present your vision with clarity and conviction.',
      'Planetary energies align to elevate your professional standing. Whether it is a promotion, recognition, or a new assignment, the cosmos supports bold career moves today.',
      'Your diligence is about to pay dividends. A strategic step taken now — updating a proposal, scheduling that meeting — could set the tone for weeks to come.',
    ],
    love: [
      'Your focus on responsibilities may leave little room for romance today, but a partner who understands your ambition will appreciate the honesty. Share your wins openly.',
      'Career momentum can energize your personal life too. Channel today\'s confidence into meaningful conversations with your loved one.',
      'Professional success radiates attractive energy. If single, you may attract someone who admires your drive and sense of purpose.',
    ],
    health: [
      'Channel restless energy into productive work rather than letting it build as tension. A brisk walk between meetings will keep your mind sharp.',
      'High career engagement can drain your reserves — schedule hydration and meal breaks with the same discipline you apply to deadlines.',
      'The surge of professional energy is best sustained with steady nutrition and planned breaks. Guard against the urge to skip self-care.',
    ],
    finance: [
      'Career-linked income opportunities are more visible than passive ones today. Focus efforts on professional growth channels for maximum financial return.',
      'The planetary alignment favors job-related financial gains. A raise, bonus, or lucrative new project is within reach if you demonstrate consistent value.',
      'Investments tied to your professional expertise or industry knowledge carry favorable returns during this transit.',
    ],
    overall: [
      'A day defined by forward motion — trust the direction you are already moving in. The planets encourage disciplined effort over dramatic pivots.',
      'Cosmic currents carry you toward professional growth. Lean into your strengths, maintain focus, and let the universe amplify your effort.',
      'The trajectory is upward. Today rewards those who show up prepared and lead with integrity.',
    ],
  },

  'career-obstacles': {
    career: [
      'Workplace friction may surface today — a colleague\'s agenda could conflict with your timeline. Stay composed and focus on what you can control.',
      'Progress at work may feel slower than expected. Planetary transits suggest patience rather than force. Revisit your strategy and refine before pushing forward.',
      'Authority figures may be less approachable today. Choose your battles wisely and save bold proposals for a more receptive window.',
      'Obstacles at work are temporary teachers. What feels like a setback is realigning you toward a more sustainable path.',
    ],
    love: [
      'Work stress may spill into your personal space. Make a conscious effort to leave professional frustrations at the office door.',
      'If your partner senses your work tension, a brief honest conversation can prevent misunderstandings from taking root.',
    ],
    health: [
      'Career-related stress can manifest as shoulder or neck tension. Prioritize stretching and conscious breathing throughout the day.',
      'When professional pressures mount, your body responds. Listen to it — rest is not laziness; it is strategic recovery.',
    ],
    finance: [
      'Avoid major financial decisions driven by career frustration. Reactive spending or impulsive investments rarely serve you well under this transit.',
      'Financial delays linked to work — pending reimbursements, delayed approvals — are likely temporary. Follow up calmly.',
    ],
    overall: [
      'A day that tests your resilience. The planets ask you to slow down, reassess, and emerge stronger from momentary friction.',
      'Challenges today are not roadblocks — they are redirections. Stay grounded and trust the process.',
    ],
  },

  'financial-gain': {
    career: [
      'Professional efforts translate directly into financial rewards today. Your work output has a clearer-than-usual link to monetary recognition.',
      'A business opportunity or client lead could surface unexpectedly. Stay alert to conversations that carry financial undertones.',
    ],
    love: [
      'Financial stability brings emotional security. Share your optimism with your partner — prosperity is more joyful when celebrated together.',
      'If single, your grounded financial energy is attractive. Abundance and generosity draw meaningful connections your way.',
    ],
    health: [
      'Financial ease relieves a layer of stress, improving your sleep quality and overall vitality. Enjoy this lighter mental state.',
      'Use the positive financial energy to invest in your well-being — a quality meal, a wellness treatment, or simply a restful evening.',
    ],
    finance: [
      'Planetary transits favor monetary gains today. Whether through salary, investments, or unexpected windfalls, the financial current flows in your direction.',
      'This is an excellent day for savings and investment decisions. The cosmic window supports wealth-building actions taken with clear intention.',
      'Income from multiple sources may converge today. Review your portfolio and consider channeling surplus into stable, long-term instruments.',
      'Financial clarity arrives — use this window to clear pending dues, negotiate better terms, or lock in a favourable deal.',
    ],
    overall: [
      'Abundance is the theme today. The planets align to support your material well-being — receive with gratitude and plan with wisdom.',
      'A day when effort and reward feel proportionate. Trust the financial flow and make intentional moves toward prosperity.',
    ],
  },

  'financial-caution': {
    career: [
      'Work-related expenses may run higher than planned. Double-check budgets and seek pre-approvals before committing organizational funds.',
      'Avoid tying career decisions to immediate financial outcomes today. The monetary picture may be temporarily clouded.',
    ],
    love: [
      'Financial tension can quietly erode relationship harmony. Be transparent with your partner about any money concerns — shared burdens weigh less.',
      'Avoid arguments about spending habits today. Planetary energies amplify financial anxiety — compassion is the better response.',
    ],
    health: [
      'Financial worry can disrupt sleep and digestion. Ground yourself with warm meals, herbal tea, and a brief evening meditation.',
      'Stress about money may surface as headaches or tight muscles. A gentle walk and deliberate deep breathing will ease the tension.',
    ],
    finance: [
      'Avoid impulsive purchases and high-risk investments today. The planetary configuration suggests caution, not contraction — protect what you have.',
      'This is not the day for speculative ventures. Review your outflows, tighten unnecessary subscriptions, and defer major financial commitments.',
      'Unexpected expenses may arise — keep a buffer available. The transit passes, but the habits you build now protect future stability.',
      'Financial clarity may be temporarily obscured. Avoid signing contracts or making binding commitments until the cosmic fog lifts.',
    ],
    overall: [
      'A day for financial discipline rather than expansion. Protect your assets and trust that abundance will return when the transit shifts.',
      'Caution is not fear — it is wisdom applied at the right time. Guard your resources today and plan for growth tomorrow.',
    ],
  },

  'romance-favorable': {
    career: [
      'Romantic contentment improves your workplace demeanor. You bring warmth and diplomacy to professional interactions, which colleagues notice and appreciate.',
      'Creative projects benefit from the heart-centered energy of today\'s transit. Let beauty and connection inspire your work.',
    ],
    love: [
      'The planets align to bless matters of the heart. Existing relationships deepen through honest conversation and shared vulnerability.',
      'If single, today carries a magnetic quality — you may encounter someone whose energy complements yours in unexpected ways.',
      'Love flows more naturally today. Express affection without overthinking; spontaneity and sincerity are your strongest romantic tools.',
      'A gesture of genuine care — a thoughtful message, a surprise plan, or simply undivided attention — strengthens your bond immeasurably today.',
      'Cosmic energies favour intimacy and emotional honesty. Lower your guard and let your heart lead.',
    ],
    health: [
      'Emotional fulfilment from love improves physical vitality. You may feel lighter, more energized, and more present in your body today.',
      'Romantic joy has a healing quality. Let the warmth of connection replenish areas where stress has depleted you.',
    ],
    finance: [
      'Romantic plans may involve spending — a dinner, a gift, a shared experience. Budget mindfully, but do not let frugality dim a meaningful gesture.',
      'Financial decisions made with your partner\'s input today carry extra wisdom. Two aligned minds see opportunities one might miss.',
    ],
    overall: [
      'Love is the dominant frequency today. Whether romantic, familial, or self-directed, the heart-space is wide open and receptive.',
      'A day coloured by connection and warmth. The cosmos supports vulnerability and rewards authentic emotional expression.',
    ],
  },

  'romance-friction': {
    career: [
      'Relationship tension may linger in the background of your workday. Compartmentalize consciously — the office is not the space for emotional processing.',
      'If a misunderstanding with a partner weighs on you, jot down your thoughts for a later conversation rather than carrying them through meetings.',
    ],
    love: [
      'Minor misunderstandings may surface in romantic relationships today. Avoid reactive responses — pause, breathe, and choose words that build rather than burn.',
      'Expectations may not align with reality in love today. Practice acceptance over control, and give your partner the grace you would want for yourself.',
      'The transit stirs old patterns or unresolved conversations. Face them gently — avoidance only postpones the discomfort.',
      'Friction is not failure. Relationships that weather honest disagreement emerge stronger. Approach today\'s challenges as invitations to grow together.',
    ],
    health: [
      'Emotional turbulence in relationships can manifest physically. Pay attention to your chest, shoulders, and breathing — tension lodges there first.',
      'If romance feels strained, prioritize self-soothing rituals. A warm bath, journaling, or a quiet walk can reset your emotional baseline.',
    ],
    finance: [
      'Avoid making shared financial decisions during a period of romantic tension. Clarity about money requires emotional calm.',
      'Impulse spending as emotional comfort is tempting today. Redirect the urge toward low-cost self-care instead.',
    ],
    overall: [
      'A day that tests emotional patience. The planets remind you that love is a practice, not a feeling — show up even when it is hard.',
      'Friction in love is a signal to grow, not a signal to leave. Navigate today with compassion for yourself and your partner.',
    ],
  },

  'family-harmony': {
    career: [
      'Family stability provides a calm foundation for your workday. You approach professional tasks with groundedness and clarity.',
      'Support from home empowers your professional confidence. Acknowledge the people who make your career ambitions possible.',
    ],
    love: [
      'Familial love extends into romantic relationships today. Warmth, generosity, and emotional availability flow naturally.',
      'A family gathering or shared meal could be the setting for a meaningful romantic moment. Be present and attentive.',
    ],
    health: [
      'Harmony at home is one of the most powerful health tonics. Your nervous system rests when the domestic sphere feels safe and loving.',
      'Cook or share a nourishing meal with family. The act of communal eating is deeply restorative under this planetary influence.',
    ],
    finance: [
      'Family-related financial decisions — home improvements, education investments — carry favourable energy today.',
      'Shared family resources are best discussed today when goodwill is high. Pool ideas and plan collaboratively.',
    ],
    overall: [
      'Home is your power centre today. The planets bless domestic tranquility and encourage you to invest time in the people who matter most.',
      'A day of belonging and emotional warmth. Let the comforts of family replenish your spirit.',
    ],
  },

  'family-tension': {
    career: [
      'Domestic stress may distract you at work. Set clear mental boundaries and reserve a specific time after hours to address home concerns.',
      'Family obligations could compete with professional deadlines. Communicate transparently with both sides about your constraints.',
    ],
    love: [
      'Family tension can strain romantic relationships, especially if your partner is part of the dynamic. Protect your partnership from external pressures.',
      'If a family disagreement affects your mood, be honest with your partner rather than withdrawing. Shared understanding prevents isolation.',
    ],
    health: [
      'Tension at home disrupts your inner peace. Prioritize grounding activities — gardening, cooking, or a brief solitary walk to recalibrate.',
      'Stress from family conflicts can affect your digestion and sleep. Eat light, avoid caffeine after noon, and wind down with calming rituals.',
    ],
    finance: [
      'Avoid financial arguments with family members today. The transit amplifies sensitivity around shared resources — defer tough conversations.',
      'Family-related expenses may feel burdensome. Review with a clear head after the emotional temperature cools.',
    ],
    overall: [
      'A day that tests patience within the family sphere. Respond with empathy, set healthy boundaries, and trust that this phase is temporary.',
      'Home may feel unsettled, but every family navigates storms. Your calm presence is the anchor others need today.',
    ],
  },

  'health-vitality': {
    career: [
      'Physical energy is high — channel it into ambitious work tasks or long-overdue projects that require stamina and focus.',
      'Your vitality is noticeable to colleagues. This is an excellent day to lead meetings, pitch ideas, or tackle physically demanding tasks.',
    ],
    love: [
      'Strong physical energy enhances romantic experiences. Plan an active date — a walk, a sport, or a shared adventure.',
      'Vitality is attractive. Your radiant energy draws your partner closer and makes new connections feel effortless.',
    ],
    health: [
      'Physical energy is at a peak today. This is the ideal day for vigorous exercise, outdoor activities, or trying a new fitness routine.',
      'Your body responds well to challenge today. Push gently past your comfort zone — the planets support physical growth and recovery.',
      'Vitality flows strongly through your system. Honour it with quality nutrition, adequate water, and purposeful movement.',
      'Energy levels are excellent. Use this window to establish healthy habits that will carry you through lower-energy days ahead.',
    ],
    finance: [
      'Good health is your greatest asset. Today\'s vitality reminds you to invest in wellness — it pays returns no portfolio can match.',
      'Physical energy translates to productivity, which drives financial outcomes. The body-money connection is real and active today.',
    ],
    overall: [
      'A day of robust vitality. The cosmos supports physical endeavors, outdoor adventures, and any activity that celebrates the body\'s capabilities.',
      'Energy and well-being are your allies. Move with purpose, eat with intention, and let the day\'s dynamism carry you forward.',
    ],
  },

  'health-caution': {
    career: [
      'Energy levels may dip during work hours. Prioritize essential tasks and delegate where possible — sustainability matters more than heroics.',
      'Your body may signal the need to slow down. Honour workplace wellness — take breaks, hydrate, and avoid overcommitting.',
    ],
    love: [
      'Low energy can dampen romantic enthusiasm. Communicate your state honestly rather than forcing engagement — rest is a valid choice.',
      'A partner who respects your need for rest is a partner worth cherishing. Allow yourself to be cared for today.',
    ],
    health: [
      'Planetary energies suggest extra care for your physical well-being. Avoid overexertion, eat warm nourishing foods, and rest early.',
      'This is not the day for extremes in diet or exercise. Moderation protects you when cosmic currents challenge the body.',
      'Pay attention to early signals — fatigue, mild aches, or disrupted sleep. Address them promptly before they compound.',
      'Hydration, gentle movement, and adequate sleep are your three non-negotiables today. The transit asks for protection, not performance.',
    ],
    finance: [
      'Health-related expenses may surface. Ensure your emergency fund and insurance are adequate — prevention is the wisest financial medicine.',
      'Avoid draining financial energy today. Stress about money amplifies physical vulnerability — keep financial worries in perspective.',
    ],
    overall: [
      'A day to prioritize self-care above ambition. The cosmos reminds you that your body is the vessel for everything you wish to achieve.',
      'Guard your well-being with intentional rest and gentle nourishment. This transit passes, and vitality returns — but only if you honour the pause.',
    ],
  },

  'travel-favorable': {
    career: [
      'Work-related travel is well-starred today. Business trips, client visits, or conferences carry productive energy and unexpected opportunities.',
      'If a professional journey is on the horizon, today\'s planning will be especially effective. Logistics fall into place with unusual ease.',
    ],
    love: [
      'Travel brings romantic possibility. Whether journeying together or meeting someone new on the road, movement opens the heart.',
      'Plan a weekend getaway or a spontaneous day trip with your partner. Shared adventure reignites the spark.',
    ],
    health: [
      'Movement is medicine today. Walking, cycling, or simply changing your physical environment brings mental clarity and renewed energy.',
      'Travel can disrupt routines. Pack healthy snacks, stay hydrated, and build in rest stops to maintain your well-being on the road.',
    ],
    finance: [
      'Travel-related investments — booking early, securing deals — are favoured. Act on opportunities that combine movement with financial advantage.',
      'A journey today could lead to unexpected financial connections or business prospects. Stay open to conversations with strangers.',
    ],
    overall: [
      'The cosmos favours movement and exploration. Whether physical travel or an intellectual journey, expand your horizons today.',
      'A day for adventure and discovery. Step beyond familiar territory — the universe rewards those who embrace the road ahead.',
    ],
  },

  'communication-clarity': {
    career: [
      'Your words carry precision and weight today. Use this clarity for presentations, negotiations, or any conversation where articulation matters.',
      'Written communication is especially effective. Emails, proposals, and reports you draft today will land with impact.',
      'Colleagues and clients understand your intent more easily today. Leverage this clarity to resolve ambiguities and align expectations.',
    ],
    love: [
      'Express what you feel clearly and kindly. Today\'s planetary support makes difficult conversations easier and honest words land softly.',
      'If there is something you have been meaning to say to your partner, today is the day. Clarity paired with compassion is irresistible.',
    ],
    health: [
      'Mental clarity reduces cognitive fatigue. You may find your thoughts are crisper, decisions quicker, and mental fog conspicuously absent.',
      'Use this mental sharpness for journaling or planning your health goals. Clear thinking today leads to better habits tomorrow.',
    ],
    finance: [
      'Financial communications — negotiations, contract reviews, discussions with advisors — benefit from today\'s verbal precision.',
      'Read the fine print today. Your clarity of mind makes you more likely to catch details that matter financially.',
    ],
    overall: [
      'A day of clear thinking and precise expression. Use your voice — written or spoken — to create alignment and understanding.',
      'The planets sharpen your intellect and tongue. Communicate with purpose and watch how doors open in response.',
    ],
  },

  'communication-conflict': {
    career: [
      'Words may be misinterpreted at work today. Proofread emails twice, avoid sarcasm, and confirm understanding in meetings explicitly.',
      'A colleague\'s comment may feel harsher than intended. Give the benefit of the doubt and respond with measured composure.',
    ],
    love: [
      'Miscommunication is the risk today, not malice. If a conversation with your partner goes sideways, pause and restart with curiosity instead of defence.',
      'Avoid texting about sensitive topics — tone is lost in digital communication. Save important conversations for face-to-face moments.',
    ],
    health: [
      'Communication stress manifests as jaw tension and headaches. Relax your face, unclench your jaw, and breathe from the diaphragm.',
      'Mental chatter may increase today. Quiet the noise with a brief meditation or by listening to calming instrumental music.',
    ],
    finance: [
      'Contractual or financial misunderstandings are possible today. Do not sign anything without thorough review and clarification.',
      'Discussions about shared finances may lead to friction. Approach money conversations with facts, not emotions.',
    ],
    overall: [
      'A day to listen more than you speak. The planets caution against hasty words — what goes unsaid today may serve you better.',
      'Miscommunication is in the air. Choose silence over reaction, and clarity over speed, in every conversation that matters.',
    ],
  },

  'spiritual-growth': {
    career: [
      'Professional pursuits may feel less urgent today as deeper questions surface. Honour the inner call without abandoning your responsibilities.',
      'Your work may benefit from a contemplative approach. Step back from the tactical grind and consider the larger purpose behind your efforts.',
    ],
    love: [
      'Spiritual growth deepens your capacity for love. You may feel a renewed sense of gratitude for your partner or a heightened awareness of what you seek in connection.',
      'Shared spiritual practice — meditation, prayer, or simply a meaningful conversation about values — strengthens romantic bonds today.',
    ],
    health: [
      'Inner peace is the foundation of physical health. Today\'s spiritual energy supports practices like yoga, breathwork, or contemplative walking.',
      'Healing comes from within today. Spend time in silence, connect with nature, or engage in any practice that nourishes your soul.',
      'Spiritual practices reduce cortisol and improve immune function. Today\'s cosmic support for inner work has tangible physical benefits.',
    ],
    finance: [
      'Material concerns may feel less pressing today. This detachment is healthy — it allows you to make financial decisions from wisdom rather than anxiety.',
      'Consider how your financial resources serve your higher purpose. Charitable giving or value-aligned spending feels especially right today.',
    ],
    overall: [
      'The cosmos invites introspection and inner growth. Take time for meditation, reflection, or any practice that connects you to your deeper self.',
      'A day of quiet power. Spiritual alignment creates clarity in every other domain — tend to the inner flame and watch the outer world respond.',
      'Seek meaning beyond the material today. The planets illuminate the path of purpose and invite you to walk it with intention.',
    ],
  },

  'education-focus': {
    career: [
      'Learning and skill development are highly favoured today. Enrol in that course, attend the workshop, or dedicate focused time to professional development.',
      'Your capacity to absorb and retain information is heightened. Use this for research, study, or mastering a new tool or methodology.',
    ],
    love: [
      'Intellectual stimulation sparks romantic interest. Share a thought-provoking article, discuss an idea, or learn something new together.',
      'Partners who support each other\'s growth create lasting bonds. Encourage your loved one\'s learning journey as they encourage yours.',
    ],
    health: [
      'Mental stimulation can energize or exhaust, depending on balance. Alternate study sessions with brief movement or eye rest breaks.',
      'The brain is a muscle that needs fuel. Omega-rich foods, hydration, and regular breaks optimize today\'s learning capacity.',
    ],
    finance: [
      'Education is the highest-return investment. Spending on courses, certifications, or books today carries long-term financial dividends.',
      'Knowledge gained today has practical financial applications. Focus learning efforts on skills that increase your market value.',
    ],
    overall: [
      'The planets favour the student in you. Approach the day with curiosity, and every experience becomes a lesson worth receiving.',
      'A day of intellectual expansion. Your mind is sharp, receptive, and hungry for growth — feed it with purpose.',
    ],
  },

  'creative-expression': {
    career: [
      'Creative solutions to professional challenges come more naturally today. Think beyond conventional approaches — innovation is cosmically supported.',
      'Artistic or design-related work is especially favoured. If your career involves any creative output, today\'s results will surprise you.',
    ],
    love: [
      'Express love through creative gestures — a handwritten note, a curated playlist, or a spontaneously planned experience. Creativity in love is irresistible.',
      'Artistic shared experiences — visiting a gallery, cooking a new recipe, or dancing — deepen romantic connection today.',
    ],
    health: [
      'Creative expression is therapeutic. Painting, writing, music, or any form of artistic output reduces stress and improves mental well-being.',
      'Your body responds to beauty today. Surround yourself with aesthetically pleasing environments and let visual harmony soothe your nerves.',
    ],
    finance: [
      'Creative ventures may yield unexpected financial returns. If you have a side project or artistic pursuit, give it attention today.',
      'Innovative approaches to financial planning — new income streams, creative budgeting — are well-starred under this transit.',
    ],
    overall: [
      'Beauty and creation are your themes today. The cosmos supports artistic expression, innovative thinking, and the courage to make something new.',
      'A day to create rather than consume. Let your imagination lead and trust the unique value of what only you can bring into the world.',
    ],
  },

  'hidden-obstacles': {
    career: [
      'Not everything at work is as it appears today. Verify information independently and trust your instincts if something feels misaligned.',
      'Behind-the-scenes dynamics may affect your projects. Stay observant without becoming paranoid — awareness is your best defence.',
    ],
    love: [
      'Unspoken feelings or unresolved issues may create an undercurrent of tension. Address them gently rather than pretending they do not exist.',
      'If your partner seems distant, it may reflect their own hidden struggles. Offer presence without pressure.',
    ],
    health: [
      'Health issues that have been quietly building may surface today. This is actually positive — awareness is the first step toward healing.',
      'Pay attention to symptoms you have been dismissing. A preventive check-up or consultation can catch concerns early.',
    ],
    finance: [
      'Hidden fees, overlooked charges, or financial details buried in fine print deserve your attention today. Review recent statements carefully.',
      'Financial risks may not be immediately visible. Approach investment decisions with extra due diligence and seek independent advice.',
    ],
    overall: [
      'The cosmos lifts the veil on what has been hidden. Welcome the revelation — even uncomfortable truths are more useful than comfortable illusions.',
      'A day for heightened awareness. Look beneath surfaces, question assumptions, and trust your intuition when logic falls short.',
    ],
  },

  'sudden-change': {
    career: [
      'Unexpected developments at work may disrupt your plan. Adaptability is your greatest asset today — flexibility trumps rigidity.',
      'A surprise announcement, reorganization, or shift in priorities is possible. Stay centred and look for opportunity within the disruption.',
    ],
    love: [
      'Romantic surprises — pleasant or challenging — may arrive without warning. Embrace the unexpected and respond from the heart, not the head.',
      'If a relationship takes an unanticipated turn, resist the urge to over-analyse immediately. Let the new reality settle before forming judgments.',
    ],
    health: [
      'Sudden changes in routine can unsettle your body. Maintain your anchoring habits — sleep schedule, meal timing — even if everything else shifts.',
      'Unexpected stress may spike adrenaline. Counter it with deep breathing and grounding techniques to keep your nervous system balanced.',
    ],
    finance: [
      'Financial surprises — both favourable and challenging — may emerge today. Maintain adequate liquidity and avoid locking up all resources.',
      'An unexpected bill or windfall is equally possible. Either way, respond thoughtfully rather than reactively.',
    ],
    overall: [
      'The only constant today is change. The cosmos disrupts stagnant patterns — welcome the turbulence as a sign that something new is being born.',
      'Expect the unexpected. Today\'s disruptions are not random — they are planetary course corrections guiding you toward a truer path.',
    ],
  },

  'emotional-sensitivity': {
    career: [
      'You may absorb colleagues\' emotions more intensely today. Protect your energy with clear boundaries and periodic moments of solitude.',
      'Heightened sensitivity is an asset in empathic professions but a liability in confrontational ones. Choose your interactions wisely.',
    ],
    love: [
      'Emotional depth intensifies romantic experiences today. You feel more, sense more, and connect on a level that transcends words.',
      'Vulnerability is strength, not weakness. Share your emotional truth with your partner and invite them to do the same.',
      'If single, your emotional openness is magnetic. The right person will be drawn to your authenticity and depth.',
    ],
    health: [
      'Emotional sensitivity can manifest as physical symptoms — fatigue, headaches, or chest tightness. Acknowledge emotions rather than suppressing them.',
      'Water is your ally today — drink it, bathe in it, walk near it. Emotional sensitivity responds beautifully to the calming element of water.',
      'Journaling or talking to a trusted friend can prevent emotional overload from becoming physical discomfort.',
    ],
    finance: [
      'Avoid making financial decisions driven by emotion today. Your sensitivity is valuable in relationships but can cloud financial judgment.',
      'Emotional spending is a risk today. If you feel the urge to shop for comfort, replace it with a no-cost self-care activity.',
    ],
    overall: [
      'Feel deeply today without apologizing for it. The cosmos amplifies your emotional antenna — use it to connect, heal, and understand.',
      'A day of profound feeling. Your sensitivity is a gift that, when honoured, brings clarity and compassion to every interaction.',
    ],
  },

  'confidence-boost': {
    career: [
      'Self-assurance radiates through your professional interactions today. Speak up in meetings, volunteer for leadership roles, and own your expertise.',
      'This is your day to step into the spotlight. The planets support bold moves, decisive communication, and visible leadership.',
      'Confidence attracts opportunity. Today\'s planetary backing gives you the edge to pursue initiatives you have been hesitating on.',
    ],
    love: [
      'Confidence is deeply attractive. Your self-assured energy draws admiration from your partner and attention from potential connections.',
      'Express your desires and boundaries clearly today. Confident communication in love builds respect and deepens intimacy.',
    ],
    health: [
      'Mental confidence improves physical performance. Your workout, your posture, and your energy all benefit from today\'s inner strength.',
      'Stand tall, breathe deep, and move with purpose. Your body mirrors your mental state — today, both are powerful.',
    ],
    finance: [
      'Negotiate from a position of strength today. Whether discussing salary, rates, or investment terms, your confidence commands better outcomes.',
      'Financial self-assurance leads to better decision-making. Trust your research and act on opportunities with conviction.',
    ],
    overall: [
      'A day of personal power. The cosmos infuses you with courage, clarity, and the unshakable belief that you are exactly where you need to be.',
      'Step forward boldly. Today\'s planetary alignment rewards initiative, self-trust, and the willingness to be seen and heard.',
    ],
  },
};
