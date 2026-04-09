// ---------- GAME STATE ----------
let board = Array(9).fill(null);
let currentPlayer = 'X';       // X always starts
let gameActive = true;
let winnerInfo = null;          // { winner: 'X'/'O'/'tie', line: [] or null }
let currentGameMode = 'twoPlayer';   // 'twoPlayer' or 'vsAI'

// DOM elements
const selectionScreen = document.getElementById('selectionScreen');
const gameWrapper = document.getElementById('gameWrapper');
const gridContainer = document.getElementById('ticGrid');
const playerXCard = document.getElementById('playerXCard');
const playerOCard = document.getElementById('playerOCard');
const statusMsgSpan = document.getElementById('statusMsg');
const newMatchBtnGame = document.getElementById('newMatchBtnGame');
const resetBoardBtn = document.getElementById('resetBoardBtn');
const exitToMenuBtn = document.getElementById('exitToMenuBtn');
const gameOverModal = document.getElementById('gameOverModal');
const modalTitle = document.getElementById('modalTitle');
const modalMsg = document.getElementById('modalMsg');
const modalNewMatch = document.getElementById('modalNewMatch');
const modalExitMenu = document.getElementById('modalExitMenu');

// win patterns
const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
];

// Evaluate winner/tie
function evaluateGame() {
    for (let pattern of winPatterns) {
        const [a,b,c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            gameActive = false;
            winnerInfo = { winner: board[a], line: pattern };
            return;
        }
    }
    const isFull = board.every(cell => cell !== null);
    if (isFull) {
        gameActive = false;
        winnerInfo = { winner: 'tie', line: null };
        return;
    }
    gameActive = true;
    winnerInfo = null;
}

// Highlight winning cells
function highlightWinningCells() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => { cell.style.backgroundColor = ''; cell.style.boxShadow = ''; });
    if (winnerInfo && winnerInfo.line) {
        winnerInfo.line.forEach(idx => {
            if (cells[idx]) {
                cells[idx].style.backgroundColor = '#3b8b6e';
                cells[idx].style.boxShadow = '0 0 14px #6ad4a0';
            }
        });
    }
}

// Render board from array
function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < cells.length; i++) {
        const val = board[i];
        cells[i].textContent = val === 'X' ? 'X' : (val === 'O' ? 'O' : '');
        cells[i].classList.remove('X-move', 'O-move');
        if (val === 'X') cells[i].classList.add('X-move');
        if (val === 'O') cells[i].classList.add('O-move');
        
        const disabled = (!gameActive) || (val !== null);
        if (disabled) cells[i].classList.add('disabled-cell');
        else cells[i].classList.remove('disabled-cell');
    }
    highlightWinningCells();
}

// Update UI badges + message
function updateUI() {
    if (!gameActive && winnerInfo) {
        if (winnerInfo.winner === 'X') {
            statusMsgSpan.innerHTML = '🔥 VICTORY: PLAYER X WINS! 🔥';
        } else if (winnerInfo.winner === 'O') {
            statusMsgSpan.innerHTML = '💀 VICTORY: PLAYER O WINS! 💀';
        } else {
            statusMsgSpan.innerHTML = '🤝 IT\'S A TIE! GREAT BATTLE 🤝';
        }
        playerXCard.classList.remove('active-turn');
        playerOCard.classList.remove('active-turn');
    } else {
        statusMsgSpan.innerHTML = currentPlayer === 'X' ? ' X - your move' : ' O - your move';
        if (currentPlayer === 'X') {
            playerXCard.classList.add('active-turn');
            playerOCard.classList.remove('active-turn');
        } else {
            playerOCard.classList.add('active-turn');
            playerXCard.classList.remove('active-turn');
        }
    }
}

// Show game over modal
function showGameEndModal() {
    if (!gameActive && winnerInfo) {
        if (winnerInfo.winner === 'X') {
            modalTitle.innerText = '❌ VICTORY!';
            modalMsg.innerText = 'Player X conquered the board!';
        } else if (winnerInfo.winner === 'O') {
            modalTitle.innerText = '⭕ VICTORY!';
            modalMsg.innerText = 'Player O dominated!';
        } else {
            modalTitle.innerText = '🤝 DRAW';
            modalMsg.innerText = 'The game ended in a tie.';
        }
        gameOverModal.classList.add('active');
    }
}

