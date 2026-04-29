# Frontend Deployment

This directory is the frontend source of truth.

- Git remote: `https://github.com/Nee200/note-frontend.git`
- Hosting: Netlify
- Public backend URL is configured in `script.js`, `admin.js`, and account-related scripts.

Operational notes:

- The backend is deployed separately from `note-backend.git` to Render.
- Local logs, temporary static servers, and `tmp_*` scratch files are intentionally ignored.
- Keep generated one-off patch scripts out of production commits unless they are still part of an active maintenance workflow.
