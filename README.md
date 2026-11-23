# Inkwell (working name)

A home for poems and books: write and format poems the way you see them, give them a theme and
moving background, and share them with a link. Later: music, an AI reader, social features and
earnings on Solana.

## Start the app on your computer

1. Open this folder in VS Code.
2. Open the terminal: **Terminal → New Terminal** (or press <kbd>Ctrl</kbd>+<kbd>`</kbd>).
3. Type `npm run dev` and press Enter.
4. Open <http://localhost:3300> in your browser.

To stop it, click in the terminal and press <kbd>Ctrl</kbd>+<kbd>C</kbd>.

## The plan

| Stage | What | Status |
| --- | --- | --- |
| 1 | Writing editor, themes, shareable poem pages | **Built** |
| 2 | Music & sounds, AI voice reader | Next |
| 3 | Accounts, profiles, feed, likes, reposts, comments, books | |
| 4 | Gifting on Solana (writer gets 85%, platform keeps 15%) | |
| 5 | Writers' pool: 20% of platform income shared by likes/reposts, switched on at 1,000 users and $1,000/month | |

## Where things live

- `src/app/page.tsx`: home page
- `src/app/write/page.tsx` + `src/components/Writer.tsx`: the writing page
- `src/app/p/[id]/page.tsx`: a shared poem's page
- `src/lib/themes.ts`: the themes (add or change looks here)
- `src/lib/fonts.ts`: fonts writers can pick
- `src/lib/site.ts`: the platform's name
- `src/server/db.ts`: the database (a file at `data/poems.db` on your computer)
