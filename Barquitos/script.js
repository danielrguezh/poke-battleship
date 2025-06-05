const boardSize = 10;
const enemyBoard = document.getElementById('enemy-board');
const message = document.getElementById('message');

let enemyGrid = [];
let ships = [
  { size: 5, positions: [], hits: 0 }, // Portaaviones
  { size: 4, positions: [], hits: 0 }, // Acorazado
  { size: 3, positions: [], hits: 0 }, // Submarino
  { size: 3, positions: [], hits: 0 }, // Crucero
  { size: 2, positions: [], hits: 0 }  // Lancha
];

// Crear el tablero
function createBoard() {
  for (let i = 0; i < boardSize * boardSize; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.addEventListener('click', () => handleShot(i, cell));
    enemyBoard.appendChild(cell);
    enemyGrid.push({ hasShip: false, shot: false });
  }
}

// Colocar barcos aleatoriamente
function placeShips() {
  for (let ship of ships) {
    let placed = false;
    while (!placed) {
      let orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      let start = Math.floor(Math.random() * boardSize * boardSize);

      let indices = [];
      for (let i = 0; i < ship.size; i++) {
        let index = orientation === 'horizontal'
          ? start + i
          : start + i * boardSize;

        if (
          index >= boardSize * boardSize ||
          (orientation === 'horizontal' && Math.floor(index / boardSize) !== Math.floor(start / boardSize)) ||
          enemyGrid[index]?.hasShip
        ) {
          indices = [];
          break;
        }

        indices.push(index);
      }

      if (indices.length === ship.size) {
        for (let i of indices) enemyGrid[i].hasShip = true;
        ship.positions = indices;
        placed = true;
      }
    }
  }
}

// Manejar disparo
function handleShot(index, cell) {
  if (enemyGrid[index].shot) return;

  enemyGrid[index].shot = true;

  if (enemyGrid[index].hasShip) {
    cell.classList.add('hit');
    message.textContent = '¡Impacto!';

    for (let ship of ships) {
      if (ship.positions.includes(index)) {
        ship.hits++;
        if (ship.hits === ship.size) {
          message.textContent = '¡Hundiste un barco!';
        }
        break;
      }
    }

    if (ships.every(ship => ship.hits === ship.size)) {
      message.textContent = '🎉 ¡Has hundido toda la flota enemiga!';
    }
  } else {
    cell.classList.add('miss');
    message.textContent = 'Fallaste.';
  }
}

// Inicializar
createBoard();
placeShips();