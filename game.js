const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const WORLD = {
  width: canvas.width,
  height: canvas.height,
};

const keys = new Set();
let lastTime = 0;
let smokeTimer = 0;
let bobTimer = 0;

const state = {
  scene: "splash",
  score: 0,
  distance: 0,
  gameOver: false,
  win: false,
  transition: 0,
  safeLaneY: WORLD.height / 2,
  safeLaneTarget: WORLD.height / 2,
};

const boat = {
  x: WORLD.width / 2,
  y: WORLD.height - 90,
  width: 90,
  height: 90,
  speed: 320,
};

const explorer = {
  x: WORLD.width / 2,
  y: WORLD.height - 70,
  width: 28,
  height: 36,
  speed: 230,
};

const explorers = [
  { name: "Johan", color: "#ffb703" },
  { name: "Hans", color: "#4cc9f0" },
];

const castle = {
  x: WORLD.width / 2 - 80,
  y: 40,
  width: 160,
  height: 90,
};

const icebergs = [];
const floes = [];

function resetGame() {
  state.scene = "ocean";
  state.score = 0;
  state.distance = 0;
  state.gameOver = false;
  state.win = false;
  state.transition = 0;
  state.safeLaneY = WORLD.height / 2;
  state.safeLaneTarget = WORLD.height / 2;
  boat.x = WORLD.width / 2;
  boat.y = WORLD.height - 90;
  explorer.x = WORLD.width / 2;
  explorer.y = WORLD.height - 70;
  icebergs.length = 0;
  floes.length = 0;
  spawnInitialFloes();
}

function startVoyage() {
  if (state.scene === "splash") {
    state.scene = "ocean";
    startButton.classList.add("hidden");
  }
}

function spawnInitialFloes() {
  for (let i = 0; i < 8; i += 1) {
    floes.push({
      x: 40 + Math.random() * (WORLD.width - 80),
      y: 120 + i * 45,
      radius: 25 + Math.random() * 22,
      drift: 10 + Math.random() * 20,
    });
  }
}

function spawnIceberg() {
  const size = (30 + Math.random() * 40) * 3;
  const gap = size * 0.7 + 70;
  let y = 160 + Math.random() * (WORLD.height - 220);
  if (Math.abs(y - state.safeLaneY) < gap) {
    const direction = y < state.safeLaneY ? -1 : 1;
    y = state.safeLaneY + direction * gap;
    y = Math.max(80, Math.min(WORLD.height - 80, y));
  }
  icebergs.push({
    x: WORLD.width + 80,
    y,
    width: size,
    height: size * 1.2,
    speed: (60 + Math.random() * 40) * 0.25,
    wobble: Math.random() * Math.PI * 2,
  });
}

function handleInput(entity, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    entity.x += (dx / length) * entity.speed * dt;
    entity.y += (dy / length) * entity.speed * dt;
  }

  entity.x = Math.max(20, Math.min(WORLD.width - 20, entity.x));
  entity.y = Math.max(20, Math.min(WORLD.height - 20, entity.y));
}

function handleVerticalInput(entity, dt) {
  let dy = 0;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (dy !== 0) {
    entity.y += dy * entity.speed * dt;
  }

  entity.y = Math.max(40, Math.min(WORLD.height - 40, entity.y));
}

