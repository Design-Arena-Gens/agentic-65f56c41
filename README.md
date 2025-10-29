## Drive ➜ YouTube Daily Uploader

This project automates a daily workflow that looks for new videos in a Google Drive folder, generates SEO-friendly metadata with optional AI assistance, and uploads the resulting content to YouTube.

### 1. Configure environment

Create an `.env.local` file based on `.env.example` and fill in:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials for an app with YouTube + Drive scopes |
| `GOOGLE_REFRESH_TOKEN` | Refresh token tied to the YouTube channel owner |
| `GOOGLE_DRIVE_FOLDER_ID` | Intake folder that receives daily videos |
| `GOOGLE_DRIVE_ARCHIVE_FOLDER_ID` | (Optional) Folder where processed files are moved |
| `OPENAI_API_KEY` | (Optional) Enables AI metadata generation |

`DEFAULT_VIDEO_TITLE_TEMPLATE` / `DEFAULT_VIDEO_DESCRIPTION_TEMPLATE` accept `{{originalName}}` and `{{uploadDate}}` placeholders. Tags are comma-separated.

### 2. Local development

```bash
npm install
npm run dev
# visit http://localhost:3000
```

The dashboard shows environment status, the Drive queue, and lets you trigger an upload manually.

### 3. Scheduling on Vercel

1. Deploy the project (`vercel deploy --prod ...`)
2. In the Vercel dashboard, add the environment variables from `.env.local`
3. Configure a [Vercel Cron job](https://vercel.com/docs/cron-jobs) to call `GET https://agentic-65f56c41.vercel.app/api/cron/daily` once every 24 hours

The route executes the full pipeline, moves processed files to the archive (if provided), and stores metadata in Drive `appProperties` for idempotency.

### 4. Required Google scopes

When creating OAuth credentials and refresh tokens, ensure the consented scopes include:

- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/drive.file` (if you want the agent to mark/move files)

### 5. Linting & build

```bash
npm run lint
npm run build
```

Both should pass before deploying. The production build relies on the same serverless handlers that Cron uses.
