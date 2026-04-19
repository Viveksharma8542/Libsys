# Deploy to Render (Free Tier)

This project has two parts: **Backend** (Express.js API) and **Frontend** (React). On Render's free tier, you must serve the React frontend from the Express backend.

## Important Free Tier Limitations

- **No static sites** - Only web services available
- **Services sleep** - Inactive after 15 minutes, takes ~30 sec to wake up
- **PostgreSQL sleeps** - Database sleeping is expected
- **90 day limit** - Free PostgreSQL can be deleted after 90 days of inactivity

---

## Step 1: Create PostgreSQL Database (Free Tier)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** > **PostgreSQL**
3. Configure:
   - **Name**: `lms-db`
   - **Database Name**: `lms`
   - **User**: `lmsuser`
   - **Plan**: **Free** (should be selected by default)
4. Click **Create Database**
5. Copy the **Internal Database URL** (format: `postgres://lmsuser:password@hostname.render.com/lms`)

---

## Step 2: Deploy Web Service

1. Click **New** > **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `lms-app`
   - **Root Directory**: Leave empty (repo root)
   - **Runtime**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && node src/app.js`
4. Add Environment Variables:
   - `DB_HOST`: Hostname from your PostgreSQL (e.g., `dpg-xxx.render.com`)
   - `DB_PORT`: `5432`
   - `DB_NAME`: `lms`
   - `DB_USER`: `lmsuser`
   - `DB_PASSWORD`: Password from PostgreSQL (from the connection string)
   - `DB_SSL`: `true`
   - `PORT`: `5003`
   - `JWT_SECRET`: Generate a secure random string (min 32 chars)
5. Click **Create Web Service**
6. Wait for deploy to complete (may take 2-3 minutes)

---

## Step 3: Initialize Database

On the free tier, there is no Shell access. Initialize the database by creating a seed API endpoint.

### Option A: Add a Seed Endpoint (Recommended)

1. Create a seed route in your backend:

```javascript
// backend/src/routes/seed.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

router.post('/seed', async (req, res) => {
  try {
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const seedPath = path.join(__dirname, '../../seed.sql');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const seedData = fs.readFileSync(seedPath, 'utf8');

    await db.query(schema);
    await db.query(seedData);

    res.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

2. Add this route to your `app.js` (TEMPORARILY for setup only):

```javascript
// Add only for initial setup - REMOVE after use
app.use('/api/seed', require('./routes/seed'));
```

3. After deployment, call the seed endpoint:
   ```
   POST https://lms-app.onrender.com/api/seed
   ```

4. Once done, **remove the seed route** from `app.js` and push to GitHub.

### Option B: Use environment variable to auto-seed

Add a startup check in your app.js:

```javascript
// backend/src/app.js - Add at the beginning of your routes
if (process.env.AUTO_SEED === 'true') {
  const fs = require('fs');
  const path = require('path');

  const initDatabase = async () => {
    try {
      const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
      const seed = fs.readFileSync(path.join(__dirname, '../seed.sql'), 'utf8');
      await db.query(schema);
      await db.query(seed);
      console.log('Database initialized');
    } catch (err) {
      console.error('DB init error:', err.message);
    }
  };
  initDatabase();
}
```

Then set `AUTO_SEED: `true`` as an environment variable, remove it after first deploy.

---

## Step 4: Update Backend to Serve React Build

Modify `backend/src/app.js` to serve the React static files:

```javascript
const path = require('path');

// Add this AFTER your API routes but BEFORE the catch-all
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
```

> **Important**: Place the static file middleware AFTER all your API routes but BEFORE the `app.get('*', ...)` catch-all handler. If you have other `app.get()` routes, they must also come before the catch-all.

---

## Step 5: Update CORS Configuration

Update your backend's CORS to allow the frontend:

```javascript
// backend/src/middleware/cors.js
const corsOptions = {
  origin: 'https://lms-app.onrender.com', // Your Render URL
  credentials: true,
};
```

---

## Step 6: Push Changes to GitHub

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Update for Render deployment"
   ```
2. Push to GitHub:
   ```bash
   git push origin main
   ```
3. Render will automatically redeploy with the changes

---

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL hostname | `dpg-xxx.render.com` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `lms` |
| `DB_USER` | Database user | `lmsuser` |
| `DB_PASSWORD` | Database password | Your password |
| `DB_SSL` | Enable SSL | `true` |
| `PORT` | Server port | `5003` |
| `JWT_SECRET` | Secret for JWT | Random 32+ char string |

---

## Troubleshooting

### Service sleeps / takes long to load
This is expected on the free tier. The first request after inactivity will take ~30 seconds to wake the service.

### Database connection errors
- Make sure `DB_SSL` is set to `true`
- Verify all DB env variables are correct
- Check the PostgreSQL database exists

### Frontend shows 404 on refresh
Ensure the catch-all `app.get('*', ...)` route is LAST in your app.js, after all API routes.

### Build fails during deploy
Check that:
- `schema.sql` and `seed.sql` are in the `backend/` folder (or update the build command path)
- Node version in `package.json` is compatible with Render's Node version

### CORS errors
Update the origin in your CORS configuration to match your Render subdomain.

---

## Testing Your Deployment

After deployment:
1. Visit `https://lms-app.onrender.com` - Should show the React app
2. API endpoints work at `https://lms-app.onrender.com/api/...`
3. First load might take 30 seconds due to sleep (free tier)

---

## Keeping Your Free Tier Database

Render's free PostgreSQL can be deleted after 90 days of inactivity. To prevent this:
- Visit your app at least once every 90 days
- Or upgrade to a paid plan ($7/month for PostgreSQL)