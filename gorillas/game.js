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
        
        // Store current status message for canvas rendering
        this.statusMessage = "";
        
        // Game statistics
        this.gameStats = {
            startTime: Date.now(),
            totalRounds: 0,
            shotsTotal: 0,
            shotsHit: 0
        };
        
        // Day/night cycle
        this.isNight = Math.random() > 0.5; // Random start
        this.skyElements = [];
        
        // Initialize wind values before generating sky elements
        this.windSpeed = 0;
        this.windDirection = 1;
        
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
        this.player1Turn = document.getElementById('player1Turn');
        this.player2Turn = document.getElementById('player2Turn');
        this.gameStatus = document.getElementById('gameStatus');
        this.score1 = document.getElementById('score1');
        this.score2 = document.getElementById('score2');
        this.windInfo = document.getElementById('windInfo');
        
        // Modal elements
        this.gameOverModal = document.getElementById('gameOverModal');
        this.gameOverTitle = document.getElementById('gameOverTitle');
        this.winnerText = document.getElementById('winnerText');
        this.finalScore = document.getElementById('finalScore');
        this.totalRounds = document.getElementById('totalRounds');
        this.aiStats = document.getElementById('aiStats');
        this.gameDuration = document.getElementById('gameDuration');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.modalContent = document.querySelector('.modal-content');
        
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
        this.generateSkyElements(); // Move sky generation after wind is set
        
        // Initialize turn indicators
        this.player1Turn.classList.add('active');
        this.player2Turn.classList.remove('active');
        
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
        // Wind speed: 0-10 (always positive)
        this.windSpeed = Math.random() * 10;
        // Wind direction: 1 for East (right), -1 for West (left)
        this.windDirection = Math.random() > 0.5 ? 1 : -1;
        // Combined wind effect for projectile physics (can be negative)
        this.wind = this.windSpeed * this.windDirection;
        
        const directionText = this.windDirection > 0 ? 'E' : 'W';
        this.windInfo.textContent = `${this.windSpeed.toFixed(1)} ${directionText}`;
    }
    
    setupEventListeners() {
        this.fireButton.addEventListener('click', () => this.fire());
        
        // Add input event listeners for real-time trajectory updates
        this.angleInput.addEventListener('input', () => {
            // Force a redraw to update trajectory indicator
            this.draw();
        });
        
        this.velocityInput.addEventListener('input', () => {
            // Force a redraw to update trajectory indicator
            this.draw();
        });
        
        // Modal event listeners
        this.playAgainBtn.addEventListener('click', () => {
            this.hideModal();
            this.resetGame();
        });
        
        // Prevent propagation from modal content to prevent closing when clicking on the content
        this.modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            // Only allow controls during player 1's turn
            if (this.currentPlayer !== 1 || this.gameOver || this.projectile || this.isAiThinking) {
                if (e.code === 'Space') {
                    e.preventDefault();
                }
                return;
            }
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.fire();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.adjustVelocity(1);
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.adjustVelocity(-1);
                    break;
                    
                case 'ArrowLeft':
                    e.preventDefault();
                    this.adjustAngle(-1);
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    this.adjustAngle(1);
                    break;
            }
        });    }
    
    adjustAngle(delta) {
        const currentAngle = parseInt(this.angleInput.value) || 45;
        const newAngle = Math.max(0, Math.min(90, currentAngle + delta));
        this.angleInput.value = newAngle;
        
        // Visual feedback - briefly highlight the input
        this.angleInput.style.backgroundColor = '#ffff88';
        setTimeout(() => {
            this.angleInput.style.backgroundColor = '';
        }, 150);
    }
    
    adjustVelocity(delta) {
        const currentVelocity = parseInt(this.velocityInput.value) || 50;
        const newVelocity = Math.max(1, Math.min(100, currentVelocity + delta));
        this.velocityInput.value = newVelocity;
        
        // Visual feedback - briefly highlight the input
        this.velocityInput.style.backgroundColor = '#ffff88';
        setTimeout(() => {
            this.velocityInput.style.backgroundColor = '';
        }, 150);
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
                
                // Check if projectile is hitting a hole (should pass through)
                let hitHole = false;
                if (building.holes) {
                    for (let hole of building.holes) {
                        const holeX = building.x + hole.x;
                        const holeY = building.y + hole.y;
                        const distance = Math.sqrt(
                            (this.projectile.x - holeX) ** 2 + 
                            (this.projectile.y - holeY) ** 2
                        );
                        if (distance < hole.width / 2) {
                            hitHole = true;
                            break;
                        }
                    }
                }
                
                // Only hit building if not hitting a hole
                if (!hitHole) {
                    this.hitBuilding(building);
                    return;
                }
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
        
        const hitX = this.projectile.x - building.x;
        const hitY = this.projectile.y - building.y;
        
        if (!building.holes) building.holes = [];
        
        // Check if this hit is near an existing hole for cumulative damage
        let nearbyHole = null;
        let nearbyDistance = Infinity;
        const maxCombineDistance = 80; // Distance within which holes combine
        
        for (let hole of building.holes) {
            const distance = Math.sqrt(
                Math.pow(hitX - hole.x, 2) + 
                Math.pow(hitY - hole.y, 2)
            );
            
            if (distance < maxCombineDistance && distance < nearbyDistance) {
                nearbyHole = hole;
                nearbyDistance = distance;
            }
        }
        
        if (nearbyHole) {
            // Calculate distance from impact point to hole center
            const distanceToCenter = Math.sqrt(
                Math.pow(hitX - nearbyHole.x, 2) + 
                Math.pow(hitY - nearbyHole.y, 2)
            );
            
            // Calculate how much the hole needs to expand to encompass the new impact point
            const currentRadius = nearbyHole.width / 2;
            const impactExpansionRadius = 30; // Explosion radius from impact point
            const requiredRadius = distanceToCenter + impactExpansionRadius;
            
            // Expand hole to encompass the impact point, but don't move the center
            if (requiredRadius > currentRadius) {
                const newRadius = Math.min(requiredRadius, 75); // Cap maximum hole radius at 75
                nearbyHole.width = newRadius * 2;
            }
            
            // Visual feedback for expanding hole
            this.createExpandedExplosion(this.projectile.x, this.projectile.y, nearbyHole.width);
        } else {
            // Create new hole
            const baseHoleSize = 60;
            building.holes.push({
                x: hitX,
                y: hitY,
                width: baseHoleSize
            });
        }
        
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
    
    createExpandedExplosion(x, y, holeSize) {
        // Create a larger explosion to show hole expansion
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: Math.min(holeSize * 0.6, 50), // Scale with hole size but cap it
            life: 40, // Last longer than regular explosions
            expanded: true // Mark as expanded explosion for different visual effect
        });
    }
    
    updateExplosions() {
        this.explosions = this.explosions.filter(explosion => {
            const maxLife = explosion.expanded ? 40 : 30;
            explosion.radius += explosion.maxRadius / maxLife;
            explosion.life--;
            return explosion.life > 0;
        });
    }
    
    nextTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Update turn indicators
        if (this.currentPlayer === 1) {
            this.player1Turn.classList.add('active');
            this.player2Turn.classList.remove('active');
        } else {
            this.player1Turn.classList.remove('active');
            this.player2Turn.classList.add('active');
        }
        
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
        
        // 30% chance to switch day/night cycle each round
        if (Math.random() < 0.3) {
            this.isNight = !this.isNight;
        }
        this.generateSkyElements();
        
        this.projectile = null;
        this.explosions = [];
        this.currentPlayer = 1;
        
        // Update turn indicators
        this.player1Turn.classList.add('active');
        this.player2Turn.classList.remove('active');
        
        // Enable player 1 controls for new round
        this.fireButton.disabled = false;
        this.angleInput.disabled = false;
        this.velocityInput.disabled = false;
        
        // Restore player 1's last settings
        this.angleInput.value = this.lastPlayerSettings.angle;
        this.velocityInput.value = this.lastPlayerSettings.velocity;
        
        const timeOfDay = this.isNight ? "night" : "day";
        this.updateStatus(`New round! It's ${timeOfDay} time. Player ${this.currentPlayer}, aim and fire!`);
    }
    
    endGame() {
        this.gameOver = true;
        const winner = this.scores[0] >= 3 ? 1 : 2;
        this.updateStatus(`🎉 Game Over! 🎉`);
        this.fireButton.disabled = true;
        
        // Calculate and display game statistics
        this.calculateGameStats();
        this.showModal(winner);
    }
    
    calculateGameStats() {
        // Calculate game duration
        const gameEndTime = Date.now();
        const durationMs = gameEndTime - this.gameStats.startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        this.gameStats.gameDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Calculate total rounds
        this.gameStats.totalRounds = this.scores[0] + this.scores[1];
        
        // Calculate AI difficulty level based on total rounds
        const totalRounds = this.scores[0] + this.scores[1];
        if (totalRounds < 3) {
            this.gameStats.difficulty = "Easy";
        } else if (totalRounds < 6) {
            this.gameStats.difficulty = "Medium";
        } else {
            this.gameStats.difficulty = "Hard";
        }
    }
    
    showModal(winner) {
        const winnerName = winner === 1 ? "You" : "AI";
        
        // Update modal content
        this.winnerText.textContent = `${winnerName} Win${winner === 1 ? "" : "s"}!`;
        this.finalScore.textContent = `${this.scores[0]} - ${this.scores[1]}`;
        this.totalRounds.textContent = this.gameStats.totalRounds;
        this.aiStats.textContent = `Difficulty: ${this.gameStats.difficulty}`;
        this.gameDuration.textContent = this.gameStats.gameDuration;
        
        // Show modal
        this.gameOverModal.style.display = 'flex';
    }
    
    hideModal() {
        this.gameOverModal.style.display = 'none';
    }
    
    resetGame() {
        this.scores = [0, 0];
        this.updateScores();
        this.gameOver = false;
        
        // Reset game statistics
        this.gameStats = {
            startTime: Date.now(),
            totalRounds: 0,
            shotsTotal: 0,
            shotsHit: 0
        };
        
        // Reset AI learning data
        this.aiLearning = {
            totalShots: 0,
            hits: 0,
            lastSuccessfulShot: null,
            adaptationFactor: 1.0
        };
        
        this.newRound();
    }
    
    updateScores() {
        this.score1.textContent = this.scores[0];
        this.score2.textContent = this.scores[1];
    }
    
    updateStatus(message) {
        this.gameStatus.textContent = message;
        this.statusMessage = message; // Store for canvas rendering
    }
    
    draw() {
        // Check for storm clouds to determine sky atmosphere
        const hasStormClouds = this.skyElements.some(element => 
            element.type === 'cloud' && (element.emoji === '🌧️' || element.emoji === '🌨️' || element.emoji === '⛈️' || element.emoji === '🌩️')
        );
        
        // Clear canvas with sky color based on day/night and weather
        let skyColor;
        if (hasStormClouds) {
            // Gray, stormy sky when weather clouds are present
            skyColor = this.isNight ? '#2a2a3a' : '#778899'; // Darker gray for night, lighter gray for day
        } else {
            // Normal sky colors
            skyColor = this.isNight ? '#1a1a2e' : '#87ceeb';
        }
        
        this.ctx.fillStyle = skyColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw sky elements (sun/moon, clouds, stars)
        this.drawSkyElements();
        
        // Draw buildings
        this.drawBuildings();
        
        // Draw gorillas
        this.drawGorillas();
        
        // Draw trajectory indicator
        this.drawTrajectoryIndicator();
        
        // Draw projectile
        this.drawProjectile();
        
        // Draw explosions
        this.drawExplosions();
        
        // Draw game status overlay
        this.drawGameStatus();
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
                    // Check for storm clouds to match sky color
                    const hasStormClouds = this.skyElements.some(element => 
                        element.type === 'cloud' && (element.emoji === '🌧️' || element.emoji === '🌨️' || element.emoji === '⛈️' || element.emoji === '🌩️')
                    );
                    
                    // Draw hole with appropriate sky color
                    let skyColor;
                    if (hasStormClouds) {
                        skyColor = this.isNight ? '#2a2a3a' : '#778899';
                    } else {
                        skyColor = this.isNight ? '#1a1a2e' : '#87ceeb';
                    }
                    
                    this.ctx.fillStyle = skyColor;
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
    
    drawTrajectoryIndicator() {
        // Only show trajectory when it's player 1's turn and no projectile is active
        if (this.gameOver || this.projectile || this.isAiThinking || this.currentPlayer === 2) {
            return;
        }
        
        const angle = parseInt(this.angleInput.value) || 45;
        const velocity = parseInt(this.velocityInput.value) || 50;
        
        if (isNaN(angle) || isNaN(velocity)) return;
        
        const gorilla = this.gorillas[this.currentPlayer - 1];
        const radians = (angle * Math.PI) / 180;
        const direction = this.currentPlayer === 1 ? 1 : -1;
        
        // Starting position (same as projectile)
        let x = gorilla.x + (direction * 20);
        let y = gorilla.y - 25;
        
        // Initial velocity with reduced accuracy (only show approximate trajectory)
        // Add some randomness to make it less precise
        const accuracyFactor = 0.8; // Reduce accuracy to 80%
        let vx = Math.cos(radians) * velocity * 0.15 * direction * accuracyFactor;
        let vy = -Math.sin(radians) * velocity * 0.15 * accuracyFactor;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // More transparent
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        // Simulate trajectory for a limited number of steps (shorter range)
        const maxSteps = 25; // Further reduced from 40 to show minimal trajectory
        const timeStep = 1;
        let lastX = x, lastY = y;
        
        for (let step = 0; step < maxSteps; step++) {
            // Update position using same physics as projectile
            x += vx * timeStep;
            y += vy * timeStep;
            vy += 0.15 * timeStep; // gravity
            vx += this.wind * 0.005 * timeStep; // wind effect
            
            // No random drift - keep trajectory smooth but inaccurate due to reduced accuracy factor
            
            // Stop if trajectory goes off screen or hits ground
            if (x < 0 || x > this.width || y > this.height) {
                break;
            }
            
            // Check if trajectory would hit a building (simplified check)
            let hitBuilding = false;
            for (let building of this.buildings) {
                if (x >= building.x && x <= building.x + building.width &&
                    y >= building.y && y <= building.y + building.height) {
                    // Simplified collision - don't check holes for trajectory indicator
                    hitBuilding = true;
                    break;
                }
            }
            
            if (hitBuilding) {
                // Draw line to approximate impact point (not exact)
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                // Draw a larger, more vague impact indicator
                this.ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 12, 0, Math.PI * 2); // Larger radius for vague indication
                this.ctx.fill();
                this.ctx.restore();
                return;
            }
            
            // Draw trajectory line every few steps for choppier appearance
            if (step % 3 === 0) { // Draw every 3rd step instead of every 2nd
                this.ctx.lineTo(x, y);
            }
            
            lastX = x;
            lastY = y;
        }
        
        // If we reach here, trajectory went off screen
        this.ctx.stroke();
        this.ctx.restore();
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
            const alpha = explosion.life / (explosion.expanded ? 40 : 30);
            
            if (explosion.expanded) {
                // Expanded explosion - different colors and effects
                this.ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = `rgba(255, 150, 0, ${alpha * 0.8})`;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.7, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = `rgba(255, 255, 100, ${alpha * 0.6})`;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Regular explosion
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
    }
    
    drawSkyElements() {
        console.log(`Drawing ${this.skyElements.length} sky elements`); // DEBUG
        for (let element of this.skyElements) {
            this.ctx.save();
            
            if (element.type === 'star') {
                // Draw twinkling stars
                this.ctx.fillStyle = `rgba(255, 255, 255, ${element.brightness})`;
                this.ctx.beginPath();
                this.ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Update twinkling effect
                element.brightness += (Math.random() - 0.5) * 0.1;
                element.brightness = Math.max(0.3, Math.min(1.0, element.brightness));
                
            } else if (element.type === 'cloud') {
                // Draw emoji clouds with drift and varied sizes
                //console.log(`Drawing cloud: ${element.emoji} at (${Math.round(element.x)}, ${Math.round(element.y)}) size: ${element.size}`); // DEBUG
                this.ctx.font = `${element.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(element.emoji, element.x, element.y);
                
                // Update cloud position (slow drift)
                element.x += element.drift;
                if (element.x < -30) element.x = this.width + 30;
                if (element.x > this.width + 30) element.x = -30;
                
            } else if (element.type === 'sun' || element.type === 'moon') {
                // Draw emoji sun or moon at large size
                this.ctx.font = `${element.size}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(element.emoji, element.x, element.y);
            }
            
            this.ctx.restore();
        }
    }
    
    drawGameStatus() {
        if (!this.statusMessage) return;
        
        this.ctx.save();
        
        // Draw semi-transparent background for better readability
        const statusHeight = 40;
        const padding = 10;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black
        this.ctx.fillRect(0, this.height - statusHeight, this.width, statusHeight);
        
        // Add a subtle border on top of the status bar
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height - statusHeight);
        this.ctx.lineTo(this.width, this.height - statusHeight);
        this.ctx.stroke();
        
        // Draw the status text
        this.ctx.font = 'bold 16px "Courier New", monospace';
        this.ctx.fillStyle = '#ffff00'; // Yellow text
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            this.statusMessage, 
            this.width / 2, 
            this.height - statusHeight / 2
        );
        
        this.ctx.restore();
    }

    gameLoop() {
        this.updateProjectile();
        this.updateExplosions();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    makeAiMove() {
        // AI logic to determine angle and velocity
        const angle = Math.random() * 90;
        const velocity = Math.random() * 100;
        
        this.angleInput.value = Math.round(angle);
        this.velocityInput.value = Math.round(velocity);
        
        this.isAiThinking = false;
        this.fire();
    }

    generateSkyElements() {
        this.skyElements = [];
        console.log("Generating sky elements..."); // DEBUG
        
        if (this.isNight) {
            // Generate stars for night sky
            for (let i = 0; i < 50; i++) {
                this.skyElements.push({
                    type: 'star',
                    x: Math.random() * this.width,
                    y: Math.random() * (this.height * 0.4), // Stars in upper 40% of sky
                    size: Math.random() * 2 + 1,
                    brightness: Math.random() * 0.5 + 0.5
                });
            }
            
            // Add moon
            this.skyElements.push({
                type: 'moon',
                x: this.width - 100 - Math.random() * 200,
                y: 60 + Math.random() * 100,
                emoji: ['🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌛', '🌜', '🌝', '🌚'][Math.floor(Math.random() * 13)],
                size: 56 // Large moon size
            });
        } else {
            // Add sun for day
            this.skyElements.push({
                type: 'sun',
                x: this.width - 100 - Math.random() * 200,
                y: 60 + Math.random() * 100,
                emoji: ['☀️', '🌞', '⛅️', '🌤️', '🌥️', '🌦️'][Math.floor(Math.random() * 6)],
                size: 56 // Large sun size
            });
        }
        
        // Add clouds (day or night)
        const numClouds = Math.floor(Math.random() * 4) + 2; // 2-5 clouds
        for (let i = 0; i < numClouds; i++) {
            // Weighted cloud selection to favor normal weather (70% normal, 30% weather)
            const rand = Math.random();
            let cloudEmoji;
            if (rand < 0.7) {
                // 70% chance for normal clouds
                cloudEmoji = '☁️';
            } else {
                // 30% chance for weather clouds, evenly distributed
                const weatherClouds = ['🌧️', '🌨️', '⛈️', '🌩️'];
                cloudEmoji = weatherClouds[Math.floor(Math.random() * weatherClouds.length)];
            }
            
            // Determine cloud size based on type - storm clouds are larger
            let cloudSize;
            if (cloudEmoji === '⛈️' || cloudEmoji === '🌩️') {
                // Storm clouds: 40-60px (large)
                cloudSize = Math.random() * 20 + 40;
            } else if (cloudEmoji === '🌧️' || cloudEmoji === '🌨️') {
                // Weather clouds: 28-48px (medium-large)
                cloudSize = Math.random() * 20 + 28;
            } else {
                // Regular clouds: varied sizes 18-45px
                cloudSize = Math.random() * 27 + 18;
            }
            
            this.skyElements.push({
                type: 'cloud',
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.3) + 20, // Clouds in upper 30% of sky
                emoji: cloudEmoji,
                drift: this.windSpeed * this.windDirection * 0.1, // More visible cloud movement
                size: cloudSize
            });
            const lastCloud = this.skyElements[this.skyElements.length - 1];
            console.log(`Added cloud: ${cloudEmoji} at (${Math.round(lastCloud.x)}, ${Math.round(lastCloud.y)}) size: ${cloudSize}`); // DEBUG
        }
        console.log(`Total sky elements generated: ${this.skyElements.length}`); // DEBUG
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new GorillasGame();
});