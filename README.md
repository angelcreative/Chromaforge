<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1w_nl_KViNGo47USojFxc21eNi6QluT7r

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your Gemini API key:
   
   **Option A: Create a `.env.local` file** (recommended):
   ```bash
   echo "API_KEY=tu_api_key_de_gemini" > .env.local
   ```
   
   **Option B: Set environment variable:**
   ```bash
   export API_KEY='tu_api_key_de_gemini'
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey
   
   **Note:** The server will automatically load `.env.local` or `.env` files. If you see `❌ API_KEY is NOT configured` in the server logs, check that your `.env.local` file exists and contains the correct key.

3. Run the app in development mode (with hot reload):
   
   **⚠️ IMPORTANT: You MUST run both servers for the AI features to work!**
   
   ```bash
   npm run dev:full
   ```
   This will start both Vite (frontend on port 3000) and the Express server (API on port 8080).
   
   You should see in the terminal:
   - `[vite] ready in XXX ms` (frontend)
   - `[Server] 🚀 Server running on port 8080` (backend)
   - `[Server] ✅ API_KEY is configured` (if API_KEY is set)

   **If you see `ECONNREFUSED` or `HTTP 500` errors:**
   - Make sure you're running `npm run dev:full` (NOT just `npm run dev`)
   - Or run them in separate terminals:
     - Terminal 1: `npm run dev` (frontend)
     - Terminal 2: `npm run dev:server` (backend - requires build first)

4. Access the app:
   - Frontend: http://localhost:3000
   - API endpoints will be proxied from Vite to the Express server automatically

5. **Troubleshooting:**
   
   **Error: `ECONNREFUSED` or `HTTP 500: Internal Server Error`:**
   - ✅ **Solution:** Run `npm run dev:full` instead of just `npm run dev`
   - The backend server (port 8080) must be running for API calls to work
   - Check terminal output for `[Server] 🚀 Server running on port 8080`
   
   **Error: `API_KEY is NOT configured`:**
   - ✅ **Solution:** Create `.env.local` file in project root with: `API_KEY=tu_key`
   - Verify the file is in the same directory as `package.json`
   - Restart the server after creating/modifying `.env.local`
   - The server will show `✅ API_KEY is configured` if loaded correctly
   
   **Error: `HTTP 500` from Gemini API:**
   - Check server logs for detailed error messages
   - Verify your API key is valid at: https://makersuite.google.com/app/apikey
   - Make sure you have quota/credits available in Google Cloud Console