function handleBoatInput(entity, dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    entity.x += (dx / length) * entity.speed * dt;
    entity.y += (dy / length) * entity.speed * dt;
  }

  entity.x = Math.max(120, Math.min(380, entity.x));
  entity.y = Math.max(160, Math.min(WORLD.height - 60, entity.y));
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateOcean(dt) {
  if (state.gameOver) return;

  if (icebergs.length < 4 && Math.random() < 0.0015) spawnIceberg();

  if (Math.random() < 0.01) {
    state.safeLaneTarget = 90 + Math.random() * (WORLD.height - 180);
  }
  state.safeLaneY += (state.safeLaneTarget - state.safeLaneY) * dt * 0.6;

  icebergs.forEach((iceberg) => {
    iceberg.x -= iceberg.speed * dt;
    iceberg.y += Math.sin(iceberg.wobble + iceberg.x * 0.01) * 10 * dt;
  });

  for (let i = icebergs.length - 1; i >= 0; i -= 1) {
    if (icebergs[i].x < -120) {
      icebergs.splice(i, 1);
      state.score += 10;
    }
  }

  handleBoatInput(boat, dt);

  const boatRect = {
    x: boat.x - boat.width / 2,
    y: boat.y - boat.height / 2,
    width: boat.width,
    height: boat.height,
  };

  for (const iceberg of icebergs) {
    const icebergRect = {
      x: iceberg.x - iceberg.width / 2,
      y: iceberg.y - iceberg.height / 2,
      width: iceberg.width,
      height: iceberg.height,
    };

    if (rectsOverlap(boatRect, icebergRect)) {
      state.gameOver = true;
    }
  }

  // 60 seconds to reach the ice (100 units over 60s)
  state.distance += dt * (100 / 60);
  if (state.distance >= 100) {
    state.scene = "transition";
    state.transition = 0;
  }
}

function updateTransition(dt) {
  if (state.gameOver || state.win) return;
  state.transition += dt;
  if (state.transition >= 3.5) {
    state.scene = "ice";
  }
}

function updateIce(dt) {
  if (state.gameOver || state.win) return;

  handleInput(explorer, dt);

  floes.forEach((floe) => {
    floe.x += Math.sin(Date.now() * 0.0005 + floe.y) * (floe.drift * dt);
  });

  const explorerRect = {
    x: explorer.x - explorer.width / 2,
    y: explorer.y - explorer.height / 2,
    width: explorer.width,
    height: explorer.height,
  };

  const castleRect = {
    x: castle.x,
    y: castle.y,
    width: castle.width,
    height: castle.height,
  };

  if (rectsOverlap(explorerRect, castleRect)) {
    state.win = true;
  }
}

function update(dt) {
  if (state.scene === "ocean") {
    updateOcean(dt);
  } else if (state.scene === "transition") {
    updateTransition(dt);
  } else if (state.scene === "ice") {
    updateIce(dt);
  }
}

function drawWaterBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#6ec5ff");
  gradient.addColorStop(0.35, "#2f8bbf");
  gradient.addColorStop(0.55, "#08334d");
  gradient.addColorStop(1, "#031724");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // Sun and sky glow
  ctx.fillStyle = "rgba(255, 225, 150, 0.9)";
  ctx.beginPath();
  ctx.arc(WORLD.width - 140, 50, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 220, 140, 0.25)";
  ctx.beginPath();
  ctx.arc(WORLD.width - 140, 50, 70, 0, Math.PI * 2);
  ctx.fill();

  // Distant ice shelf on the horizon
  ctx.fillStyle = "rgba(210, 235, 245, 0.85)";
  ctx.beginPath();
  ctx.moveTo(0, 110);
  ctx.lineTo(120, 100);
  ctx.lineTo(260, 112);
  ctx.lineTo(420, 96);
  ctx.lineTo(620, 110);
  ctx.lineTo(820, 98);
  ctx.lineTo(WORLD.width, 112);
  ctx.lineTo(WORLD.width, 140);
  ctx.lineTo(0, 140);
  ctx.closePath();
  ctx.fill();

  // Ice shelf shadow
  ctx.fillStyle = "rgba(160, 200, 220, 0.35)";
  ctx.fillRect(0, 135, WORLD.width, 12);

  // Horizon line
  ctx.strokeStyle = "rgba(170, 220, 240, 0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 140);
  ctx.lineTo(WORLD.width, 140);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let i = 0; i < 16; i += 1) {
    ctx.beginPath();
    ctx.ellipse(60 + i * 70, 70 + (i % 4) * 40, 70, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(140, 200, 230, 0.18)";
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.ellipse(110 + i * 90, 160 + (i % 3) * 50, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating ice chunks
  ctx.fillStyle = "rgba(235, 248, 255, 0.8)";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(140 + i * 140, 210 + (i % 2) * 40, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBoatWake() {
  const bob = Math.sin(bobTimer * 2) * 4;
  const baseX = boat.x - 26;
  const baseY = boat.y + 34 + bob;

  ctx.save();
  ctx.fillStyle = "rgba(140, 200, 230, 0.35)";
  ctx.beginPath();
  ctx.ellipse(baseX, baseY, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(110, 180, 210, 0.25)";
  ctx.beginPath();
  ctx.ellipse(baseX - 24, baseY + 2, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(160, 220, 240, 0.2)";
  ctx.beginPath();
  ctx.ellipse(baseX - 52, baseY + 4, 38, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHarborBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#0f3a52");
  gradient.addColorStop(1, "#051722");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  // Moon glow
  ctx.fillStyle = "rgba(255, 244, 214, 0.12)";
  ctx.beginPath();
  ctx.ellipse(740, 90, 80, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  // Harbor skyline
  ctx.fillStyle = "#0a1a24";
  ctx.fillRect(0, 240, WORLD.width, 120);
  ctx.fillStyle = "#122635";
  for (let i = 0; i < 10; i += 1) {
    const x = 40 + i * 90;
    const w = 50 + (i % 3) * 10;
    const h = 30 + (i % 4) * 12;
    ctx.fillRect(x, 240 - h, w, h);
  }

  // Dock lights
  ctx.fillStyle = "#ffcf6f";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(60 + i * 110, 250, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Water shimmer
  ctx.fillStyle = "rgba(255, 205, 110, 0.08)";
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.ellipse(90 + i * 120, 320 + (i % 2) * 16, 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFogLayer() {
  ctx.save();
  ctx.fillStyle = "rgba(200, 220, 230, 0.18)";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.ellipse(80 + i * 160, 120 + (i % 3) * 50, 140, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoat() {
  ctx.save();
  const bob = Math.sin(bobTimer * 2) * 4;
  ctx.translate(boat.x, boat.y + bob);

  // Hull
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath();
  ctx.moveTo(-84, 30);
  ctx.lineTo(84, 30);
  ctx.lineTo(60, 54);
  ctx.lineTo(-60, 54);
  ctx.closePath();
  ctx.fill();

  // Red waterline stripe
  ctx.fillStyle = "#8b2f28";
  ctx.fillRect(-78, 26, 156, 6);

  // Hull portholes
  ctx.fillStyle = "rgba(255, 214, 102, 0.9)";
  for (let i = -66; i <= 54; i += 12) {
    ctx.beginPath();
    ctx.arc(i, 38, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Titanic label
  ctx.fillStyle = "#e6d9c6";
  ctx.font = "11px 'Trebuchet MS'";
  ctx.fillText("TITANIC", -22, 50);

  // Upper decks
  ctx.fillStyle = "#f2e9e4";
  ctx.fillRect(-62, -15, 124, 34);
  ctx.fillStyle = "#e2d4c7";
  ctx.fillRect(-44, -38, 88, 22);

  // Bridge
  ctx.fillStyle = "#d6c3b4";
  ctx.fillRect(-18, -50, 36, 14);

  // Deck lines
  ctx.strokeStyle = "rgba(140, 120, 110, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-28, -2);
  ctx.lineTo(28, -2);
  ctx.moveTo(-26, -20);
  ctx.lineTo(26, -20);
  ctx.stroke();

  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-38, -15);
  ctx.lineTo(-62, -42);
  ctx.stroke();

  // Smokestacks
  ctx.fillStyle = "#f0a500";
  ctx.fillRect(-48, -42, 12, 18);
  ctx.fillRect(-10, -46, 12, 20);
  ctx.fillRect(28, -42, 12, 18);
  ctx.fillStyle = "#333";
  ctx.fillRect(-48, -46, 12, 6);
  ctx.fillRect(-10, -50, 12, 6);
  ctx.fillRect(28, -46, 12, 6);

  ctx.restore();
}

function drawSmokeStackSmoke() {
  const stacks = [
    { x: -32, y: -50 },
    { x: 0, y: -54 },
    { x: 32, y: -50 },
  ];

  stacks.forEach((stack, index) => {
    for (let i = 0; i < 3; i += 1) {
      const drift = smokeTimer * 40 + i * 18 + index * 12;
      const bob = Math.sin(bobTimer * 2) * 4;
      const puffX = boat.x + stack.x - drift * 0.15;
      const puffY = boat.y + stack.y + bob - drift * 0.9;
      const radius = 8 + i * 4;
      ctx.fillStyle = "rgba(200, 200, 200, 0.45)";
      ctx.beginPath();
      ctx.ellipse(puffX, puffY, radius, radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawIceberg(iceberg) {
  ctx.save();
  const bob = Math.sin(bobTimer * 0.7 + iceberg.wobble) * 6;
  const clampedY = Math.max(160, iceberg.y + bob);
  ctx.translate(iceberg.x, clampedY);
  ctx.fillStyle = "#f3fbff";
  ctx.beginPath();
  ctx.moveTo(0, -iceberg.height / 2);
  ctx.lineTo(iceberg.width / 2, iceberg.height / 2);
  ctx.lineTo(-iceberg.width / 2, iceberg.height / 2);
  ctx.closePath();
  ctx.fill();

  // Submerged base
  ctx.fillStyle = "rgba(110, 180, 210, 0.45)";
  ctx.beginPath();
  ctx.ellipse(0, iceberg.height / 2 - 4, iceberg.width * 0.6, iceberg.height * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#bfe6f7";
  ctx.beginPath();
  ctx.moveTo(0, -iceberg.height / 2 + 10);
  ctx.lineTo(iceberg.width / 4, iceberg.height / 2);
  ctx.lineTo(-iceberg.width / 4, iceberg.height / 2);
  ctx.closePath();
  ctx.fill();

  // Faceted highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.moveTo(-iceberg.width * 0.18, -iceberg.height * 0.1);
  ctx.lineTo(0, -iceberg.height * 0.38);
  ctx.lineTo(iceberg.width * 0.12, -iceberg.height * 0.05);
  ctx.closePath();
  ctx.fill();

  // Waterline glow
  ctx.strokeStyle = "rgba(120, 200, 230, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-iceberg.width / 2 + 4, iceberg.height / 2 - 6);
  ctx.lineTo(iceberg.width / 2 - 4, iceberg.height / 2 - 6);
  ctx.stroke();
  ctx.restore();
}

function drawIceScene() {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, "#f5fdff");
  gradient.addColorStop(1, "#b7d9ea");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  floes.forEach((floe) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.ellipse(floe.x, floe.y, floe.radius, floe.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#9ac7da";
  ctx.fillRect(castle.x - 10, castle.y + castle.height - 10, castle.width + 20, 18);

  ctx.fillStyle = "#dde9f2";
  ctx.fillRect(castle.x, castle.y, castle.width, castle.height);
  ctx.fillStyle = "#c0d6e4";
  ctx.fillRect(castle.x + 20, castle.y + 20, castle.width - 40, castle.height - 40);

  ctx.fillStyle = "#7b8ea3";
  ctx.fillRect(castle.x + 60, castle.y + 25, 40, 30);
}

function drawExplorer() {
  ctx.save();
  ctx.translate(explorer.x, explorer.y);

  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(-12, -18, 24, 36);
  ctx.fillStyle = "#ffb703";
  ctx.fillRect(-10, -26, 20, 10);
  ctx.fillStyle = "#f4d35e";
  ctx.beginPath();
  ctx.arc(0, -8, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawDisembarkExplorers() {
  const t = Math.min(state.transition / 3.5, 1);
  const bob = Math.sin(bobTimer * 2) * 4;
  const startX = boat.x;
  const startY = boat.y - 10 + bob;
  const targetX = WORLD.width / 2 - 70;
  const targetY = WORLD.height - 120;

  explorers.forEach((exp, index) => {
    const offset = index * 30;
    const x = startX - 20 + offset + (targetX - startX) * t;
    const y = startY - 10 + (targetY - startY) * t;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#2d2d2d";
    ctx.fillRect(-10, -16, 20, 32);
    ctx.fillStyle = exp.color;
    ctx.fillRect(-9, -23, 18, 8);
    ctx.fillStyle = "#f4d35e";
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawHud() {
  ctx.fillStyle = "rgba(3, 12, 18, 0.6)";
  ctx.fillRect(20, 20, 210, 72);

  ctx.fillStyle = "#e9f6ff";
  ctx.font = "16px 'Trebuchet MS'";
  ctx.fillText(`Scene: ${state.scene === "ocean" ? "Ocean" : "Ice Field"}`, 34, 45);
  ctx.fillText(`Score: ${state.score}`, 34, 66);
  if (state.scene === "ocean") {
    ctx.fillText(`Distance: ${state.distance.toFixed(0)} / 100`, 34, 86);
  }
}

function drawTitleLogo() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(6, 20, 30, 0.7)";
  ctx.fillRect(0, 90, WORLD.width, 110);

  ctx.fillStyle = "#f9f1d6";
  ctx.font = "44px 'Trebuchet MS'";
  ctx.fillText("JOHAN'S ARCTIC ADVENTURE", WORLD.width / 2, 140);
  ctx.font = "16px 'Trebuchet MS'";
  ctx.fillStyle = "#ffd166";
  ctx.fillText("Voyage to the Frozen Castle", WORLD.width / 2, 170);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawMessage(text, subtext) {
  ctx.fillStyle = "rgba(6, 20, 30, 0.75)";
  ctx.fillRect(0, WORLD.height / 2 - 60, WORLD.width, 120);

  ctx.fillStyle = "#fdf6e3";
  ctx.font = "28px 'Trebuchet MS'";
  ctx.textAlign = "center";
  ctx.fillText(text, WORLD.width / 2, WORLD.height / 2 - 6);
  ctx.font = "16px 'Trebuchet MS'";
  ctx.fillText(subtext, WORLD.width / 2, WORLD.height / 2 + 24);
  ctx.textAlign = "left";
}

function draw() {
  if (state.scene === "splash") {
    drawHarborBackground();
    drawTitleLogo();
    drawBoatWake();
    drawBoat();
    drawSmokeStackSmoke();
    drawFogLayer();
  } else if (state.scene === "ocean") {
    drawWaterBackground();
    icebergs.forEach(drawIceberg);
    drawBoatWake();
    drawSmokeStackSmoke();
    drawBoat();
    drawFogLayer();
  } else if (state.scene === "transition") {
    drawWaterBackground();
    drawBoatWake();
    drawSmokeStackSmoke();
    drawBoat();
    drawFogLayer();
    drawDisembarkExplorers();

    const fade = Math.min(state.transition / 3.5, 1);
    ctx.save();
    ctx.globalAlpha = fade;
    drawIceScene();
    ctx.restore();
  } else {
    drawIceScene();
    drawExplorer();
  }

  drawHud();

  if (state.scene === "splash") {
    drawMessage("Johan's Arctic Adventure", "Press SPACE to begin the voyage");
    startButton.classList.remove("hidden");
  } else {
    startButton.classList.add("hidden");
  }

  if (state.gameOver) {
    drawMessage("The Titanic hit an iceberg!", "Press R to try again");
  }

  if (state.win) {
    drawMessage("You reached the castle!", "Press R to play again");
  }
}

function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000 || 0);
  lastTime = timestamp;
  smokeTimer += dt;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.add(key);
  if (key === "r") resetGame();
  if (key === " " && state.scene === "splash") {
    startVoyage();
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

startButton.addEventListener("click", startVoyage);

resetGame();
requestAnimationFrame(loop);
