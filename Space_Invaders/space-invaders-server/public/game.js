// ==============================
// Space Invaders — Full Feature game.js
// Replace your current game.js with this file
// ==============================

// Canvas + context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// GAME STATE
let GAME_STATE = "TITLE"; // TITLE, PLAYING, GAME_OVER
let score = 0;
let highScore = parseInt(localStorage.getItem("si_high") || "0");
let level = 1;
let lives = 3;

// Entities
let player = null;
let bullets = [];        // player bullets
let alienBullets = [];   // enemy bullets
let aliens = [];         // alien list
let shields = [];        // shield block list
let particles = [];      // explosion particles
let ufo = null;          // UFO object or null

// Timing & difficulty
let lastShotTime = 0;
let alienMoveTimer = 0;
let alienAnimFrame = 0;
let baseAlienSpeed = 0.5; // base horizontal speed
let alienDirection = 1;   // 1 => right, -1 => left
let lastFrameTime = performance.now();

// helper: safe audio play if you have AudioSys
function playSound(name) {
  try { if (window.AudioSys && typeof window.AudioSys[name] === "function") window.AudioSys[name](); }
  catch(e){ /* ignore if not present */ }
}

// ---------------------------
// Initialization
// ---------------------------
function initGame() {
  score = 0;
  level = 1;
  lives = 3;
  initLevel();
}

function initLevel() {
  bullets = [];
  alienBullets = [];
  aliens = [];
  shields = [];
  particles = [];
  ufo = null;
  alienMoveTimer = 0;
  alienAnimFrame = 0;
  alienDirection = 1;

  createPlayer();
  createInvaders(level);
  createShields();
  // small chance to spawn UFO later
  if (Math.random() < 0.25) scheduleUFO();
  updateHUD();
}

// ---------------------------
// Create player
// ---------------------------
function createPlayer() {
  player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    w: 36,
    h: 18,
    speed: 220, // px per second
    left: false,
    right: false,
    canShoot: true
  };
}

// ---------------------------
// Create alien grid
// ---------------------------
function createInvaders(levelNum) {
  aliens = [];
  const rows = 5;               // can change by level if desired
  const cols = 11;
  const startX = 40;
  const startY = 60;
  const stepX = 44;
  const stepY = 36;

  // speed scales with level
  const speed = baseAlienSpeed + (levelNum - 1) * 0.08;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      aliens.push({
        x: startX + c * stepX,
        y: startY + r * stepY,
        w: 32,
        h: 24,
        row: r,
        col: c,
        alive: true,
        baseSpeed: speed,
        speedX: speed
      });
    }
  }
}

// ---------------------------
// Create shields as many small blocks (for erosion)
// ---------------------------
function createShields() {
  shields = [];
  const baseY = canvas.height - 140;
  const centers = [120, 320, 520]; // center x positions

  // shield block layout (3 rows x 8 columns block) — you can tweak
  const layout = [
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1]
  ];
  const blockW = 12, blockH = 10;

  centers.forEach((cx) => {
    for (let r=0; r<layout.length; r++) {
      for (let c=0; c<layout[r].length; c++) {
        if (layout[r][c]) {
          shields.push({
            x: cx + (c - Math.floor(layout[r].length/2)) * blockW,
            y: baseY + r * blockH,
            w: blockW - 2,
            h: blockH - 2,
            hp: 3
          });
        }
      }
    }
  });
}

// ---------------------------
// UFO scheduling & update
// ---------------------------
function scheduleUFO() {
  // spawn UFO after a delay between 8-18s
  const delay = 8000 + Math.random() * 10000;
  setTimeout(() => {
    if (!ufo && GAME_STATE === "PLAYING") spawnUFO();
  }, delay);
}

function spawnUFO() {
  ufo = {
    x: -80,
    y: 40 + Math.random()*40,
    w: 60,
    h: 22,
    speed: 2 + Math.random()*1.5,
    direction: 1
  };
}

// ---------------------------
// Input handling
// ---------------------------
window.addEventListener("keydown", (e) => {
  const key = e.code || e.key;
  // start/restart
  if (GAME_STATE === "TITLE" && (key === "Space" || key === " " || key === "Enter")) {
    GAME_STATE = "PLAYING";
    initGame();
    return;
  }

  if (GAME_STATE === "GAME_OVER" && (key === "Space" || key === "Enter")) {
    GAME_STATE = "TITLE";
    return;
  }

  if (GAME_STATE !== "PLAYING") return;

  if (key === "ArrowLeft" || key === "a") player.left = true;
  if (key === "ArrowRight" || key === "d") player.right = true;
  if (key === "Space" || key === " ") shootBullet();
});

