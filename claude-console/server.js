#!/usr/bin/env node
/*
 * Claude Console — a small local dashboard on top of Claude Code.
 *
 * Zero dependencies. Reads Claude Code's own session logs and skills,
 * shows a daily report, turns skills/automations into one-click buttons,
 * and keeps a log of every session.
 *
 * Run:  node server.js   (then open the printed URL)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const PORT = Number(process.env.PORT || 4317);
const HOST = '127.0.0.1'; // local only — never exposed to the network
const CLAUDE_HOME = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');
const APP_DIR = __dirname;
const PUBLIC_DIR = path.join(APP_DIR, 'public');
const AUTOMATIONS_FILE = path.join(APP_DIR, 'automations.json');
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';
// The project the buttons act on. Defaults to wherever you launched from.
const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function safeRead(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}
function listDir(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}
function decodeProjectDir(name) {
  // Claude stores project dirs as the cwd with slashes turned into dashes.
  // Leading dash means an absolute path.
  return name.replace(/^-/, '/').replace(/-/g, '/');
}
function dayKey(iso) {
  // Group by local calendar day.
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toISOString().slice(0, 10);
}
function firstLine(str, max = 120) {
  if (!str) return '';
  const line = String(str).split('\n').find((l) => l.trim().length) || '';
  const clean = line.trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

// Pull readable text out of a message.content (string OR array of blocks).
function textFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n');
}

// Strip a leading attachment reference like:  @"/path/to/file.jpg" Try this
function cleanUserText(text) {
  if (!text) return '';
  return text.replace(/^@"[^"]*"\s*/, '').replace(/^@\S+\s*/, '').trim();
}

// ---------------------------------------------------------------------------
// Session parsing
// ---------------------------------------------------------------------------
function readSessionFile(projectDirName, fileName) {
  const full = path.join(PROJECTS_DIR, projectDirName, fileName);
  const raw = safeRead(full);
  if (raw == null) return null;

  const sessionId = fileName.replace(/\.jsonl$/, '');
  const events = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { events.push(JSON.parse(t)); } catch { /* skip malformed line */ }
  }
  if (!events.length) return null;

  let title = '';
  let firstTs = null;
  let lastTs = null;
  let cwd = null;
  let gitBranch = null;
  let version = null;
  let userMsgs = 0;
  let assistantMsgs = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const tools = {}; // name -> count
  const models = new Set();

  for (const ev of events) {
    if (ev.timestamp) {
      if (!firstTs) firstTs = ev.timestamp;
      lastTs = ev.timestamp;
    }
    if (ev.cwd) cwd = ev.cwd;
    if (ev.gitBranch) gitBranch = ev.gitBranch;
    if (ev.version) version = ev.version;

    if (ev.type === 'user' && ev.message) {
      const txt = cleanUserText(textFromContent(ev.message.content));
      if (txt) {
        userMsgs += 1;
        if (!title) title = firstLine(txt);
      }
    } else if (ev.type === 'assistant' && ev.message) {
      assistantMsgs += 1;
      if (ev.message.model) models.add(ev.message.model);
      const u = ev.message.usage || {};
      inputTokens += (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      outputTokens += u.output_tokens || 0;
      const content = ev.message.content;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b && b.type === 'tool_use' && b.name) {
            tools[b.name] = (tools[b.name] || 0) + 1;
          }
        }
      }
    }
  }

  return {
    id: sessionId,
    projectDir: projectDirName,
    title: title || '(untitled session)',
    cwd: cwd || decodeProjectDir(projectDirName),
    gitBranch,
    version,
    start: firstTs,
    end: lastTs,
    userMessages: userMsgs,
    assistantMessages: assistantMsgs,
    inputTokens,
    outputTokens,
    tokens: inputTokens + outputTokens,
    tools,
    toolCount: Object.values(tools).reduce((a, b) => a + b, 0),
    models: [...models],
    events: events.length,
  };
}

function listAllSessions() {
  const out = [];
  for (const dirent of listDir(PROJECTS_DIR)) {
    if (!dirent.isDirectory()) continue;
    for (const f of listDir(path.join(PROJECTS_DIR, dirent.name))) {
      if (!f.isFile() || !f.name.endsWith('.jsonl')) continue;
      const s = readSessionFile(dirent.name, f.name);
      if (s) out.push(s);
    }
  }
  // Newest first.
  out.sort((a, b) => new Date(b.end || 0) - new Date(a.end || 0));
  return out;
}

