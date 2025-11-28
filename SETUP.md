# EchoVault Setup Instructions

## 🔐 API Key Security Setup

### Step 1: Get a New Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Delete the old exposed key** (if you haven't already)
3. Click **"Create API Key"**
4. Copy the new key

### Step 2: Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace `your_new_api_key_here` with your actual API key:

```bash
VITE_GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

3. **Save the file**

### Step 3: Verify .gitignore

Make sure `.env.local` is listed in `.gitignore` so it's never committed:

```bash
# Check that .env.local won't be committed
git status

# Should NOT show .env.local as a file to be committed
```

### Step 4: Restart Your Dev Server

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

## ⚠️ Important Security Notes

### Client-Side Limitation

**Even with environment variables, your API key is still exposed in the browser.**

Anyone can:
1. Open browser DevTools (F12)
2. Go to Network tab
3. See your API key in the request headers

### Recommended: Move to Backend (Production Ready)

For production, you should:

1. **Create a backend API** (Node.js, Firebase Functions, etc.)
2. **Move all Gemini API calls to the backend**
3. **Your frontend calls your backend** (which then calls Gemini)
4. **API key stays on the server** (never sent to browser)

#### Quick Backend Option: Vercel Serverless Functions

```javascript
// api/transcribe.js (Vercel serverless function)
export default async function handler(req, res) {
  const { audio } = req.body;

  // Your API key is in Vercel environment variables (server-side only)
  const result = await fetch('https://generativelanguage.googleapis.com/...', {
    headers: { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
    body: JSON.stringify({ audio })
  });

  res.json(await result.json());
}
```

### Alternative: API Key Restrictions

While not perfect, you can add some protection:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key
3. Click **"Edit"**
4. Under **"Application restrictions"**:
   - Select **"HTTP referrers"**
   - Add your domain: `https://yourdomain.com/*`
5. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Only allow: "Generative Language API"

This prevents others from using your key on different domains (but won't stop someone on your site).

## 🚀 Deployment Checklist

Before deploying:

- [ ] Regenerated API key (old one was exposed)
- [ ] Added API key to hosting provider's environment variables
- [ ] Verified `.env.local` is in `.gitignore`
- [ ] Tested app with new environment variable setup
- [ ] (Optional) Set up API key restrictions in Google Cloud Console
- [ ] (Recommended) Consider moving to backend API for production

## 📱 For Hosting Providers

### Vercel / Netlify
1. Go to project settings → Environment Variables
2. Add: `VITE_GEMINI_API_KEY=your_key_here`
3. Redeploy

### Firebase Hosting
Use Firebase Functions for the backend:
```bash
firebase functions:config:set gemini.key="your_key_here"
```

## 🆘 Troubleshooting

**"API key not found" error:**
- Make sure `.env.local` exists in project root
- Restart your dev server after creating/editing `.env.local`
- Check that the variable name is exactly `VITE_GEMINI_API_KEY`

**Key still showing in browser:**
- This is expected with client-side apps
- For true security, you need a backend

**Git shows .env.local:**
- Run: `git rm --cached .env.local`
- Make sure `.gitignore` includes `.env.local`
