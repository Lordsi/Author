# Cloudflare Pages Build Configuration

For **Git-based deployment** on Cloudflare Pages, configure these settings in the dashboard:

## Build settings

| Setting | Value |
|--------|-------|
| **Build command** | `npm run deploy` |
| **Build output directory** | `.` |
| **Root directory** | (leave blank) |

## Alternative build command

If `npm run deploy` does not work, use this **exact** command (no `&` in the project name):

```
npx wrangler pages deploy . --project-name=queens-gods
```

**Important:** Do **not** use `Queens-&-Gods` as the project name. The `&` character breaks the shell and causes the build to fail. Use `queens-gods` instead.

## Project name

- **Correct:** `queens-gods` (alphanumeric and hyphens only)
- **Incorrect:** `Queens-&-Gods` (ampersand breaks the build)

## Where to change this

1. Go to [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. Open your project
3. **Settings** → **Builds & deployments** → **Build configurations**
4. Set **Build command** to `npm run deploy`
5. Set **Build output directory** to `.`
