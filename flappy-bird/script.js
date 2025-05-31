// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverElement = document.getElementById('gameOver');
const instructionsElement = document.getElementById('instructions');
const restartBtn = document.getElementById('restartBtn');

// Game state
let gameState = 'waiting'; // waiting, playing, gameOver
let score = 0;
let highScore = localStorage.getItem('flappyHighScore') || 0;
highScoreElement.textContent = highScore;

// Bird properties
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -8,
    color: '#ffff00'
};

// Pipe properties
const pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
const pipeSpeed = 2;

// Particle system for effects
const particles = [];

// Initialize high score display
updateHighScore();

// Particle class for visual effects
class Particle {
    constructor(x, y, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1;
        this.decay = 0.02;
        this.color = color;
        this.size = Math.random() * 3 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

// Create pipe
function createPipe() {
    const groundLevel = canvas.height * 0.75;
    const maxPipeHeight = groundLevel - pipeGap - 50; // Ensure gap + bottom pipe doesn't go below ground
    const pipeHeight = Math.random() * (maxPipeHeight - 50) + 50;
    const bottomPipeTop = pipeHeight + pipeGap;
    const bottomPipeHeight = groundLevel - bottomPipeTop;
    
    pipes.push({
        x: canvas.width,
        topHeight: pipeHeight,
        bottomY: bottomPipeTop,
        bottomHeight: bottomPipeHeight,
        scored: false
    });
}

// Draw bird with retro pixel art style
function drawBird() {
    // Bird body (main yellow square)
    ctx.fillStyle = bird.color;
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    
    // Bird outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
    
    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(bird.x + 12, bird.y + 5, 4, 4);
    ctx.fillStyle = '#fff';
    ctx.fillRect(bird.x + 13, bird.y + 6, 2, 2);
    
    // Beak
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(bird.x + bird.width, bird.y + 8, 6, 4);
    ctx.strokeRect(bird.x + bird.width, bird.y + 8, 6, 4);
    
    // Wing
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(bird.x + 4, bird.y + 10, 8, 6);
    ctx.strokeRect(bird.x + 4, bird.y + 10, 8, 6);
}

// Draw pipes with retro style
function drawPipes() {
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
        
        // Pipe outlines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, pipe.bottomHeight);
        
        // Pipe caps
        ctx.fillStyle = '#00cc66';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
    });
}

// Draw background elements
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98d8e8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.75);
    
    // Ground
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, canvas.height * 0.75, canvas.width, canvas.height * 0.25);
    
    // Ground pattern
    ctx.fillStyle = '#7cc87c';
    for (let x = 0; x < canvas.width; x += 20) {
        ctx.fillRect(x, canvas.height * 0.75, 10, canvas.height * 0.25);
    }
    
    // Clouds
    drawClouds();
}

// Draw retro pixel clouds
function drawClouds() {
    ctx.fillStyle = '#ffffff';
    
    // Cloud 1
    drawPixelCloud(80, 100);
    drawPixelCloud(250, 80);
    drawPixelCloud(320, 120);
}

function drawPixelCloud(x, y) {
    const cloudPattern = [
        [0,1,1,1,0],
        [1,1,1,1,1],
        [1,1,1,1,1],
        [0,1,1,1,0]
    ];
    
    const pixelSize = 8;
    for (let row = 0; row < cloudPattern.length; row++) {
        for (let col = 0; col < cloudPattern[row].length; col++) {
            if (cloudPattern[row][col]) {
                ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    particles.forEach(particle => particle.draw());
}

// Add explosion effect
function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, '#ff6b6b'));
    }
}

// Update game
function update() {
    if (gameState !== 'playing') return;
    
    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Create new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
        createPipe();
    }
    
    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        
        // Score when passing pipe
        if (!pipes[i].scored && pipes[i].x + pipeWidth < bird.x) {
            score++;
            pipes[i].scored = true;
            scoreElement.textContent = score;
            
            // Add score particles
            for (let j = 0; j < 5; j++) {
                particles.push(new Particle(bird.x, bird.y, '#ffd93d'));
            }
        }
        
        // Remove off-screen pipes
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }
    
    // Check collisions
    checkCollisions();
    
    // Update particles
    updateParticles();
}

// Check collisions
function checkCollisions() {
    // Ground and ceiling collision
    if (bird.y + bird.height >= canvas.height * 0.75 || bird.y <= 0) {
        gameOver();
        return;
    }
    
    // Pipe collision
    pipes.forEach(pipe => {
        if (bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > pipe.bottomY)) {
            gameOver();
        }
    });
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    createExplosion(bird.x + bird.width/2, bird.y + bird.height/2);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        updateHighScore();
    }
    
    finalScoreElement.textContent = score;
    instructionsElement.style.display = 'none';
    gameOverElement.style.display = 'block';
}

// Update high score display
function updateHighScore() {
    highScoreElement.textContent = highScore;
}

// Jump
function jump() {
    if (gameState === 'waiting') {
        gameState = 'playing';
        instructionsElement.style.display = 'none';
    }
    
    if (gameState === 'playing') {
        bird.velocity = bird.jumpPower;
        
        // Add jump particles
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(bird.x, bird.y + bird.height, '#00ff88'));
        }
    }
}

// Restart game
function restart() {
    gameState = 'waiting';
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    particles.length = 0;
    
    scoreElement.textContent = score;
    gameOverElement.style.display = 'none';
    instructionsElement.style.display = 'block';
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw everything
    drawBackground();
    drawPipes();
    drawBird();
    drawParticles();
    
    // Update game
    update();
    
    requestAnimationFrame(gameLoop);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);
restartBtn.addEventListener('click', restart);

// Prevent context menu on right click
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Start game loop
gameLoop();