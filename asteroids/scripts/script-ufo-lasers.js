// Function to update UFO lasers movement and collisions
function updateUfoLasers() {
    // Loop through all UFO lasers
    for (let i = ufoLasers.length - 1; i >= 0; i--) {
        let laser = ufoLasers[i];
        
        // Move the laser
        laser.x += laser.xv;
        laser.y += laser.yv;
        
        // Calculate distance traveled
        laser.dist += Math.sqrt(laser.xv * laser.xv + laser.yv * laser.yv);
        
        // Remove laser if it goes beyond its maximum distance or off screen
        if (laser.dist > laser.maxDist || 
            laser.x < 0 || laser.x > canvas.width || 
            laser.y < 0 || laser.y > canvas.height) {
            ufoLasers.splice(i, 1);
            continue;
        }
        
        // Check collision with player ship (if not exploding or in invincibility period)
        if (!ship.dead && !ship.explodeTime && ship.blinkNum === 0) {
            // Calculate distance between laser and ship
            let dx = laser.x - ship.x;
            let dy = laser.y - ship.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check if collision with ship
            if (dist < SHIP_SIZE / 2) {
                // Remove the laser
                ufoLasers.splice(i, 1);
                
                // Destroy the ship
                destroyShip();
                break;
            }
        }
    }
}

// Function to draw UFO lasers
function drawUfoLasers() {
    // Set up for drawing lasers
    context.lineWidth = 2;
    context.strokeStyle = UFO_LASER_COLOR;
    
    // Loop through all UFO lasers
    for (let i = 0; i < ufoLasers.length; i++) {
        let laser = ufoLasers[i];
        
        // Draw the laser
        context.beginPath();
        context.moveTo(
            laser.x - laser.xv * 0.1, // Draw slightly behind current position
            laser.y - laser.yv * 0.1
        );
        context.lineTo(
            laser.x + laser.xv * 0.1, // Draw slightly ahead of current position
            laser.y + laser.yv * 0.1
        );
        context.stroke();
        
        // Add glow effect
        context.shadowColor = UFO_LASER_COLOR;
        context.shadowBlur = 5;
    }
    context.shadowBlur = 0; // Reset shadow blur
}

// Function to play UFO shooting sound
function playUfoShootingSound() {
    if (!audioCtx) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Higher pitch than player laser
    oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
}
