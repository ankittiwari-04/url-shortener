# URL Shortener

A production-grade URL shortener built with Node.js, Express, MongoDB, and Redis.

## Setup
1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in values
4. Run `npm run dev`

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- Redis (ioredis)
- Docker

## API Endpoints

### POST /api/shorten
Shorten a long URL.

**Body:**
```json
{
  "originalUrl": "https://www.google.com",
  "expiresInDays": 7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "ErF4_6T",
    "shortUrl": "http://localhost:3000/ErF4_6T"
  }
}
```