// Full, readable transcript for one session.
function readTranscript(projectDirName, sessionId) {
  const full = path.join(PROJECTS_DIR, projectDirName, sessionId + '.jsonl');
  const raw = safeRead(full);
  if (raw == null) return null;

  const turns = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let ev;
    try { ev = JSON.parse(t); } catch { continue; }

    if (ev.type === 'user' && ev.message) {
      const txt = cleanUserText(textFromContent(ev.message.content));
      // Tool results come back as "user" events too — skip those.
      const isToolResult = Array.isArray(ev.message.content) &&
        ev.message.content.some((b) => b && b.type === 'tool_result');
      if (txt && !isToolResult) {
        turns.push({ role: 'user', ts: ev.timestamp, text: txt });
      }
    } else if (ev.type === 'assistant' && ev.message && Array.isArray(ev.message.content)) {
      let text = '';
      let thinking = '';
      const tools = [];
      for (const b of ev.message.content) {
        if (!b) continue;
        if (b.type === 'text') text += (text ? '\n' : '') + b.text;
        else if (b.type === 'thinking') thinking += (thinking ? '\n' : '') + (b.thinking || '');
        else if (b.type === 'tool_use') tools.push({ name: b.name, input: summarizeToolInput(b) });
      }
      if (text || tools.length || thinking) {
        turns.push({ role: 'assistant', ts: ev.timestamp, text, thinking, tools });
      }
    }
  }
  return turns;
}

function summarizeToolInput(block) {
  const i = block.input || {};
  if (i.file_path) return i.file_path;
  if (i.command) return firstLine(i.command, 80);
  if (i.pattern) return i.pattern;
  if (i.path) return i.path;
  if (i.url) return i.url;
  if (i.prompt) return firstLine(i.prompt, 80);
  if (i.description) return firstLine(i.description, 80);
  return '';
}

// ---------------------------------------------------------------------------
// Daily report
// ---------------------------------------------------------------------------
function buildDailyReport() {
  const sessions = listAllSessions();
  const today = new Date().toISOString().slice(0, 10);

  const byDay = {}; // day -> {sessions, messages, tokens, tools}
  for (const s of sessions) {
    const k = dayKey(s.end || s.start);
    if (!k) continue;
    const bucket = (byDay[k] = byDay[k] || { sessions: 0, messages: 0, tokens: 0, tools: 0 });
    bucket.sessions += 1;
    bucket.messages += s.userMessages + s.assistantMessages;
    bucket.tokens += s.tokens;
    bucket.tools += s.toolCount;
  }

  const todaySessions = sessions.filter((s) => dayKey(s.end || s.start) === today);
  const toolTotals = {};
  const projectsToday = new Set();
  for (const s of todaySessions) {
    projectsToday.add(s.cwd);
    for (const [name, n] of Object.entries(s.tools)) {
      toolTotals[name] = (toolTotals[name] || 0) + n;
    }
  }
  const topTools = Object.entries(toolTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // 14-day activity sparkline.
  const spark = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    spark.push({ day: k, sessions: (byDay[k] && byDay[k].sessions) || 0 });
  }

  const todayStats = todaySessions.reduce(
    (acc, s) => {
      acc.messages += s.userMessages + s.assistantMessages;
      acc.tokens += s.tokens;
      acc.tools += s.toolCount;
      return acc;
    },
    { messages: 0, tokens: 0, tools: 0 }
  );

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    today: {
      sessions: todaySessions.length,
      projects: projectsToday.size,
      messages: todayStats.messages,
      tokens: todayStats.tokens,
      toolCalls: todayStats.tools,
      topTools,
      sessionList: todaySessions.map((s) => ({
        id: s.id, projectDir: s.projectDir, title: s.title, cwd: s.cwd,
        start: s.start, end: s.end, tokens: s.tokens, toolCount: s.toolCount,
      })),
    },
    totals: {
      sessions: sessions.length,
      tokens: sessions.reduce((a, s) => a + s.tokens, 0),
      projects: new Set(sessions.map((s) => s.cwd)).size,
    },
    sparkline: spark,
  };
}

// ---------------------------------------------------------------------------
// Skills, commands, automations
// ---------------------------------------------------------------------------
function parseFrontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---/.exec(md || '');
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
      if (kv) meta[kv[1].toLowerCase()] = kv[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return meta;
}

