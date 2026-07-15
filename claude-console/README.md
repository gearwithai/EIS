# Claude Console

A small, clean **local dashboard on top of [Claude Code](https://claude.com/claude-code)**.
No terminal required to use it — just open a web page.

It gives you three things:

1. **📊 Today** — a daily report of your Claude Code activity (sessions, messages, tool actions, tokens, and a 14-day activity chart), plus a one-click **"Write today's summary"** that has Claude Code write a plain-language standup for you.
2. **⚡ Actions** — your **skills and automations as one-click buttons**. Click one, tweak the wording if you like, press **Run**, and watch Claude Code work in real time.
3. **🗂️ Sessions** — a searchable **log of every Claude Code session** on the machine. Click any one to read the full transcript.

It reads Claude Code's own data (`~/.claude`) and drives the `claude` command for you. Everything runs locally — nothing is sent anywhere.

---

## Start it

You need [Claude Code](https://claude.com/claude-code) installed and signed in, and **Node.js 18+**. No other setup, no `npm install` — it has zero dependencies.

```bash
cd your-project            # the project you want the buttons to act on
node /path/to/claude-console/server.js
```

Then open the printed link in your browser (defaults to **http://127.0.0.1:4317**).

That's the whole thing. Leave it running in a terminal tab and use the browser.

> **Tip for a teammate who never touches a terminal:** have someone run that one
> command once (or add it to a login script / a double-click launcher), then just
> share the `http://127.0.0.1:4317` link. From there it's all buttons.

---

## The buttons

**Automations** are ready-made routines defined in [`automations.json`](./automations.json).
Four ship by default — write a daily report, review your current changes, explain the
project, and draft a commit message. Edit that file to add your own; each entry is just:

```json
{
  "id": "unique-id",
  "label": "Button text",
  "icon": "🚀",
  "description": "One line shown on the card.",
  "prompt": "What you want Claude Code to do."
}
```

**Skills** are discovered automatically from `~/.claude/skills` and your project's
`.claude/skills`. Each becomes a button that runs Claude Code with that skill.

By default, runs are **read-only-friendly** — Claude can look around and answer, but
won't change files or run commands unless you tick **"Allow file edits & commands"**
before pressing Run.

---

## Settings (optional)

All optional environment variables:

| Variable | Default | What it does |
|---|---|---|
| `PORT` | `4317` | Port for the web app. |
| `PROJECT_DIR` | current directory | The project the buttons act on. |
| `CLAUDE_HOME` | `~/.claude` | Where Claude Code stores its data. |
| `CLAUDE_BIN` | `claude` | Path to the `claude` executable. |

Example:

```bash
PORT=5000 PROJECT_DIR=~/work/my-app node /path/to/claude-console/server.js
```

---

## How it works

- **`server.js`** — a zero-dependency Node HTTP server. It parses the session logs in
  `~/.claude/projects/**/*.jsonl` for the report and session list, reads your skills and
  automations, and spawns `claude -p … --output-format stream-json` for runs, streaming
  the output to the browser over Server-Sent Events.
- **`public/`** — the single-page dashboard (plain HTML/CSS/JS, light & dark aware).

Bound to `127.0.0.1` only, so it's never exposed to your network.
