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
  sinking: false,
  sinkingTimer: 0,
  firstIcebergSpawned: false,
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
const horizonFeatures = [];
const clouds = Array.from({ length: 7 }, (_, index) => ({
  x: 60 + index * 140 + Math.random() * 60,
  y: 26 + (index % 3) * 18,
  size: 50 + Math.random() * 40,
  speed: 6 + Math.random() * 6,
  opacity: 0.25 + Math.random() * 0.2,
}));
const foamParticles = [];
const snowParticles = Array.from({ length: 70 }, () => ({
  x: Math.random() * WORLD.width,
  y: Math.random() * WORLD.height,
  speed: 12 + Math.random() * 24,
  drift: 0.3 + Math.random() * 0.6,
  size: 1 + Math.random() * 1.6,
}));
const sprayParticles = [];
const birds = Array.from({ length: 6 }, (_, index) => ({
  x: 120 + index * 150 + Math.random() * 80,
  y: 30 + (index % 3) * 18,
  scale: 0.8 + Math.random() * 0.6,
  speed: 16 + Math.random() * 10,
}));

function resetGame() {
  state.scene = "splash";
  state.score = 0;
  state.distance = 0;
  state.gameOver = false;
  state.win = false;
  state.transition = 0;
  state.safeLaneY = WORLD.height / 2;
  state.safeLaneTarget = WORLD.height / 2;
  state.sinking = false;
  state.sinkingTimer = 0;
  state.firstIcebergSpawned = false;
  boat.x = WORLD.width / 2;
  boat.y = WORLD.height - 90;
  explorer.x = WORLD.width / 2;
  explorer.y = WORLD.height - 70;
  icebergs.length = 0;
  floes.length = 0;
  horizonFeatures.length = 0;
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

function spawnHorizonFeature() {
  const types = ["bear", "penguin", "ice_spire"];
  const type = types[Math.floor(Math.random() * types.length)];
  const scale = 0.8 + Math.random() * 0.6;
  horizonFeatures.push({
    type,
    x: WORLD.width + 120,
    y: 135,
    scale,
    speed: 18 + Math.random() * 10,
  });
}

function spawnIceberg() {
  const size = (30 + Math.random() * 40) * 4;
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

  entity.x = Math.max(120, Math.min(WORLD.width - 160, entity.x));
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

function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  return distance < a.radius + b.radius;
}

function updateOcean(dt) {
  if (state.gameOver && !state.sinking) return;

  if (!state.firstIcebergSpawned && state.distance > 2) {
    spawnIceberg();
    state.firstIcebergSpawned = true;
  }

  if (icebergs.length < 4 && Math.random() < 0.0015) spawnIceberg();
  if (horizonFeatures.length < 3 && Math.random() < 0.003) spawnHorizonFeature();

  if (Math.random() < 0.01) {
    state.safeLaneTarget = 90 + Math.random() * (WORLD.height - 180);
  }
  state.safeLaneY += (state.safeLaneTarget - state.safeLaneY) * dt * 0.6;

  icebergs.forEach((iceberg) => {
    iceberg.x -= iceberg.speed * dt;
    iceberg.y += Math.sin(iceberg.wobble + iceberg.x * 0.01) * 10 * dt;
  });
  horizonFeatures.forEach((feature) => {
    feature.x -= feature.speed * dt;
  });

  spawnFoam();
  updateFoam(dt);
  spawnSpray();
  updateSpray(dt);

  for (let i = icebergs.length - 1; i >= 0; i -= 1) {
    if (icebergs[i].x < -120) {
      icebergs.splice(i, 1);
    }
  }
  for (let i = horizonFeatures.length - 1; i >= 0; i -= 1) {
    if (horizonFeatures[i].x < -120) {
      horizonFeatures.splice(i, 1);
    }
  }

  if (!state.sinking) {
    handleBoatInput(boat, dt);
  }

  for (const iceberg of icebergs) {
    const boatCircle = {
      x: boat.x,
      y: boat.y,
      radius: boat.width * 0.35,
    };
    const icebergCircle = {
      x: iceberg.x,
      y: iceberg.y,
      radius: iceberg.width * 0.35,
    };

    if (circlesOverlap(boatCircle, icebergCircle) && !state.sinking) {
      state.sinking = true;
      state.sinkingTimer = 0;
      state.gameOver = true;
    }
  }

  // 60 seconds to reach the ice (100 units over 60s)
  state.distance += dt * (100 / 60);
  if (state.distance >= 100) {
    state.scene = "transition";
    state.transition = 0;
  }

  if (state.sinking) {
    state.sinkingTimer += dt;
    boat.y += dt * 30;
    if (state.sinkingTimer > 3.5) {
      state.sinking = false;
    }
  }
}

function updateTransition(dt) {
  if (state.gameOver || state.win) return;
  state.transition += dt;
  if (state.transition >= 3.5) {
    state.scene = "ice";
  }
  updateFoam(dt);
  updateSpray(dt);
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

function drawCloud(x, y, size, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = "#f5fbff";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.55, size * 0.28, 0, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.35, y + 2, size * 0.35, size * 0.2, 0, 0, Math.PI * 2);
  ctx.ellipse(x - size * 0.35, y + 4, size * 0.32, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCloudLayer() {
  const t = smokeTimer * 0.6;
  const wrapWidth = WORLD.width + 240;
  clouds.forEach((cloud) => {
    let x = cloud.x - t * cloud.speed;
    x = ((x % wrapWidth) + wrapWidth) % wrapWidth;
    x -= 120;
    drawCloud(x, cloud.y, cloud.size, cloud.opacity);
  });
}

function drawSunRays() {
  const centerX = WORLD.width - 140;
  const centerY = 50;
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(255, 230, 170, 0.45)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * 50, centerY + Math.sin(angle) * 50);
    ctx.lineTo(centerX + Math.cos(angle) * 110, centerY + Math.sin(angle) * 110);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSunFlare() {
  const centerX = WORLD.width - 140;
  const centerY = 50;
  const flarePoints = [
    { t: 0.25, r: 12, a: 0.18 },
    { t: 0.4, r: 18, a: 0.14 },
    { t: 0.55, r: 10, a: 0.12 },
    { t: 0.7, r: 20, a: 0.1 },
  ];
  ctx.save();
  flarePoints.forEach((flare) => {
    const x = centerX - flare.t * 320;
    const y = centerY + flare.t * 160;
    ctx.fillStyle = `rgba(255, 230, 180, ${flare.a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, flare.r * 1.2, flare.r, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBirds() {
  const t = smokeTimer * 0.6;
  const wrapWidth = WORLD.width + 200;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 2;
  birds.forEach((bird) => {
    let x = bird.x - t * bird.speed;
    x = ((x % wrapWidth) + wrapWidth) % wrapWidth;
    x -= 100;
    const y = bird.y + Math.sin(t + bird.x * 0.01) * 6;
    const s = bird.scale;
    ctx.beginPath();
    ctx.moveTo(x - 8 * s, y);
    ctx.quadraticCurveTo(x, y - 6 * s, x + 8 * s, y);
    ctx.stroke();
  });
  ctx.restore();
}

function drawCloudShadows() {
  const t = smokeTimer * 0.6;
  const wrapWidth = WORLD.width + 240;
  clouds.forEach((cloud) => {
    let x = cloud.x - t * cloud.speed;
    x = ((x % wrapWidth) + wrapWidth) % wrapWidth;
    x -= 120;
    ctx.save();
    ctx.globalAlpha = cloud.opacity * 0.25;
    ctx.fillStyle = "#08263b";
    ctx.beginPath();
    ctx.ellipse(x, 190, cloud.size * 0.7, cloud.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawSunReflection() {
  const centerX = WORLD.width - 140 + Math.sin(smokeTimer * 0.6) * 6;
  const startY = 150;
  ctx.save();
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 12; i += 1) {
    const y = startY + i * 26;
    const width = 18 + i * 6;
    ctx.fillStyle = `rgba(255, 235, 180, ${0.25 - i * 0.012})`;
    ctx.beginPath();
    ctx.ellipse(centerX, y, width, 4 + (i % 3), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOceanWaves() {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(140, 210, 240, 0.18)";
  for (let band = 0; band < 6; band += 1) {
    const baseY = 190 + band * 50;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 40) {
      const y = baseY + Math.sin(x * 0.025 + smokeTimer * 1.2 + band) * 6;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeepWaveBands() {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(3, 20, 40, 0.2)";
  for (let band = 0; band < 4; band += 1) {
    const baseY = 250 + band * 90;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 50) {
      const y = baseY + Math.sin(x * 0.015 + smokeTimer * 0.8 + band) * 10;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterCaustics() {
  ctx.save();
  ctx.strokeStyle = "rgba(120, 210, 235, 0.12)";
  ctx.lineWidth = 1.5;
  for (let row = 0; row < 5; row += 1) {
    const baseY = 220 + row * 70;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 30) {
      const y = baseY + Math.sin(x * 0.04 + smokeTimer * 1.6 + row) * 8;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterSparkles() {
  ctx.save();
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 61 + smokeTimer * 40) % WORLD.width;
    const y = 220 + (i % 6) * 45 + Math.sin(smokeTimer + i) * 6;
    ctx.fillStyle = "rgba(200, 240, 255, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHorizonMist() {
  ctx.save();
  const mist = ctx.createLinearGradient(0, 120, 0, 170);
  mist.addColorStop(0, "rgba(230, 245, 255, 0.45)");
  mist.addColorStop(1, "rgba(230, 245, 255, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 120, WORLD.width, 70);
  ctx.restore();
}

function spawnFoam() {
  if (foamParticles.length > 90) return;
  for (let i = 0; i < 2; i += 1) {
    foamParticles.push({
      x: boat.x - 70 + Math.random() * 20,
      y: boat.y + 36 + (Math.random() - 0.5) * 8,
      vx: -30 - Math.random() * 30,
      vy: (Math.random() - 0.5) * 10,
      life: 0.6 + Math.random() * 0.5,
      size: 3 + Math.random() * 4,
    });
  }
}

function updateFoam(dt) {
  for (let i = foamParticles.length - 1; i >= 0; i -= 1) {
    const p = foamParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      foamParticles.splice(i, 1);
    }
  }
}

function drawFoam() {
  ctx.save();
  foamParticles.forEach((p) => {
    const alpha = Math.max(p.life, 0) * 0.7;
    ctx.fillStyle = `rgba(220, 245, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function spawnSpray() {
  if (sprayParticles.length > 50) return;
  for (let i = 0; i < 2; i += 1) {
    sprayParticles.push({
      x: boat.x + 70 + Math.random() * 10,
      y: boat.y + 10 + (Math.random() - 0.5) * 6,
      vx: 20 + Math.random() * 20,
      vy: -20 - Math.random() * 20,
      life: 0.4 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
    });
  }
}

function updateSpray(dt) {
  for (let i = sprayParticles.length - 1; i >= 0; i -= 1) {
    const p = sprayParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 40 * dt;
    p.life -= dt;
    if (p.life <= 0) {
      sprayParticles.splice(i, 1);
    }
  }
}

function drawSpray() {
  ctx.save();
  sprayParticles.forEach((p) => {
    const alpha = Math.max(p.life, 0) * 0.7;
    ctx.fillStyle = `rgba(235, 250, 255, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBoatReflection() {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.translate(boat.x, boat.y + 70);
  ctx.scale(1, -0.6);
  ctx.fillStyle = "rgba(180, 210, 230, 0.45)";
  ctx.beginPath();
  ctx.moveTo(-84, 20);
  ctx.lineTo(84, 20);
  ctx.lineTo(60, 40);
  ctx.lineTo(-60, 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.height * 0.2,
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.height * 0.85
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.35)");
  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
}

function drawColorGrade(scene) {
  ctx.save();
  if (scene === "ocean" || scene === "transition") {
    ctx.fillStyle = "rgba(10, 70, 110, 0.08)";
  } else if (scene === "ice") {
    ctx.fillStyle = "rgba(200, 240, 255, 0.08)";
  } else {
    ctx.fillStyle = "rgba(5, 20, 35, 0.12)";
  }
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.restore();
}

function drawWaterBackground() {
  const horizon = 140;
  const skyGradient = ctx.createLinearGradient(0, 0, 0, horizon);
  skyGradient.addColorStop(0, "#8fd4ff");
  skyGradient.addColorStop(0.7, "#4fa5d3");
  skyGradient.addColorStop(1, "#2f88b8");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, WORLD.width, horizon);

  const oceanGradient = ctx.createLinearGradient(0, horizon, 0, WORLD.height);
  oceanGradient.addColorStop(0, "#0c5a7c");
  oceanGradient.addColorStop(0.4, "#0a4262");
  oceanGradient.addColorStop(1, "#031724");
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, horizon, WORLD.width, WORLD.height - horizon);

  // Sun and sky glow
  ctx.fillStyle = "rgba(255, 225, 150, 0.9)";
  ctx.beginPath();
  ctx.arc(WORLD.width - 140, 50, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 220, 140, 0.25)";
  ctx.beginPath();
  ctx.arc(WORLD.width - 140, 50, 70, 0, Math.PI * 2);
  ctx.fill();
  drawSunRays();
  drawSunFlare();
  drawCloudLayer();
  drawBirds();

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
  drawHorizonMist();
  drawCloudShadows();

  ctx.fillStyle = "rgba(140, 200, 230, 0.18)";
  for (let i = 0; i < 10; i += 1) {
    ctx.beginPath();
    ctx.ellipse(110 + i * 90, 160 + (i % 3) * 50, 50, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  drawDeepWaveBands();
  drawOceanWaves();
  drawWaterCaustics();
  drawWaterSparkles();
  drawSunReflection();

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

  // Stars
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 97 + 40) % WORLD.width;
    const y = 18 + (i % 6) * 14;
    ctx.fillRect(x, y, 2, 2);
  }

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
  const sinkTilt = state.sinking ? Math.min(state.sinkingTimer * 0.2, 0.7) : 0;
  ctx.translate(boat.x, boat.y + bob);
  ctx.rotate(sinkTilt);

  // Hull
  const hullGradient = ctx.createLinearGradient(-90, 20, 90, 60);
  hullGradient.addColorStop(0, "#101010");
  hullGradient.addColorStop(0.5, "#232323");
  hullGradient.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = hullGradient;
  ctx.beginPath();
  ctx.moveTo(-84, 30);
  ctx.lineTo(84, 30);
  ctx.lineTo(60, 54);
  ctx.lineTo(-60, 54);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-78, 30);
  ctx.lineTo(78, 30);
  ctx.stroke();

  // Red waterline stripe
  ctx.fillStyle = "#8b2f28";
  ctx.fillRect(-78, 26, 156, 6);

  // Gold trim
  ctx.fillStyle = "rgba(214, 180, 90, 0.7)";
  ctx.fillRect(-70, 20, 140, 2);

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

  // Lifeboats
  ctx.fillStyle = "#f6a34f";
  ctx.fillRect(-42, -24, 24, 8);
  ctx.fillRect(6, -24, 24, 8);

  // Mast and flag
  ctx.strokeStyle = "#4d4d4d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(0, -78);
  ctx.stroke();
  ctx.fillStyle = "#e63946";
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(18, -72);
  ctx.lineTo(0, -66);
  ctx.closePath();
  ctx.fill();

  // Deck windows
  ctx.fillStyle = "rgba(120, 90, 60, 0.55)";
  for (let i = -52; i <= 40; i += 16) {
    ctx.fillRect(i, -6, 10, 6);
  }

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
  const iceGradient = ctx.createLinearGradient(0, -iceberg.height / 2, 0, iceberg.height / 2);
  iceGradient.addColorStop(0, "#ffffff");
  iceGradient.addColorStop(0.6, "#d8f3ff");
  iceGradient.addColorStop(1, "#a9d3e6");
  ctx.fillStyle = iceGradient;
  ctx.beginPath();
  ctx.moveTo(0, -iceberg.height / 2);
  ctx.lineTo(iceberg.width / 2, iceberg.height / 2);
  ctx.lineTo(-iceberg.width / 2, iceberg.height / 2);
  ctx.closePath();
  ctx.fill();

  // Shadowed side
  ctx.fillStyle = "rgba(120, 170, 200, 0.35)";
  ctx.beginPath();
  ctx.moveTo(0, -iceberg.height / 2 + 10);
  ctx.lineTo(iceberg.width / 2, iceberg.height / 2);
  ctx.lineTo(0, iceberg.height / 2);
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

  // Ice cracks
  ctx.strokeStyle = "rgba(190, 230, 245, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-iceberg.width * 0.1, -iceberg.height * 0.05);
  ctx.lineTo(-iceberg.width * 0.18, iceberg.height * 0.2);
  ctx.lineTo(-iceberg.width * 0.05, iceberg.height * 0.32);
  ctx.stroke();

  // Waterline glow
  ctx.strokeStyle = "rgba(120, 200, 230, 0.6)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-iceberg.width / 2 + 4, iceberg.height / 2 - 6);
  ctx.lineTo(iceberg.width / 2 - 4, iceberg.height / 2 - 6);
  ctx.stroke();

  // Reflection blur
  ctx.fillStyle = "rgba(180, 220, 235, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, iceberg.height / 2 + 14, iceberg.width * 0.5, iceberg.height * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHorizonFeature(feature) {
  const y = feature.y;
  const s = feature.scale;
  ctx.save();
  ctx.translate(feature.x, y);
  ctx.scale(s, s);

  if (feature.type === "bear") {
    ctx.fillStyle = "#f3f1e7";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e4dece";
    ctx.beginPath();
    ctx.arc(-6, -6, 3, 0, Math.PI * 2);
    ctx.arc(6, -6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (feature.type === "penguin") {
    ctx.fillStyle = "#1c1c1c";
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3f1e7";
    ctx.beginPath();
    ctx.ellipse(0, 2, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(220, 245, 255, 0.9)";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawIceScene() {
  const skyHeight = 220;
  const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
  skyGradient.addColorStop(0, "#dff6ff");
  skyGradient.addColorStop(0.6, "#b7e3f7");
  skyGradient.addColorStop(1, "#8fc6e6");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, WORLD.width, skyHeight);

  const groundGradient = ctx.createLinearGradient(0, skyHeight, 0, WORLD.height);
  groundGradient.addColorStop(0, "#eaf7ff");
  groundGradient.addColorStop(1, "#b7d9ea");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, skyHeight, WORLD.width, WORLD.height - skyHeight);

  // Distant ice mountains
  ctx.fillStyle = "rgba(200, 230, 245, 0.9)";
  for (let i = 0; i < 6; i += 1) {
    const baseX = i * 180 - 40;
    const peakY = 70 + (i % 3) * 20;
    ctx.beginPath();
    ctx.moveTo(baseX, skyHeight);
    ctx.lineTo(baseX + 90, peakY);
    ctx.lineTo(baseX + 180, skyHeight);
    ctx.closePath();
    ctx.fill();
  }

  // Aurora ribbon
  ctx.strokeStyle = "rgba(160, 240, 220, 0.35)";
  ctx.lineWidth = 18;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.width; x += 60) {
    const y = 90 + Math.sin(x * 0.02 + smokeTimer * 0.4) * 18;
    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  // Snow drift particles
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  snowParticles.forEach((particle) => {
    const y = (particle.y + smokeTimer * particle.speed) % WORLD.height;
    const x = (particle.x + Math.sin(smokeTimer * particle.drift + particle.y) * 20) % WORLD.width;
    ctx.fillRect(x, y, particle.size, particle.size);
  });

  floes.forEach((floe) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.ellipse(floe.x, floe.y, floe.radius, floe.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Snow sparkle texture
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 73 + smokeTimer * 10) % WORLD.width;
    const y = 240 + (i % 10) * 28;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#9ac7da";
  ctx.fillRect(castle.x - 10, castle.y + castle.height - 10, castle.width + 20, 18);

  const castleGrad = ctx.createLinearGradient(castle.x, castle.y, castle.x, castle.y + castle.height);
  castleGrad.addColorStop(0, "#f1fbff");
  castleGrad.addColorStop(1, "#b4d2e3");
  ctx.fillStyle = castleGrad;
  ctx.fillRect(castle.x, castle.y, castle.width, castle.height);

  ctx.fillStyle = "#c0d6e4";
  ctx.fillRect(castle.x + 20, castle.y + 20, castle.width - 40, castle.height - 40);

  // Side towers
  ctx.fillStyle = "#cfe5f2";
  ctx.fillRect(castle.x - 18, castle.y + 10, 22, 60);
  ctx.fillRect(castle.x + castle.width - 4, castle.y + 10, 22, 60);

  // Windows
  ctx.fillStyle = "rgba(120, 170, 200, 0.7)";
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(castle.x + 18 + i * 40, castle.y + 36, 10, 18);
  }

  // Gate
  ctx.fillStyle = "#7b8ea3";
  ctx.fillRect(castle.x + 60, castle.y + 25, 40, 34);

  // Castle glow
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(castle.x, castle.y, castle.width, castle.height);
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
  ctx.fillText(`Distance: ${state.distance.toFixed(0)} / 100`, 34, 66);
  if (state.scene === "ocean") {
    ctx.fillText(`Icebergs: ${icebergs.length}`, 34, 86);
  }
}

function drawTitleLogo() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(6, 20, 30, 0.7)";
  ctx.fillRect(0, 90, WORLD.width, 110);

  ctx.fillStyle = "#f9f1d6";
  ctx.font = "44px 'Trebuchet MS'";
  ctx.fillText("JOHAN'S ARTCTIC ADVENTURE", WORLD.width / 2, 140);
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
    drawBoatReflection();
    drawBoat();
    drawSmokeStackSmoke();
    drawFogLayer();
  } else if (state.scene === "ocean") {
    drawWaterBackground();
    horizonFeatures.forEach(drawHorizonFeature);
    icebergs.forEach(drawIceberg);
    drawBoatWake();
    drawFoam();
    drawBoatReflection();
    drawBoat();
    drawSpray();
    drawSmokeStackSmoke();
    drawFogLayer();
  } else if (state.scene === "transition") {
    drawWaterBackground();
    horizonFeatures.forEach(drawHorizonFeature);
    drawBoatWake();
    drawFoam();
    drawBoatReflection();
    drawBoat();
    drawSpray();
    drawSmokeStackSmoke();
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

  drawColorGrade(state.scene);
  drawVignette();
  drawHud();

  if (state.scene === "splash") {
    drawMessage("Johan's Artctic Adventure", "Press SPACE to begin the voyage");
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
  bobTimer += dt;
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
