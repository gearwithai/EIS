'use strict';

// ---- tiny helpers ----------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
  return r.json();
}
function fmtNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n || 0);
}
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function fmtWhen(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return 'Today ' + fmtTime(iso);
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday ' + fmtTime(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + fmtTime(iso);
}

// ---- navigation ------------------------------------------------------------
$$('.nav-item').forEach((b) => b.addEventListener('click', () => {
  $$('.nav-item').forEach((x) => x.classList.remove('is-active'));
  b.classList.add('is-active');
  $$('.view').forEach((v) => v.classList.remove('is-active'));
  $('#view-' + b.dataset.view).classList.add('is-active');
}));

// ---- drawer ----------------------------------------------------------------
const drawer = $('#drawer');
const scrim = $('#scrim');
function openDrawer(title, sub) {
  $('#drawerTitle').textContent = title;
  $('#drawerSub').textContent = sub || '';
  $('#drawerBody').innerHTML = '';
  drawer.hidden = false; scrim.hidden = false;
  return $('#drawerBody');
}
function closeDrawer() {
  drawer.hidden = true; scrim.hidden = true;
  if (currentStream) { currentStream.close(); currentStream = null; }
}
$('#drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

// ---- TODAY -----------------------------------------------------------------
let cwd = '';
async function loadToday() {
  const d = await api('/api/summary');
  $('#todayDate').textContent = new Date(d.date + 'T12:00:00').toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  const t = d.today;
  const stats = [
    { num: t.sessions, label: 'Sessions today', sub: d.totals.sessions + ' all-time' },
    { num: t.messages, label: 'Messages exchanged', sub: t.projects + ' project' + (t.projects === 1 ? '' : 's') },
    { num: t.toolCalls, label: 'Tool actions', sub: 'reads, edits, commands' },
    { num: fmtNum(t.tokens), label: 'Tokens today', sub: fmtNum(d.totals.tokens) + ' all-time' },
  ];
  const row = $('#statRow'); row.innerHTML = '';
  stats.forEach((s) => {
    const c = el('div', 'stat');
    c.append(el('div', 'stat-num', String(s.num)), el('div', 'stat-label', s.label), el('div', 'stat-sub', s.sub));
    row.append(c);
  });

  // sparkline
  const spark = $('#spark'); spark.innerHTML = '';
  const max = Math.max(1, ...d.sparkline.map((x) => x.sessions));
  d.sparkline.forEach((x) => {
    const wrap = el('div');
    wrap.style.flex = '1'; wrap.style.display = 'flex'; wrap.style.flexDirection = 'column';
    const bar = el('div', 'spark-bar');
    bar.style.height = '100%';
    bar.dataset.tip = x.sessions + ' session' + (x.sessions === 1 ? '' : 's') + ' · ' + x.day.slice(5);
    const fill = el('i');
    fill.style.height = Math.round((x.sessions / max) * 100) + '%';
    bar.append(fill);
    const lbl = el('div', 'spark-day', x.day.slice(8));
    wrap.append(bar, lbl);
    spark.append(wrap);
  });

  // tool bars
  const tb = $('#toolBars'); tb.innerHTML = '';
  if (!t.topTools.length) tb.append(el('div', 'empty', 'No tool activity recorded today.'));
  const tmax = Math.max(1, ...t.topTools.map((x) => x.count));
  t.topTools.forEach((x) => {
    const r = el('div', 'tool-bar');
    const track = el('div', 'track');
    const fill = el('div', 'fill'); fill.style.width = Math.round((x.count / tmax) * 100) + '%';
    track.append(fill);
    r.append(el('div', 'name', x.name), track, el('div', 'val', String(x.count)));
    tb.append(r);
  });

  // today's sessions
  const list = $('#todaySessions'); list.innerHTML = '';
  if (!t.sessionList.length) list.append(el('div', 'empty', 'No sessions yet today. When you use Claude Code, they show up here.'));
  t.sessionList.forEach((s) => {
    const item = el('div', 'mini-item');
    item.append(el('div', 'm-title', s.title));
    item.append(el('div', 'm-meta', fmtTime(s.start) + ' · ' + fmtNum(s.tokens) + ' tok'));
    item.addEventListener('click', () => openTranscript(s));
    list.append(item);
  });
}

// ---- Write today's summary (streamed run) ----------------------------------
$('#btnWriteReport').addEventListener('click', () => {
  const panel = $('#reportPanel'); panel.hidden = false;
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  runInto({
    prompt: "Look at what I worked on in this project today (git log for today, plus any current uncommitted changes). Write a short, friendly daily standup update in plain language for a non-technical teammate: what got done, what's in progress, and anything blocked. Use a few tight bullet points. If there's no activity, say so briefly.",
    outputEl: $('#reportOutput'),
    statusEl: $('#reportStatus'),
    button: $('#btnWriteReport'),
  });
});

// ---- ACTIONS ---------------------------------------------------------------
async function loadActions() {
  const [autos, skills, cmds] = await Promise.all([
    api('/api/automations'), api('/api/skills'), api('/api/commands'),
  ]);
  cwd = autos.cwd;
  $('#footCwd').textContent = cwd;
  $('#footCwd').title = cwd;

  const ag = $('#automationGrid'); ag.innerHTML = '';
  autos.automations.forEach((a) => {
    ag.append(makeCard({
      icon: a.icon || '⚡', title: a.label, desc: a.description, tag: 'Automation',
      onClick: () => openRun(a.label, a.description, a.prompt),
    }));
  });

  const sg = $('#skillGrid'); sg.innerHTML = '';
  if (!skills.skills.length) sg.append(el('div', 'empty', 'No skills installed. Skills live in ~/.claude/skills or .claude/skills.'));
  skills.skills.forEach((s) => {
    const pretty = s.name.replace(/-/g, ' ');
    sg.append(makeCard({
      icon: '✨', title: pretty, desc: s.description || 'A Claude Code skill.', tag: s.scope,
      onClick: () => openRun('Skill: ' + pretty, s.description,
        'Use the "' + s.name + '" skill for the following task:\n\n[Describe what you want here]'),
    }));
  });

  if (cmds.commands.length) {
    $('#cmdTitle').hidden = false;
    const cg = $('#commandGrid'); cg.innerHTML = '';
    cmds.commands.forEach((c) => {
      cg.append(makeCard({
        icon: '⌘', title: c.name, desc: c.description || 'Slash command.', tag: c.scope,
        onClick: () => openRun('Command ' + c.name, c.description, c.name + ' '),
      }));
    });
  }
}
function makeCard({ icon, title, desc, tag, onClick }) {
  const c = el('button', 'card');
  c.append(el('div', 'card-ico', icon));
  c.append(el('div', 'card-title', title));
  c.append(el('div', 'card-desc', desc || ''));
  if (tag) c.append(el('div', 'card-tag', tag));
  c.addEventListener('click', onClick);
  return c;
}

// Open the run drawer with an editable prompt.
function openRun(title, sub, prompt) {
  const body = openDrawer(title, sub);
  body.append(el('label', 'field-label', 'What Claude Code will do'));
  const ta = el('textarea', 'prompt-box'); ta.value = prompt; body.append(ta);

  const controls = el('div', 'run-controls');
  const runBtn = el('button', 'btn btn-primary', '▶ Run');
  const stopBtn = el('button', 'btn btn-ghost', '■ Stop'); stopBtn.disabled = true;
  const toggle = el('label', 'toggle');
  const cb = el('input'); cb.type = 'checkbox';
  toggle.append(cb, document.createTextNode('Allow file edits & commands'));
  const status = el('span', 'run-status');
  controls.append(runBtn, stopBtn, toggle, status);
  body.append(controls);

  const out = el('div', 'run-output'); body.append(out);

  runBtn.addEventListener('click', () => {
    runInto({
      prompt: ta.value, outputEl: out, statusEl: status,
      button: runBtn, stopBtn, skipPermissions: cb.checked,
    });
  });
  stopBtn.addEventListener('click', () => {
    if (currentRunId) api('/api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId: currentRunId }) });
  });
}

// ---- Streaming run engine --------------------------------------------------
let currentStream = null;
let currentRunId = null;
function setStatus(elm, kind, text) {
  if (!elm) return;
  elm.innerHTML = '';
  elm.append(el('span', 'dot ' + kind), document.createTextNode(text));
}
async function runInto({ prompt, outputEl, statusEl, button, stopBtn, skipPermissions }) {
  if (!prompt || !prompt.trim()) return;
  outputEl.innerHTML = '';
  if (button) button.disabled = true;
  if (stopBtn) stopBtn.disabled = false;
  setStatus(statusEl, 'live', 'Starting Claude Code…');

  let runId;
  try {
    ({ runId } = await api('/api/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, cwd, skipPermissions }),
    }));
  } catch (e) {
    setStatus(statusEl, 'err', 'Failed to start');
    outputEl.append(evNode('ev-err', 'Could not start: ' + e.message));
    if (button) button.disabled = false;
    return;
  }
  currentRunId = runId;

  const es = new EventSource('/api/run/stream?id=' + encodeURIComponent(runId));
  currentStream = es;
  setStatus(statusEl, 'live', 'Working…');
  let textBuf = null;

  es.onmessage = (m) => {
    let ev; try { ev = JSON.parse(m.data); } catch { return; }
    if (ev.type === 'text' || ev.type === 'result') {
      if (!textBuf) { textBuf = evNode('ev-text', ''); outputEl.append(textBuf); }
      textBuf.textContent += ev.text;
      outputEl.scrollTop = outputEl.scrollHeight;
    } else if (ev.type === 'tool') {
      textBuf = null;
      const t = el('div', 'ev ev-tool');
      t.append(el('span', 'tname', ev.name));
      if (ev.detail) t.append(el('span', 'tdetail', ev.detail));
      outputEl.append(t);
      outputEl.scrollTop = outputEl.scrollHeight;
    } else if (ev.type === 'status') {
      outputEl.append(evNode('ev-status', ev.text));
    } else if (ev.type === 'stderr') {
      // keep quiet unless it's the only thing we get; store softly
    } else if (ev.type === 'error') {
      outputEl.append(evNode('ev-err', ev.message));
    } else if (ev.type === 'meta') {
      const bits = [];
      if (ev.durationMs) bits.push((ev.durationMs / 1000).toFixed(1) + 's');
      if (ev.cost) bits.push('$' + ev.cost.toFixed(4));
      if (bits.length) outputEl.append(evNode('ev-meta', 'Finished · ' + bits.join(' · ')));
    } else if (ev.type === 'done') {
      es.close(); currentStream = null; currentRunId = null;
      if (button) button.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
      if (ev.exitCode === 0) setStatus(statusEl, 'done', 'Done');
      else setStatus(statusEl, 'err', 'Stopped (code ' + ev.exitCode + ')');
      if (!outputEl.children.length) outputEl.append(evNode('ev-status', 'No output was produced.'));
    }
  };
  es.onerror = () => {
    es.close(); currentStream = null;
    if (button) button.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    setStatus(statusEl, 'err', 'Connection lost');
  };
}
function evNode(cls, text) { return el('div', 'ev ' + cls, text); }

// ---- SESSIONS --------------------------------------------------------------
let allSessions = [];
async function loadSessions() {
  const d = await api('/api/sessions');
  allSessions = d.sessions;
  renderSessions('');
}
function renderSessions(q) {
  const table = $('#sessionTable'); table.innerHTML = '';
  const head = el('div', 'srow head');
  head.append(el('div', null, 'Session'), el('div', null, 'When'), el('div', 's-num', 'Tokens'), el('div', 's-num', 'Msgs'));
  table.append(head);

  const filtered = allSessions.filter((s) =>
    !q || (s.title + ' ' + s.cwd + ' ' + (s.gitBranch || '')).toLowerCase().includes(q));
  if (!filtered.length) { table.append(el('div', 'empty', 'No sessions found.')); return; }

  filtered.forEach((s) => {
    const r = el('div', 'srow');
    const title = el('div', 's-title');
    title.append(el('div', 't', s.title));
    const proj = s.cwd.split('/').pop() || s.cwd;
    title.append(el('div', 'p', proj + (s.gitBranch ? '  ·  ' + s.gitBranch : '')));
    r.append(title);
    r.append(el('div', 's-when', fmtWhen(s.end || s.start)));
    r.append(el('div', 's-num', fmtNum(s.tokens)));
    r.append(el('div', 's-num msgs', String(s.userMessages + s.assistantMessages)));
    r.addEventListener('click', () => openTranscript(s));
    table.append(r);
  });
}
$('#sessionSearch').addEventListener('input', (e) => renderSessions(e.target.value.toLowerCase().trim()));

async function openTranscript(s) {
  const body = openDrawer(s.title, s.cwd + (s.gitBranch ? '  ·  ' + s.gitBranch : ''));
  const meta = el('div', 'transcript-meta');
  meta.append(el('span', 'pill', fmtWhen(s.start)));
  meta.append(el('span', 'pill', fmtNum(s.tokens) + ' tokens'));
  meta.append(el('span', 'pill', (s.toolCount || 0) + ' tool actions'));
  if (s.models && s.models[0]) meta.append(el('span', 'pill', s.models[0]));
  body.append(meta);
  body.append(el('div', 'empty', 'Loading transcript…'));

  try {
    const d = await api('/api/session?id=' + encodeURIComponent(s.id) + '&projectDir=' + encodeURIComponent(s.projectDir));
    body.querySelector('.empty').remove();
    if (!d.turns.length) { body.append(el('div', 'empty', 'This session has no readable messages.')); return; }
    d.turns.forEach((turn) => {
      const t = el('div', 'turn ' + turn.role);
      t.append(el('div', 'turn-role', turn.role === 'user' ? 'You' : 'Claude'));
      if (turn.text) t.append(el('div', 'turn-text', turn.text));
      if (turn.tools && turn.tools.length) {
        const tools = el('div', 'turn-tools');
        turn.tools.forEach((tool) => {
          const tt = el('div', 'turn-tool');
          const b = el('b'); b.textContent = tool.name;
          tt.append(b);
          if (tool.input) tt.append(document.createTextNode('  ' + tool.input));
          tools.append(tt);
        });
        t.append(tools);
      }
      body.append(t);
    });
  } catch (e) {
    const em = body.querySelector('.empty');
    if (em) em.textContent = 'Could not load transcript: ' + e.message;
  }
}

// ---- boot ------------------------------------------------------------------
(async function boot() {
  try {
    await Promise.all([loadToday(), loadActions(), loadSessions()]);
  } catch (e) {
    console.error(e);
  }
})();
