// ==UserScript==
// @name         Canvas Rubric Library Chooser
// @namespace    VisComm@UON
// @version      0.2
// @description  Choose rubric criteria from a library and download Canvas import CSV
// @match        https://*/courses/*/rubrics*
// @require      File:///Users/jbs939/Desktop/AssessmentHelpers/canvas-rubric-library-chooser.user.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Lets rubric criteria be chosen from an embedded library and exported as Canvas CSV.

  // constants/config
  const STORAGE_PREFIX = 'canvas_rubric_library_chooser_v1';
  const LEGACY_POSITION_KEYS = {
    left: 'jjRubricBtnLeft',
    top: 'jjRubricBtnTop'
  };

  const selectors = {
    launcher: '#jj-rubric-library-btn',
    overlay: '#jj-rubric-overlay',
    status: '#jj-status'
  };

  // =========================================================
  // 1. PASTE YOUR TSV LIBRARY HERE
  // =========================================================
  const LIBRARY_TSV = `
  category	criterion_code	display_order	criterion_name	criterion_summary	framing	max_points	label_1	anchor_1	desc_1	label_2	anchor_2	desc_2	label_3	anchor_3	desc_3	label_4	anchor_4	desc_4	label_5	anchor_5	desc_5	tags	notes	active
Practical/studio work	STUD_01	1	Visual Research	Researching the work of other designers and styles.	This looks at how well you’ve explored and engaged with visual references — including artists, designers, or styles that relate to your work. It's about learning from others and using that knowledge meaningfully.	100	Fail	50	No visual research is evident. Lacks reference to existing works or creative context.	Pass	65	Visual research is present but limited in scope or connection to the work.	Credit	75	Relevant visual references are used. Shows awareness of existing work.	Distinction	85	Well-chosen and diverse visual research supports and informs the project.	High Distinction	100	Visual research is integrated deeply. Demonstrates critical engagement and influences the direction of the work.			TRUE
Practical/studio work	STUD_02	2	Idea Generation	Exploring possibilities and creative direction	This category looks at how you develop the core idea behind your work. We’re interested in your ability to explore options, take creative risks, and define a concept or direction that feels intentional and relevant.	100	Fail	50	No clear concept is articulated. Engagement with the task appears minimal or unclear.	Pass	65	An idea is identified but remains underdeveloped or tentative.	Credit	75	A clear concept with some development of alternative ideas or approaches.	Distinction	85	A well-developed concept supported by creative thinking and intentional direction.	High Distinction	100	Inventive ideas with strong conceptual clarity, creative risk-taking, or original thinking.			TRUE
Practical/studio work	STUD_03	3	Process & Development	Working through, testing, and refining your ideas	This is about how you worked through your ideas - what you tested, rejected, revised, or built upon. Good development usually shows that you’ve been reflective and open to changing your approach as needed.	100	Fail	50	No evidence of process. Work appears incomplete or lacking consideration.	Pass	65	Some process steps are evident, but development is inconsistent or partial.	Credit	75	A sound process is evident, with signs of iteration and improvement.	Distinction	85	Thoughtful development process supporting skill growth and exploration.	High Distinction	100	Highly engaged, reflective process driving complex or evolving outcomes.			TRUE
Practical/studio work	STUD_04	4	Visual Creativity	Visual decision-making and stylistic intent	This category looks at how you’ve handled the visual side of things - layout, composition, style, colour, material, etc. We’re looking for visual intent, originality, and coherence.	100	Fail	50	Visual coherence or intent is not apparent.	Pass	65	Visual decisions are functional but lack distinctiveness or refinement.	Credit	75	Visual approach is considered and consistent. Shows some originality or style.	Distinction	85	Strong, distinctive visual execution with aesthetic awareness.	High Distinction	100	Visually compelling and imaginative. Shows confident control of visual language.			TRUE
Practical/studio work	STUD_05	5	Applied Understanding	Using what you've learned; ideas, techniques, context, to make creative decisions	This refers to how you’ve used relevant techniques, theory, context or prior learning to make informed choices. It’s about applying knowledge in a creative, integrated way and not just ticking off requirements.	100	Fail	50	No clear application of relevant knowledge, technique, or context.	Pass	65	Shows some understanding of relevant ideas or techniques, but application is uneven.	Credit	75	Applies relevant ideas, methods, or influences in appropriate ways.	Distinction	85	Applies knowledge with clarity and control. Work reflects critical or contextual awareness.	High Distinction	100	Sophisticated integration of concepts, influences, or techniques into a cohesive creative approach.			TRUE
Practical/studio work	STUD_06	6	Execution & Presentation	How well the work is made and shared	This category focuses on how well the final outcome is constructed and presented. It includes technical skill, finish, and the choices you’ve made in order  to display, format, or communicate your work.	100	Fail	50	Execution is incomplete or significantly impacts the outcome. Presentation may hinder understanding.	Pass	65	Work is complete and functional, but lacks polish or clarity in finish.	Credit	75	Competently executed with care. Presentation supports the work.	Distinction	85	Well-crafted and consistently executed. Presentation is thoughtful and appropriate.	High Distinction	100	Highly accomplished. Execution and presentation work together to elevate the impact of the work.			TRUE
Generic	GEN_01	1	Communication	Visual, verbal, or written	This looks at how clearly and effectively you express your ideas- whether visually, verbally, or in writing. It’s about making your thinking understandable and engaging.	100	Fail	50	Communication lacks clarity and may impact how the work is understood.	Pass	65	Communicates ideas simply but with occasional gaps in clarity or structure.	Credit	75	Communicates ideas clearly and appropriately for the medium.	Distinction	85	Communicates effectively and fluently. Shows awareness of audience and intent.	High Distinction	100	Highly articulate, expressive, or impactful communication that strengthens the work.			TRUE
Generic	GEN_02	2	Collaboration & Engagement	Includes participation in class, group work, studio or discussion	This refers to how you work with others- in groups or in the classroom. We’re looking for respectful, constructive, and meaningful participation.	100	Fail	50	Minimal contribution to shared work or class activity.	Pass	65	Participates when required, though contributions may be limited or inconsistent.	Credit	75	Reliable contributor to group or class activities. Works respectfully with others.	Distinction	85	Actively supports group processes and contributes positively to shared outcomes.	High Distinction	100	Takes initiative, demonstrates leadership or insight in group settings. Highly engaged.			TRUE
Generic	GEN_03	3	Project & Time Management	Organisation, planning, responsibility	This is about being organised, reliable and able to manage your time and workload across a project. 	100	Fail	50	Planning is absent or unclear. Missed deadlines or commitments affect the outcome.	Pass	65	Meets minimum expectations for planning and deadlines. Some lapses may occur.	Credit	75	Manages time and workload effectively. Fulfils commitments.	Distinction	85	Well-organised and self-directed. Project scope is realistic and well managed.	High Distinction	100	Exceptionally well organised. Project ambition is enabled by strong planning and follow-through.			TRUE
Generic	GEN_04	4	Reflection & Evaluation	Includes self-assessment, critical thinking, and problem-solving	This focuses on your ability to look back at what you did and articulate why you arrived at a particular point. 	100	Fail	50	Reflection is missing. Decisions appear unexamined or arbitrary.	Pass	65	Reflection is present but surface-level, with limited evidence of critical thinking.	Credit	75	Demonstrates considered reflection. Able to evaluate work and adjust approach.	Distinction	85	Thoughtful and consistent reflection leading to improved outcomes or insight.	High Distinction	100	Deep, critical reflection. Uses evaluation to take risks or drive meaningful progress.			TRUE
Generic	GEN_05	5	Presentation Delivery	Verbal, visual and overall delivery of live or recorded presentation	This assesses how you present your work to an audience- whether live or recorded. It includes how well your visuals support your message and how clearly you communicate your ideas.	100	Fail	50	Presentation lacks clarity or structure. Visual materials may distract from core content.	Pass	65	Presentation communicates the main points. Visuals are present but may not fully support the message.	Credit	75	Presentation is clear and structured. Visuals support key ideas.	Distinction	85	Confident delivery with clear structure and engaging visuals. Time and audience well managed.	High Distinction	100	Highly effective, polished and compelling presentation. Strong synergy between visuals, timing, and delivery.			TRUE
Written work	WRIT_01	1	Research & Context	Use of sources, theory, and contextual understanding	This category looks at how well you've researched your topic and how effectively you've used sources or context to shape your work.	100	Fail	50	Little or no relevant research. Sources are missing or unclear.	Pass	65	Research is evident, but the range or relevance of sources may be narrow.	Credit	75	Appropriate sources used. Demonstrates developing contextual understanding.	Distinction	85	Well-researched and contextualised. Sources support ideas and extend thinking.	High Distinction	100	Wide-ranging, well-chosen research. Sophisticated synthesis of context and ideas.			TRUE
Written work	WRIT_02	2	Critical Thinking	Analysis, interpretation, and originality of thought	This focuses on your ability to question, interpret, and reflect- not just describe. We're looking for thoughtful engagement with ideas, not just summary or repetition.	100	Fail	50	No clear analysis. Work is descriptive or superficial.	Pass	65	Some analysis or interpretation is present but lacks depth or development.	Credit	75	Logical and relevant analysis. Shows some independent thought.	Distinction	85	Insightful and consistent critical thinking. Ideas are well-reasoned.	High Distinction	100	Exceptional analysis and originality. Challenges assumptions or reframes ideas.			TRUE
Written work	WRIT_03	3	Argument & Structure	Organisation, clarity, logical flow	We’re assessing how clearly your ideas are organised and how well your argument builds across the work. A good structure helps the reader follow your thinking.	100	Fail	50	Argument is unclear or absent. Poor structure.	Pass	65	Argument is identifiable but may be unclear, uneven, or loosely structured.	Credit	75	Argument is clear and mostly logical. Structure supports the ideas.	Distinction	85	Well-developed argument. Structured clearly and fluently.	High Distinction	100	Strong, coherent argument with excellent structure and flow. Ideas build powerfully.			TRUE
Written work	WRIT_04	4	Communication & Referencing	Writing style, referencing, visual support if relevant	This is about clarity, tone, and proper referencing. Can you express your ideas well in writing, and support them with credible sources?	100	Fail	50	Poorly written or difficult to follow. Referencing missing or incorrect.	Pass	65	Writing is readable, though it may include unclear phrasing or referencing issues.	Credit	75	Clear writing. Referencing is appropriate and mostly correct.	Distinction	85	Confident academic voice. Referencing is accurate and well integrated.	High Distinction	100	Elegant and precise communication. Referencing is meticulous. Visuals if used enhance meaning.			TRUE
Practice Based Research	PRAX_01	1	Research Question & Intent	Clarity of enquiry, relevance of practice-based approach	This is about how clearly you’ve framed your research question and how well your practice is aligned with that enquiry. A strong project shows what you're trying to find out and why it matters.	100	Fail	50	No clear research intent. Relationship between making and enquiry is absent or confused.	Pass	65	A research question is present, though loosely defined or only partially explored.	Credit	75	A clear research intent guides the work. Practice is relevant to the enquiry.	Distinction	85	Well-articulated research intent. Creative practice is deliberately positioned as a method of investigation.	High Distinction	100	Sophisticated and original research framing. Practice and theory are deeply intertwined from the outset.			TRUE
Practice Based Research	PRAX_02	2	Integration of Theory and Practice	How theory/context informs making, and vice versa	This looks at how well you’ve connected theory, context, and your creative practice. We’re looking for interaction- not just theory stuck on top.	100	Fail	50	No visible connection between theory/context and practice.	Pass	65	Theory or context is referenced, but connections to practice are limited or unclear.	Credit	75	Theory and context are used to inform aspects of the work. Making and thinking interact.	Distinction	85	Strong integration. Theory enriches practice and vice versa. Making decisions show critical awareness.	High Distinction	100	Exceptional synthesis. Theory, context, and practice operate as a single, reflexive system of knowledge-making.			TRUE
Practice Based Research	PRAX_03	3	Process as Method	Creative development treated as research process	Here, the focus is on your creative process as a form of research. We want to see how your choices, changes, and experiments helped you explore your question.	100	Fail	50	No development shown. Process appears accidental or unexplored.	Pass	65	Process is documented but may lack rationale or continuity.	Credit	75	Process is purposeful and documented. Decisions are linked to enquiry.	Distinction	85	Development is rigorous and reflective. Process is framed as methodological.	High Distinction	100	Process is used as a primary method of research. Each stage contributes to new insight or understanding.			TRUE
Practice Based Research	PRAX_04	4	Contribution to Knowledge	What is learned, revealed, or opened through the work	What have you added to the conversation? This assesses the insight or understanding your work has generated- creatively, critically, or both.	100	Fail	50	No identifiable contribution. Outcomes are disconnected from the enquiry.	Pass	65	Some insight is present, but the overall contribution remains brief or unclear.	Credit	75	Project shows a contribution to knowledge in either form or reflection.	Distinction	85	Research outcome creative and/or written makes a clear and supported claim.	High Distinction	100	Original and compelling contribution to knowledge. Creative and critical elements work together to reveal new understanding.			TRUE
Practice Based Research	PRAX_05	5	Reflective Communication	Critical reflection, exegesis, or verbal framing	This is about how well you explain your thinking- through writing, speaking, or documentation. Good reflection helps others understand what you’ve done and why.	100	Fail	50	No reflection or awareness of project’s implications.	Pass	65	Reflection is included, though it may be brief or lack depth.	Credit	75	Reflective writing or discussion clarifies intent and contextualises choices.	Distinction	85	Reflection is articulate, critical, and enhances understanding of the work.	High Distinction	100	Insightful, reflexive, and compelling. Communication elevates the research as a whole.			TRUE
Self initiated projects	SIP_01	1	Initiative & Direction	Clarity of intent, goals, and scope-setting	This looks at how you’ve defined and scoped your own project. A good project has a clear direction and shows initiative in how it was shaped.	100	Fail	50	No clear direction. Goals absent or unrelated to task.	Pass	65	A project direction is proposed, though goals may be vague or modest.	Credit	75	Clear direction and achievable goals. Scope is realistic.	Distinction	85	Strong project vision. Direction is purposeful and self-directed.	High Distinction	100	Ambitious and well-defined project. Shows autonomy, curiosity, and original framing.			TRUE
Self initiated projects	SIP_02	2	Research & Contextual Awareness	Relevant theory, references, or influences	This category assesses how well you understand the context around your project- influences, ideas, theory or creative work that shape your decisions.	100	Fail	50	Research is missing or irrelevant. No evidence of context.	Pass	65	Some context is considered, but research may be limited in scope or depth.	Credit	75	Research is appropriate. Context is acknowledged and applied.	Distinction	85	Well-researched and integrated. Context enhances the project’s purpose.	High Distinction	100	Outstanding use of research. Contextual understanding deepens the work.			TRUE
Self initiated projects	SIP_03	3	Development & Critical Thinking	Process, analysis, synthesis, decision-making	This is about how your thinking shaped the project- what you explored, how you responded to challenges, and how your ideas developed over time.	100	Fail	50	No visible development. Project lacks rationale or critical engagement.	Pass	65	Development evident, though decisions may be unexamined or unsupported.	Credit	75	Clear development and justification of ideas. Shows analytical thinking.	Distinction	85	Thoughtful development and decision-making. Ideas evolve through critique or reflection.	High Distinction	100	Sophisticated thinking and synthesis. Complex or subtle ideas explored with clarity.			TRUE
Self initiated projects	SIP_04	4	Realisation & Creativity	Execution of the work and creative resolution	This looks at how effectively and creatively the project was brought to completion. It’s about both execution and creative strength.	100	Fail	50	Unfinished or poorly resolved. Lacks creative direction.	Pass	65	Work is complete and meets the brief, but creative resolution is minimal.	Credit	75	Competent realisation. Creative intent is visible.	Distinction	85	Well-executed and imaginative. Resolution reflects the project’s aims.	High Distinction	100	Highly resolved, creative and impactful outcome. Demonstrates originality and skill.			TRUE
`.trim();

  // =========================================================
  // 2. PARSE LIBRARY
  // =========================================================
  function parseTsv(tsv) {
    const lines = tsv.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];

    const headers = lines[0].split('\t');

    return lines.slice(1).map(line => {
      const cols = line.split('\t');
      const row = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] || '').trim();
      });

      row.display_order = Number(row.display_order || 0);
      row.max_points = Number(row.max_points || 100);
      row.active = String(row.active || '').toUpperCase() !== 'FALSE';

      for (let i = 1; i <= 5; i++) {
        row[`anchor_${i}`] = Number(row[`anchor_${i}`] || 0);
      }

      return row;
    }).filter(r => r.active);
  }

  function getRowsByCategory(rows) {
    const grouped = {};
    for (const row of rows) {
      const cat = row.category || 'Uncategorised';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    }

    Object.values(grouped).forEach(arr => {
      arr.sort((a, b) => a.display_order - b.display_order);
    });

    return grouped;
  }

  // =========================================================
  // 3. SCORE CALCULATION
  // Canvas seems happy when the highest score is the criterion total.
  // You confirmed working examples like:
  // 20, 17, 15, 13, 10
  // 30, 25.5, 22.5, 19.5, 15
  // =========================================================
  function roundScore(n) {
    return Math.round(n * 10) / 10;
  }

  function calculateBandScores(weight) {
    const w = Number(weight || 0);
    return {
      hd: roundScore(w),
      d: roundScore(w * 0.85),
      c: roundScore(w * 0.75),
      p: roundScore(w * 0.65),
      f: roundScore(w * 0.50),
    };
  }

  // =========================================================
  // 4. CANVAS CSV EXPORT
  // Adjust header names here if your Canvas template needs slightly
  // different repeated column labels.
  // =========================================================
  const CSV_HEADERS = [
    'Rubric Name',
    'Criteria Name',
    'Criteria Description',
    'Criteria Enable Range',
    'Rating Name',
    'Rating Description',
    'Rating Points',
    'Rating Name 2',
    'Rating Description 2',
    'Rating Points 2',
    'Rating Name 3',
    'Rating Description 3',
    'Rating Points 3',
    'Rating Name 4',
    'Rating Description 4',
    'Rating Points 4',
    'Rating Name 5',
    'Rating Description 5',
    'Rating Points 5',
  ];

  function chooseDescription(row) {
    return (row.framing || row.criterion_summary || '').trim();
  }

  function createCanvasCsvRow(row, rubricName, weight) {
    const scores = calculateBandScores(weight);

    return {
      'Rubric Name': rubricName,
      'Criteria Name': row.criterion_name || '',
      'Criteria Description': chooseDescription(row),
      'Criteria Enable Range': 'TRUE',

      'Rating Name': row.label_5 || 'High Distinction',
      'Rating Description': row.desc_5 || '',
      'Rating Points': scores.hd,

      'Rating Name 2': row.label_4 || 'Distinction',
      'Rating Description 2': row.desc_4 || '',
      'Rating Points 2': scores.d,

      'Rating Name 3': row.label_3 || 'Credit',
      'Rating Description 3': row.desc_3 || '',
      'Rating Points 3': scores.c,

      'Rating Name 4': row.label_2 || 'Pass',
      'Rating Description 4': row.desc_2 || '',
      'Rating Points 4': scores.p,

      'Rating Name 5': row.label_1 || 'Fail',
      'Rating Description 5': row.desc_1 || '',
      'Rating Points 5': scores.f,
    };
  }

  function csvEscape(value) {
    const s = String(value ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function createCsvText(rows) {
    const lines = [
      CSV_HEADERS.map(csvEscape).join(','),
      ...rows.map(row => CSV_HEADERS.map(h => csvEscape(row[h])).join(',')),
    ];
    return lines.join('\n');
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // =========================================================
  // 5. UI
  // =========================================================
  // state
  const state = {
    rows: parseTsv(LIBRARY_TSV),
    selected: new Map(), // criterion_code -> { row, weight }
  };

  // elements
  const elements = {};

  function getStorageKey(name) {
    return `${STORAGE_PREFIX}:${name}`;
  }

  function loadStoredValue(name, legacyKey = '') {
    return localStorage.getItem(getStorageKey(name)) || (legacyKey ? localStorage.getItem(legacyKey) : null);
  }

  function saveStoredValue(name, value) {
    localStorage.setItem(getStorageKey(name), value);
  }

function createLauncherButton() {
  if (document.querySelector(selectors.launcher)) return;

  const btn = document.createElement('button');
  btn.id = 'jj-rubric-library-btn';
  btn.textContent = 'VisComm Rubric Builder';
  btn.type = 'button';

  const savedX = loadStoredValue('launcher_left', LEGACY_POSITION_KEYS.left);
  const savedY = loadStoredValue('launcher_top', LEGACY_POSITION_KEYS.top);

  btn.style.cssText = `
    position: fixed;
    top: ${savedY || '20px'};
    left: ${savedX || '20px'};
    z-index: 999999;
    padding: 10px 12px;
    background: #252b33;
    color: white;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    cursor: grab;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    user-select: none;
  `;

  btn.addEventListener('click', function (e) {
    if (btn.dataset.dragged === 'true') {
      btn.dataset.dragged = 'false';
      return;
    }
    renderModal();
  });

  bindDragging(btn);
  document.body.appendChild(btn);
  elements.launcher = btn;
}
    function bindDragging(el) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let moved = false;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    moved = false;

    startX = e.clientX;
    startY = e.clientY;
    startLeft = el.offsetLeft;
    startTop = el.offsetTop;

    el.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      moved = true;
    }

    const newLeft = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, startLeft + dx));
    const newTop = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, startTop + dy));

    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;

    isDragging = false;
    el.style.cursor = 'grab';

    saveStoredValue('launcher_left', el.style.left);
    saveStoredValue('launcher_top', el.style.top);

    if (moved) {
      el.dataset.dragged = 'true';
    }
  });
}
  function renderModal() {
    handleCloseModal();

    const overlay = document.createElement('div');
    overlay.id = 'jj-rubric-overlay';
    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,0.45);
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
    `;

    const modal = document.createElement('div');
 modal.style.cssText = `
  background:#f8f9fb;
  width:min(1200px, 95vw);
  height:min(85vh, 900px);
  border-radius:12px;
  overflow:hidden;
  display:grid;
  grid-template-rows:auto 1fr auto;
  box-shadow:0 10px 30px rgba(0,0,0,.25);
  font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  border:1px solid #d9dde3;