function collectSkills() {
  const roots = [
    { dir: path.join(CLAUDE_HOME, 'skills'), scope: 'personal' },
    { dir: path.join(PROJECT_DIR, ".claude", "skills"), scope: 'project' },
  ];
  const skills = [];
  const seen = new Set();
  for (const { dir, scope } of roots) {
    for (const d of listDir(dir)) {
      if (!d.isDirectory()) continue;
      const skillMd = path.join(dir, d.name, 'SKILL.md');
      const md = safeRead(skillMd);
      if (md == null) continue;
      const meta = parseFrontmatter(md);
      const name = meta.name || d.name;
      if (seen.has(name)) continue;
      seen.add(name);
      skills.push({
        name,
        slug: d.name,
        description: meta.description || '',
        scope,
        path: skillMd,
      });
    }
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

function collectCommands() {
  const roots = [
    { dir: path.join(CLAUDE_HOME, 'commands'), scope: 'personal' },
    { dir: path.join(PROJECT_DIR, ".claude", "commands"), scope: 'project' },
  ];
  const cmds = [];
  for (const { dir, scope } of roots) {
    for (const f of listDir(dir)) {
      if (!f.isFile() || !f.name.endsWith('.md')) continue;
      const md = safeRead(path.join(dir, f.name));
      const meta = parseFrontmatter(md);
      cmds.push({
        name: '/' + f.name.replace(/\.md$/, ''),
        description: meta.description || firstLine((md || '').replace(/^---[\s\S]*?---/, ''), 100),
        scope,
      });
    }
  }
  cmds.sort((a, b) => a.name.localeCompare(b.name));
  return cmds;
}

const DEFAULT_AUTOMATIONS = [
  {
    id: 'daily-report',
    label: 'Write my daily report',
    icon: '📋',
    description: 'Summarize what you worked on today into a short, plain-language update.',
    prompt: "Look at what I worked on in this project today using git log and the current changes. Write a short daily standup update in plain language: what got done, what's in progress, and anything blocked. Keep it to a few bullet points a non-technical teammate could follow.",
    tools: false,
  },
  {
    id: 'review-changes',
    label: 'Review my current changes',
    icon: '🔎',
    description: 'Read the uncommitted changes and flag bugs or rough edges before you commit.',
    prompt: 'Review my current uncommitted git changes for bugs, mistakes, and anything that looks unfinished. Give me a short prioritized list. Do not change any files.',
    tools: false,
  },
  {
    id: 'explain-project',
    label: 'Explain this project to me',
    icon: '🧭',
    description: 'A friendly overview of what this codebase is and how it fits together.',
    prompt: 'Give me a friendly, plain-language overview of this project: what it does, the main pieces, and where I would start if I were new here. No jargon.',
    tools: false,
  },
  {
    id: 'commit-message',
    label: 'Draft a commit message',
    icon: '✏️',
    description: 'Turn the current changes into a clean, conventional commit message.',
    prompt: 'Look at my staged and unstaged git changes and draft a clear, concise commit message (a short title plus a few bullet points). Just give me the message text — do not commit anything.',
    tools: false,
  },
];

function loadAutomations() {
  const raw = safeRead(AUTOMATIONS_FILE);
  if (raw != null) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch { /* fall through to defaults */ }
  }
  // Seed the file so a non-technical teammate can edit it later.
  try { fs.writeFileSync(AUTOMATIONS_FILE, JSON.stringify(DEFAULT_AUTOMATIONS, null, 2)); } catch {}
  return DEFAULT_AUTOMATIONS;
}

// ---------------------------------------------------------------------------
// Running Claude Code (headless), streamed to the browser over SSE
// ---------------------------------------------------------------------------
const runs = new Map(); // runId -> { child, buffer:[], done, exitCode, listeners:Set }

function startRun({ prompt, cwd, skipPermissions }) {
  const runId = 'run_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose'];
  if (skipPermissions) args.push('--dangerously-skip-permissions');

  const workdir = cwd && fs.existsSync(cwd) ? cwd : PROJECT_DIR;
  const record = { child: null, buffer: [], done: false, exitCode: null, listeners: new Set(), workdir, prompt };
  runs.set(runId, record);

  let child;
  try {
    // Close stdin so the CLI doesn't wait ~3s for piped input.
    child = spawn(CLAUDE_BIN, args, { cwd: workdir, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    record.done = true;
    record.exitCode = -1;
    pushEvent(runId, { type: 'error', message: 'Could not start Claude Code: ' + err.message });
    pushEvent(runId, { type: 'done', exitCode: -1 });
    return runId;
  }
  record.child = child;

  let stdoutBuf = '';
  child.stdout.on('data', (chunk) => {
    stdoutBuf += chunk.toString();
    let idx;
    while ((idx = stdoutBuf.indexOf('\n')) >= 0) {
      const line = stdoutBuf.slice(0, idx).trim();
      stdoutBuf = stdoutBuf.slice(idx + 1);
      if (line) forwardStreamLine(runId, line);
    }
  });
  child.stderr.on('data', (chunk) => {
    pushEvent(runId, { type: 'stderr', text: chunk.toString() });
  });
  child.on('close', (code) => {
    if (stdoutBuf.trim()) forwardStreamLine(runId, stdoutBuf.trim());
    record.done = true;
    record.exitCode = code;
    pushEvent(runId, { type: 'done', exitCode: code });
  });
  child.on('error', (err) => {
    pushEvent(runId, { type: 'error', message: err.message });
    record.done = true;
    record.exitCode = -1;
    pushEvent(runId, { type: 'done', exitCode: -1 });
  });

  return runId;
}

// Translate one Claude stream-json line into a friendly event.
function forwardStreamLine(runId, line) {
  let ev;
  try { ev = JSON.parse(line); } catch { return; }

  if (ev.type === 'assistant' && ev.message && Array.isArray(ev.message.content)) {
    for (const b of ev.message.content) {
      if (b.type === 'text' && b.text) pushEvent(runId, { type: 'text', text: b.text });
      else if (b.type === 'tool_use') pushEvent(runId, { type: 'tool', name: b.name, detail: summarizeToolInput(b) });
    }
  } else if (ev.type === 'result') {
    if (ev.result) pushEvent(runId, { type: 'result', text: ev.result });
    pushEvent(runId, { type: 'meta', durationMs: ev.duration_ms, cost: ev.total_cost_usd });
  } else if (ev.type === 'system' && ev.subtype === 'init') {
    pushEvent(runId, { type: 'status', text: 'Claude Code started (' + (ev.model || 'model') + ')' });
  }
}

function pushEvent(runId, event) {
  const rec = runs.get(runId);
  if (!rec) return;
  const payload = JSON.stringify(event);
  rec.buffer.push(payload);
  for (const res of rec.listeners) {
    res.write(`data: ${payload}\n\n`);
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function serveStatic(req, res) {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;

  try {
    if (p === '/api/summary') return sendJSON(res, 200, buildDailyReport());
    if (p === '/api/sessions') {
      const sessions = listAllSessions().map((s) => ({
        id: s.id, projectDir: s.projectDir, title: s.title, cwd: s.cwd,
        gitBranch: s.gitBranch, start: s.start, end: s.end,
        userMessages: s.userMessages, assistantMessages: s.assistantMessages,
        tokens: s.tokens, toolCount: s.toolCount, models: s.models,
      }));
      return sendJSON(res, 200, { sessions });
    }
    if (p === '/api/session') {
      const id = url.searchParams.get('id');
      const dir = url.searchParams.get('projectDir');
      if (!id || !dir) return sendJSON(res, 400, { error: 'missing id/projectDir' });
      const turns = readTranscript(dir, id);
      if (!turns) return sendJSON(res, 404, { error: 'not found' });
      return sendJSON(res, 200, { id, turns });
    }
    if (p === '/api/skills') return sendJSON(res, 200, { skills: collectSkills() });
    if (p === '/api/commands') return sendJSON(res, 200, { commands: collectCommands() });
    if (p === '/api/automations') {
      return sendJSON(res, 200, { automations: loadAutomations(), cwd: PROJECT_DIR });
    }

    if (p === '/api/run' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.prompt || !String(body.prompt).trim()) {
        return sendJSON(res, 400, { error: 'prompt is required' });
      }
      const runId = startRun({
        prompt: String(body.prompt),
        cwd: body.cwd,
        skipPermissions: !!body.skipPermissions,
      });
      return sendJSON(res, 200, { runId });
    }

    if (p === '/api/run/stream') {
      const runId = url.searchParams.get('id');
      const rec = runs.get(runId);
      if (!rec) { res.writeHead(404); res.end('unknown run'); return; }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      // Replay anything already buffered, then live-stream the rest.
      for (const payload of rec.buffer) res.write(`data: ${payload}\n\n`);
      if (rec.done) { res.end(); return; }
      rec.listeners.add(res);
      req.on('close', () => rec.listeners.delete(res));
      return;
    }

    if (p === '/api/stop' && req.method === 'POST') {
      const body = await readBody(req);
      const rec = runs.get(body.runId);
      if (rec && rec.child && !rec.done) { try { rec.child.kill('SIGTERM'); } catch {} }
      return sendJSON(res, 200, { ok: true });
    }

    if (p === '/api/health') {
      return sendJSON(res, 200, { ok: true, claudeHome: CLAUDE_HOME, cwd: PROJECT_DIR });
    }

    // Static files for everything else.
    return serveStatic(req, res);
  } catch (err) {
    sendJSON(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log('');
  console.log('  Claude Console is running.');
  console.log('  Open this in your browser:  ' + url);
  console.log('');
  console.log('  Reading Claude Code data from: ' + CLAUDE_HOME);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
