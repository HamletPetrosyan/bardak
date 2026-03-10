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

In [accounts.ts](/home/erankyun/Hpam/backend/src/data/accounts.ts):
- `ALICE-KEY-123`
- `BOB-KEY-456`

## 5) Environment variables

Backend `.env`:
- `PORT=4000`
- `FRONTEND_ORIGIN=http://localhost:5173`
- `HEX_BOARD_SIZE=11`
- `ACCOUNT_KEY_PEPPER=<long-random-secret>`
- `ACCOUNT_KEY_ALICE=<alice-login-key>`
- `ACCOUNT_KEY_BOB=<bob-login-key>`

Frontend `.env`:
- `VITE_API_BASE_URL=http://localhost:4000`
- `VITE_WS_BASE_URL=ws://localhost:4000`

## Account-key security note

Raw account keys are no longer stored in backend source code.
At startup, backend reads account keys from environment variables and stores only HMAC-SHA256 hashes in memory.

For deployment:
- keep `ACCOUNT_KEY_PEPPER` secret and never commit it
- set strong account keys in environment, not in code
- rotate keys by changing env values and restarting backend