window.addEventListener("keyup", (e) => {
  const key = e.code || e.key;
  if (!player) return;
  if (key === "ArrowLeft" || key === "a") player.left = false;
  if (key === "ArrowRight" || key === "d") player.right = false;
});

// ---------------------------
// Shooting (player)
// ---------------------------
function shootBullet() {
  if (!player || !player.canShoot) return;
  const now = performance.now();
  // rate limit
  if (now - lastShotTime < 220) return;
  lastShotTime = now;

  bullets.push({ x: player.x + player.w/2 - 2, y: player.y - 8, w: 4, h: 10, vy: -10 });
  playSound("shot");
}

// ---------------------------
// Aliens shooting (random)
// ---------------------------
function alienTryShoot() {
  if (aliens.length === 0) return;
  // pick a random alive alien from bottom-most of a column
  const columns = {};
  aliens.forEach(a => {
    if (!a.alive) return;
    const key = a.col;
    if (!columns[key] || columns[key].row < a.row) columns[key] = a;
  });
  const shooters = Object.values(columns);
  if (shooters.length === 0) return;
  // probability increases with level
  const prob = 0.01 + Math.min(0.06, level * 0.0025);
  if (Math.random() < prob) {
    const s = shooters[Math.floor(Math.random() * shooters.length)];
    alienBullets.push({ x: s.x + s.w/2 - 2, y: s.y + s.h + 4, w: 4, h: 10, vy: 4 + level*0.2 });
    playSound("enemyShoot");
  }
}

// ---------------------------
// Particles (explosion)
// ---------------------------
function spawnExplosion(x,y,color) {
  for (let i=0;i<18;i++){
    particles.push({
      x, y,
      dx: (Math.random()-0.5)*4,
      dy: (Math.random()-0.5)*4,
      life: 40 + Math.random()*20,
      col: color || "#fff"
    });
  }
  playSound("explosion");
}

function updateParticles(dt) {
  for (let i = particles.length-1; i>=0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.08; // gravity
    p.life--;
    if (p.life <= 0) particles.splice(i,1);
  }
}

function drawParticle(ctx, p) {
  ctx.fillStyle = p.col;
  ctx.fillRect(p.x, p.y, 2, 2);
}

// ---------------------------
// Update functions
// ---------------------------
function updatePlayer(dt) {
  if (!player) return;
  const speed = player.speed * (dt/1000);
  if (player.left) player.x -= speed;
  if (player.right) player.x += speed;
  // clamp
  player.x = Math.max(6, Math.min(canvas.width - player.w - 6, player.x));
}

function updateBullets(dt) {
  for (let i=bullets.length-1;i>=0;i--) {
    bullets[i].y += bullets[i].vy;
    if (bullets[i].y < -20) bullets.splice(i,1);
  }
}

function updateAlienBullets(dt) {
  for (let i=alienBullets.length-1;i>=0;i--) {
    alienBullets[i].y += alienBullets[i].vy;
    if (alienBullets[i].y > canvas.height + 20) alienBullets.splice(i,1);
  }
}

function updateUFO(dt) {
  if (!ufo) return;
  ufo.x += ufo.speed;
  if (ufo.x > canvas.width + 80) {
    ufo = null;
    // schedule next UFO
    scheduleUFO();
  }
}

// aliens horizontal movement + edge detection + speed-up
function updateInvaders(dt) {
  if (aliens.length === 0) return;

  // compute leftmost and rightmost
  let left = Infinity, right = -Infinity;
  aliens.forEach(a => {
    if (!a.alive) return;
    left = Math.min(left, a.x);
    right = Math.max(right, a.x + a.w);
  });

  // if only 1 left -> turbo
  if (aliens.filter(a=>a.alive).length === 1) {
    aliens.forEach(a => { if (a.alive) a.x += (6 + level*0.5) * (dt/16); });
    return;
  }

  // basic move: step every tick depending on speed
  const speedFactor = 0.8 + level*0.05;
  const dx = alienDirection * speedFactor * (dt/16) * (baseAlienSpeed + (level-1)*0.08) * 8;

  // check if edge would be crossed
  const wouldCrossLeft = left + dx < 8;
  const wouldCrossRight = right + dx > canvas.width - 8;

  if (wouldCrossLeft || wouldCrossRight) {
    // move down and reverse
    aliens.forEach(a => { if (a.alive) a.y += 18; });
    alienDirection *= -1;
    // slightly increase speed
    aliens.forEach(a => { if (a.alive) a.baseSpeed *= 1.02; });
  } else {
    aliens.forEach(a => { if (a.alive) a.x += dx; });
  }

  // trigger occasional alien shoot
  alienTryShoot();
}

