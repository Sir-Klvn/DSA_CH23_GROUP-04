# ViewTube Full YouTube Clone - TODO

## New Expanded Scope (User Request: All Features)

### 1. 🔄 Replace with Real YouTube Videos
- Use YouTube iframe API for real embeds
- Match videos to desc/channels (popular tech/gaming/etc)
- Lazy load, responsive player

### 2. 👤 User Authentication
- Login/Register forms (email/password)
- Backend JWT/localStorage
- Profile avatar change on login

### 3. ⚙️ Functional Sidebar/Navigation
- Settings page (account, privacy)
- Library (saved videos)
- History (localStorage watch history)
- Subscriptions (follow channels)
- Explore/Search results page
- Subscriptions tab with channel videos

### 4. 🎮 Full Button Functionality
- Upload (modal/new page)
- Notifications bell (mock data)
- All sidebar links → new pages
- Watch later/save (localStorage list page)
- Like/dislike/subscribe persist

### 5. 📱 Additional Pages
- `settings.html` + js
- `library.html` + js
- `history.html` + js
- `subscriptions.html` + js
- `search.html` + js
- `channel.html?id=...` + js

### 6. 🔗 Backend Integration
- Auth endpoints
- User data, history, subscriptions
- Real search/recommendations

**Status:** ✅ Sidebar functional (Library/History/Settings/Watch Later pages created, nav links updated)
**Next:** User auth (login/register) + more YT video IDs
