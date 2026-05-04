# 🌿 WasteO – Smart Campus Waste Management System

> Transforming waste into opportunity, cleanliness into habit, and health into priority.

---

## ✨ Vision

**WasteO is not just a project — it's a real platform for cleaner campus operations.**

We aim to create a world where:
- Waste is managed intelligently  
- Communities stay clean and healthy  
- Technology drives sustainable living  

---

## 🚀 What is WasteO?

**WasteO** is a browser-based waste management platform that integrates:

- ♻️ Waste Management  
- 🏥 Healthcare Awareness  
- 🌿 Environmental Cleanliness  

It empowers individuals, campuses, and organizations to **track, improve, and sustain better living conditions** using data and intelligent insights.

---

## 🔥 Why WasteO Matters

Today’s world faces:

- ❌ Poor waste segregation  
- ❌ Lack of hygiene monitoring  
- ❌ Minimal environmental awareness  
- ❌ No real-time tracking systems  

👉 **WasteO solves these problems by combining technology with sustainability.**

---

## 💡 Core Features

### ♻️ Smart Waste Management
- Intelligent waste tracking  
- Segregation guidance (wet/dry waste)  
- Recycling insights  

### 🏥 Health & Hygiene System
- Cleanliness scoring  
- Health awareness tips  
- Sanitation tracking  

### 🌿 Environmental Monitoring
- Air quality insights  
- Sustainability metrics  
- Eco-impact tracking  

### 📊 Interactive Dashboard
- Real-time analytics  
- Visual insights  
- User activity tracking  

### 🤖 AI-Powered Intelligence
- Smart recommendations  
- Predictive analysis  
- Automated sustainability insights  

---

## 🛠️ Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend    | React.js (Vite), Context API |
| Backend     | Node.js, Express.js |
| Database    | MongoDB (Mongoose) |
| Styling     | Modern CSS3 (Variables & Dark Mode) |

---

## 📂 Project Structure

```bash
WasteO/
│── client/           # React Frontend
│── server/           # Node.js Backend
│── package.json      # Root dependencies (concurrently)
│── .gitignore        # Git exclusion rules
```

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Suvajit-Code/WasteO.git
cd WasteO
```

### 2. Install dependencies
```bash
npm run install-all
```

### 3. Run the project
```bash
npm run dev
```

---

## ✅ Verified Run Guide (Windows, May 2026)

These steps were checked against the current codebase.

### 1. Prerequisites

- Node.js 18+ (Node 22 also works)
- npm 9+

### 2. Install all dependencies (root + server + client)

From the `WasteO` project root:

```bash
npm run install-all
```

### 3. Optional backend database setup (MongoDB)

If you want full backend API + database features, create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/wasteo
JWT_SECRET=replace_with_strong_secret
```

Notes:

- If `MONGO_URI` is not set, backend now starts in degraded mode (no DB connection) instead of crashing.
- Configure `MONGO_URI` in `server/.env` to enable backend database features.

### 4. Start both apps

```bash
npm run dev
```

Expected:

- Frontend: `http://localhost:3001` (or next free port)
- Backend: `http://localhost:5000`

### 5. (Optional) Seed users in MongoDB mode

Run only after `MONGO_URI` is configured:

```bash
npm run seed
```

### 6. Default login

- Admin: `admin@edu.in` / `12345678`
- Student: `student@edu.in` / `12345678`
- Collector: `collector@edu.in` / `12345678`

### Troubleshooting

- Error `Cannot find module server.ts`: fixed by using existing `server.js` in npm scripts.
- If port is busy, Vite auto-selects another port.

---

## 📸 Screenshots

> Add your project screenshots here for better presentation

```bash
/assets/home.png
/assets/dashboard.png
/assets/waste.png
```

---

## 🎯 Target Users

- 🎓 Students & Colleges  
- 🏙️ Smart Cities  
- 🏢 Organizations  
- 🌍 Eco-conscious individuals  

---

## 🌱 Impact

- Promotes sustainable living  
- Improves hygiene awareness  
- Reduces environmental footprint  
- Encourages community participation  

---

## 🔮 Future Enhancements

- AI-based waste classification  
- IoT-enabled smart bins  
- Gamification (rewards & leaderboards)  
- Government & NGO integration  

---

## 🤝 Contributing

Contributions are welcome!

```bash
fork → create branch → commit → push → pull request
```

---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you like this project:

- ⭐ Star the repository  
- 🍴 Fork it  
- 📢 Share it  

---

## 💬 Final Note

> Small actions, when multiplied by millions, can transform the world.

**WasteO is one step toward that transformation.**

Created by Suvajit Ghosh. Copyright reserved.
