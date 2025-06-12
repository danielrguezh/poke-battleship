const boardSize = 10;
const enemyBoard = document.getElementById('enemy-board');
const playerBoard = document.getElementById('player-board');
const message = document.getElementById('message');

let enemyGrid = [];
let playerGrid = [];

// Barcos separados para jugador y enemigo
const playerShips = [
  { size: 5, positions: [], hits: 0 },
  { size: 4, positions: [], hits: 0 },
  { size: 3, positions: [], hits: 0 },
  { size: 3, positions: [], hits: 0 },
  { size: 2, positions: [], hits: 0 }
];

const enemyShips = JSON.parse(JSON.stringify(playerShips));

let shipOrientation = 'horizontal';
let draggedShip = null;
let gameStarted = false;
let playerTurn = true;
let lastHitIndex = null;
let possibleTargets = [];

// Crear tablero
function createBoard(board, grid, isEnemy = false) {
  for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    if (isEnemy) {
      cell.addEventListener('click', () => handleShot(i, cell));
    } else {
      cell.addEventListener('dragover', e => e.preventDefault());
      cell.addEventListener('drop', () => handleDrop(i));
    }
    board.appendChild(cell);
    grid.push({ hasShip: false, shot: false });
  }
}

// Colocar barcos enemigos aleatoriamente
function placeEnemyShips() {
  for (let ship of enemyShips) {
    let placed = false;
    while (!placed) {
      const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const start = Math.floor(Math.random() * boardSize * boardSize);
      let indices = [];

      for (let i = 0; i < ship.size; i++) {
        const index = orientation === 'horizontal' ? start + i : start + i * boardSize;
        const rowStart = Math.floor(start / boardSize);
        const rowCurrent = Math.floor(index / boardSize);

        if (
          index >= boardSize * boardSize ||
          (orientation === 'horizontal' && rowStart !== rowCurrent) ||
          enemyGrid[index]?.hasShip
        ) {
          indices = [];
          break;
        }

        indices.push(index);
      }

      if (indices.length === ship.size) {
        indices.forEach(i => enemyGrid[i].hasShip = true);
        ship.positions = indices;
        placed = true;
      }
    }
  }
}

// IA
function enemyTurn() {
  let index;

  if (possibleTargets.length > 0) {
    index = possibleTargets.shift();
  } else if (lastHitIndex !== null) {
    const directions = [-1, 1, -boardSize, boardSize];
    possibleTargets = directions
      .map(d => lastHitIndex + d)
      .filter(i =>
        i >= 0 &&
        i < boardSize * boardSize &&
        !playerGrid[i].shot &&
        Math.abs((i % boardSize) - (lastHitIndex % boardSize)) <= 1
      );
    index = possibleTargets.shift();
  }

  if (index === undefined || playerGrid[index]?.shot) {
    const validShots = playerGrid.map((c, i) => !c.shot ? i : null).filter(i => i !== null);
    index = validShots[Math.floor(Math.random() * validShots.length)];
  }

  playerGrid[index].shot = true;
  const cell = playerBoard.children[index];

  if (playerGrid[index].hasShip) {
    cell.classList.add('hit');
    message.textContent = '¡El enemigo te ha dado!';
    lastHitIndex = index;
    playSound("hit-sound");
  } else {
    cell.classList.add('miss');
    message.textContent = 'El enemigo falló.';
    if (possibleTargets.length === 0) lastHitIndex = null;
    playSound("miss-sound");
  }

  const remaining = playerGrid.filter(c => c.hasShip && !c.shot);
  if (remaining.length === 0) {
    message.textContent = '💥 ¡Has perdido!';
    gameStarted = false;
    return;
  }

  playerTurn = true;
}

// Disparo jugador
function handleShot(index, cell) {
  if (!gameStarted || !playerTurn || enemyGrid[index].shot) return;

  enemyGrid[index].shot = true;
  playerTurn = false;

  if (enemyGrid[index].hasShip) {
    cell.classList.add('hit');
    message.textContent = '¡Impacto!';
    playSound("hit-sound");

    for (let ship of enemyShips) {
      if (ship.positions.includes(index)) {
        ship.hits++;
        if (ship.hits === ship.size) {
          message.textContent = '¡Hundiste un barco!';
        }
        break;
      }
    }

    if (enemyShips.every(s => s.hits === s.size)) {
      message.textContent = '🎉 ¡Has ganado!';
      gameStarted = false;
      return;
    }

  } else {
    cell.classList.add('miss');
    message.textContent = 'Fallaste.';
    playSound("miss-sound");
  }

  setTimeout(enemyTurn, 1000);
}

// Colocar barco del jugador
function handleDrop(index) {
  const size = parseInt(draggedShip.dataset.size);
  const row = Math.floor(index / boardSize);

  let indices = [];

  for (let i = 0; i < size; i++) {
    const idx = shipOrientation === 'horizontal' ? index + i : index + i * boardSize;
    const r = Math.floor(idx / boardSize);

    if (
      idx >= boardSize * boardSize ||
      (shipOrientation === 'horizontal' && r !== row) ||
      playerGrid[idx].hasShip
    ) {
      return;
    }

    indices.push(idx);
  }

  indices.forEach(i => {
    playerGrid[i].hasShip = true;
    playerBoard.children[i].classList.add('ship');
  });

  draggedShip.remove();
  draggedShip = null;
}

// Eventos de barcos
function initializeShipEvents() {
  document.querySelectorAll('.ship').forEach(ship => {
    ship.addEventListener('contextmenu', e => {
      e.preventDefault();
      const size = ship.dataset.size;

      if (ship.style.transform === 'rotate(90deg)') {
        ship.style.transform = 'rotate(0deg)';
        shipOrientation = 'horizontal';
        ship.style.width = `${size * 30}px`;
        ship.style.height = `30px`;
      } else {
        ship.style.transform = 'rotate(90deg)';
        shipOrientation = 'vertical';
        ship.style.width = `30px`;
        ship.style.height = `${size * 30}px`;
      }
    });

    ship.addEventListener('dragstart', () => {
      draggedShip = ship;
      shipOrientation = ship.style.transform === 'rotate(90deg)' ? 'vertical' : 'horizontal';
    });
  });
}

// Botón iniciar
document.getElementById('start-game-button').addEventListener('click', () => {
  // Verifica cuántas celdas tienen barcos del jugador
  const totalPlayerShipCells = playerGrid.filter(c => c.hasShip).length;

  // La suma total de celdas ocupadas debe ser igual a la suma de tamaños de barcos
  const totalShipCellsRequired = playerShips.reduce((sum, ship) => sum + ship.size, 0);

  if (totalPlayerShipCells === totalShipCellsRequired) {
    gameStarted = true;
    message.textContent = "¡Comienza el juego! Tu turno.";
  } else {
    message.textContent = "Coloca todos los barcos antes de comenzar.";
  }
});


// Sonidos
function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

// Inicialización
createBoard(enemyBoard, enemyGrid, true);
createBoard(playerBoard, playerGrid, false);
placeEnemyShips();
initializeShipEvents();