// ---------------------------
// Collisions
// ---------------------------
function rectsOverlap(a,b) {
  return a.x < b.x + b.w && a.x + (a.w||4) > b.x && a.y < b.y + b.h && a.y + (a.h||4) > b.y;
}

function handleCollisions() {
  // player bullets vs aliens
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hit = false;
    for (let j = aliens.length - 1; j >= 0; j--) {
      const a = aliens[j];
      if (!a.alive) continue;
      if (rectsOverlap(b,a)) {
        // hit
        a.alive = false;
        bullets.splice(i,1);
        score += 50;
        spawnExplosion(a.x + a.w/2, a.y + a.h/2, a.color || "#8f8");
        playSound("enemyHit");
        hit = true;
        break;
      }
    }
    if (hit) continue;
    // bullets vs UFO
    if (ufo && rectsOverlap(b,ufo)) {
      // score variable amount
      const ufoScore = 50 + Math.floor(Math.random()*250);
      score += ufoScore;
      bullets.splice(i,1);
      spawnExplosion(ufo.x + ufo.w/2, ufo.y + ufo.h/2, "#ff6");
      ufo = null;
      playSound("enemyHit");
    }
    // bullets vs shields
    for (let sIdx = shields.length - 1; sIdx >= 0; sIdx--) {
      const s = shields[sIdx];
      if (rectsOverlap(b,s)) {
        b.y = -999;
        s.hp--;
        spawnExplosion(s.x + s.w/2, s.y + s.h/2, "#4df");
        if (s.hp <= 0) shields.splice(sIdx,1);
      }
    }
  }

  // alien bullets vs player / shields
  for (let i = alienBullets.length - 1; i >= 0; i--) {
    const b = alienBullets[i];
    // shields
    let blocked = false;
    for (let sIdx = shields.length -1; sIdx >= 0; sIdx--) {
      const s = shields[sIdx];
      if (rectsOverlap(b,s)) {
        alienBullets.splice(i,1);
        s.hp--;
        if (s.hp <= 0) shields.splice(sIdx,1);
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    // player
    if (player && rectsOverlap(b, player)) {
      // hit
      alienBullets.splice(i,1);
      spawnExplosion(player.x + player.w/2, player.y + player.h/2, "#fff");
      lives--;
      playSound("playerHit");
      updateHUD();
      if (lives <= 0) {
        GAME_STATE = "GAME_OVER";
        // save high score
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("si_high", highScore);
        }
      }
    }
  }

  // remove dead aliens physically from array (optional)
  // keep them but filter when drawing/processing
}

// ---------------------------
// HUD update
// ---------------------------
function updateHUD() {
  // if you have DOM HUD elements, update them; otherwise game draws HUD on canvas
  const domScore = document.getElementById("score");
  const domLives = document.getElementById("lives");
  const domLevel = document.getElementById("level");
  const domHigh = document.getElementById("high");
  if (domScore) domScore.textContent = `Score: ${score}`;
  if (domLives) domLives.textContent = `Lives: ${lives}`;
  if (domLevel) domLevel.textContent = `Level: ${level}`;
  if (domHigh) domHigh.textContent = `High: ${highScore}`;
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";

    ctx.fillText(`Score: ${score}`, 10, 24);
    ctx.fillText(`Lives: ${lives}`, 10, 48);
    ctx.fillText(`Level: ${level}`, 10, 72);

    ctx.textAlign = "right";
    ctx.fillText(`High: ${highScore}`, canvas.width - 10, 24);
}