`;

    modal.innerHTML = `
      <div style="padding:16px 20px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; gap:16px; align-items:center;">
        <div style="display:flex; flex-direction:column; gap:8px; flex:1;">
<strong style="font-size:16px; font-weight:700;">VisComm Rubric Chooser</strong>
<input id="jj-rubric-title" type="text" placeholder="New rubric name" style="padding:8px 10px; font-size:14px; width:100%; max-width:420px; border:1px solid #cfd5dd; border-radius:8px; background:#eef1f4; color:#2f3a45;">
</div>
<button id="jj-close-modal" type="button" style="background:#161a20; color:#d5d9df; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:400;">Close</button>
</div>

      <div style="display:grid; grid-template-columns: 1.2fr 1fr; min-height:0; background:#eef1f5;">
  <div id="jj-library-panel" style="overflow:auto; padding:18px 20px; border-right:1px solid #d9dde3; background:#f3f5f8;"></div>
  <div id="jj-selected-panel" style="overflow:auto; padding:18px 20px; background:#f8f9fb;"></div>
</div>

<div style="padding:12px 20px; border-top:1px solid #d9dde3; display:flex; justify-content:space-between; align-items:center; background:#f8f9fb;">
  <div id="jj-status" style="font-size:13px; color:#555;">Select criteria and enter weights.</div>
  <button id="jj-download-csv" type="button" style="background:#11151a; color:#f3f4f6; border:1px solid rgba(0,0,0,0.08); border-radius:8px; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:400;">Download Canvas CSV</button>
