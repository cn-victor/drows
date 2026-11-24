# Drows

A home for poems and books: write and format poems the way you see them, give them a theme,
moving background, music and sound effects, have them read aloud by an AI voice with the tones
you choose, and share them with a link. Later: social features and earnings on Solana.

## Start the app on your computer

1. Open this folder in VS Code.
2. Open the terminal: **Terminal → New Terminal** (or press <kbd>Ctrl</kbd>+<kbd>`</kbd>).
3. Type `npm run dev` and press Enter.
4. Open <http://localhost:3300> in your browser.

To stop it, click in the terminal and press <kbd>Ctrl</kbd>+<kbd>C</kbd>.

## Switch on the AI voice

Without this, poems are read by the browser's free built-in voice.

1. Get an API key from OpenAI (platform.openai.com → API keys) and add a little credit.
2. In this folder, copy `.env.example` and name the copy `.env.local`.
3. Paste your key after `OPENAI_API_KEY=` and save.
4. Stop the app (<kbd>Ctrl</kbd>+<kbd>C</kbd>) and start it again (`npm run dev`).

Each part of a poem is recorded once and saved in `data/voice/`, so you pay for it once, not every
time someone listens. `.env.local` is private and is never uploaded to GitHub.

## Gifts and wallets (Solana)

- Every writer can create a wallet on the **Wallet** page. It lives in their browser, locked with a wallet
  password, and backed up by 12 recovery words (it also opens in Phantom or Solflare). The platform only
  stores the public address, never keys or money.
- Readers press **🎁 Gift** on a poem. One Solana payment sends 85% to the writer and 15% to the platform
  wallet (`PLATFORM_WALLET` in `.env.local`). The server checks the payment on the blockchain before
  recording it.
- It runs on Solana's **test network** (free test money). Get test SOL at faucet.solana.com and test USDC at
  faucet.circle.com. Before switching to real money (`NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta`): put your own
  wallet address in `PLATFORM_WALLET`, and get legal advice about taking fees on payments.

## The plan

| Stage | What | Status |
| --- | --- | --- |
| 1 | Writing editor, themes, shareable poem pages | **Built** |
| 2 | Background sounds & music, sound effects, AI voice reader with tones | **Built** |
| 3 | Accounts, profiles, follows, feed, likes, reposts, comments, books with chapters | **Built** |
| 4 | Gifting on Solana (writer gets 85%, platform keeps 15%), on the test network | **Built** |
| 5 | Writers' pool: 20% of platform income shared by likes/reposts, switched on at 1,000 users and $1,000/month | |

## Where things live

- `src/app/page.tsx`: home page
- `src/app/write/page.tsx` + `src/components/Writer.tsx`: the writing page
- `src/app/p/[id]/page.tsx`: a shared poem's page (with the Listen button)
- `src/lib/themes.ts`: the themes (add or change looks here)
- `src/lib/fonts.ts`: fonts writers can pick
- `src/lib/sounds.ts`: the list of background sounds and sound effects
- `src/lib/audioEngine.ts`: how each sound is made (generated live, no audio files)
- `src/lib/voice.ts`: reader voices, reading styles, line tones and pauses
- `src/server/tts.ts`: the AI voice
- `src/lib/site.ts`: the platform's name
- `src/server/db.ts`: the database (a file at `data/poems.db` on your computer)
- `data/uploads/`: music writers upload; `data/voice/`: saved AI recordings
