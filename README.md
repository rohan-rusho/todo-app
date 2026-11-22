# Todo App ✅

A free, simple todo list. Add tasks, tick them off, filter all / active /
done, clear completed — everything saved in your browser, no sign-up.

## Features

- **Add** — type a task and press Enter (or hit Add)
- **Complete** — click the circle to toggle done, with a strike-through
- **Delete** — ✕ on any task, with a slide-out animation
- **Edit in place** — double-click a task (or press Enter on it) to edit; Enter saves, Escape cancels
- **Filters** — All / Active / Done, with live counts on each button
- **Clear completed** — sweep finished tasks away in one tap
- **Remaining count** — always visible, e.g. “3 of 5 remaining”
- **Saved in localStorage** — tasks and your filter survive closing the tab
- Responsive, keyboard-friendly, `aria-live` counts, `prefers-reduced-motion` respected

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step, no dependencies — just open `index.html` (or serve it).

## Deploy

Static site — drop the folder on any static host (GitHub Pages, Netlify,
Vercel, or any web server). The only external dependency is Google Fonts.