// ----- SMART AI (MINIMAX-like but simplified: win > block > center > corner > edge) -----
// AI plays as 'O'
function getSmartAIMove() {
    // 1. Check if AI can win (O)
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'O';
            let win = false;
            for (let pattern of winPatterns) {
                const [a,b,c] = pattern;
                if (board[a] === 'O' && board[b] === 'O' && board[c] === 'O') win = true;
            }
            board[i] = null;
            if (win) return i;
        }
    }
    
    // 2. Block player X from winning
    for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
            board[i] = 'X';
            let win = false;
            for (let pattern of winPatterns) {
                const [a,b,c] = pattern;
                if (board[a] === 'X' && board[b] === 'X' && board[c] === 'X') win = true;
            }
            board[i] = null;
            if (win) return i;
        }
    }
    
    // 3. Take center if available
    if (board[4] === null) return 4;
    
    // 4. Take corners (0,2,6,8)
    const corners = [0,2,6,8];
    const availableCorners = corners.filter(i => board[i] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // 5. Take any remaining edge
    const edges = [1,3,5,7];
    const availableEdges = edges.filter(i => board[i] === null);
    if (availableEdges.length > 0) {
        return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }
    
    return -1;
}

// AI move execution
function aiMove() {
    if (!gameActive) return;
    if (currentPlayer !== 'O') return;
    
    const moveIndex = getSmartAIMove();
    if (moveIndex !== -1 && board[moveIndex] === null) {
        makeMove(moveIndex, 'O');
    }
}

// Core move logic
function makeMove(index, expectedPlayer) {
    if (!gameActive) return false;
    if (board[index] !== null) return false;
    if (expectedPlayer !== currentPlayer) return false;
    
    board[index] = currentPlayer;
    renderBoard();
    evaluateGame();
    renderBoard();
    updateUI();
    
    if (!gameActive) {
        showGameEndModal();
        return true;
    }
    
    // switch player
    currentPlayer = (currentPlayer === 'X') ? 'O' : 'X';
    updateUI();
    renderBoard();
    
    // AI trigger if vsAI mode, game still active, and it's O's turn
    if (currentGameMode === 'vsAI' && gameActive && currentPlayer === 'O') {
        setTimeout(() => {
            if (gameActive && currentGameMode === 'vsAI' && currentPlayer === 'O') {
                aiMove();
            }
        }, 200);
    }
    return true;
}

// Full reset (keep mode)
function fullResetGame() {
    board.fill(null);
    currentPlayer = 'X';
    gameActive = true;
    winnerInfo = null;
    renderBoard();
    updateUI();
    if (gameOverModal.classList.contains('active')) gameOverModal.classList.remove('active');
}

// New match
function newMatch() {
    fullResetGame();
}

// Exit to menu
function exitToMenu() {
    gameWrapper.classList.remove('visible');
    selectionScreen.classList.remove('hide');
    fullResetGame();
    if (gameOverModal.classList.contains('active')) gameOverModal.classList.remove('active');
}

// Start game with specific mode
function startGameWithMode(mode) {
    currentGameMode = mode;
    fullResetGame();
    selectionScreen.classList.add('hide');
    gameWrapper.classList.add('visible');
    if (mode === 'vsAI') {
        statusMsgSpan.innerHTML = '🤖 SMART AI MODE · You are X, AI (O) tries to win · X starts';
        updateUI();
    } else {
        statusMsgSpan.innerHTML = '👥 2-Player mode · X goes first';
        updateUI();
    }
    renderBoard();
    // If AI mode but AI is O, it's X turn first, no AI move needed.
}

// Build interactive grid
function buildGrid() {
    gridContainer.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-idx', i);
        cell.addEventListener('click', (function(idx) {
            return function() {
                if (!gameActive) return;
                if (board[idx] !== null) return;
                
                if (currentGameMode === 'twoPlayer') {
                    makeMove(idx, currentPlayer);
                } 
                else if (currentGameMode === 'vsAI') {
                    // Human is X only
                    if (currentPlayer === 'X') {
                        makeMove(idx, 'X');
                    } else {
                        statusMsgSpan.innerHTML = '🤖 AI is thinking ...';
                        setTimeout(() => updateUI(), 400);
                    }
                }
            };
        })(i));
        gridContainer.appendChild(cell);
    }
    renderBoard();
}

// Event Listeners
document.getElementById('selectTwoPlayer').addEventListener('click', () => startGameWithMode('twoPlayer'));
document.getElementById('selectVsAI').addEventListener('click', () => startGameWithMode('vsAI'));
newMatchBtnGame.addEventListener('click', () => newMatch());
resetBoardBtn.addEventListener('click', () => fullResetGame());
exitToMenuBtn.addEventListener('click', () => exitToMenu());
modalNewMatch.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    newMatch();
});
modalExitMenu.addEventListener('click', () => {
    gameOverModal.classList.remove('active');
    exitToMenu();
});

// initialization
buildGrid();
fullResetGame();
gameWrapper.classList.remove('visible');
selectionScreen.classList.remove('hide');
