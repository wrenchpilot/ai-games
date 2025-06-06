class GorillasGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.currentPlayer = 1;
        this.gameOver = false;
        this.scores = [0, 0];
        this.buildings = [];
        this.gorillas = [];
        this.projectile = null;
        this.explosions = [];
        this.wind = 0;
        this.isAiThinking = false;
        this.lastPlayerSettings = { angle: 45, velocity: 50 };
        this.aiLearning = {
            totalShots: 0,
            hits: 0,
            lastSuccessfulShot: null,
            adaptationFactor: 1.0
        };
        
        // Sound effects
        this.sounds = {
            throw: this.createAudioContext(),
            explosion: this.createAudioContext(),
            hit: this.createAudioContext()
        };
        
        // UI elements
        this.angleInput = document.getElementById('angle');
        this.velocityInput = document.getElementById('velocity');
        this.fireButton = document.getElementById('fireButton');
        this.playerTurn = document.getElementById('playerTurn');
        this.gameStatus = document.getElementById('gameStatus');
        this.score1 = document.getElementById('score1');
        this.score2 = document.getElementById('score2');
        
        this.init();
    }
    
    createAudioContext() {
        // Create simple sound effects using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        return audioContext;
    }
    
    playThrowSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playExplosionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    init() {
        this.generateBuildings();
        this.placeGorillas();
        this.generateWind();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    generateBuildings() {
        this.buildings = [];
        const numBuildings = 8;
        const buildingWidth = this.width / numBuildings;
        
        for (let i = 0; i < numBuildings; i++) {
            const height = Math.random() * 200 + 150;
            this.buildings.push({
                x: i * buildingWidth,
                y: this.height - height,
                width: buildingWidth,
                height: height,
                color: this.getRandomBuildingColor(),
                windows: this.generateWindows(i * buildingWidth, this.height - height, buildingWidth, height)
            });
        }
    }
    
    getRandomBuildingColor() {
        const colors = ['#444', '#555', '#666', '#333', '#777'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    generateWindows(buildingX, buildingY, buildingWidth, buildingHeight) {
        const windows = [];
        const windowWidth = 8;
        const windowHeight = 12;
        const windowSpacingX = 20;
        const windowSpacingY = 25;
        
        for (let x = buildingX + 10; x < buildingX + buildingWidth - windowWidth; x += windowSpacingX) {
            for (let y = buildingY + 15; y < buildingY + buildingHeight - windowHeight; y += windowSpacingY) {
                windows.push({
                    x: x,
                    y: y,
                    width: windowWidth,
                    height: windowHeight,
                    color: Math.random() > 0.3 ? '#ffff88' : '#333'
                });
            }
        }
        
        return windows;
    }
    
    placeGorillas() {
        this.gorillas = [];
        
        // Player 1 gorilla (left side)
        const building1 = this.buildings[1];
        this.gorillas.push({
            x: building1.x + building1.width / 2,
            y: building1.y,
            player: 1,
            alive: true,
            facing: 'right'
        });
        
        // Player 2 gorilla (right side)
        const building2 = this.buildings[this.buildings.length - 2];
        this.gorillas.push({
            x: building2.x + building2.width / 2,
            y: building2.y,
            player: 2,
            alive: true,
            facing: 'left'
        });
    }
    
    generateWind() {
        this.wind = (Math.random() - 0.5) * 10;
        this.updateStatus(`Wind: ${this.wind.toFixed(1)} ${this.wind > 0 ? 'E' : 'W'}`);
    }
    
    setupEventListeners() {
        this.fireButton.addEventListener('click', () => this.fire());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.fire();
            }
        });
    }
    
    fire() {
        if (this.gameOver || this.projectile || this.isAiThinking) return;
        
        const angle = parseInt(this.angleInput.value);
        const velocity = parseInt(this.velocityInput.value);
        
        if (isNaN(angle) || isNaN(velocity)) return;
        
        // Save player 1's settings
        if (this.currentPlayer === 1) {
            this.lastPlayerSettings.angle = angle;
            this.lastPlayerSettings.velocity = velocity;
        }
        
        const gorilla = this.gorillas[this.currentPlayer - 1];
        const radians = (angle * Math.PI) / 180;
        
        // Adjust direction based on which player is shooting
        const direction = this.currentPlayer === 1 ? 1 : -1;
        
        // Start projectile from gorilla's arm position
        this.projectile = {
            x: gorilla.x + (direction * 20),
            y: gorilla.y - 25,
            vx: Math.cos(radians) * velocity * 0.15 * direction,
            vy: -Math.sin(radians) * velocity * 0.15,
            trail: [],
            rotation: 0
        };
        
        // Play throw sound
        this.playThrowSound();
        
        this.fireButton.disabled = true;
        this.updateStatus('Banana in flight...');
    }
    
    updateProjectile() {
        if (!this.projectile) return;
        
        // Add current position to trail
        this.projectile.trail.push({x: this.projectile.x, y: this.projectile.y});
        if (this.projectile.trail.length > 15) {
            this.projectile.trail.shift();
        }
        
        // Apply physics
        this.projectile.x += this.projectile.vx;
        this.projectile.y += this.projectile.vy;
        this.projectile.vy += 0.15; // gravity
        this.projectile.vx += this.wind * 0.005; // wind effect
        
        // Update rotation for banana animation
        this.projectile.rotation += 0.3;
        
        // Check collisions
        this.checkCollisions();
        
        // Check if projectile is off screen (only if projectile still exists after collision check)
        if (this.projectile && (this.projectile.x < 0 || this.projectile.x > this.width || this.projectile.y > this.height)) {
            this.projectile = null;
            this.nextTurn();
        }
    }
    
    checkCollisions() {
        if (!this.projectile) return;
        
        // Check gorilla collisions
        for (let gorilla of this.gorillas) {
            if (!gorilla.alive) continue;
            
            const dx = this.projectile.x - gorilla.x;
            const dy = this.projectile.y - gorilla.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only check collision if projectile has moved away from starting position
            if (distance < 25 && this.projectile.trail.length > 5) {
                this.hitGorilla(gorilla);
                return;
            }
        }
        
        // Check building collisions
        for (let building of this.buildings) {
            if (this.projectile.x >= building.x && 
                this.projectile.x <= building.x + building.width &&
                this.projectile.y >= building.y) {
                this.hitBuilding(building);
                return;
            }
        }
    }
    
    hitGorilla(gorilla) {
        gorilla.alive = false;
        this.createExplosion(this.projectile.x, this.projectile.y);
        this.playExplosionSound();
        this.projectile = null;
        
        const winner = gorilla.player === 1 ? 2 : 1;
        this.scores[winner - 1]++;
        this.updateScores();
        
        // Track AI performance for learning
        if (winner === 2) {
            this.aiLearning.hits++;
            this.aiLearning.lastSuccessfulShot = {
                angle: parseInt(this.angleInput.value),
                velocity: parseInt(this.velocityInput.value),
                wind: this.wind
            };
        }
        
        this.updateStatus(`Player ${winner} wins this round!`);
        
        setTimeout(() => {
            if (this.scores[0] >= 3 || this.scores[1] >= 3) {
                this.endGame();
            } else {
                this.newRound();
            }
        }, 2000);
    }
    
    hitBuilding(building) {
        this.createExplosion(this.projectile.x, this.projectile.y);
        this.playExplosionSound();
        
        // Create circular hole in building
        const holeSize = 60;
        const holeX = this.projectile.x - building.x;
        const holeY = this.projectile.y - building.y;
        
        if (!building.holes) building.holes = [];
        building.holes.push({
            x: holeX,
            y: holeY,
            width: holeSize
        });
        
        this.projectile = null;
        this.nextTurn();
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 30,
            life: 30
        });
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            explosion.radius += explosion.maxRadius / 30;
            explosion.life--;
            return explosion.life > 0;
        });
    }
    
    nextTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.playerTurn.textContent = `Player ${this.currentPlayer}'s Turn`;
        
        if (this.currentPlayer === 2) {
            // AI turn - disable player controls
            this.updateStatus('AI is thinking...');
            this.fireButton.disabled = true;
            this.angleInput.disabled = true;
            this.velocityInput.disabled = true;
            this.isAiThinking = true;
            
            setTimeout(() => {
                this.makeAiMove();
            }, 1500); // Give AI time to "think"
        } else {
            // Player 1's turn - enable controls and restore their settings
            this.fireButton.disabled = false;
            this.angleInput.disabled = false;
            this.velocityInput.disabled = false;
            this.angleInput.value = this.lastPlayerSettings.angle;
            this.velocityInput.value = this.lastPlayerSettings.velocity;
            this.updateStatus(`Player ${this.currentPlayer}, aim and fire!`);
        }
        
        // Update gorilla facing direction
        this.gorillas[0].facing = this.currentPlayer === 1 ? 'right' : 'left';
        this.gorillas[1].facing = this.currentPlayer === 2 ? 'left' : 'right';
    }
    
    newRound() {
        this.generateBuildings();
        this.placeGorillas();
        this.generateWind();
        this.projectile = null;
        this.explosions = [];
        this.currentPlayer = 1;
        this.playerTurn.textContent = `Player ${this.currentPlayer}'s Turn`;
        
        // Enable player 1 controls for new round
        this.fireButton.disabled = false;
        this.angleInput.disabled = false;
        this.velocityInput.disabled = false;
        
        // Restore player 1's last settings
        this.angleInput.value = this.lastPlayerSettings.angle;
        this.velocityInput.value = this.lastPlayerSettings.velocity;
        
        this.updateStatus(`New round! Player ${this.currentPlayer}, aim and fire!`);
    }
    
    endGame() {
        this.gameOver = true;
        const winner = this.scores[0] >= 3 ? 1 : 2;
        const winnerName = winner === 1 ? "You" : "AI";
        this.updateStatus(`🎉 ${winnerName} win${winner === 1 ? "" : "s"} the game! 🎉`);
        this.fireButton.disabled = true;
        
        setTimeout(() => {
            if (confirm(`${winnerName} win${winner === 1 ? "" : "s"}! Play again?`)) {
                this.resetGame();
            }
        }, 1000);
    }
    
    resetGame() {
        this.scores = [0, 0];
        this.updateScores();
        this.gameOver = false;
        this.newRound();
    }
    
    updateScores() {
        this.score1.textContent = this.scores[0];
        this.score2.textContent = this.scores[1];
    }
    
    updateStatus(message) {
        this.gameStatus.textContent = message;
    }
    
    draw() {
        // Clear canvas with solid sky color (matches CSS background)
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw sun
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(this.width - 80, 80, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw buildings
        this.drawBuildings();
        
        // Draw gorillas
        this.drawGorillas();
        
        // Draw projectile
        this.drawProjectile();
        
        // Draw explosions
        this.drawExplosions();
    }
    
    drawBuildings() {
        for (let building of this.buildings) {
            // Draw building base
            this.ctx.fillStyle = building.color;
            this.ctx.fillRect(building.x, building.y, building.width, building.height);
            
            // Draw windows using pre-generated window data
            for (let window of building.windows) {
                // Check if window is not inside a hole (proper circular collision)
                let windowInHole = false;
                if (building.holes) {
                    for (let hole of building.holes) {
                        // Calculate distance from window center to hole center
                        const windowCenterX = window.x + window.width / 2;
                        const windowCenterY = window.y + window.height / 2;
                        const holeCenterX = building.x + hole.x;
                        const holeCenterY = building.y + hole.y;
                        
                        const distance = Math.sqrt(
                            Math.pow(windowCenterX - holeCenterX, 2) + 
                            Math.pow(windowCenterY - holeCenterY, 2)
                        );
                        
                        // If window is within the hole radius, hide it
                        if (distance < hole.width / 2) {
                            windowInHole = true;
                            break;
                        }
                    }
                }
                
                if (!windowInHole) {
                    this.ctx.fillStyle = window.color;
                    this.ctx.fillRect(window.x, window.y, window.width, window.height);
                }
            }
            
            // Draw building outline
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(building.x, building.y, building.width, building.height);
            
            // Draw holes (destroy parts of the building)
            if (building.holes) {
                for (let hole of building.holes) {
                    // Draw hole with sky color instead of transparency
                    this.ctx.fillStyle = '#87ceeb'; // Match sky background
                    this.ctx.beginPath();
                    this.ctx.arc(
                        building.x + hole.x, 
                        building.y + hole.y, 
                        hole.width / 2, 
                        0, 
                        Math.PI * 2
                    );
                    this.ctx.fill();
                }
            }
        }
    }
    
    drawGorillas() {
        for (let gorilla of this.gorillas) {
            if (!gorilla.alive) continue;
            
            this.ctx.save();
            this.ctx.translate(gorilla.x, gorilla.y);
            
            // Gorilla legs (standing on building)
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(-6, -5, 12, 8);
            
            // Gorilla body
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(-12, -25, 24, 20);
            
            // Gorilla head
            this.ctx.fillStyle = '#8b4513';
            this.ctx.beginPath();
            this.ctx.arc(0, -30, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(-5, -32, 3, 0, Math.PI * 2);
            this.ctx.arc(5, -32, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(-5, -32, 1.5, 0, Math.PI * 2);
            this.ctx.arc(5, -32, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Arms
            this.ctx.strokeStyle = '#8b4513';
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            
            if (gorilla.facing === 'right') {
                this.ctx.moveTo(12, -20);
                this.ctx.lineTo(20, -15);
            } else {
                this.ctx.moveTo(-12, -20);
                this.ctx.lineTo(-20, -15);
            }
            this.ctx.stroke();
            
            // Player indicator
            this.ctx.fillStyle = gorilla.player === 1 ? '#ff0000' : '#0000ff';
            this.ctx.font = 'bold 14px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(gorilla.player, 0, -50);
            
            this.ctx.restore();
        }
    }
    
    drawProjectile() {
        if (!this.projectile) return;
        
        // Draw trail
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        for (let i = 0; i < this.projectile.trail.length; i++) {
            const point = this.projectile.trail[i];
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();
        
        // Draw animated banana
        this.ctx.save();
        this.ctx.translate(this.projectile.x, this.projectile.y);
        this.ctx.rotate(this.projectile.rotation);
        
        // Banana body (yellow)
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Banana curve (darker yellow)
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.ellipse(-2, 0, 6, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Banana tip (brown)
        this.ctx.fillStyle = '#8b4513';
        this.ctx.beginPath();
        this.ctx.ellipse(6, 0, 2, 1, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Banana stem (brown)
        this.ctx.fillStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.ellipse(-6, 0, 1.5, 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawExplosions() {
        for (let explosion of this.explosions) {
            const alpha = explosion.life / 30;
            this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.7})`;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    gameLoop() {
        this.updateProjectile();
        this.updateExplosions();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    makeAiMove() {
        if (this.currentPlayer !== 2 || this.gameOver || this.projectile) return;
        
        const aiGorilla = this.gorillas[1];
        const targetGorilla = this.gorillas[0];
        
        // Track total shots for learning
        this.aiLearning.totalShots++;
        
        // Calculate basic trajectory to target
        const dx = targetGorilla.x - aiGorilla.x;
        const dy = targetGorilla.y - aiGorilla.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate AI skill improvement based on performance
        const successRate = this.aiLearning.totalShots > 0 ? this.aiLearning.hits / this.aiLearning.totalShots : 0;
        const totalRounds = this.scores[0] + this.scores[1];
        
        // AI gets progressively better: starts at 70% accuracy, improves to 90% by round 10
        const baseSkill = 0.7 + Math.min(totalRounds * 0.02, 0.2); // 70% to 90%
        const adaptiveSkill = Math.min(baseSkill + successRate * 0.1, 0.95); // Cap at 95%
        
        // Randomness factor decreases as AI gets smarter
        const maxRandomness = 0.3 - Math.min(totalRounds * 0.01, 0.15); // 30% to 15% randomness
        const randomFactor = 1.0 + (Math.random() - 0.5) * maxRandomness;
        
        // Wind compensation improves over time
        const windCompensation = Math.min(0.5 + totalRounds * 0.05, 1.0); // 50% to 100% wind compensation
        const windAdjustment = this.wind * -3 * windCompensation;
        
        // Calculate angle and velocity with improved logic
        let angle, velocity;
        
        // Use successful shot data if available and similar conditions
        if (this.aiLearning.lastSuccessfulShot && Math.abs(this.wind - this.aiLearning.lastSuccessfulShot.wind) < 2) {
            // Learn from previous success with some variation
            angle = this.aiLearning.lastSuccessfulShot.angle + (Math.random() - 0.5) * 10 * (1 - adaptiveSkill);
            velocity = this.aiLearning.lastSuccessfulShot.velocity + (Math.random() - 0.5) * 15 * (1 - adaptiveSkill);
        } else {
            // Calculate based on distance with improved accuracy
            if (distance < 200) {
                // Close range - high arc
                angle = 65 + Math.random() * 15 * (1 - adaptiveSkill); // Tighter range as AI improves
                velocity = 35 + Math.random() * 25 * (1 - adaptiveSkill);
            } else if (distance < 400) {
                // Medium range
                angle = 40 + Math.random() * 20 * (1 - adaptiveSkill);
                velocity = 50 + Math.random() * 30 * (1 - adaptiveSkill);
            } else {
                // Long range - lower arc
                angle = 30 + Math.random() * 25 * (1 - adaptiveSkill);
                velocity = 70 + Math.random() * 25 * (1 - adaptiveSkill);
            }
        }
        
        // Apply skill-based adjustments
        angle *= randomFactor;
        velocity *= randomFactor;
        
        // Apply improved wind compensation
        velocity += Math.abs(windAdjustment);
        if (this.wind > 0) {
            angle -= Math.abs(this.wind) * 0.5 * windCompensation; // Adjust angle for crosswind
        } else {
            angle += Math.abs(this.wind) * 0.5 * windCompensation;
        }
        
        // Clamp values to valid ranges
        angle = Math.max(5, Math.min(85, angle));
        velocity = Math.max(10, Math.min(95, velocity));
        
        // Set AI inputs (for visual feedback)
        this.angleInput.value = Math.round(angle);
        this.velocityInput.value = Math.round(velocity);
        
        // Show AI difficulty status
        const difficultyLevel = totalRounds < 3 ? "Easy" : totalRounds < 6 ? "Medium" : "Hard";
        this.updateStatus(`AI is thinking... (${difficultyLevel} mode)`);
        
        // Fire after a short delay
        setTimeout(() => {
            this.isAiThinking = false;
            this.fire();
        }, 500);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GorillasGame();
});