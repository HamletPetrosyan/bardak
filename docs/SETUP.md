# Setup

## Requirements

- Node.js 20+ (recommended)
- npm

## 1) Backend

```bash
cd /home/erankyun/Hpam/backend
npm install
cp .env.example .env
npm run dev
```

Backend default URL: `http://localhost:4000`

## 2) Frontend

Open a second terminal:

```bash
cd /home/erankyun/Hpam/frontend
npm install
cp .env.example .env
npm run dev
```

Frontend default URL: `http://localhost:5173`

## 3) Backend tests (Hex rules)

```bash
cd /home/erankyun/Hpam/backend
npm test
```

## 4) Test accounts

Accounts are now stored in the database.

You can seed the first two accounts from backend `.env`:
- `ACCOUNT_KEY_ALICE=<alice-login-key>`
- `ACCOUNT_KEY_BOB=<bob-login-key>`

Or add/update accounts manually:

```bash
cd /home/erankyun/Hpam/backend
npm run account:upsert -- --account-id alice --display-name Alice --account-key your-secret-key
```

## 5) Environment variables

Backend `.env`:
- `PORT=4000`
- `FRONTEND_ORIGIN=http://localhost:5173`
- `HEX_BOARD_SIZE=11`
- `DATABASE_URL=<your-supabase-session-pooler-connection-string>`
- `ACCOUNT_KEY_PEPPER=<long-random-secret>`
- `ACCOUNT_KEY_ALICE=<optional-seed-key>`
- `ACCOUNT_KEY_BOB=<optional-seed-key>`

Frontend `.env`:
- `VITE_API_BASE_URL=http://localhost:4000`
- `VITE_WS_BASE_URL=ws://localhost:4000`

## Account-key security note

Raw account keys are no longer stored in backend source code.
The backend stores only hashed keys in the database.

For deployment:
- keep `ACCOUNT_KEY_PEPPER` secret and never commit it
- set `DATABASE_URL` to your Supabase Postgres database
- use the account CLI or database-backed account creation flow instead of editing code
