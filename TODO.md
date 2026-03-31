# Backend Fix Plan - Progress Tracker

## Approved Plan Steps

### 1. ✅ Create TODO.md [DONE]

### 2. 🔄 Edit server.js port to 3001
- Change `const PORT = process.env.PORT || 3000;` → `process.env.PORT || 3001`
- Update console banner if needed

### 3. 🧹 Kill port 3000 process (if exists)
- `netstat -ano | findstr :3000`
- `taskkill /PID <PID> /F`

### 4. ▶️ Run backend
- `cd viewtube-backend; npm start`
- Verify: http://localhost:3001/

### 5. ✅ Test API
- `curl http://localhost:3001/` or browser
- Check /videos, /trending, etc.

### 6. 🚀 Complete
- attempt_completion

**Status:** Plan approved - implementing step-by-step

