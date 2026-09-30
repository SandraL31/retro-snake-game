const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const statusEl = document.getElementById('status');

const gridSize = 20;
const tileSize = canvas.width / gridSize;
const baseSpeed = 130;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let apple = { x: 0, y: 0 };
let score = 0;
let bestScore = Number(localStorage.getItem('neon-nibbler-best')) || 0;
let lastTime = 0;
let accumulatedTime = 0;
let gameRunning = false;
let gameOver = false;

bestScoreEl.textContent = String(bestScore);

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = '0';
  gameOver = false;
  statusEl.textContent = 'READY';
  spawnApple();
  accumulatedTime = 0;
  lastTime = 0;
}

function spawnApple() {
  let valid = false;

  while (!valid) {
    apple = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize)
    };

    valid = !snake.some(segment => segment.x === apple.x && segment.y === apple.y);
  }
}

function setDirection(newDir) {
  const isOpposite = newDir.x === -direction.x && newDir.y === -direction.y;

  if (!isOpposite) {
    nextDirection = newDir;
  }
}

function update() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall =
    head.x < 0 ||
    head.y < 0 ||
    head.x >= gridSize ||
    head.y >= gridSize;

  const hitSelf = snake.some(segment => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    gameRunning = false;
    gameOver = true;
    statusEl.textContent = 'GAME OVER';
    if (score > bestScore) {
      bestScore = score;
      bestScoreEl.textContent = String(bestScore);
      localStorage.setItem('neon-nibbler-best', String(bestScore));
    }
    return;
  }

  snake.unshift(head);

  const ateApple = head.x === apple.x && head.y === apple.y;

  if (ateApple) {
    score += 10;
    scoreEl.textContent = String(score);
    spawnApple();
    statusEl.textContent = 'NICE!';
  } else {
    snake.pop();
  }
}

function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tileSize, y * tileSize, w * tileSize, h * tileSize);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#050914';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(80, 240, 255, 0.03)';
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }
  }

  for (let i = 0; i <= gridSize; i++) {
    ctx.strokeStyle = 'rgba(80, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const bodyColor = isHead ? '#50f0ff' : index % 2 === 0 ? '#c7ff5b' : '#9b7bff';
    const shadowColor = isHead ? '#ff4fd8' : '#5ae6b0';

    drawPixelRect(segment.x, segment.y, 1, 1, bodyColor);
    drawPixelRect(segment.x + 0.15, segment.y + 0.15, 0.7, 0.7, shadowColor);
  });
}

function drawApple() {
  ctx.fillStyle = '#ff4fd8';
  ctx.fillRect(apple.x * tileSize + 4, apple.y * tileSize + 2, tileSize - 8, tileSize - 4);

  ctx.fillStyle = '#ffe65c';
  ctx.fillRect(apple.x * tileSize + 7, apple.y * tileSize, tileSize - 14, 6);
}

function drawOverlay() {
  if (!gameRunning && !gameOver) {
    ctx.fillStyle = 'rgba(5, 9, 20, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#50f0ff';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('START', canvas.width / 2, canvas.height / 2 - 8);

    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#c7ff5b';
    ctx.fillText('ARROWS / WASD', canvas.width / 2, canvas.height / 2 + 24);
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(5, 9, 20, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff5c7a';
    ctx.font = '18px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = '#ffe65c';
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.fillText('ENTER TO RESTART', canvas.width / 2, canvas.height / 2 + 18);
  }
}

function tick(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (gameRunning) {
    accumulatedTime += delta;
    const stepDelay = Math.max(60, baseSpeed - score * 0.5);

    if (accumulatedTime >= stepDelay) {
      accumulatedTime = 0;
      update();
    }
  }

  drawBoard();
  drawApple();
  drawSnake();
  drawOverlay();

  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (event.key === 'Enter' && gameOver) {
    resetGame();
    gameRunning = true;
    statusEl.textContent = 'PLAYING';
    return;
  }

  if (!gameRunning && !gameOver && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
    gameRunning = true;
    statusEl.textContent = 'PLAYING';
  }

  if (key === 'arrowup' || key === 'w') setDirection({ x: 0, y: -1 });
  if (key === 'arrowdown' || key === 's') setDirection({ x: 0, y: 1 });
  if (key === 'arrowleft' || key === 'a') setDirection({ x: -1, y: 0 });
  if (key === 'arrowright' || key === 'd') setDirection({ x: 1, y: 0 });
});

resetGame();
requestAnimationFrame(tick);
