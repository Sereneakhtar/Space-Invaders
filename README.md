# Space-Invaders
This is a classic arcade style Space Invaders Game built from scratc. Be able to defend the earth from waves of descending alien invaders, shoot them down, dodge their laser fire, and beat your high score!

# Features
* **Classic Gameplay:** Retro arcade mechanics including player movement, shooting, and destructible alien waves.
* **Dynamic Difficulty:** Aliens speed up or increase in numbers as you progress through waves.
* **Score & Lives System:** Track your current score and manage your remaining lives in real-time.
* **Sound Effects & Music:** Retro audio to enhance the gaming experience (optional/if included).

---

# Tech Stack
* **Frontend:** HTML5, CSS3, Javascript
* **Backend Runtime:** Node.js
* **Server Framework:** Express
* **Package Manager:** pnpm

---

## 📦 Installation & Setup

To run this project locally, make sure you have [Node.js](https://nodejs.org/) installed along with [pnpm](https://pnpm.io/).

1. Clone the repository:
   git clone [https://github.com/Sereneakhtar/Space-Invaders.git](https://github.com/Sereneakhtar/Space-Invaders.git)
2. Navigate to the main directory:
  cd Space-Invaders
3. Install required dependencies:
   pnpm install
4. To start the server:
  pnpm start
5. Open browser and navigate to https://localhost:3000 to start playing

# How to Play
Move left: left arrow key or 'a'
Move right: right arrow key or 'd'
To shoot: 'space bar'

# Objective
Eliminate the grid of alien ships before they advance to the bottom of the screen. Dodge their incoming laser fire to protect your ship and preserve your remaining lives.

# Project Structure
SPACE_INVADERS/
├── space-invaders-server/
│   ├── public/              # Frontend static game files
│   │   ├── audio.js         # Sound effects controller
│   │   ├── game.js          # Main core game loop
│   │   ├── index.html       # Game view layout window
│   │   ├── sprites.js       # Visual graphics and drawing logic
│   │   └── style.css        # Game page styling
│   ├── index.js             # Express application entry server
│   ├── package.json         # Server-specific dependencies
│   └── pnpm-lock.yaml
├── package.json             # Root project configuration
└── pnpm-lock.yaml

