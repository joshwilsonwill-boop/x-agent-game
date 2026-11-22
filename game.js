// Meteor Dodge - a tiny browser game built from one prompt.
// Steer a rocket through falling asteroids. Arrow keys or touch drag.
// Score a point for every asteroid dodged. Three lives. Game over with restart.
// All art is procedural: canvas paths only. No network, no external assets.

(function () {
  'use strict';

  var W = 1280, H = 720;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var params = new URLSearchParams(window.location.search);
  var shotMode = params.get('shot'); // 'title' | 'play' | 'over' | null

  // Small seeded RNG so ?shot= frames are deterministic.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = shotMode ? mulberry32(20261122) : Math.random;

  var state = 'title'; // 'title' | 'playing' | 'over'
  var score = 0;
  var lives = 3;
  var frame = 0;
  var spawnTimer = 0;
  var invuln = 0;
  var keys = {};
  var touchX = null, touchY = null;

  var rocket = { x: W / 2, y: H - 120, r: 22, vx: 0, vy: 0 };
  var asteroids = [];
  var stars = [];
  var i, s;
  for (i = 0; i < 90; i++) {
    stars.push({ x: rng() * W, y: rng() * H, r: 0.6 + rng() * 1.8, tw: rng() * Math.PI * 2 });
  }

  function spawnAsteroid() {
    var r = 16 + rng() * 30;
    var speed = 2.2 + rng() * 2.2 + Math.min(score * 0.04, 2.5);
    var points = [];
    var n = 9 + Math.floor(rng() * 4);
    for (var k = 0; k < n; k++) {
      points.push(0.72 + rng() * 0.45);
    }
    asteroids.push({
      x: 40 + rng() * (W - 80),
      y: -60,
      r: r,
      vy: speed,
      vx: (rng() - 0.5) * 1.2,
      rot: rng() * Math.PI * 2,
      vr: (rng() - 0.5) * 0.03,
      points: points,
      shade: 90 + Math.floor(rng() * 60)
    });
  }

  function resetGame() {
    score = 0;
    lives = 3;
    frame = 0;
    spawnTimer = 0;
    invuln = 0;
    asteroids = [];
    rocket.x = W / 2;
    rocket.y = H - 120;
    rocket.vx = 0;
    rocket.vy = 0;
  }

  function startGame() {
    resetGame();
    state = 'playing';
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#070718');
    g.addColorStop(0.6, '#0a0a28');
    g.addColorStop(1, '#120a2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      var a = 0.35 + 0.65 * Math.abs(Math.sin(s.tw + frame * 0.02));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawRocket() {
    var x = rocket.x, y = rocket.y;
    ctx.save();
    ctx.translate(x, y);
    if (invuln > 0 && Math.floor(invuln / 4) % 2 === 0) ctx.globalAlpha = 0.35;
    // Flame
    var flame = 26 + Math.sin(frame * 0.5) * 8;
    var fg = ctx.createLinearGradient(0, 18, 0, 18 + flame);
    fg.addColorStop(0, '#ffd23f');
    fg.addColorStop(0.5, '#ff7a18');
    fg.addColorStop(1, 'rgba(255, 60, 60, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-9, 16);
    ctx.lineTo(0, 18 + flame);
    ctx.lineTo(9, 16);
    ctx.closePath();
    ctx.fill();
    // Fins
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath();
    ctx.moveTo(-14, 6); ctx.lineTo(-26, 22); ctx.lineTo(-12, 20); ctx.closePath();
    ctx.moveTo(14, 6); ctx.lineTo(26, 22); ctx.lineTo(12, 20); ctx.closePath();
    ctx.fill();
    // Body
    var bg = ctx.createLinearGradient(-14, 0, 14, 0);
    bg.addColorStop(0, '#c7d2fe');
    bg.addColorStop(0.5, '#f8fafc');
    bg.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(14, -12, 14, 8);
    ctx.lineTo(14, 18);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-14, 8);
    ctx.quadraticCurveTo(-14, -12, 0, -34);
    ctx.closePath();
    ctx.fill();
    // Window
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, -6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(-2, -8, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroid(a) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.fillStyle = 'rgb(' + a.shade + ',' + (a.shade - 12) + ',' + (a.shade - 28) + ')';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    var n = a.points.length;
    for (var k = 0; k < n; k++) {
      var ang = (k / n) * Math.PI * 2;
      var rr = a.r * a.points[k];
      if (k === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.arc(-a.r * 0.3, -a.r * 0.2, a.r * 0.22, 0, Math.PI * 2);
    ctx.arc(a.r * 0.35, a.r * 0.3, a.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHUD() {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE  ' + score, 28, 22);
    ctx.textAlign = 'right';
    var hearts = '';
    for (var h = 0; h < 3; h++) hearts += (h < lives) ? '\u2665 ' : '\u2661 ';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText(hearts, W - 28, 22);
    ctx.textAlign = 'left';
  }

  function centerText(text, y, size, color, font) {
    ctx.font = (font || 'bold ') + size + 'px Arial, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, y);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawTitle() {
    centerText('METEOR DODGE', 240, 84, '#ffffff');
    centerText('Steer the rocket. Dodge the rocks. Survive.', 330, 30, '#a5b4fc');
    centerText('ARROW KEYS or DRAG to move', 430, 28, '#fbbf24');
    centerText('3 lives - 1 point per asteroid dodged', 475, 28, '#fbbf24');
    centerText('PRESS SPACE OR TAP TO START', 668, 34, '#34d399');
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(5,5,16,0.72)';
    ctx.fillRect(0, 0, W, H);
    centerText('GAME OVER', 280, 88, '#ff4d6d');
    centerText('Final score: ' + score, 390, 40, '#ffffff');
    centerText('Best dodge run yet. Go again?', 450, 28, '#a5b4fc');
    centerText('PRESS R OR TAP TO RESTART', 560, 32, '#34d399');
  }

  function update() {
    frame++;
    if (state !== 'playing') return;
    if (invuln > 0) invuln--;

    var speed = 7;
    if (keys['ArrowLeft'] || keys['a']) rocket.vx -= 0.9;
    if (keys['ArrowRight'] || keys['d']) rocket.vx += 0.9;
    if (keys['ArrowUp'] || keys['w']) rocket.vy -= 0.9;
    if (keys['ArrowDown'] || keys['s']) rocket.vy += 0.9;
    if (touchX !== null) {
      rocket.x += (touchX - rocket.x) * 0.25;
      rocket.y += (touchY - rocket.y) * 0.25;
    }
    rocket.vx *= 0.86;
    rocket.vy *= 0.86;
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.x = Math.max(30, Math.min(W - 30, rocket.x));
    rocket.y = Math.max(60, Math.min(H - 40, rocket.y));
    void speed;

    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = Math.max(18, 55 - score);
    }

    for (var j = asteroids.length - 1; j >= 0; j--) {
      var a = asteroids[j];
      a.y += a.vy;
      a.x += a.vx;
      a.rot += a.vr;
      if (a.y - a.r > H) {
        asteroids.splice(j, 1);
        score++;
        continue;
      }
      var dx = a.x - rocket.x, dy = a.y - rocket.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (invuln === 0 && dist < a.r + rocket.r - 6) {
        lives--;
        asteroids.splice(j, 1);
        invuln = 90;
        if (lives <= 0) state = 'over';
      }
    }
  }

  function render() {
    drawBackground();
    if (state === 'title') {
      drawRocket();
      drawTitle();
    } else if (state === 'playing' || state === 'over') {
      for (var j = 0; j < asteroids.length; j++) drawAsteroid(asteroids[j]);
      if (state !== 'over') drawRocket();
      drawHUD();
      if (state === 'over') drawGameOver();
    }
  }

  function loop() {
    update();
    render();
    if (!shotMode) requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Enter') {
      if (state === 'title') startGame();
      e.preventDefault();
    }
    if ((e.key === 'r' || e.key === 'R') && state === 'over') startGame();
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) >= 0) e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys[e.key] = false; });
  canvas.addEventListener('pointerdown', function (e) {
    var rect = canvas.getBoundingClientRect();
    touchX = (e.clientX - rect.left) * (W / rect.width);
    touchY = (e.clientY - rect.top) * (H / rect.height);
    if (state === 'title') startGame();
    else if (state === 'over') startGame();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (touchX === null) return;
    var rect = canvas.getBoundingClientRect();
    touchX = (e.clientX - rect.left) * (W / rect.width);
    touchY = (e.clientY - rect.top) * (H / rect.height);
  });
  window.addEventListener('pointerup', function () { touchX = null; touchY = null; });

  // Deterministic screenshot states: paint synchronously, then signal readiness.
  if (shotMode === 'title') {
    state = 'title';
    frame = 42;
    render();
    window.__shotReady = true;
  } else if (shotMode === 'play') {
    state = 'playing';
    score = 12;
    lives = 3;
    frame = 260;
    rocket.x = W / 2 - 90;
    rocket.y = H - 140;
    for (var m = 0; m < 7; m++) {
      spawnAsteroid();
      asteroids[m].y = 60 + m * 88;
      asteroids[m].x = 180 + ((m * 173) % 900);
    }
    render();
    window.__shotReady = true;
  } else if (shotMode === 'over') {
    state = 'over';
    score = 27;
    lives = 0;
    frame = 900;
    render();
    window.__shotReady = true;
  } else {
    loop();
  }
})();
