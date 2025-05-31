class PacManGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameOver = false;
        
        // Game settings
        this.tileSize = 25;
        this.rows = 24;
        this.cols = 32;
        
        // Game entities
        this.pacman = {
            x: 15,
            y: 18,
            direction: 'right',
            nextDirection: 'right',
            mouthOpen: true
        };
        
        this.ghosts = [
            { x: 15, y: 11, direction: 'up', color: '#ff0000', startX: 15, startY: 11, eaten: false },
            { x: 16, y: 11, direction: 'down', color: '#ffb8ff', startX: 16, startY: 11, eaten: false },
            { x: 15, y: 12, direction: 'left', color: '#00ffff', startX: 15, startY: 12, eaten: false },
            { x: 16, y: 12, direction: 'right', color: '#ffb852', startX: 16, startY: 12, eaten: false }
        ];
        
        this.dots = [];
        this.powerPellets = [];
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.moveCounter = 0;
        this.ghostMoveCounter = 0;
        
        // Game map (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
        this.map = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,1,1,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,1,2,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,1,2,1,0,0,0,0,0],
            [0,0,0,0,0,1,2,1,1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,1,2,1,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
            [0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0],
            [1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
            [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
            [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
            [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,1,1,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        this.initializeGame();
        this.bindEvents();
        this.gameLoop();
    }
    
    initializeGame() {
        // Initialize dots and power pellets
        this.dots = [];
        this.powerPellets = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.map[row][col] === 2) {
                    this.dots.push({ x: col, y: row });
                } else if (this.map[row][col] === 3) {
                    this.powerPellets.push({ x: col, y: row });
                }
            }
        }
        
        this.updateUI();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning && e.code === 'Space') {
                this.startGame();
                return;
            }
            
            if (this.gameRunning) {
                switch (e.code) {
                    case 'ArrowUp':
                        this.pacman.nextDirection = 'up';
                        break;
                    case 'ArrowDown':
                        this.pacman.nextDirection = 'down';
                        break;
                    case 'ArrowLeft':
                        this.pacman.nextDirection = 'left';
                        break;
                    case 'ArrowRight':
                        this.pacman.nextDirection = 'right';
                        break;
                    case 'Space':
                        this.pauseGame();
                        break;
                }
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    startGame() {
        this.gameRunning = true;
    }
    
    pauseGame() {
        this.gameRunning = !this.gameRunning;
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.gameRunning = false;
        this.powerMode = false;
        this.powerModeTimer = 0;
        
        // Reset positions
        this.pacman = {
            x: 1,
            y: 1,
            direction: 'right',
            nextDirection: 'right',
            mouthOpen: true
        };
        
        this.ghosts.forEach((ghost, index) => {
            ghost.x = ghost.startX;
            ghost.y = ghost.startY;
        });
        
        this.initializeGame();
        document.getElementById('gameOver').classList.add('hidden');
    }
    
    canMove(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) {
            return false;
        }
        return this.map[y][x] !== 1;
    }
    
    movePacman() {
        // Only move Pac-Man every 8th frame to control speed
        this.moveCounter++;
        if (this.moveCounter < 8) return;
        this.moveCounter = 0;
        
        // Try to change direction if possible
        let nextX = this.pacman.x;
        let nextY = this.pacman.y;
        
        switch (this.pacman.nextDirection) {
            case 'up': nextY--; break;
            case 'down': nextY++; break;
            case 'left': nextX--; break;
            case 'right': nextX++; break;
        }
        
        if (this.canMove(nextX, nextY)) {
            this.pacman.direction = this.pacman.nextDirection;
        }
        
        // Move in current direction
        switch (this.pacman.direction) {
            case 'up': this.pacman.y--; break;
            case 'down': this.pacman.y++; break;
            case 'left': this.pacman.x--; break;
            case 'right': this.pacman.x++; break;
        }
        
        // Tunnel effect (wrap around)
        if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
        if (this.pacman.x >= this.cols) this.pacman.x = 0;
        
        // Check if move is valid, if not, don't move
        if (!this.canMove(this.pacman.x, this.pacman.y)) {
            switch (this.pacman.direction) {
                case 'up': this.pacman.y++; break;
                case 'down': this.pacman.y--; break;
                case 'left': this.pacman.x++; break;
                case 'right': this.pacman.x--; break;
            }
        }
        
        this.pacman.mouthOpen = !this.pacman.mouthOpen;
    }
    
    moveGhosts() {
        // Only move ghosts every 12th frame to slow them down
        this.ghostMoveCounter++;
        if (this.ghostMoveCounter < 12) return;
        this.ghostMoveCounter = 0;
        
        this.ghosts.forEach(ghost => {
            // Don't move if recently eaten
            if (ghost.eaten) return;
            
            const directions = ['up', 'down', 'left', 'right'];
            let validMoves = [];
            
            directions.forEach(dir => {
                let newX = ghost.x;
                let newY = ghost.y;
                
                switch (dir) {
                    case 'up': newY--; break;
                    case 'down': newY++; break;
                    case 'left': newX--; break;
                    case 'right': newX++; break;
                }
                
                if (this.canMove(newX, newY)) {
                    validMoves.push(dir);
                }
            });
            
            // Simple AI: prefer moving towards Pac-Man (unless in power mode)
            if (!this.powerMode && Math.random() < 0.6) {
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    const preferredDir = dx > 0 ? 'right' : 'left';
                    if (validMoves.includes(preferredDir)) {
                        ghost.direction = preferredDir;
                    }
                } else {
                    const preferredDir = dy > 0 ? 'down' : 'up';
                    if (validMoves.includes(preferredDir)) {
                        ghost.direction = preferredDir;
                    }
                }
            } else if (this.powerMode) {
                // In power mode, try to run away from Pac-Man
                const dx = this.pacman.x - ghost.x;
                const dy = this.pacman.y - ghost.y;
                
                if (Math.abs(dx) > Math.abs(dy)) {
                    const preferredDir = dx > 0 ? 'left' : 'right';
                    if (validMoves.includes(preferredDir)) {
                        ghost.direction = preferredDir;
                    }
                } else {
                    const preferredDir = dy > 0 ? 'up' : 'down';
                    if (validMoves.includes(preferredDir)) {
                        ghost.direction = preferredDir;
                    }
                }
            }
            
            // If current direction is not valid, choose random valid direction
            if (!validMoves.includes(ghost.direction)) {
                ghost.direction = validMoves[Math.floor(Math.random() * validMoves.length)];
            }
            
            // Move ghost
            switch (ghost.direction) {
                case 'up': ghost.y--; break;
                case 'down': ghost.y++; break;
                case 'left': ghost.x--; break;
                case 'right': ghost.x++; break;
            }
            
            // Tunnel effect
            if (ghost.x < 0) ghost.x = this.cols - 1;
            if (ghost.x >= this.cols) ghost.x = 0;
        });
    }
    
    checkCollisions() {
        // Check dot collection
        for (let i = this.dots.length - 1; i >= 0; i--) {
            const dot = this.dots[i];
            if (dot.x === this.pacman.x && dot.y === this.pacman.y) {
                this.dots.splice(i, 1);
                this.score += 10;
            }
        }
        
        // Check power pellet collection
        for (let i = this.powerPellets.length - 1; i >= 0; i--) {
            const pellet = this.powerPellets[i];
            if (pellet.x === this.pacman.x && pellet.y === this.pacman.y) {
                this.powerPellets.splice(i, 1);
                this.score += 50;
                this.powerMode = true;
                this.powerModeTimer = 1800; // ~30 seconds at 60 FPS
            }
        }
        
        // Check ghost collisions
        this.ghosts.forEach((ghost, index) => {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (this.powerMode) {
                    // Eat ghost
                    this.score += 200;
                    // Reset ghost to center
                    ghost.x = ghost.startX;
                    ghost.y = ghost.startY;
                    ghost.eaten = true;
                    setTimeout(() => {
                        ghost.eaten = false;
                    }, 1000);
                } else {
                    // Lose life
                    this.lives--;
                    if (this.lives <= 0) {
                        this.endGame();
                    } else {
                        this.resetPositions();
                    }
                }
            }
        });
        
        // Check win condition
        if (this.dots.length === 0 && this.powerPellets.length === 0) {
            this.score += 1000;
            this.initializeGame(); // Start new level
        }
    }
    
    resetPositions() {
        this.pacman.x = 15;
        this.pacman.y = 18;
        this.pacman.direction = 'right';
        this.pacman.nextDirection = 'right';
        
        this.ghosts.forEach(ghost => {
            ghost.x = ghost.startX;
            ghost.y = ghost.startY;
        });
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        this.ctx.fillStyle = '#0000ff';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.map[row][col] === 1) {
                    this.ctx.fillRect(
                        col * this.tileSize,
                        row * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
        
        // Draw dots
        this.ctx.fillStyle = '#ffff00';
        this.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                dot.x * this.tileSize + this.tileSize / 2,
                dot.y * this.tileSize + this.tileSize / 2,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw power pellets
        this.ctx.fillStyle = '#ffff00';
        this.powerPellets.forEach(pellet => {
            this.ctx.beginPath();
            this.ctx.arc(
                pellet.x * this.tileSize + this.tileSize / 2,
                pellet.y * this.tileSize + this.tileSize / 2,
                8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw Pac-Man
        const pacX = this.pacman.x * this.tileSize + this.tileSize / 2;
        const pacY = this.pacman.y * this.tileSize + this.tileSize / 2;
        
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen) {
            let startAngle = 0;
            let endAngle = Math.PI * 2;
            
            switch (this.pacman.direction) {
                case 'right':
                    startAngle = Math.PI * 0.2;
                    endAngle = Math.PI * 1.8;
                    break;
                case 'left':
                    startAngle = Math.PI * 1.2;
                    endAngle = Math.PI * 0.8;
                    break;
                case 'up':
                    startAngle = Math.PI * 1.7;
                    endAngle = Math.PI * 1.3;
                    break;
                case 'down':
                    startAngle = Math.PI * 0.7;
                    endAngle = Math.PI * 0.3;
                    break;
            }
            
            this.ctx.arc(pacX, pacY, this.tileSize / 2 - 2, startAngle, endAngle);
            this.ctx.lineTo(pacX, pacY);
        } else {
            this.ctx.arc(pacX, pacY, this.tileSize / 2 - 2, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            const ghostX = ghost.x * this.tileSize + this.tileSize / 2;
            const ghostY = ghost.y * this.tileSize + this.tileSize / 2;
            
            if (this.powerMode && this.powerModeTimer > 80 && !ghost.eaten) {
                this.ctx.fillStyle = '#0000ff';
            } else if (this.powerMode && this.powerModeTimer <= 80 && !ghost.eaten) {
                this.ctx.fillStyle = this.powerModeTimer % 10 < 5 ? '#0000ff' : '#ffffff';
            } else if (ghost.eaten) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            } else {
                this.ctx.fillStyle = ghost.color;
            }
            
            // Ghost body
            this.ctx.beginPath();
            this.ctx.arc(ghostX, ghostY - 2, this.tileSize / 2 - 2, Math.PI, 0);
            this.ctx.rect(
                ghostX - this.tileSize / 2 + 2,
                ghostY - 2,
                this.tileSize - 4,
                this.tileSize / 2
            );
            this.ctx.fill();
            
            // Ghost bottom (wavy)
            this.ctx.beginPath();
            for (let i = 0; i < 4; i++) {
                const x = ghostX - this.tileSize / 2 + 2 + (i * (this.tileSize - 4)) / 3;
                const y = ghostY + this.tileSize / 2 - 2 + (i % 2 === 0 ? -3 : 0);
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.lineTo(ghostX + this.tileSize / 2 - 2, ghostY + this.tileSize / 2 - 2);
            this.ctx.lineTo(ghostX - this.tileSize / 2 + 2, ghostY + this.tileSize / 2 - 2);
            this.ctx.fill();
            
            // Ghost eyes (don't draw eyes if ghost is eaten)
            if ((!this.powerMode || this.powerModeTimer <= 80) && !ghost.eaten) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(ghostX - 6, ghostY - 8, 4, 6);
                this.ctx.fillRect(ghostX + 2, ghostY - 8, 4, 6);
                
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(ghostX - 5, ghostY - 6, 2, 2);
                this.ctx.fillRect(ghostX + 3, ghostY - 6, 2, 2);
            }
        });
    }
    
    gameLoop() {
        if (this.gameRunning && !this.gameOver) {
            this.movePacman();
            this.moveGhosts();
            this.checkCollisions();
            
            if (this.powerMode) {
                this.powerModeTimer--;
                if (this.powerModeTimer <= 0) {
                    this.powerMode = false;
                }
            }
            
            this.updateUI();
        }
        
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new PacManGame();
});