# Causal Inference Methods - Interactive Learning Platform

An AI-powered interactive tool for teaching RCT, DiD, RD, and PSM through personalized, step-by-step explanations with synchronized visualizations.

Students choose a method, set their difficulty level (Plain Language, Basic, or Advanced), describe a program they want to evaluate, and the AI generates a tailored walkthrough using their example.

**Powered by Google Gemini 2.0 Flash (free tier).**

---

## Quick Deploy to Vercel (~10 minutes, completely free)

### What you need

1. **A Google AI Studio account** (free): https://aistudio.google.com
2. **A GitHub account** (free): https://github.com
3. **A Vercel account** (free): https://vercel.com (sign up with GitHub)

### Step 1: Get your free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Click **Create API Key**
3. Copy the key and save it somewhere safe

The free tier includes 15 requests per minute and 1,500 requests per day with Gemini 2.0 Flash. That is more than enough for a full classroom.

### Step 2: Get the code onto GitHub

1. Go to https://github.com/new
2. Name the repository `causal-inference-lab`
3. Keep it **Private**
4. Click **Create repository**
5. Upload all the project files (drag and drop the contents of the zip)

Your repository should have this structure:

```
causal-inference-lab/
  app/
    api/
      generate/
        route.js          <-- server-side Gemini proxy
    layout.js
    page.js
  components/
    CausalInferenceLab.jsx  <-- the main app
  package.json
  next.config.js
  .gitignore
  .env.local.example
```

### Step 3: Deploy on Vercel

1. Go to https://vercel.com/new
2. Click **Import** next to your `causal-inference-lab` repository
3. Under **Environment Variables**, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key from Step 1
4. Click **Deploy**
5. Wait about 60 seconds

Vercel gives you a live URL like `https://causal-inference-lab.vercel.app`. Share that link with your students. Done.

---

## Running Locally (for development/testing)

Requires Node.js 18+ (https://nodejs.org).

```bash
# 1. Clone your repo
git clone https://github.com/YOUR_USERNAME/causal-inference-lab.git
cd causal-inference-lab

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.local.example .env.local
# Edit .env.local and paste your Gemini API key

# 4. Run
npm run dev
```

Open http://localhost:3000.

---

## Cost

**$0.** The Gemini 2.0 Flash free tier covers:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

A class of 30 students each generating 10 explanations = 300 requests, well within the daily limit. Even heavy use across an entire semester costs nothing.

If you somehow exceed the free tier (unlikely), Google's paid rate for Gemini 2.0 Flash is extremely low.

---

## How it works

1. Student opens the site and picks a method (RCT, DiD, RD, PSM)
2. Student sets difficulty (Plain Language, Basic, Advanced) and sees a definition
3. Student types a program they want to evaluate (or uses the default)
4. The browser sends the request to your Vercel server at `/api/generate`
5. Your server calls Google Gemini with your API key (never exposed to students)
6. Gemini returns a structured JSON explanation
7. The app renders it as an interactive step-by-step walkthrough with synced charts

Students never need an account, API key, or login. They just use the URL.

---

## Customization

- **Methods**: Edit the `METHODS` array in `components/CausalInferenceLab.jsx`
- **AI behavior**: Edit the `SYSTEM_PROMPT` constant in the same file
- **Visualizations**: Modify `RCTChart`, `DiDChart`, `RDChart`, `PSMChart` components
- **Model**: Change `gemini-2.0-flash` in `app/api/generate/route.js` to another Gemini model

---

## Security

The Gemini API key is stored as a server-side environment variable on Vercel. It is never sent to the browser. Students interact only with your Vercel URL.

---

## Troubleshooting

**"Failed to generate explanation"**
- Verify your `GEMINI_API_KEY` is set correctly in Vercel (Settings > Environment Variables)
- Check that the key is active at https://aistudio.google.com/apikey

**Slow responses**
- Gemini 2.0 Flash typically responds in 3-8 seconds. If slower, the free tier may be rate-limited. Wait a moment and retry.

**JSON parse errors**
- Occasionally the model may return malformed JSON. Click "Generate Explanation" again. The `responseMimeType: "application/json"` setting in the API route minimizes this.