</div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleCloseModal();
    });
    modal.querySelector('#jj-close-modal').addEventListener('click', handleCloseModal);
    modal.querySelector('#jj-download-csv').addEventListener('click', handleExportCsv);

    renderLibrary();
    renderSelected();
  }

  function handleCloseModal() {
    document.getElementById('jj-rubric-overlay')?.remove();
  }

  function renderLibrary() {
    const container = document.getElementById('jj-library-panel');
    if (!container) return;

    const grouped = getRowsByCategory(state.rows);
    container.innerHTML = '';

    Object.keys(grouped).sort().forEach(category => {
const section = document.createElement('div');
section.style.cssText = `
  margin-bottom:20px;
  padding:14px;
  border:1px solid #d9dde3;
  border-radius:12px;
  background:#eceff3;
`;

      const heading = document.createElement('h3');
      heading.textContent = category;
heading.style.cssText = `
  margin:0 0 12px 0;
  font-size:14px;
  font-weight:700;
  color:#2f3a45;
  letter-spacing:0.01em;
`;
        section.appendChild(heading);

      grouped[category].forEach(row => {
        const checked = state.selected.has(row.criterion_code);

        const item = document.createElement('label');
        item.style.cssText = `
  display:block;
  padding:10px 12px;
  margin:0 0 8px 0;
  border:1px solid ${checked ? '#bcc4cd' : '#d9dde3'};
  border-radius:10px;
  cursor:pointer;
background:${checked ? '#e7eaee' : '#ffffff'};
  box-shadow:${checked ? '0 0 0 1px rgba(120, 128, 138, 0.10) inset' : 'none'};
`;

        item.innerHTML = `
          <div style="display:flex; gap:10px; align-items:flex-start;">
<input type="checkbox" data-code="${row.criterion_code}" ${checked ? 'checked' : ''} style="margin-top:3px; accent-color:#6f7782;">
<div>
              <div style="font-weight:600;">${escapeHtml(row.criterion_name)}</div>
<div style="font-size:13px; color:#5b6570; margin-top:3px; line-height:1.4;">${escapeHtml(row.criterion_summary || '')}</div>            </div>
          </div>
        `;

        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            state.selected.set(row.criterion_code, { row, weight: 20 });
          } else {
            state.selected.delete(row.criterion_code);
          }
          renderLibrary();
          renderSelected();
        });

        section.appendChild(item);
      });

      container.appendChild(section);
    });
  }

  function renderSelected() {
    const container = document.getElementById('jj-selected-panel');
    if (!container) return;

    const selectedItems = Array.from(state.selected.values())
      .sort((a, b) => {
        const catCompare = (a.row.category || '').localeCompare(b.row.category || '');
        if (catCompare !== 0) return catCompare;
        return a.row.display_order - b.row.display_order;
      });

    if (!selectedItems.length) {
      container.innerHTML = `<p style="margin:0; color:#666;">No criteria selected yet.</p>`;
      updateStatus();
      return;
    }

    container.innerHTML = '';
    selectedItems.forEach(item => {
      const { row, weight } = item;
      const scores = calculateBandScores(weight);

      const card = document.createElement('div');
card.style.cssText = `
  border:1px solid #d9dde3;
  border-radius:10px;
  padding:12px;
  margin-bottom:12px;
  background:#ffffff;
  box-shadow:0 1px 0 rgba(0,0,0,0.02);
`;

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:start;">
          <div>
            <div style="font-weight:700;">${escapeHtml(row.criterion_name)}</div>
            <div style="font-size:13px; color:#555; margin-top:4px;">${escapeHtml(row.category || '')}</div>
          </div>
<button type="button" data-remove="${row.criterion_code}" style="background:#8b1e2d; color:#fff2f4; border:1px solid rgba(0,0,0,0.06); border-radius:8px; padding:4px 8px; cursor:pointer; font-size:12px; font-weight:400;">Remove</button>
</div>

        <div style="font-size:13px; color:#444; margin-top:8px;">${escapeHtml(chooseDescription(row))}</div>

        <div style="margin-top:10px;">
          <label style="font-size:13px;">Weight:
<input type="number" step="0.5" min="0" value="${weight}" data-weight="${row.criterion_code}" style="width:90px; margin-left:6px; padding:6px 8px; border:1px solid #d9dde3; border-radius:8px; background:#f8f9fb;">
</label>
        </div>

        <div style="margin-top:10px; font-size:13px; color:#333;">
          HD ${scores.hd} &nbsp;|&nbsp;
          D ${scores.d} &nbsp;|&nbsp;
          C ${scores.c} &nbsp;|&nbsp;
          P ${scores.p} &nbsp;|&nbsp;
          F ${scores.f}
        </div>
      `;

      card.querySelector(`[data-remove="${row.criterion_code}"]`).addEventListener('click', () => {
        state.selected.delete(row.criterion_code);
        renderLibrary();
        renderSelected();
      });

const weightInput = card.querySelector(`[data-weight="${row.criterion_code}"]`);

weightInput.addEventListener('change', (e) => {
  const raw = e.target.value.trim();
  const n = Number(raw);

  state.selected.set(row.criterion_code, {
    row,
    weight: raw === '' ? '' : (Number.isFinite(n) ? n : 0),
  });

  renderSelected();
});

      container.appendChild(card);
    });

    updateStatus();
  }

function updateStatus() {
  const status = document.getElementById('jj-status');
  if (!status) return;

  const selectedItems = Array.from(state.selected.values());

  const totalWeight = selectedItems.reduce((sum, item) => {
    const n = Number(item.weight);
    return sum + (Number.isFinite(n) ? n : 20);
  }, 0);

  const roundedTotal = Math.round(totalWeight * 10) / 10;
  const countText = `${selectedItems.length} criterion${selectedItems.length === 1 ? '' : 'a'} selected.`;
  const totalText = ` Total weight: ${roundedTotal}`;

  status.textContent = countText + totalText;
  status.style.color = roundedTotal > 100 ? '#b00020' : '#555';
  status.style.fontWeight = roundedTotal > 100 ? '700' : '400';
}

  function handleExportCsv() {
    const rubricTitleInput = document.getElementById('jj-rubric-title');
    const rubricName = (rubricTitleInput?.value || '').trim() || 'Rubric Library Export';

    const selectedItems = Array.from(state.selected.values());
    if (!selectedItems.length) {
      alert('Select at least one criterion first.');
      return;
    }

    const rows = selectedItems.map(item =>
      createCanvasCsvRow(item.row, rubricName, item.weight)
    );

    const csv = createCsvText(rows);
    const safeName = rubricName.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'rubric_export';
    downloadTextFile(`${safeName}.csv`, csv);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // =========================================================
  // 6. START
  // =========================================================
  function init() {
    createLauncherButton();
  }

  const observer = new MutationObserver(() => createLauncherButton());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  init();
})();
