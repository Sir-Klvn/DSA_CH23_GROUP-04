# 📺 ViewTube – YouTube Frontend Clone

A pixel-faithful YouTube clone built with HTML, CSS, and Vanilla JavaScript.

## 📁 Project Structure

```
youtube-clone/
├── index.html     → Home page (video grid, chips, sidebar)
├── watch.html     → Video player page (player, comments, recommended)
├── style.css      → All styles (dark theme, responsive)
├── data.js        → 12 mock videos with channels and comments
├── app.js         → Home page logic (filter, search, sidebar)
└── watch.js       → Watch page logic (player, likes, comments)
```

## ✅ Features

- 🏠 **Home Page** – responsive video grid with category filter chips
- 🎬 **Watch Page** – video player with custom controls, like/dislike, subscribe
- 💬 **Comments** – post, like, and display comments
- 🔍 **Search** – live search by title, channel, or category
- 📱 **Responsive** – works on desktop, tablet, and mobile
- 🎨 **Dark theme** – faithful to YouTube's dark mode

## 🚀 How to Run in VS Code

### Step 1 – Install VS Code
Download from: https://code.visualstudio.com

### Step 2 – Install Live Server Extension
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions panel)
3. Search **"Live Server"** by Ritwick Dey
4. Click **Install**

### Step 3 – Open the Project
1. In VS Code: `File → Open Folder`
2. Select the `youtube-clone` folder

### Step 4 – Run It
1. Right-click `index.html` in the Explorer panel
2. Select **"Open with Live Server"**
3. Your browser opens at `http://127.0.0.1:5500/index.html`

## 🛠 Extending the Project

| Task | File to Edit |
|------|-------------|
| Add more videos | `data.js` → add to the `videos` array |
| Change colors/theme | `style.css` → edit `:root` CSS variables |
| Add new pages | Create `channel.html`, `search.html` etc. |
| Add real video playback | Replace `.video-placeholder` in `watch.html` with `<video>` tag |
| Add localStorage history | Use `localStorage.setItem()` in `watch.js` |