function drawTitleScreen() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SPACE INVADERS", canvas.width/2, canvas.height/2 - 40);

    ctx.font = "22px Arial";
    ctx.fillText("Press SPACE to Start", canvas.width/2, canvas.height/2 + 10);
}

function drawGameOverScreen() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 40);

    ctx.font = "22px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 10);
    ctx.fillText("Press SPACE to Restart", canvas.width/2, canvas.height/2 + 40);
}

// ---------------------------
// Drawing helpers use your draw functions
// ---------------------------
// PLAYER
function drawPlayer(ctx, p) {
  ctx.fillStyle = "#0f0";
  ctx.fillRect(p.x, p.y, p.w, p.h);
}

// ALIEN
function drawAlien(ctx, a) {
  ctx.fillStyle = "#0ff";
  ctx.fillRect(a.x, a.y, a.w, a.h);
}

// BULLET (player)
function drawBullet(ctx, b) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(b.x, b.y, b.w, b.h);
}

// ALIEN BULLET
function drawAlienBullet(ctx, b) {
  ctx.fillStyle = "#f33";
  ctx.fillRect(b.x, b.y, b.w, b.h);
}

// SHIELD BLOCK
function drawShield(ctx, s) {
  if (s.hp === 3) ctx.fillStyle = "#4df";
  else if (s.hp === 2) ctx.fillStyle = "#2ac";
  else ctx.fillStyle = "#188";

  ctx.fillRect(s.x, s.y, s.w, s.h);
}

// UFO
function drawUFO(ctx, u) {
  ctx.fillStyle = "#f0f";
  ctx.fillRect(u.x, u.y, u.w, u.h);
}

// PARTICLE
function drawParticle(ctx, p) {
  ctx.fillStyle = p.col || "#fff";
  ctx.fillRect(p.x, p.y, 2, 2);
}

function drawAll() {
    if (GAME_STATE === "TITLE") {
        drawTitleScreen();
        return;
    }

    if (GAME_STATE === "GAME_OVER") {
        drawGameOverScreen();
        return;
    }

    // ---- GAMEPLAY ----
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width, canvas.height);

    shields.forEach(s => drawShield(ctx, s));
    aliens.forEach(a => { if (a.alive) drawAlien(ctx, a); });
    bullets.forEach(b => drawBullet(ctx,b));
    alienBullets.forEach(b => drawAlienBullet(ctx,b));

    if (player) drawPlayer(ctx, player);
    particles.forEach(p => drawParticle(ctx, p));
    if (ufo) drawUFO(ctx, ufo);

    drawHUD();
}

// ---------------------------
// Level up check & next level
// ---------------------------
function checkLevelComplete() {
  if (aliens.filter(a=>a.alive).length === 0) {
    // next level
    level++;
    if (level > 15) level = 1;
    // slightly increase base speed
    baseAlienSpeed += 0.05;
    initLevel();
    playSound("levelUp");
  }
}

// ---------------------------
// Main update & loop
// ---------------------------
let lastTime = performance.now();
function mainUpdate(now) {
  const dt = now - lastTime;
  lastTime = now;

  if (GAME_STATE === "PLAYING") {
    updatePlayer(dt);
    updateBullets(dt);
    updateInvaders(dt);
    updateAlienBullets(dt);
    updateParticles(dt);
    updateUFO(dt);
    handleCollisions();
    checkLevelComplete();
    updateHUD();
  }

  // draw
  drawAll();

  requestAnimationFrame(mainUpdate);
}

// start loop
requestAnimationFrame(mainUpdate);

// ---------------------------
// utility: handleCollisions wrapper to avoid name difference
// ---------------------------
// function handleCollisions() { handleCollisions; } // placeholder to keep older calls safe
// But we actually use handleCollisions() defined above (collision logic)

// ---------------------------
// Minimal safety exports for compatibility
// ---------------------------
// If other code expects updatePlayer/updateInvaders etc names globally, map to existing functions:
window.createInvaders = createInvaders;
window.createShields = createShields;
window.updatePlayer = (dt)=> updatePlayer(dt);
window.updateBullets = (dt)=> updateBullets(dt);
window.updateInvaders = (dt)=> updateInvaders(dt);
window.updateAlienBullets = (dt)=> updateAlienBullets(dt);
window.updateParticles = (dt)=> updateParticles(dt);
window.updateUFO = (dt)=> updateUFO(dt);
window.shootBullet = shootBullet;

// End of file
