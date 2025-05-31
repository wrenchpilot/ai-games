const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level'); // Get level display element
const highScoreDisplay = document.getElementById('high-score'); // Get high score display element
const timerDisplay = document.getElementById('timer'); // Get timer display element

// Image assets
let shipImage = new Image();
// let asteroidSheet = new Image(); // REMOVED
let asteroidImageBig = new Image();
let asteroidImageMedium = new Image();
let asteroidImageSmall = new Image();
let asteroidImageSmallest = new Image(); // For astroid_1-smallest.png, loaded but may not be used by current 3-tier logic

let imagesLoaded = 0;
const TOTAL_IMAGES = 5; // 1 ship + 4 asteroids

function loadAssets() {
    console.log("Loading assets..."); // DEBUG
    let loadedCount = 0;
    function onImageLoad() {
        loadedCount++;
        imagesLoaded = loadedCount; // Update global imagesLoaded for clarity if needed elsewhere
        console.log(`Image ${loadedCount} of ${TOTAL_IMAGES} loaded.`); // DEBUG
        if (loadedCount === TOTAL_IMAGES) {
            allAssetsLoaded();
        }
    }

    shipImage.onload = onImageLoad;
    asteroidImageBig.onload = onImageLoad;
    asteroidImageMedium.onload = onImageLoad;
    asteroidImageSmall.onload = onImageLoad;
    asteroidImageSmallest.onload = onImageLoad; // Even if not used by default, load it

    shipImage.onerror = () => console.error("Error loading ship_sprite.png");
    asteroidImageBig.onerror = () => console.error("Error loading astroid_4-big.png");
    asteroidImageMedium.onerror = () => console.error("Error loading astroid_3-small.png");
    asteroidImageSmall.onerror = () => console.error("Error loading astroid_2-smaller.png");
    asteroidImageSmallest.onerror = () => console.error("Error loading astroid_1-smallest.png");

    shipImage.src = "assets/sprites/ship_sprite.png";
    asteroidImageBig.src = "assets/sprites/astroid_4-big.png";
    asteroidImageMedium.src = "assets/sprites/astroid_3-small.png";
    asteroidImageSmall.src = "assets/sprites/astroid_2-smaller.png";
    asteroidImageSmallest.src = "assets/sprites/astroid_1-smallest.png";
}

function allAssetsLoaded() {
    console.log("All assets loaded. Initializing game objects and starting loop."); // DEBUG
    // Initialize game objects that might depend on image dimensions if necessary
    // For now, we'll proceed with existing initializations that happen after this call.

    // Set up event handlers
    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
    console.log("Event listeners attached."); // DEBUG

    // Set up game loop
    setInterval(update, 1000 / FPS);
    console.log("Game loop started."); // DEBUG

    // Add a global event listener to initialize audio on first user interaction
    // These ensure that initAudio is called only once.
    document.body.addEventListener('click', function () { initAudio(); }, { once: true });
    document.body.addEventListener('keydown', function () { initAudio(); }, { once: true });
}

// Audio Context
let audioCtx = null;
// let laserSoundBuffer = null; // REMOVED - We will generate sound on the fly
let soundsLoading = false; // This might not be needed if not loading external files
let soundsLoaded = true; // Set to true initially if not loading external files for laser

// Function to initialize AudioContext on user gesture
function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext initialized. State:", audioCtx.state); // DEBUG

            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log("AudioContext resumed. State:", audioCtx.state);
                    // No need to call loadGameSounds if we are generating laser sound on the fly
                }).catch(e => console.error("Error resuming AudioContext:", e));
            } else if (audioCtx.state === 'running') {
                // Context is running, good to go for generated sounds
                console.log("AudioContext already running.");
            }
        } catch (e) {
            console.error("Error creating AudioContext:", e);
        }
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log("AudioContext resumed (existing instance). State:", audioCtx.state);
        }).catch(e => console.error("Error resuming existing AudioContext:", e));
    }
    // If audioCtx exists and is running, do nothing further here for init.
}

// Sound effects functions
function playLaserSound() {
    if (!audioCtx || audioCtx.state !== 'running') {
        console.warn('playLaserSound: AudioContext not ready or not running. State:', audioCtx ? audioCtx.state : 'null');
        // Attempt to initialize/resume audio if not ready - this is a fallback
        if (typeof initAudio === 'function') {
            initAudio();
            // If it's still not running after an attempt, then return
            if (!audioCtx || audioCtx.state !== 'running') {
                console.warn('playLaserSound: AudioContext still not ready after attempting init/resume.');
                return;
            }
        }
        // If initAudio is not defined or didn't make context ready, return
        if (!audioCtx || audioCtx.state !== 'running') return;
    }

    // Generate laser sound on the fly
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine'; // Or 'square', 'sawtooth', 'triangle'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Start frequency (e.g., A5)
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1); // End frequency (e.g., A4)

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime); // Start volume (adjust as needed)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); // Fade out

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15); // Duration of the sound
    console.log("Generated laser sound played.");
}

let thrustSoundOscillator = null;
let thrustSoundGain = null;

function startThrustSound() {
    if (!audioCtx || thrustSoundOscillator) return;
    thrustSoundOscillator = audioCtx.createOscillator();
    thrustSoundGain = audioCtx.createGain();
    thrustSoundOscillator.connect(thrustSoundGain);
    thrustSoundGain.connect(audioCtx.destination);
    thrustSoundOscillator.type = 'sawtooth';
    thrustSoundOscillator.frequency.setValueAtTime(50, audioCtx.currentTime); // Low hum
    thrustSoundGain.gain.setValueAtTime(0.03, audioCtx.currentTime); // Reduced volume
    thrustSoundOscillator.start(audioCtx.currentTime);
}

function stopThrustSound() {
    if (thrustSoundOscillator) {
        thrustSoundOscillator.stop(audioCtx.currentTime);
        thrustSoundOscillator.disconnect();
        thrustSoundGain.disconnect();
        thrustSoundOscillator = null;
        thrustSoundGain = null;
    }
}

function playShipExplosionSound() {
    if (!audioCtx) return;
    
    // Create white noise for explosion
    const bufferSize = audioCtx.sampleRate * 0.8; // 0.8 seconds of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    // Create buffer source for white noise
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    
    // Create filters for more realistic explosion sound
    const lowPassFilter = audioCtx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.setValueAtTime(800, audioCtx.currentTime);
    lowPassFilter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
    
    const highPassFilter = audioCtx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.setValueAtTime(20, audioCtx.currentTime);
    
    // Create gain for volume control
    const explosionGain = audioCtx.createGain();
    explosionGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    explosionGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    // Connect the audio chain
    whiteNoise.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(explosionGain);
    explosionGain.connect(audioCtx.destination);
    
    // Add some low-frequency rumble for impact
    const rumbleOsc = audioCtx.createOscillator();
    const rumbleGain = audioCtx.createGain();
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(audioCtx.destination);
    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
    rumbleOsc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
    rumbleGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    // Start sounds
    whiteNoise.start(audioCtx.currentTime);
    whiteNoise.stop(audioCtx.currentTime + 0.8);
    rumbleOsc.start(audioCtx.currentTime);
    rumbleOsc.stop(audioCtx.currentTime + 0.4);
}

function playAsteroidExplosionSound() {
    if (!audioCtx) return;
    
    // Create white noise for asteroid explosion (shorter than ship)
    const bufferSize = audioCtx.sampleRate * 0.4; // 0.4 seconds of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    // Create buffer source for white noise
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    
    // Create filters for asteroid explosion
    const lowPassFilter = audioCtx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.setValueAtTime(1200, audioCtx.currentTime);
    lowPassFilter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    const highPassFilter = audioCtx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.setValueAtTime(30, audioCtx.currentTime);
    
    // Create gain for volume control
    const explosionGain = audioCtx.createGain();
    explosionGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    explosionGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    // Connect the audio chain
    whiteNoise.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(explosionGain);
    explosionGain.connect(audioCtx.destination);
    
    // Add a quick crack sound for impact
    const crackOsc = audioCtx.createOscillator();
    const crackGain = audioCtx.createGain();
    crackOsc.connect(crackGain);
    crackGain.connect(audioCtx.destination);
    crackOsc.type = 'square';
    crackOsc.frequency.setValueAtTime(400, audioCtx.currentTime);
    crackOsc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.1);
    crackGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    crackGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    // Start sounds
    whiteNoise.start(audioCtx.currentTime);
    whiteNoise.stop(audioCtx.currentTime + 0.4);
    crackOsc.start(audioCtx.currentTime);
    crackOsc.stop(audioCtx.currentTime + 0.15);
}

// Game settings
const FPS = 30; // Frames per second
const TWO_PI = Math.PI * 2; // Full circle in radians for angle normalization
const SHIP_SIZE = 30; // Ship height in pixels
const TURN_SPEED = 360; // Turn speed in degrees per second
const SHIP_THRUST = 5; // Acceleration of the ship in pixels per second per second
const SHIP_FRICTION = 0.7; // Friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_INV_DUR = 3; // Duration of ship's invincibility in seconds
const SHIP_BLINK_DUR = 0.1; // Duration of ship's blink during invincibility in seconds
const SHIP_EMOJI_FONT_SIZE_FACTOR = 1.5; // Adjust to make emoji ship larger/smaller relative to SHIP_SIZE
const LASER_SPEED = 500; // Speed of lasers in pixels per second
const LASER_MAX = 10; // Maximum number of lasers on screen at once
const LASER_DIST = 0.6; // Max distance laser can travel as fraction of screen width
const ASTEROID_NUM = 1; // Starting number of asteroids
const ASTEROID_SPEED = 50; // Max starting speed of asteroids in pixels per second
const ASTEROID_SIZE = 100; // Starting size of asteroids in pixels
const ASTEROID_JAG = 0.4; // Jaggedness of the asteroids (0 = none, 1 = lots)
const ASTEROID_VERT = 10; // Average number of vertices on each asteroid
const POINTS_LRG = 20; // Points for large asteroid
const POINTS_MED = 50; // Points for medium asteroid
const POINTS_SML = 100; // Points for small asteroid
const GAME_LIVES = 3; // Starting number of lives

// Round Timer Settings
const ROUND_TIME_SECONDS = 180; // 3 minutes per round
const ROUND_TIME_FRAMES = ROUND_TIME_SECONDS * FPS; // Total frames per round

// Starfield Settings
const STAR_NUM = 200; // Number of stars in the background
const STAR_COLOUR = "rgba(255, 255, 255, 0.7)"; // Star colour and alpha
let stars = []; // Array to hold star objects
const PARALLAX_FACTOR = 0.05; // How much stars shift relative to ship's velocity. Adjust for desired effect.
const MAX_STAR_RADIUS_FOR_PARALLAX = 1.5; // Max radius used in createStarfield for normalization
const PLANET_PARALLAX_FACTOR = 0.15; // Planet parallax factor - higher than stars to appear closer

// Distant Planet Settings
let distantPlanet = {};
const PLANET_EMOJI_FONT_SIZE_FACTOR = 1.0; // Adjust for planet emoji size relative to its radius
const PLANET_COLORS_BODY = [
    "#4A5A8C", // Muted blue (opaque)
    "#786D5F", // Muted brown (opaque)
    "#8C4A4A",  // Muted red (opaque)
    "#5F7872"  // Muted teal (opaque)
];
const PLANET_COLORS_RING = [
    "rgba(160, 160, 160, 0.3)", // Light grey with reduced alpha
    "rgba(176, 160, 144, 0.3)", // Light brownish-grey with reduced alpha
    "rgba(136, 136, 112, 0.3)"  // Light yellowish-grey with reduced alpha
];
const PLANET_MIN_RADIUS = 20; // Further reduced min size
const PLANET_MAX_RADIUS = 50; // Further reduced max size
const PLANET_RING_THICKNESS_FACTOR = 0.3;
const PLANET_RING_WIDTH_FACTOR = 2.5;

// Comet Settings
let comets = [];
const COMET_SPAWN_INTERVAL_MIN_FRAMES = 25 * FPS; // Min time between comets (25 seconds)
const COMET_SPAWN_INTERVAL_MAX_FRAMES = 70 * FPS; // Max time between comets (70 seconds)
let nextCometSpawnFrame = 0;
const COMET_SIZE = 5; // Head radius for drawing
const COMET_COLLISION_RADIUS = 10; // Larger radius for easier shooting
const COMET_SPEED_MIN = 100 / FPS;
const COMET_SPEED_MAX = 300 / FPS;
const COMET_TAIL_LENGTH = 20;
const COMET_COLOR_HEAD = "rgba(200, 220, 255, 0.9)";
const COMET_COLOR_TAIL_START = "rgba(150, 180, 255, 0.7)";
const COMET_COLOR_TAIL_END = "rgba(100, 120, 200, 0)";

// UFO Settings
let ufos = [];
const UFO_SPAWN_INTERVAL_MIN_FRAMES = 45 * FPS; // Min time between UFOs (45 seconds)
const UFO_SPAWN_INTERVAL_MAX_FRAMES = 90 * FPS; // Max time between UFOs (90 seconds)
let nextUfoSpawnFrame = 0;
const UFO_SIZE = 15; // UFO emoji size for collision
const UFO_COLLISION_RADIUS = 20; // Collision radius
const UFO_SPEED_MIN = 150 / FPS; // Faster than comets
const UFO_SPEED_MAX = 400 / FPS; // Faster than comets
const UFO_STEERING_FORCE = 0.5; // How aggressively UFO steers toward player
const UFO_MAX_TURN_RATE = 0.05; // Max radians per frame UFO can turn
const UFO_COLOR = "rgba(150, 255, 150, 0.9)"; // Green glow
const UFO_POINTS = 500; // Points for destroying UFO
let screenFlashFrames = 0; // For screen flash effect when UFO destroyed
const SCREEN_FLASH_DURATION = 10; // Duration of screen flash in frames

// UFO Shooting Settings
const UFO_SHOOTING_DISTANCE = 300; // Distance at which UFOs will try to shoot
const UFO_SHOOTING_INTERVAL = 60; // Frames between UFO shots (about 1 second)
const UFO_LASER_SPEED = 400 / FPS; // UFO laser speed
const UFO_LASER_COLOR = "rgba(150, 255, 150, 1)"; // Green laser
let ufoLasers = []; // Array to store UFO lasers

// UFO Sound Management
let ufoAmbientSound = null; // Current UFO ambient sound
let ufoSoundGain = null; // Gain node for UFO sound

// Ambient Background Sound Management
let ambientBackgroundSound = null; // Current ambient background sound
let ambientSoundGain = null; // Gain node for ambient sound

// Power-up Settings
const POWERUP_CHANCE = 0.15; // 15% chance to drop a power-up
const POWERUP_DURATION_FRAMES = 10 * FPS; // Duration in frames (10 seconds)
const POWERUP_SIZE = 20; // Size of power-up item in pixels
const POWERUP_SPEED_BOOST_MULTIPLIER = 1.5; // Ship speed multiplier
const POWERUP_LASER_SPEED_BOOST_MULTIPLIER = 1.5; // Laser speed multiplier
const POWERUP_SPRAY_SHOT_COUNT = 3; // Number of lasers in a spray
const POWERUP_SPRAY_SHOT_ANGLE = 15 * Math.PI / 180; // Angle between spray lasers

const POWERUP_TYPES = {
    FAST_SHIP: 'FAST_SHIP',
    FAST_SHOTS: 'FAST_SHOTS',
    SPRAY_SHOTS: 'SPRAY_SHOTS'
};
const POWERUP_COLORS = {
    FAST_SHIP: 'cyan',
    FAST_SHOTS: 'dodgerblue', // Changed from lime to blue for better differentiation
    SPRAY_SHOTS: 'magenta'
};
const POWERUP_INITIALS = {
    FAST_SHIP: 'S', // Speed
    FAST_SHOTS: 'L', // Laser
    SPRAY_SHOTS: 'W'  // Wide/Spray
};

// Set initial canvas size
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;
console.log("Initial canvas size:", canvas.width, canvas.height); // DEBUG

// Ship object
let ship = newShip();
console.log("Initial ship:", JSON.stringify(ship)); // DEBUG

// Asteroids array
let asteroids = [];
// DO NOT CALL createAsteroidBelt() here yet

// Game variables
let score = 0;
let highScore = 0; // High score variable
let lives = GAME_LIVES;
let level = 0;
let gameRunning = true; // Variable to control game state
let currentFrame = 0; // Frame counter for timed events like power-ups
let roundStartFrame = 0; // Frame when current round started
let roundTimeRemaining = ROUND_TIME_FRAMES; // Frames remaining in current round
let powerUps = []; // Array to hold power-up items on screen
let activePowerUp = { // Object to track multiple simultaneous power-ups
    FAST_SHIP: null,
    FAST_SHOTS: null, 
    SPRAY_SHOTS: null
}; 
let showHelpScreen = false; // Variable to control display of help screen
let gamePaused = false; // Variable to control game pause state

// Bonus level variables
let bonusLevel = false; // Whether we're currently in a bonus level
let bonusWave = 0; // Current wave number (1, 2, or 3)
let bonusUfosRemaining = 0; // Number of UFOs remaining in current wave
let bonusLevelLives = 0; // Lives specifically for bonus level (separate from main lives)
let bonusLevelStarted = false; // Whether bonus level has been initiated

// Game statistics
let gameStats = {
    shotsFired: 0,
    shotsHit: 0, // Track successful hits on any target
    powerUpsCollected: {
        FAST_SHIP: 0,
        FAST_SHOTS: 0,
        SPRAY_SHOTS: 0
    },
    asteroidsDestroyed: {
        large: 0,
        medium: 0,
        small: 0,
        total: 0
    },
    cometsDestroyed: 0,
    ufosDestroyed: 0,
    gameStartTime: 0,
    totalPlayTime: 0
};
console.log("Game variables initialized. Score:", score, "Lives:", lives, "Level:", level); // DEBUG

// High score functions
function loadHighScore() {
    const saved = localStorage.getItem('asteroidsHighScore');
    if (saved !== null) {
        highScore = parseInt(saved, 10);
        console.log("High score loaded:", highScore); // DEBUG
    } else {
        highScore = 0;
        console.log("No saved high score, starting with 0"); // DEBUG
    }
}

function saveHighScore() {
    localStorage.setItem('asteroidsHighScore', highScore.toString());
    console.log("High score saved:", highScore); // DEBUG
}

function checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        console.log("New high score!", highScore); // DEBUG
        return true; // Return true if new high score was set
    }
    return false;
}

// Load high score when game starts
loadHighScore();

initDistantPlanet(); // Initialize the distant planet
setNextCometSpawnFrame(); // Set initial comet spawn timer
setNextUfoSpawnFrame(); // Set initial UFO spawn timer
createStarfield(); // Create initial starfield
createAsteroidBelt(); // MOVED: Call createAsteroidBelt() after level is initialized
console.log("Initial asteroids created:", asteroids.length); // DEBUG

// Set up event handlers
// document.addEventListener("keydown", keyDown); // MOVED to allAssetsLoaded
// document.addEventListener("keyup", keyUp); // MOVED to allAssetsLoaded
// console.log("Event listeners attached."); // DEBUG

// Set up game loop
// setInterval(update, 1000 / FPS); // MOVED to allAssetsLoaded
// console.log("Game loop started."); // DEBUG

// Add a global event listener to initialize audio on first user interaction
// These ensure that initAudio is called only once.
// document.body.addEventListener('click', function() { initAudio(); }, { once: true }); // MOVED to allAssetsLoaded
// document.body.addEventListener('keydown', function() { initAudio(); }, { once: true }); // MOVED to allAssetsLoaded

// INSTEAD OF CALLING THESE DIRECTLY, CALL loadAssets()
loadAssets();

function createStarfield() {
    stars = [];
    for (let i = 0; i < STAR_NUM; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * MAX_STAR_RADIUS_FOR_PARALLAX // Use the constant here
        });
    }
    console.log("Starfield created with", stars.length, "stars."); // DEBUG
}

function drawStarfield() {
    context.fillStyle = STAR_COLOUR;
    for (let i = 0; i < stars.length; i++) {
        context.beginPath();
        context.arc(stars[i].x, stars[i].y, stars[i].r, 0, Math.PI * 2);
        context.fill();
    }
}

function playPowerUpCollectSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.00001, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
}

function playCometExplosionSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'noise';
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
    // Quick pop
    const popOsc = audioCtx.createOscillator();
    const popGain = audioCtx.createGain();
    popOsc.connect(popGain);
    popGain.connect(audioCtx.destination);
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(600, audioCtx.currentTime);
    popGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
    popOsc.start(audioCtx.currentTime);
    popOsc.stop(audioCtx.currentTime + 0.1);
}

function play1UpSound() {
    if (!audioCtx) return;
    const freqs = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    let delay = 0;
    for (const freq of freqs) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + delay + 0.15);
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 0.15);
        delay += 0.07;
    }
}

function playScreenClearSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.6);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.7);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.7);
}

function initDistantPlanet() {
    distantPlanet.radius = Math.random() * (PLANET_MAX_RADIUS - PLANET_MIN_RADIUS) + PLANET_MIN_RADIUS;
    // Colors are no longer used for emoji, but keep radius for size reference

    // Position it somewhere in the distance, ensuring it's mostly visible
    distantPlanet.x = Math.random() * canvas.width;
    distantPlanet.y = (Math.random() * 0.3 + 0.1) * canvas.height; // Upper or lower part of screen
    if (Math.random() < 0.5) {
        distantPlanet.y = canvas.height - distantPlanet.y; // Place in lower part
    }
    
    // Add random rotation for visual variety
    distantPlanet.rotation = Math.random() * Math.PI * 2; // Random rotation from 0 to 2π radians
    
    // Select random planet emoji type
    const planetEmojis = ["🪐", "🌎","🌕", "🛰️"]; // Saturn, Earth, Moon phases
    distantPlanet.emoji = planetEmojis[Math.floor(Math.random() * planetEmojis.length)];
    
    console.log("Distant planet initialized:", JSON.stringify(distantPlanet)); // DEBUG
}

function drawDistantPlanet() {
    if (!distantPlanet.radius) return;

    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    
    // Move to planet position and apply rotation
    context.translate(distantPlanet.x, distantPlanet.y);
    context.rotate(distantPlanet.rotation);
    
    // Adjust font size based on planet's original radius. Tweak PLANET_EMOJI_FONT_SIZE_FACTOR if needed.
    const fontSize = distantPlanet.radius * PLANET_EMOJI_FONT_SIZE_FACTOR * 2; // Multiply by 2 as emojis are often wider than tall
    context.font = fontSize + "px sans-serif";
    
    // Draw a solid background circle first to ensure stars are occluded
    context.globalAlpha = 1.0;
    context.fillStyle = "black"; // Match space background color
    context.beginPath();
    context.arc(0, 0, distantPlanet.radius * 0.9, 0, Math.PI * 2); // Slightly smaller to match emoji coverage area
    context.fill();
    
    // Draw the planet emoji completely opaque on top
    context.globalAlpha = 1.0; // Make planet emoji completely opaque to ensure it appears in front of stars
    context.fillText(distantPlanet.emoji, 0, 0);
    context.restore();
}

function setNextCometSpawnFrame() {
    nextCometSpawnFrame = currentFrame +
        Math.floor(Math.random() * (COMET_SPAWN_INTERVAL_MAX_FRAMES - COMET_SPAWN_INTERVAL_MIN_FRAMES + 1)) +
        COMET_SPAWN_INTERVAL_MIN_FRAMES;
    console.log("Next comet spawn frame set to:", nextCometSpawnFrame); // DEBUG
}

function spawnComet() {
    let x, y, xv, yv;
    const side = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:top, 3:bottom
    const speed = Math.random() * (COMET_SPEED_MAX - COMET_SPEED_MIN) + COMET_SPEED_MIN;

    switch (side) {
        case 0: // Left
            x = -COMET_SIZE * COMET_TAIL_LENGTH; // Start off-screen
            y = Math.random() * canvas.height;
            xv = speed;
            yv = (Math.random() - 0.5) * speed; // Angle slightly up or down
            break;
        case 1: // Right
            x = canvas.width + COMET_SIZE * COMET_TAIL_LENGTH;
            y = Math.random() * canvas.height;
            xv = -speed;
            yv = (Math.random() - 0.5) * speed;
            break;
        case 2: // Top
            x = Math.random() * canvas.width;
            y = -COMET_SIZE * COMET_TAIL_LENGTH;
            xv = (Math.random() - 0.5) * speed;
            yv = speed;
            break;
        case 3: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + COMET_SIZE * COMET_TAIL_LENGTH;
            xv = (Math.random() - 0.5) * speed;
            yv = -speed;
            break;
    }

    comets.push({
        x: x, y: y, xv: xv, yv: yv,
        r: COMET_COLLISION_RADIUS, // Collision radius
        size: COMET_SIZE, // Visual size
        tailLength: COMET_TAIL_LENGTH
    });
    console.log("Comet spawned at:", x, y, "with velocity:", xv, yv); // DEBUG
    setNextCometSpawnFrame(); // Reset timer for the next comet
}

function updateComets() {
    for (let i = comets.length - 1; i >= 0; i--) {
        let c = comets[i];
        c.x += c.xv;
        c.y += c.yv;

        // Remove comet if it's far off screen
        const margin = c.size * c.tailLength * 2; // Generous margin
        if (c.x < -margin || c.x > canvas.width + margin || c.y < -margin || c.y > canvas.height + margin) {
            comets.splice(i, 1);
            console.log("Comet despawned"); // DEBUG
        }
    }
}

function drawComets() {
    for (let i = 0; i < comets.length; i++) {
        let c = comets[i];
        let tailEndX = c.x - c.xv * c.tailLength;
        let tailEndY = c.y - c.yv * c.tailLength;

        // Create gradient for the tail
        const tailGradient = context.createLinearGradient(c.x, c.y, tailEndX, tailEndY);
        tailGradient.addColorStop(0, COMET_COLOR_TAIL_START);
        tailGradient.addColorStop(1, COMET_COLOR_TAIL_END);

        // Draw tail
        context.strokeStyle = tailGradient;
        context.lineWidth = c.size * 1.5; // Tail wider at the head
        context.beginPath();
        context.moveTo(c.x, c.y);
        context.lineTo(tailEndX, tailEndY);
        context.stroke();

        // Draw head
        context.fillStyle = COMET_COLOR_HEAD;
        context.beginPath();
        context.arc(c.x, c.y, c.size, 0, Math.PI * 2);
        context.fill();
    }
}

function setNextUfoSpawnFrame() {
    nextUfoSpawnFrame = currentFrame +
        Math.floor(Math.random() * (UFO_SPAWN_INTERVAL_MAX_FRAMES - UFO_SPAWN_INTERVAL_MIN_FRAMES + 1)) +
        UFO_SPAWN_INTERVAL_MIN_FRAMES;
    console.log("Next UFO spawn frame set to:", nextUfoSpawnFrame); // DEBUG
}

function spawnUfo() {
    let x, y, xv, yv;
    const side = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:top, 3:bottom
    const speed = Math.random() * (UFO_SPEED_MAX - UFO_SPEED_MIN) + UFO_SPEED_MIN;

    switch (side) {
        case 0: // Left
            x = -UFO_SIZE * 2; // Start off-screen
            y = Math.random() * canvas.height;
            xv = speed;
            yv = (Math.random() - 0.5) * speed * 0.5; // Less random initial Y velocity
            break;
        case 1: // Right
            x = canvas.width + UFO_SIZE * 2;
            y = Math.random() * canvas.height;
            xv = -speed;
            yv = (Math.random() - 0.5) * speed * 0.5;
            break;
        case 2: // Top
            x = Math.random() * canvas.width;
            y = -UFO_SIZE * 2;
            xv = (Math.random() - 0.5) * speed * 0.5;
            yv = speed;
            break;
        case 3: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + UFO_SIZE * 2;
            xv = (Math.random() - 0.5) * speed * 0.5;
            yv = -speed;
            break;
    }

    ufos.push({
        x: x, y: y, xv: xv, yv: yv,
        r: UFO_COLLISION_RADIUS, // Collision radius
        size: UFO_SIZE, // Visual size
        angle: Math.random() * Math.PI * 2 // Random initial rotation
    });
    console.log("UFO spawned at:", x, y, "with velocity:", xv, yv); // DEBUG
    setNextUfoSpawnFrame(); // Reset timer for the next UFO
}

function updateUfos() {
    for (let i = ufos.length - 1; i >= 0; i--) {
        let u = ufos[i];
        
        // UFO AI - try to steer toward the player
        if (!ship.dead) {
            let dx = ship.x - u.x;
            let dy = ship.y - u.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize direction to player
                dx /= distance;
                dy /= distance;
                
                // Apply steering force toward player
                u.xv += dx * UFO_STEERING_FORCE;
                u.yv += dy * UFO_STEERING_FORCE;
                
                // Limit maximum speed
                let currentSpeed = Math.sqrt(u.xv * u.xv + u.yv * u.yv);
                let maxSpeed = UFO_SPEED_MAX;
                if (currentSpeed > maxSpeed) {
                    u.xv = (u.xv / currentSpeed) * maxSpeed;
                    u.yv = (u.yv / currentSpeed) * maxSpeed;
                }
                
                // Shooting logic
                if (!u.shootingTimer) {
                    u.shootingTimer = 0; // Initialize if not set
                }
                
                // Check if UFO is within shooting distance and timer has elapsed
                if (distance < UFO_SHOOTING_DISTANCE && u.shootingTimer <= 0) {
                    // Calculate the direction to the player
                    let shootAngle = Math.atan2(dy, dx);
                    
                    // Create a new laser aimed at player
                    ufoLasers.push({
                        x: u.x,
                        y: u.y,
                        xv: Math.cos(shootAngle) * UFO_LASER_SPEED,
                        yv: Math.sin(shootAngle) * UFO_LASER_SPEED,
                        dist: 0,
                        maxDist: LASER_DIST * canvas.width // Use same max distance as player lasers
                    });
                    
                    // Play UFO shooting sound
                    playUfoShootingSound();
                    
                    // Reset shooting timer
                    u.shootingTimer = UFO_SHOOTING_INTERVAL;
                }
                
                // Decrement shooting timer
                if (u.shootingTimer > 0) {
                    u.shootingTimer--;
                }
            }
        }
        
        // Update position
        u.x += u.xv;
        u.y += u.yv;

        // Update rotation for visual effect
        u.angle += 0.02;
        if (u.angle > Math.PI * 2) u.angle -= Math.PI * 2;

        // Remove UFO if it's far off screen
        const margin = UFO_SIZE * 4;
        if (u.x < -margin || u.x > canvas.width + margin || u.y < -margin || u.y > canvas.height + margin) {
            ufos.splice(i, 1);
            console.log("UFO despawned"); // DEBUG
        }
    }
}

function drawUfos() {
    for (let i = 0; i < ufos.length; i++) {
        let u = ufos[i];
        
        context.save();
        context.translate(u.x, u.y);
        context.rotate(u.angle);
        
        // Draw green glow effect around UFO
        context.shadowColor = UFO_COLOR;
        context.shadowBlur = 10;
        
        // Draw UFO emoji
        context.textAlign = "center";
        context.textBaseline = "middle";
        const fontSize = u.size * 2;
        context.font = fontSize + "px sans-serif";
        context.fillStyle = "white";
        context.fillText("🛸", 0, 0);
        
        context.restore();
    }
}

function playUfoExplosionSound() {
    if (!audioCtx) return;
    
    // Create white noise for UFO explosion (longer and more intense than others)
    const bufferSize = audioCtx.sampleRate * 1.0; // Longer than asteroid explosion
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    // Create buffer source for white noise
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = buffer;
    
    // Create filters for UFO explosion - more electronic/alien sounding
    const lowPassFilter = audioCtx.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.setValueAtTime(1500, audioCtx.currentTime);
    lowPassFilter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.6);
    
    const highPassFilter = audioCtx.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.setValueAtTime(40, audioCtx.currentTime);
    
    // Create gain for volume control
    const explosionGain = audioCtx.createGain();
    explosionGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    explosionGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    
    // Connect the audio chain
    whiteNoise.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    lowPassFilter.connect(explosionGain);
    explosionGain.connect(audioCtx.destination);
    
    // Add electronic beeping sound for alien effect
    const beepOsc = audioCtx.createOscillator();
    const beepGain = audioCtx.createGain();
    beepOsc.connect(beepGain);
    beepGain.connect(audioCtx.destination);
    beepOsc.type = 'triangle';
    beepOsc.frequency.setValueAtTime(800, audioCtx.currentTime);
    beepOsc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    beepGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    beepGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    
    // Start sounds
    whiteNoise.start(audioCtx.currentTime);
    whiteNoise.stop(audioCtx.currentTime + 0.8);
    beepOsc.start(audioCtx.currentTime);
    beepOsc.stop(audioCtx.currentTime + 0.4);
}

function startUfoAmbientSound() {
    if (!audioCtx || ufoAmbientSound) return; // Don't start if already playing
    
    // Create oscillators for eerie pulsing sound
    const lowOsc = audioCtx.createOscillator();
    const midOsc = audioCtx.createOscillator();
    
    // Create gain nodes for pulsing effect
    const lowGain = audioCtx.createGain();
    const midGain = audioCtx.createGain();
    ufoSoundGain = audioCtx.createGain();
    
    // Set up low frequency drone (base frequency)
    lowOsc.type = 'sawtooth';
    lowOsc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A note
    
    // Set up mid frequency modulation
    midOsc.type = 'triangle';
    midOsc.frequency.setValueAtTime(110, audioCtx.currentTime); // Higher harmonic
    
    // Create pulsing effect with low frequency oscillator
    const pulseOsc = audioCtx.createOscillator();
    const pulseGain = audioCtx.createGain();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.setValueAtTime(1.5, audioCtx.currentTime); // 1.5 Hz pulse rate
    pulseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    
    // Connect pulse modulation
    pulseOsc.connect(pulseGain);
    pulseGain.connect(lowGain.gain);
    pulseGain.connect(midGain.gain);
    
    // Connect main oscillators
    lowOsc.connect(lowGain);
    midOsc.connect(midGain);
    lowGain.connect(ufoSoundGain);
    midGain.connect(ufoSoundGain);
    ufoSoundGain.connect(audioCtx.destination);
    
    // Set initial volume (quieter and more subtle)
    lowGain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Reduced from 0.15
    midGain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Reduced from 0.08
    ufoSoundGain.gain.setValueAtTime(0.15, audioCtx.currentTime); // Reduced from 0.3
    
    // Start all oscillators
    lowOsc.start(audioCtx.currentTime);
    midOsc.start(audioCtx.currentTime);
    pulseOsc.start(audioCtx.currentTime);
    
    // Store reference for cleanup
    ufoAmbientSound = {
        lowOsc: lowOsc,
        midOsc: midOsc,
        pulseOsc: pulseOsc,
        lowGain: lowGain,
        midGain: midGain,
        pulseGain: pulseGain
    };
    
    console.log("UFO ambient sound started"); // DEBUG
}

function stopUfoAmbientSound() {
    if (!ufoAmbientSound || !audioCtx) return;
    
    // Fade out over 0.5 seconds
    const fadeTime = 0.5;
    ufoSoundGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + fadeTime);
    
    // Stop all oscillators after fade
    setTimeout(() => {
        if (ufoAmbientSound) {
            ufoAmbientSound.lowOsc.stop();
            ufoAmbientSound.midOsc.stop();
            ufoAmbientSound.pulseOsc.stop();
            ufoAmbientSound = null;
            ufoSoundGain = null;
            console.log("UFO ambient sound stopped"); // DEBUG
        }
    }, fadeTime * 1000);
}

function updateUfoAmbientSound() {
    if (!audioCtx) return;
    
    // Start sound if UFOs are present and sound isn't playing
    if (ufos.length > 0 && !ufoAmbientSound) {
        startUfoAmbientSound();
    }
    // Stop sound if no UFOs and sound is playing
    else if (ufos.length === 0 && ufoAmbientSound) {
        stopUfoAmbientSound();
    }
    
    // Adjust volume based on closest UFO distance
    if (ufoAmbientSound && ufoSoundGain && ufos.length > 0 && !ship.dead) {
        let closestDistance = Infinity;
        for (let i = 0; i < ufos.length; i++) {
            const distance = distBetweenPoints(ship.x, ship.y, ufos[i].x, ufos[i].y);
            if (distance < closestDistance) {
                closestDistance = distance;
            }
        }
        
        // Calculate volume based on distance (closer = louder)
        const maxDistance = Math.max(canvas.width, canvas.height);
        const normalizedDistance = Math.min(closestDistance / maxDistance, 1);
        const volume = 0.05 + (1 - normalizedDistance) * 0.15; // Range from 0.05 to 0.2 (much quieter)
        
        ufoSoundGain.gain.setValueAtTime(volume, audioCtx.currentTime);
    }
}

// Ambient Background Sound Functions
function startAmbientBackgroundSound() {
    if (!audioCtx || ambientBackgroundSound) return; // Don't start if already playing
    
    // Create multiple oscillators for a rich, subtle space ambience
    const lowDroneOsc = audioCtx.createOscillator();
    const midDroneOsc = audioCtx.createOscillator();
    const highShimmerOsc = audioCtx.createOscillator();
    
    // Create gain nodes for mixing
    const lowDroneGain = audioCtx.createGain();
    const midDroneGain = audioCtx.createGain();
    const highShimmerGain = audioCtx.createGain();
    ambientSoundGain = audioCtx.createGain();
    
    // Set up very low frequency drone (deep space hum)
    lowDroneOsc.type = 'sine';
    lowDroneOsc.frequency.setValueAtTime(25, audioCtx.currentTime); // Even lower, deeper hum
    
    // Set up mid frequency drone with slight variation
    midDroneOsc.type = 'sine';
    midDroneOsc.frequency.setValueAtTime(40, audioCtx.currentTime); // Lower harmonic, smoother sine wave
    
    // Set up much lower frequency "shimmer" (more like a gentle rumble)
    highShimmerOsc.type = 'sine';
    highShimmerOsc.frequency.setValueAtTime(80, audioCtx.currentTime); // Much lower frequency
    
    // Create subtle modulation for the low rumble
    const shimmerLFO = audioCtx.createOscillator();
    const shimmerLFOGain = audioCtx.createGain();
    shimmerLFO.type = 'sine';
    shimmerLFO.frequency.setValueAtTime(0.2, audioCtx.currentTime); // Even slower modulation
    shimmerLFOGain.gain.setValueAtTime(10, audioCtx.currentTime); // Much less modulation depth
    
    // Connect modulation to low rumble frequency
    shimmerLFO.connect(shimmerLFOGain);
    shimmerLFOGain.connect(highShimmerOsc.frequency);
    
    // Remove high-pass filter to keep all the low frequencies
    
    // Connect the audio chain (no high-pass filter, direct connection)
    lowDroneOsc.connect(lowDroneGain);
    midDroneOsc.connect(midDroneGain);
    highShimmerOsc.connect(highShimmerGain); // Direct connection for full low-frequency range
    
    lowDroneGain.connect(ambientSoundGain);
    midDroneGain.connect(ambientSoundGain);
    highShimmerGain.connect(ambientSoundGain);
    ambientSoundGain.connect(audioCtx.destination);
    
    // Set volumes for a deeper, more subtle hum
    lowDroneGain.gain.setValueAtTime(0.03, audioCtx.currentTime); // Slightly louder deep hum
    midDroneGain.gain.setValueAtTime(0.02, audioCtx.currentTime); // Subtle low harmonic
    highShimmerGain.gain.setValueAtTime(0.015, audioCtx.currentTime); // Gentle low rumble
    ambientSoundGain.gain.setValueAtTime(0.25, audioCtx.currentTime); // Slightly reduced overall volume
    
    // Start all oscillators
    lowDroneOsc.start(audioCtx.currentTime);
    midDroneOsc.start(audioCtx.currentTime);
    highShimmerOsc.start(audioCtx.currentTime);
    shimmerLFO.start(audioCtx.currentTime);
    
    // Store reference for cleanup
    ambientBackgroundSound = {
        lowDroneOsc: lowDroneOsc,
        midDroneOsc: midDroneOsc,
        highShimmerOsc: highShimmerOsc,
        shimmerLFO: shimmerLFO,
        lowDroneGain: lowDroneGain,
        midDroneGain: midDroneGain,
        highShimmerGain: highShimmerGain,
        shimmerLFOGain: shimmerLFOGain
    };
    
    console.log("Ambient background sound started"); // DEBUG
}

function stopAmbientBackgroundSound() {
    if (!ambientBackgroundSound || !audioCtx) return;
    
    // Fade out over 1 second for smooth transition
    const fadeTime = 1.0;
    ambientSoundGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + fadeTime);
    
    // Stop all oscillators after fade
    setTimeout(() => {
        if (ambientBackgroundSound) {
            ambientBackgroundSound.lowDroneOsc.stop();
            ambientBackgroundSound.midDroneOsc.stop();
            ambientBackgroundSound.highShimmerOsc.stop();
            ambientBackgroundSound.shimmerLFO.stop();
            ambientBackgroundSound = null;
            ambientSoundGain = null;
            console.log("Ambient background sound stopped"); // DEBUG
        }
    }, fadeTime * 1000);
}

function updateAmbientBackgroundSound() {
    if (!audioCtx) return;
    
    // Start ambient sound when game is running and audio context is ready
    if (gameRunning && !ambientBackgroundSound && audioCtx.state === 'running') {
        startAmbientBackgroundSound();
    }
    // Stop ambient sound when game is not running
    else if (!gameRunning && ambientBackgroundSound) {
        stopAmbientBackgroundSound();
    }
    
    // Adjust volume based on game state (slightly quieter during intense moments)
    if (ambientBackgroundSound && ambientSoundGain) {
        let volumeMultiplier = 1.0;
        
        // Reduce ambient volume slightly when UFOs are present (so UFO sound is more prominent)
        if (ufos.length > 0) {
            volumeMultiplier *= 0.7;
        }
        
        // Reduce ambient volume when ship is exploding
        if (ship.explodeTime > 0) {
            volumeMultiplier *= 0.5;
        }
        
        // Calculate final volume
        const baseVolume = 0.3;
        const finalVolume = baseVolume * volumeMultiplier;
        
        // Smooth volume changes
        ambientSoundGain.gain.exponentialRampToValueAtTime(finalVolume, audioCtx.currentTime + 0.1);
    }
}

function giveAllPowerUps() {
    // Give all 3 power-ups when UFO is destroyed
    const allPowerUpTypes = [POWERUP_TYPES.FAST_SHIP, POWERUP_TYPES.FAST_SHOTS, POWERUP_TYPES.SPRAY_SHOTS];
    
    for (const powerUpType of allPowerUpTypes) {
        activatePowerUp(powerUpType);
    }
    
    console.log("UFO destroyed! All power-ups activated!"); // DEBUG
}

function drawScreenFlash() {
    if (screenFlashFrames > 0) {
        // Create white flash overlay
        const alpha = screenFlashFrames / SCREEN_FLASH_DURATION;
        context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        screenFlashFrames--;
    }
}

function newShip() {
    console.log("newShip called. Canvas dimensions:", canvas.width, canvas.height); // DEBUG
    return {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2,
        a: Math.PI / 2, // SHIP STARTS FACING NORTH (PI/2 radians)
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0
        },
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        canShoot: true,
        canThrust: true,
        lasers: [],
        explodeTime: 0,
        dead: false, // Initialized ship.dead
        spaceBarDown: false, // Track if space bar is being held down
        rapidFireCounter: 0 // Counter for rapid fire timing
    }
}

function createAsteroidBelt() {
    asteroids = [];
    let x, y;
    // Ensure power-ups from previous level don't persist if not collected
    // powerUps = []; // This might be too aggressive, let's see. Usually done on game reset.
    for (let i = 0; i < ASTEROID_NUM + level; i++) {
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r); // Prevent asteroids spawning on top of ship
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
    }
}

function newAsteroid(x, y, r) {
    let lvlMult = 1 + 0.1 * level;
    // Define sprite properties for different asteroid sizes
    // let spriteData = {}; // REMOVED - No longer using sprite sheet data
    let imageToUse = null;
    let drawWidth, drawHeight;

    if (r === Math.ceil(ASTEROID_SIZE / 2)) { // Large
        imageToUse = asteroidImageBig;
        drawWidth = ASTEROID_SIZE;
        drawHeight = ASTEROID_SIZE;
    } else if (r === Math.ceil(ASTEROID_SIZE / 4)) { // Medium
        imageToUse = asteroidImageMedium; // Using astroid_3-small.png for medium
        drawWidth = ASTEROID_SIZE / 2;
        drawHeight = ASTEROID_SIZE / 2;
    } else { // Small (using ASTEROID_SIZE / 8 for radius check if needed, or just the else for the smallest tier)
        imageToUse = asteroidImageSmall; // Using astroid_2-smaller.png for small
        drawWidth = ASTEROID_SIZE / 4;
        drawHeight = ASTEROID_SIZE / 4;
        // If you want a fourth, even smaller size, you'd need to adjust the splitting logic
        // and how 'r' is determined for the smallest asteroids.
        // For now, the smallest created by splitting will use asteroidImageSmall.
    }

    let roid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROID_SPEED * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ASTEROID_SPEED * lvlMult / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: r, // Keep radius for collision detection, should match visual size
        a: Math.random() * Math.PI * 2, // in radians (for rotation, if desired)
        // vert: Math.floor(Math.random() * (ASTEROID_VERT + 1) + ASTEROID_VERT / 2), // No longer needed for vector drawing
        // offs: [], // No longer needed for vector drawing
        // sprite: spriteData // REMOVED
        image: imageToUse,
        drawWidth: drawWidth,
        drawHeight: drawHeight,
        explodeTime: 0 // For explosion animation when asteroid is destroyed
    };

    // Create vertex offsets (kept for fallback, not used for sprite drawing)
    // for (let i = 0; i < roid.vert; i++) { // No longer needed
    //     roid.offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG);
    // }
    return roid;
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
    // Ensure AudioContext is initialized/resumed on any key press
    if (typeof initAudio === 'function') {
        initAudio(); // Call initAudio to create or resume and load sounds
    }

    console.log("keyDown event:", ev.key, "Ship dead?", ship.dead, "Game running?", gameRunning); // DEBUG

    // Allow 'r' or 'R' to reset at any time, not just at game over
    if (ev.key.toLowerCase() === 'r') {
        resetGame();
        return;
    }

    // Toggle help screen when 'h' or 'H' is pressed
    if (ev.key.toLowerCase() === 'h') {
        toggleHelpScreen();
        return;
    }

    // Toggle pause when 'p' or 'P' is pressed
    if (ev.key.toLowerCase() === 'p') {
        togglePause();
        return;
    }

    if (ship.dead || !gameRunning) { // Check gameRunning here as well
        return;
    }
    switch (ev.key) { // Changed ev.keyCode to ev.key
        case " ": // Space bar (shoot laser) - Note: " " for Spacebar with event.key
            shootLaser();
            ship.spaceBarDown = true; // Track when space bar is held down
            break;
        case "ArrowLeft": // Left arrow (rotate ship left)
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case "ArrowUp": // Up arrow (thrust ship forward)
            ship.thrusting = true;
            startThrustSound();
            break;
        case "ArrowRight": // Right arrow (rotate ship right)
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    console.log("keyUp event:", ev.key, "Ship dead?", ship.dead, "Game running?", gameRunning); // DEBUG
    if (ship.dead || !gameRunning) { // Check gameRunning here as well
        return;
    }
    switch (ev.key) { // Changed ev.keyCode to ev.key
        case " ": // Space bar (allow shooting again)
            ship.canShoot = true;
            ship.spaceBarDown = false; // Track when space bar is released
            break;
        case "ArrowLeft": // Left arrow (stop rotating left)
            ship.rot = 0;
            break;
        case "ArrowUp": // Up arrow (stop thrusting)
            ship.thrusting = false;
            stopThrustSound();
            break;
        case "ArrowRight": // Right arrow (stop rotating right)
            ship.rot = 0;
            break;
    }
}

function shootLaser() {
    console.log("shootLaser angle (deg):", ship.a * 180 / Math.PI); // DEBUG
    // Ensure AudioContext is initialized/resumed before playing sound
    if (typeof initAudio === 'function') {
        initAudio(); // Call initAudio to ensure context is active
    }

    // Check if can shoot and lasers are available
    if (ship.canShoot && ship.lasers.length < LASER_MAX && !ship.dead && gameRunning) {
        // Track statistics for shots fired
        gameStats.shotsFired++;
        
        let laserX, laserY;
        const shipFrontOffset = ship.r; // Distance from center to nose

        // FIXED: The ship angle needs to be adjusted by -90 degrees (clockwise) to correct the firing direction
        // This is because there's currently a mismatch between ship orientation and firing direction
        const firingAngle = ship.a - Math.PI / 2;

        // Calculate laser position at the ship's nose
        laserX = ship.x + shipFrontOffset * Math.cos(firingAngle);
        laserY = ship.y + shipFrontOffset * Math.sin(firingAngle);

        let currentLaserSpeed = LASER_SPEED;
        if (activePowerUp.FAST_SHOTS && activePowerUp.FAST_SHOTS.expiryFrame > currentFrame) {
            currentLaserSpeed *= POWERUP_LASER_SPEED_BOOST_MULTIPLIER;
        }

        ship.lasers.push({
            x: laserX,
            y: laserY,
            xv: currentLaserSpeed * Math.cos(firingAngle) / FPS,
            yv: currentLaserSpeed * Math.sin(firingAngle) / FPS,
            dist: 0,
            explodeTime: 0
        });
        playLaserSound(); // Play sound after successfully creating a laser

        // Handle spray shot power-up
        if (activePowerUp.SPRAY_SHOTS && activePowerUp.SPRAY_SHOTS.expiryFrame > currentFrame) {
            for (let i = 1; i <= (POWERUP_SPRAY_SHOT_COUNT - 1) / 2; i++) {
                // Add laser to the right
                let sprayAngleRight = firingAngle + POWERUP_SPRAY_SHOT_ANGLE * i;
                let laserRightX = ship.x + shipFrontOffset * Math.cos(sprayAngleRight);
                let laserRightY = ship.y + shipFrontOffset * Math.sin(sprayAngleRight);
                ship.lasers.push({
                    x: laserRightX, y: laserRightY,
                    xv: currentLaserSpeed * Math.cos(sprayAngleRight) / FPS,
                    yv: currentLaserSpeed * Math.sin(sprayAngleRight) / FPS,
                    dist: 0, explodeTime: 0
                });

                // Add laser to the left
                let sprayAngleLeft = firingAngle - POWERUP_SPRAY_SHOT_ANGLE * i;
                let laserLeftX = ship.x + shipFrontOffset * Math.cos(sprayAngleLeft);
                let laserLeftY = ship.y + shipFrontOffset * Math.sin(sprayAngleLeft);
                ship.lasers.push({
                    x: laserLeftX, y: laserLeftY,
                    xv: currentLaserSpeed * Math.cos(sprayAngleLeft) / FPS,
                    yv: currentLaserSpeed * Math.sin(sprayAngleLeft) / FPS,
                    dist: 0, explodeTime: 0
                });
            }
        }
    }
    ship.canShoot = false; // Prevent continuous shooting by holding spacebar
    // The canShoot reset is now handled in the keyUp for " " (Space)
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = "white") {
    console.log("drawShip angle (deg):", a * 180 / Math.PI); // DEBUG
    if (!shipImage.complete || !shipImage.naturalWidth) {
        // Fallback to drawing a triangle if sprite is not ready
        context.strokeStyle = colour;
        context.lineWidth = SHIP_SIZE / 20;
        context.beginPath();

        // Draw ship as a triangle with nose pointing in ship's facing direction (a)
        context.moveTo( // nose of the ship
            x + ship.r * Math.cos(a),
            y + ship.r * Math.sin(a)
        );
        context.lineTo( // rear left
            x - ship.r * (Math.cos(a) + Math.sin(a)),
            y - ship.r * (Math.sin(a) - Math.cos(a))
        );
        context.lineTo( // rear right
            x - ship.r * (Math.cos(a) - Math.sin(a)),
            y - ship.r * (Math.sin(a) + Math.cos(a))
        );
        context.closePath();
        context.stroke();
        return; // Exit if sprite not loaded
    }

    context.save();
    context.translate(x, y);

    // Since we want the ship to face in the direction of its angle,
    // and the sprite has its nose at the top, we don't need any adjustment
    context.rotate(a);

    // Calculate the scale factor to fit the sprite into ship.r
    const spriteWidth = shipImage.width;
    const spriteHeight = shipImage.height;
    const maxDim = Math.max(spriteWidth, spriteHeight);
    const scale = (ship.r * 2) / maxDim; // ship.r is radius, so diameter is ship.r * 2

    // Draw the image centered at (0,0) after translation
    context.drawImage(
        shipImage,
        -spriteWidth * scale / 2, // Center the image horizontally
        -spriteHeight * scale / 2, // Center the image vertically
        spriteWidth * scale,
        spriteHeight * scale
    );

    context.restore();

    // Draw thruster if thrusting
    if (ship.thrusting && ship.canThrust && !ship.explodeTime && (ship.blinkNum === 0 || ship.blinkNum % 2 === 0)) {
        drawThruster(x, y, a);
    }
}

function explodeShip() {
    ship.explodeTime = Math.ceil(0.3 * FPS);
    playShipExplosionSound();
    stopThrustSound(); // Stop thrust sound if ship explodes while thrusting
}

// Add the drawThruster function right after the explodeShip function
function drawThruster(x, y, a) {
    const shipRearOffset = ship.r; // Thruster flame originates from the ship's radius at the back
    const flameLength = ship.r * 1.5;
    const flameWidth = ship.r * 0.8;

    // FIXED: Adjust the angle by -90 degrees (clockwise) to align with ship's orientation
    // Similar to the laser firing fix, this ensures correct thruster positioning
    const thrusterAngle = a - Math.PI / 2;

    // Calculate flame origin at the back of the ship (opposite of ship's angle)
    const flameOriginX = x - shipRearOffset * Math.cos(thrusterAngle);
    const flameOriginY = y - shipRearOffset * Math.sin(thrusterAngle);

    // Calculate tip of the flame (extends from origin in direction opposite to ship.a)
    const tipX = flameOriginX - flameLength * Math.cos(thrusterAngle);
    const tipY = flameOriginY - flameLength * Math.sin(thrusterAngle);

    // Calculate base corners of the flame (perpendicular to ship's direction)
    const perpDx = Math.sin(thrusterAngle);
    const perpDy = -Math.cos(thrusterAngle);

    const baseLeftX = flameOriginX + (flameWidth / 2) * perpDx;
    const baseLeftY = flameOriginY + (flameWidth / 2) * perpDy;
    const baseRightX = flameOriginX - (flameWidth / 2) * perpDx;
    const baseRightY = flameOriginY - (flameWidth / 2) * perpDy;

    context.fillStyle = "red";
    context.strokeStyle = "yellow";
    context.lineWidth = SHIP_SIZE / 10;
    context.beginPath();
    context.moveTo(baseLeftX, baseLeftY);
    context.lineTo(tipX, tipY);
    context.lineTo(baseRightX, baseRightY);
    context.closePath();
    context.fill();
    context.stroke();
}

function gameOver() {
    console.log("Game Over triggered"); // DEBUG
    ship.dead = true;
    gameRunning = false; // Stop the game
    
    // Total play time is already being tracked correctly in the update loop
    console.log("Total play time:", gameStats.totalPlayTime, "seconds"); // DEBUG
    
    // Stop all sounds when game is over
    stopAmbientBackgroundSound();
    stopUfoAmbientSound();
    stopThrustSound();
    
    // Final check for high score when game ends
    checkAndUpdateHighScore();
}

function resetGame() {
    console.log("Resetting game..."); //DEBUG
    score = 0;
    lives = GAME_LIVES;
    level = 0;
    ship = newShip(); // This will also reset ship.dead to false
    asteroids = []; // Clear existing asteroids before creating new ones

    powerUps = []; // Clear any on-screen power-ups
    // Deactivate all current power-ups
    activePowerUp.FAST_SHIP = null;
    activePowerUp.FAST_SHOTS = null;
    activePowerUp.SPRAY_SHOTS = null;
    currentFrame = 0; // Reset frame counter
    roundStartFrame = 0; // Reset round start frame
    roundTimeRemaining = ROUND_TIME_FRAMES; // Reset round timer

    comets = []; // Clear comets
    ufos = []; // Clear UFOs
    initDistantPlanet(); // Re-initialize planet for new game (new position/look)
    setNextCometSpawnFrame(); // Reset comet spawn timer
    setNextUfoSpawnFrame(); // Reset UFO spawn timer

    // Reset game statistics
    gameStats = {
        shotsFired: 0,
        shotsHit: 0, // Track successful hits on any target
        powerUpsCollected: {
            FAST_SHIP: 0,
            FAST_SHOTS: 0,
            SPRAY_SHOTS: 0
        },
        asteroidsDestroyed: {
            large: 0,
            medium: 0,
            small: 0,
            total: 0
        },
        cometsDestroyed: 0,
        ufosDestroyed: 0,
        gameStartTime: 0, // Will track actual play time in seconds
        totalPlayTime: 0
    };

    // Reset bonus level variables
    bonusLevel = false;
    bonusWave = 0;
    bonusUfosRemaining = 0;
    bonusLevelLives = 0;
    bonusLevelStarted = false;

    createStarfield(); // Recreate starfield in case canvas size changed during game over
    createAsteroidBelt();
    updateDisplays();
    gameRunning = true;
    if (update.firstRun === false) { // Reset firstRun for update loop console log
        update.firstRun = undefined;
    }
    console.log("Game reset. Score:", score, "Lives:", lives, "Level:", level, "Ship:", JSON.stringify(ship)); //DEBUG
}

function toggleHelpScreen() {
    showHelpScreen = !showHelpScreen;
    console.log("Help screen toggled:", showHelpScreen);
}

function togglePause() {
    gamePaused = !gamePaused;
    console.log("Game paused:", gamePaused);
}

function updateDisplays() {
    // HTML elements are no longer used - we're drawing directly to canvas
    // This function is kept for compatibility with existing code calls
    // but doesn't need to do anything now
    
    // Optional: If you want to keep HTML elements updated as a fallback:
    /*
    scoreDisplay.textContent = score;
    livesDisplay.textContent = lives;
    levelDisplay.textContent = level + 1; // Display level as level + 1
    highScoreDisplay.textContent = highScore; // Update high score display
    
    // Update timer display
    const timeInSeconds = Math.max(0, Math.ceil(roundTimeRemaining / FPS));
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    */
}

function spawnPowerUp(x, y) {
    // Limit the number of power-ups on screen to 2
    if (powerUps.length >= 2) {
        return; // Don't spawn if already at limit
    }

    // Set relative probabilities for each power-up type
    // FAST_SHIP: 60%, FAST_SHOTS: 30%, SPRAY_SHOTS: 10%
    const random = Math.random();
    let type;

    if (random < 0.6) {
        type = POWERUP_TYPES.FAST_SHIP; // Most common
    } else if (random < 0.9) {
        type = POWERUP_TYPES.FAST_SHOTS; // Less common
    } else {
        type = POWERUP_TYPES.SPRAY_SHOTS; // Rare
    }

    powerUps.push({
        x: x,
        y: y,
        type: type,
        size: POWERUP_SIZE,
        color: POWERUP_COLORS[type],
        xv: (Math.random() * ASTEROID_SPEED / FPS / 3) * (Math.random() < 0.5 ? 1 : -1),
        yv: (Math.random() * ASTEROID_SPEED / FPS / 3) * (Math.random() < 0.5 ? 1 : -1),
    });
    console.log("Spawned power-up:", type, "at", x, y); // DEBUG
}

function drawPowerUps() {
    for (let i = 0; i < powerUps.length; i++) {
        let pu = powerUps[i];

        // Pulse and scale animation
        const pulseRate = 2; // seconds for a complete pulse
        const timeFactor = currentFrame / FPS;
        const pulseFactor = 0.2 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 0.8;
        const scaleFactor = 0.15 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 1;

        // Set up rotation
        const rotationSpeed = 0.7; // radians per second
        const rotation = timeFactor * rotationSpeed;

        context.save();
        context.translate(pu.x, pu.y);
        context.rotate(rotation);
        context.scale(scaleFactor, scaleFactor);

        // Draw outer glow (large radius)
        const gradient = context.createRadialGradient(0, 0, pu.size * 0.2, 0, 0, pu.size * 1.2);
        gradient.addColorStop(0, pu.color);
        gradient.addColorStop(0.5, pu.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, pu.color.replace(')', ', 0)').replace('rgb', 'rgba'));

        context.fillStyle = gradient;
        context.globalAlpha = pulseFactor * 0.7;
        context.beginPath();
        context.arc(0, 0, pu.size * 1.2, 0, Math.PI * 2);
        context.fill();

        // Draw inner star
        context.globalAlpha = 1;

        // 1. Draw the main star
        drawStar(0, 0, 5, pu.size * 0.8, pu.size * 0.4, "gold", "white", 2);

        // 2. Draw a smaller rotated star on top (opposite rotation)
        context.save();
        context.rotate(-rotation * 2);
        drawStar(0, 0, 5, pu.size * 0.5, pu.size * 0.25, "#FFF7D6", "white", 1);
        context.restore();

        // 3. Draw tiny sparkles around the star
        const sparkleCount = 5;
        for (let j = 0; j < sparkleCount; j++) {
            const sparkleAngle = (j / sparkleCount) * Math.PI * 2 + timeFactor * 2;
            const sparkleDistance = pu.size * 0.9;
            const sparkleX = Math.cos(sparkleAngle) * sparkleDistance;
            const sparkleY = Math.sin(sparkleAngle) * sparkleDistance;
            const sparkleSize = (0.1 + 0.05 * Math.sin(timeFactor * 3 + j)) * pu.size;

            context.save();
            context.translate(sparkleX, sparkleY);
            context.rotate(sparkleAngle);
            context.beginPath();
            context.fillStyle = "white";
            context.arc(0, 0, sparkleSize, 0, Math.PI * 2);
            context.fill();

            // Draw sparkle lines
            context.beginPath();
            context.strokeStyle = "white";
            context.lineWidth = 1;
            context.moveTo(-sparkleSize * 2, 0);
            context.lineTo(sparkleSize * 2, 0);
            context.moveTo(0, -sparkleSize * 2);
            context.lineTo(0, sparkleSize * 2);
            context.stroke();
            context.restore();
        }

        context.restore();
    }
}

// Helper function to draw a star
function drawStar(x, y, spikes, outerRadius, innerRadius, fillColor, strokeColor, lineWidth) {
    context.beginPath();
    context.fillStyle = fillColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = lineWidth;

    for (let j = 0; j < spikes * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = j * Math.PI / spikes;
        const pointX = x + Math.cos(angle) * radius;
        const pointY = y + Math.sin(angle) * radius;

        if (j === 0) {
            context.moveTo(pointX, pointY);
        } else {
            context.lineTo(pointX, pointY);
        }
    }

    context.closePath();
    context.fill();
    context.stroke();
}

function activatePowerUp(type) {
    // Set the specific power-up type without clearing others
    activePowerUp[type] = { expiryFrame: currentFrame + POWERUP_DURATION_FRAMES };
    
    // Track power-up collection
    gameStats.powerUpsCollected[type]++;
    
    console.log("Activated power-up:", type, " Current frame:", currentFrame, "Expires at frame:", activePowerUp[type].expiryFrame); // DEBUG
    playPowerUpCollectSound();
}

function deactivatePowerUp(type) {
    // Clear the specific power-up type
    activePowerUp[type] = null;
    console.log("Deactivated power-up:", type); // DEBUG
}

function update() {
    // Wait for assets (images)
    // Sound readiness is now primarily about audioCtx.state === 'running'
    if (imagesLoaded < TOTAL_IMAGES || !audioCtx || audioCtx.state !== 'running') {
        // Calculate a scale factor based on canvas size for responsive sizing
        const scaleFactor = Math.min(1, Math.min(canvas.width / 800, canvas.height / 600));
        // Increased base sizes with a higher minimum scale factor
        const minScaleFactor = Math.max(0.85, scaleFactor);

        context.fillStyle = "black";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "white";
        context.font = Math.max(18, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
        context.textAlign = "center";
        context.textBaseline = "middle";
        let messageY = canvas.height / 4 - 45; // Moved higher up for more space
        let messages = [];

        // Game Name
        context.fillText("ASTEROIDS", canvas.width / 2, messageY);
        messageY += 30; // Adjusted spacing for better layout
        context.font = Math.max(14, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
        if (imagesLoaded < TOTAL_IMAGES) {
            messages.push(`Loading assets... Images: ${imagesLoaded}/${TOTAL_IMAGES}`);
        }
        if (!audioCtx || audioCtx.state === 'suspended') {
            messages.push("Click or press any key to play.");
        } else if (audioCtx.state !== 'running') {
            messages.push("Audio context issue: " + audioCtx.state + ". Try interacting.");
        }

        if (messages.length > 0) {
            const lineHeight = Math.max(15, Math.floor(20 * scaleFactor));
            messageY -= (messages.length - 1) * lineHeight / 2; // Adjust start Y to center messages
            for (let i = 0; i < messages.length; i++) {
                context.fillText(messages[i], canvas.width / 2, messageY + (i * lineHeight));
            }
        }

        // Display controls - moved up and made more compact
        const controlsY = canvas.height / 4 + 25;
        context.font = "bold " + Math.max(20, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("CONTROLS", canvas.width / 2, controlsY);

        // Create a 2-column layout for more efficient space usage
        const colWidth = Math.min(220, canvas.width / 3);
        const col1X = canvas.width / 2 - colWidth / 2;
        const col2X = canvas.width / 2 + colWidth / 2;
        const iconSize = Math.max(12, Math.floor(16 * minScaleFactor));
        const startY = controlsY + 35;
        const lineHeight = Math.max(28, Math.floor(32 * minScaleFactor)); // Larger line height

        // Set up for left column
        context.textAlign = "left";
        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'"; // Larger font

        // Draw Up Arrow (Thrust)
        const upArrowY = startY;
        context.fillStyle = "white";
        context.beginPath();
        context.moveTo(col1X, upArrowY - 5);
        context.lineTo(col1X - 10, upArrowY + 5);
        context.lineTo(col1X - 5, upArrowY + 5);
        context.lineTo(col1X - 5, upArrowY + 14);
        context.lineTo(col1X + 5, upArrowY + 14);
        context.lineTo(col1X + 5, upArrowY + 5);
        context.lineTo(col1X + 10, upArrowY + 5);
        context.closePath();
        context.fill();
        context.fillText("Thrust", col1X + 20, upArrowY + 5);

        // Left/Right Arrows (Rotate)
        const arrowsY = upArrowY + lineHeight;
        // Left arrow
        context.beginPath();
        context.moveTo(col1X - 14, arrowsY);
        context.lineTo(col1X - 5, arrowsY - 5);
        context.lineTo(col1X - 5, arrowsY + 5);
        context.closePath();
        context.fill();
        // Right arrow
        context.beginPath();
        context.moveTo(col1X + 14, arrowsY);
        context.lineTo(col1X + 5, arrowsY - 5);
        context.lineTo(col1X + 5, arrowsY + 5);
        context.closePath();
        context.fill();
        context.fillText("Rotate", col1X + 20, arrowsY);

        // P key (Pause) - moved to left column
        const pKeyY = arrowsY + lineHeight;
        context.fillStyle = "white";
        context.fillRect(col1X - 10, pKeyY - 6, 20, 14);
        context.fillStyle = "black";
        context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
        context.textAlign = "center";
        context.fillText("P", col1X, pKeyY + 1);
        context.fillStyle = "white";
        context.textAlign = "left";
        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("Pause", col1X + 20, pKeyY + 4);

        // Set up for right column
        context.textAlign = "left";

        // Space Bar (Fire)
        const spaceY = startY;
        context.fillStyle = "white";
        context.fillRect(col2X - 22, spaceY - 6, 44, 14);
        context.fillStyle = "black";
        context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
        context.textAlign = "center";
        context.fillText("SPACE", col2X, spaceY + 1);
        context.fillStyle = "white";
        context.textAlign = "left";
        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("Fire", col2X + 28, spaceY + 4);

        // R key (Reset)
        const rKeyY = spaceY + lineHeight;
        context.fillStyle = "white";
        context.fillRect(col2X - 10, rKeyY - 6, 20, 14);
        context.fillStyle = "black";
        context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
        context.textAlign = "center";
        context.fillText("R", col2X, rKeyY + 1);
        context.fillStyle = "white";
        context.textAlign = "left";
        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("Reset", col2X + 28, rKeyY + 4);

        // H key (Help) - moved up to replace P key position
        const hKeyY = rKeyY + lineHeight;
        context.fillStyle = "white";
        context.fillRect(col2X - 10, hKeyY - 6, 20, 14);
        context.fillStyle = "black";
        context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
        context.textAlign = "center";
        context.fillText("H", col2X, hKeyY + 1);
        context.fillStyle = "white";
        context.textAlign = "left";
        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("Help", col2X + 28, hKeyY + 4);

        // Display power-ups in a more compact grid layout
        const powerUpY = startY + lineHeight * 3 + 20;
        context.textAlign = "center";
        context.font = "bold " + Math.max(20, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("POWER-UPS", canvas.width / 2, powerUpY);

        // Define power-up grid layout with more spacing
        const puGrid = {
            cols: 3,
            spacing: Math.min(canvas.width / 3.2, 160), // Wider spacing
            iconSize: Math.max(18, Math.floor(22 * minScaleFactor)), // Larger power-up icons
            startY: powerUpY + 40, // More vertical space
            labelOffset: 40 // Much more padding between icon and text
        };

        context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'"; // Larger font

        // Draw power-ups in grid layout with animated icons like in the game
        const powerUpTypes = [
            { type: POWERUP_TYPES.FAST_SHIP, name: "Speed Boost" },
            { type: POWERUP_TYPES.FAST_SHOTS, name: "Rapid Fire" },
            { type: POWERUP_TYPES.SPRAY_SHOTS, name: "Spread Shot" }
        ];

        // Calculate timing for animation
        const timeFactor = currentFrame ? (currentFrame / FPS) : (Date.now() / 1000);

        for (let i = 0; i < powerUpTypes.length; i++) {
            const pu = powerUpTypes[i];
            const x = canvas.width / 2 + (i - 1) * puGrid.spacing;
            const y = puGrid.startY;

            // Draw animated power-up icon similar to in-game style
            drawAnimatedPowerUpIcon(x, y, POWERUP_COLORS[pu.type], puGrid.iconSize, timeFactor);

            // Draw power-up name with more padding from the icon
            context.fillStyle = "white";
            context.fillText(pu.name, x, y + puGrid.labelOffset);
        }

        // Add note about rapid fire at the bottom with larger font
        context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
        context.fillText("(Hold SPACE for continuous fire with Rapid Fire power-up)",
            canvas.width / 2, puGrid.startY + puGrid.labelOffset + 30);
            
        // Add UFO bonus information
        const ufoY = puGrid.startY + puGrid.labelOffset + 70; // Position below power-up info
        
        // Center everything for UFO bonus section
        context.textAlign = "center";
        
        // Draw section title with UFO emojis on both sides
        const ufoTitleSize = Math.max(20, Math.floor(24 * minScaleFactor));
        const ufoEmojiSize = Math.max(24, Math.floor(28 * minScaleFactor)); // Slightly bigger emojis
        
        // Draw title with emojis
        context.save();
        // Add glow effect for UFO emojis
        context.shadowColor = UFO_COLOR || "rgba(150, 255, 150, 0.9)"; // Green glow
        context.shadowBlur = 15;
        
        // Draw left UFO emoji
        context.textBaseline = "middle";
        context.font = ufoEmojiSize + "px sans-serif";
        context.fillStyle = "white";
        context.fillText("🛸", canvas.width / 2 - 110, ufoY);
        
        // Draw right UFO emoji
        context.fillText("🛸", canvas.width / 2 + 110, ufoY);
        context.restore();
        
        // Draw the title text
        context.font = "bold " + ufoTitleSize + "px 'Courier New'";
        context.fillText("UFO BONUS", canvas.width / 2, ufoY);
        
        // Draw description text
        const ufoIconY = ufoY + 40;
        context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
        context.fillStyle = "white";
        context.fillText("Destroy UFOs to activate ALL power-ups at once!", 
            canvas.width / 2, ufoIconY);
            
        // Add comet bonus information
        const cometY = ufoIconY + 70; // Position below UFO info
        
        // Center everything for comet bonus section
        context.textAlign = "center";
        
        // Draw section title with comet emojis on both sides
        const cometTitleSize = Math.max(20, Math.floor(24 * minScaleFactor));
        const cometEmojiSize = Math.max(24, Math.floor(28 * minScaleFactor)); // Slightly bigger emojis
        
        // Draw title with emojis
        context.save();
        // Add glow effect for comet emojis
        context.shadowColor = "rgba(220, 180, 255, 0.9)"; // Purple glow
        context.shadowBlur = 15;
        
        // Draw left comet emoji
        context.textBaseline = "middle";
        context.font = cometEmojiSize + "px sans-serif";
        context.fillStyle = "white";
        context.fillText("☄️", canvas.width / 2 - 110, cometY);
        
        // Draw right comet emoji
        context.fillText("☄️", canvas.width / 2 + 110, cometY);
        context.restore();
        
        // Draw the title text
        context.font = "bold " + cometTitleSize + "px 'Courier New'";
        context.fillText("COMET REWARDS", canvas.width / 2, cometY);
        
        // Draw description text
        const cometIconY = cometY + 40;
        context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
        context.fillStyle = "white";
        context.fillText("Destroy comets for a chance at an extra life", 
            canvas.width / 2, cometIconY);
        context.fillText("or to clear all asteroids from the screen!", 
            canvas.width / 2, cometIconY + 25);

        // Helper function to draw animated power-up star icon with improved visibility
        function drawAnimatedPowerUpIcon(x, y, color, size, timeFactor) {
            const pulseRate = 2; // seconds for a complete pulse
            const pulseFactor = 0.2 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 0.8;
            const scaleFactor = 0.15 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 1;
            const rotation = timeFactor * 0.7; // rotation speed similar to in-game

            context.save();
            context.translate(x, y);
            context.rotate(rotation);
            context.scale(scaleFactor, scaleFactor);

            // Draw outer glow (large radius)
            const gradient = context.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.2);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
            gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

            context.fillStyle = gradient;
            context.globalAlpha = pulseFactor * 0.9; // Higher opacity for better visibility
            context.beginPath();
            context.arc(0, 0, size * 1.2, 0, Math.PI * 2);
            context.fill();

            // Draw inner star
            context.globalAlpha = 1;

            // Draw the main star
            drawStar(0, 0, 5, size * 0.8, size * 0.4, "gold", "white", 2);

            // Draw a smaller rotated star on top (opposite rotation)
            context.save();
            context.rotate(-rotation * 2);
            drawStar(0, 0, 5, size * 0.5, size * 0.25, "#FFF7D6", "white", 1);
            context.restore();

            // Draw tiny sparkles around the star (fewer sparkles, limited radius)
            const sparkleCount = 4;
            for (let j = 0; j < sparkleCount; j++) {
                const sparkleAngle = (j / sparkleCount) * Math.PI * 2 + timeFactor * 2;
                const sparkleDistance = size * 0.7; // Reduced distance to keep sparkles closer to center
                const sparkleX = Math.cos(sparkleAngle) * sparkleDistance;
                const sparkleY = Math.sin(sparkleAngle) * sparkleDistance;
                const sparkleSize = (0.1 + 0.05 * Math.sin(timeFactor * 3 + j)) * size;

                context.save();
                context.translate(sparkleX, sparkleY);
                context.rotate(sparkleAngle);
                context.beginPath();
                context.fillStyle = "white";
                context.arc(0, 0, sparkleSize, 0, Math.PI * 2);
                context.fill();

                // Draw sparkle lines (shorter)
                context.beginPath();
                context.strokeStyle = "white";
                context.lineWidth = 1;
                context.moveTo(-sparkleSize * 1.5, 0);
                context.lineTo(sparkleSize * 1.5, 0);
                context.moveTo(0, -sparkleSize * 1.5);
                context.lineTo(0, sparkleSize * 1.5);
                context.stroke();
                context.restore();
            }

            context.restore();
        }

        // Attempt to initialize audio if it hasn't been, as a fallback, 
        // but primary init should be from body event listeners.
        if (!audioCtx && typeof initAudio === 'function') {
            // initAudio(); // Calling this every frame might be too much if there's an issue.
            // Better to rely on the one-time event listeners.
        }

        return; // Stop update loop until assets are loaded and audio is ready
    }

    // Only increment frame counter and update timer when game is actively running
    // (not paused, not in help screen, and game is running)
    if (!showHelpScreen && !gamePaused && gameRunning) {
        currentFrame++; // Increment global frame counter
        
        // Increment play time (convert frames to seconds)
        gameStats.totalPlayTime = Math.floor(currentFrame / FPS);

        // Update round timer
        if (roundStartFrame === 0) {
            roundStartFrame = currentFrame; // Start timer on first frame of round
        }
        roundTimeRemaining = ROUND_TIME_FRAMES - (currentFrame - roundStartFrame);
        if (roundTimeRemaining < 0) {
            roundTimeRemaining = 0;
        }
    }

    // Check for comet spawning
    if (currentFrame >= nextCometSpawnFrame) {
        spawnComet();
    }

    // Check for UFO spawning
    if (currentFrame >= nextUfoSpawnFrame) {
        spawnUfo();
    }

    if (!gameRunning) {
        // Display Game Over message and reset instructions
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "white";
        context.font = "bold 50px 'Courier New'";
        context.fillText("GAME OVER", canvas.width / 2, canvas.height / 6);
        
        // Display final score
        context.font = "bold 30px 'Courier New'";
        context.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 6 + 50);
        
        // Show high score achievement if it's a new record
        if (score === highScore && score > 0) {
            context.fillStyle = "#ffd700"; // Gold color
            context.font = "bold 28px 'Courier New'";
            context.fillText("★ NEW HIGH SCORE! ★", canvas.width / 2, canvas.height / 6 + 90);
            context.fillStyle = "white";
        }
        
        // Display game statistics
        const statsStartY = canvas.height / 2.8;
        const lineHeight = 32;
        context.font = "20px 'Courier New'";
        
        // Calculate column positions for better centering
        const colWidth = 320; // Fixed width for each column
        const colSpacing = 60; // Space between columns
        const totalWidth = colWidth * 2 + colSpacing;
        const leftColX = (canvas.width - totalWidth) / 2;
        const rightColX = leftColX + colWidth + colSpacing;
        
        // Format time in hours, minutes, and seconds
        const hours = Math.floor(gameStats.totalPlayTime / 3600);
        const minutes = Math.floor((gameStats.totalPlayTime % 3600) / 60);
        const seconds = Math.floor(gameStats.totalPlayTime % 60);
        const timeString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Calculate accuracy percentage
        const accuracy = gameStats.shotsFired > 0 ? Math.round((gameStats.shotsHit / gameStats.shotsFired) * 100) : 0;
        
        // Left column statistics
        context.textAlign = "left";
        context.fillText(`Total Play Time: ${timeString}`, leftColX, statsStartY);
        context.fillText(`Shots Fired: ${gameStats.shotsFired}`, leftColX, statsStartY + lineHeight);
        context.fillText(`Accuracy: ${accuracy}% (${gameStats.shotsHit}/${gameStats.shotsFired})`, leftColX, statsStartY + lineHeight * 2);
        context.fillText(`Asteroids Destroyed: ${gameStats.asteroidsDestroyed.total}`, leftColX, statsStartY + lineHeight * 3);
        context.fillText(`  Large: ${gameStats.asteroidsDestroyed.large}`, leftColX + 20, statsStartY + lineHeight * 4);
        context.fillText(`  Medium: ${gameStats.asteroidsDestroyed.medium}`, leftColX + 20, statsStartY + lineHeight * 5);
        context.fillText(`  Small: ${gameStats.asteroidsDestroyed.small}`, leftColX + 20, statsStartY + lineHeight * 6);
        
        // Right column statistics
        context.fillText(`UFOs Destroyed: ${gameStats.ufosDestroyed}`, rightColX, statsStartY);
        context.fillText(`Comets Destroyed: ${gameStats.cometsDestroyed}`, rightColX, statsStartY + lineHeight);
        context.fillText(`Power-ups Collected:`, rightColX, statsStartY + lineHeight * 2);
        context.fillText(`  Speed Boost: ${gameStats.powerUpsCollected.FAST_SHIP}`, rightColX + 20, statsStartY + lineHeight * 3);
        context.fillText(`  Rapid Fire: ${gameStats.powerUpsCollected.FAST_SHOTS}`, rightColX + 20, statsStartY + lineHeight * 4);
        context.fillText(`  Spread Shot: ${gameStats.powerUpsCollected.SPRAY_SHOTS}`, rightColX + 20, statsStartY + lineHeight * 5);
        
        // Reset instructions
        context.textAlign = "center";
        context.font = "bold 24px 'Courier New'";
        context.fillText("Press 'R' to Play Again", canvas.width / 2, canvas.height - 60);
        return; // Stop the update loop if game is not running
    }

    // Check if help screen should be displayed
    if (showHelpScreen) {
        drawHelpScreen();
        return; // Skip the rest of the game update while help is shown
    }

    // Check if game is paused
    if (gamePaused) {
        drawPauseScreen();
        return; // Skip the rest of the game update while paused
    }

    // First log in update to ensure it's running
    if (update.firstRun === undefined) {
        console.log("Update loop is running. Initial ship state:", JSON.stringify(ship)); // DEBUG
        update.firstRun = false;
    }

    let blinkOn = ship.blinkNum % 2 == 0;
    let exploding = ship.explodeTime > 0;

    // Set canvas dimensions dynamically and check if resize occurred
    let oldCanvasWidth = canvas.width;
    let oldCanvasHeight = canvas.height;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    if (canvas.width !== oldCanvasWidth || canvas.height !== oldCanvasHeight) {
        console.log("Canvas resized. Recreating starfield."); // DEBUG
        createStarfield(); // Recreate starfield if canvas size changed
        console.log("Ship position might need adjustment after resize.");
    }

    // Move stars for parallax effect based on ship's current velocity (ship.thrust)
    for (let i = 0; i < stars.length; i++) {
        // Parallax shift is proportional to ship's velocity and star's "closeness" (larger radius)
        // And in the opposite direction of ship's movement
        // Normalizing star radius against MAX_STAR_RADIUS_FOR_PARALLAX to get a factor between 0 and 1
        let depthFactor = stars[i].r / MAX_STAR_RADIUS_FOR_PARALLAX;
        let parallaxShiftX = -ship.thrust.x * depthFactor * PARALLAX_FACTOR;
        let parallaxShiftY = -ship.thrust.y * depthFactor * PARALLAX_FACTOR;

        stars[i].x += parallaxShiftX;
        stars[i].y += parallaxShiftY;

        // Wrap stars around the screen
        if (stars[i].x < 0) stars[i].x += canvas.width;
        else if (stars[i].x > canvas.width) stars[i].x -= canvas.width;
        if (stars[i].y < 0) stars[i].y += canvas.height;
        else if (stars[i].y > canvas.height) stars[i].y -= canvas.height;
    }

    // Move distant planet for parallax effect (faster than stars to appear closer)
    if (distantPlanet.x !== undefined) {
        let planetParallaxShiftX = -ship.thrust.x * PLANET_PARALLAX_FACTOR;
        let planetParallaxShiftY = -ship.thrust.y * PLANET_PARALLAX_FACTOR;

        distantPlanet.x += planetParallaxShiftX;
        distantPlanet.y += planetParallaxShiftY;

        // Wrap planet around the screen with some buffer for its size
        let planetBuffer = distantPlanet.radius || 50; // Use radius if available, fallback to 50
        if (distantPlanet.x < -planetBuffer) distantPlanet.x += canvas.width + (planetBuffer * 2);
        else if (distantPlanet.x > canvas.width + planetBuffer) distantPlanet.x -= canvas.width + (planetBuffer * 2);
        if (distantPlanet.y < -planetBuffer) distantPlanet.y += canvas.height + (planetBuffer * 2);
        else if (distantPlanet.y > canvas.height + planetBuffer) distantPlanet.y -= canvas.height + (planetBuffer * 2);
    }

    // Draw space
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield first (background layer)
    drawStarfield();

    // Draw distant planet second (foreground layer that occludes stars)
    drawDistantPlanet();

    // Update and Draw Comets
    updateComets();
    drawComets();

    // Update and Draw UFOs
    updateUfos();
    drawUfos();
    updateUfoLasers(); // Update UFO lasers
    drawUfoLasers(); // Draw UFO lasers
    updateUfoAmbientSound(); // Manage UFO ambient sound
    updateAmbientBackgroundSound(); // Manage ambient background sound

    // Handle active power-up expiry for all power-up types
    if (activePowerUp.FAST_SHIP && currentFrame >= activePowerUp.FAST_SHIP.expiryFrame) {
        console.log("FAST_SHIP power-up expired at frame:", currentFrame); // DEBUG
        activePowerUp.FAST_SHIP = null;
    }
    if (activePowerUp.FAST_SHOTS && currentFrame >= activePowerUp.FAST_SHOTS.expiryFrame) {
        console.log("FAST_SHOTS power-up expired at frame:", currentFrame); // DEBUG
        activePowerUp.FAST_SHOTS = null;
    }
    if (activePowerUp.SPRAY_SHOTS && currentFrame >= activePowerUp.SPRAY_SHOTS.expiryFrame) {
        console.log("SPRAY_SHOTS power-up expired at frame:", currentFrame); // DEBUG
        activePowerUp.SPRAY_SHOTS = null;
    }

    // Thrust the ship
    let currentShipThrust = SHIP_THRUST;
    if (activePowerUp.FAST_SHIP && activePowerUp.FAST_SHIP.expiryFrame > currentFrame) {
        currentShipThrust *= POWERUP_SPEED_BOOST_MULTIPLIER;
    }

    // Handle rapid fire when space bar is held down
    if (ship.spaceBarDown && activePowerUp.FAST_SHOTS && activePowerUp.FAST_SHOTS.expiryFrame > currentFrame && !ship.dead) {
        ship.rapidFireCounter++;
        // Fire every 5 frames (adjust for desired firing rate)
        if (ship.rapidFireCounter >= 5) {
            ship.rapidFireCounter = 0;
            ship.canShoot = true;
            shootLaser();
        }
    }

    if (ship.thrusting && !ship.dead) {
        // FIXED: Adjust angle by -90 degrees (clockwise) to correct thrust direction
        // This makes the ship move in the direction it's facing
        const thrustAngle = ship.a - Math.PI / 2;
        ship.thrust.x += currentShipThrust * Math.cos(thrustAngle) / FPS;
        ship.thrust.y += currentShipThrust * Math.sin(thrustAngle) / FPS;

        // Thruster drawing is now handled in the drawShip function via drawThruster
    } else if (!ship.dead) { // Added !ship.dead
        ship.thrust.x -= SHIP_FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= SHIP_FRICTION * ship.thrust.y / FPS;
    }

    // Draw the ship
    if (!exploding && !ship.dead) { // Added !ship.dead
        if (blinkOn) {
            drawShip(ship.x, ship.y, ship.a);
        }

        // Handle blinking
        if (ship.blinkNum > 0) {
            ship.blinkTime--;
            if (ship.blinkTime == 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNum--;
            }
        }
    } else if (exploding && !ship.dead) { // Draw explosion only if not dead yet (during explodeTime)
        // Draw explosion
        context.fillStyle = "darkred";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "red";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "orange";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "yellow";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        context.fill();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        context.fill();
    }

    // Draw the lasers
    for (let i = 0; i < ship.lasers.length; i++) {
        context.fillStyle = "salmon";
        // Make lasers more visible if FAST_SHOTS is active (optional)
        if (activePowerUp.FAST_SHOTS && activePowerUp.FAST_SHOTS.expiryFrame > currentFrame) {
            context.fillStyle = "orange";
        }
        context.beginPath();
        context.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
        context.fill();
    }

    // Detect laser hits on asteroids
    let ax, ay, ar, lx, ly;
    if (!ship.dead) { // Only process laser hits if game is active
        for (let i = asteroids.length - 1; i >= 0; i--) {
            // Skip exploding asteroids for collision detection
            if (asteroids[i].explodeTime > 0) continue;
            
            ax = asteroids[i].x;
            ay = asteroids[i].y;
            ar = asteroids[i].r;

            // Loop over the lasers
            for (let j = ship.lasers.length - 1; j >= 0; j--) {
                lx = ship.lasers[j].x;
                ly = ship.lasers[j].y;

                // Detect hits
                if (distBetweenPoints(ax, ay, lx, ly) < ar) {
                    // Remove the laser
                    ship.lasers.splice(j, 1);

                    // Track successful hit
                    gameStats.shotsHit++;

                    // Destroy the asteroid and gain score
                    destroyAsteroid(i);
                    playAsteroidExplosionSound(); // Play sound on hit
                    break;
                }
            }
        }
    }

    // Detect laser hits on comets
    if (!ship.dead) {
        for (let i = comets.length - 1; i >= 0; i--) {
            let cx = comets[i].x;
            let cy = comets[i].y;
            let cr = comets[i].r; // Collision radius

            for (let j = ship.lasers.length - 1; j >= 0; j--) {
                lx = ship.lasers[j].x;
                ly = ship.lasers[j].y;

                if (distBetweenPoints(cx, cy, lx, ly) < cr) {
                    // Comet hit
                    comets.splice(i, 1);
                    ship.lasers.splice(j, 1);
                    playCometExplosionSound();
                    
                    // Track successful hit
                    gameStats.shotsHit++;
                    
                    // Track comet destroyed
                    gameStats.cometsDestroyed++;

                    // Trigger random reward
                    if (Math.random() < 0.5) { // 50% chance for 1-Up
                        lives++;
                        play1UpSound();
                        console.log("Comet reward: 1-Up! Lives:", lives); // DEBUG
                    } else { // 50% chance to destroy all asteroids
                        console.log("Comet reward: Destroy all asteroids!"); // DEBUG
                        let screenClearScore = 0;
                        for (let k = asteroids.length - 1; k >= 0; k--) {
                            if (asteroids[k].r === Math.ceil(ASTEROID_SIZE / 2)) screenClearScore += POINTS_LRG;
                            else if (asteroids[k].r === Math.ceil(ASTEROID_SIZE / 4)) screenClearScore += POINTS_MED;
                            else screenClearScore += POINTS_SML;
                            // No need to call destroyAsteroid(k) to avoid sound/powerup cascade from this event
                        }
                        score += screenClearScore;
                        asteroids = []; // Clear all asteroids
                        checkAndUpdateHighScore(); // Check for high score after screen clear bonus
                        playScreenClearSound();
                    }
                    updateDisplays(); // Update score/lives display
                    break; // Laser hit one comet, stop checking this laser
                }
            }
            // If comet was destroyed, outer loop needs to continue to next comet correctly
            // No 'break' here as a laser might hit multiple comets if perfectly aligned (though unlikely)
        }
    }

    // Detect laser hits on UFOs
    if (!ship.dead) {
        for (let i = ufos.length - 1; i >= 0; i--) {
            let ux = ufos[i].x;
            let uy = ufos[i].y;
            let ur = ufos[i].r; // Collision radius

            for (let j = ship.lasers.length - 1; j >= 0; j--) {
                lx = ship.lasers[j].x;
                ly = ship.lasers[j].y;

                if (distBetweenPoints(ux, uy, lx, ly) < ur) {
                    // UFO hit
                    ufos.splice(i, 1);
                    ship.lasers.splice(j, 1);
                    playUfoExplosionSound();
                    score += UFO_POINTS;
                    
                    // Track successful hit
                    gameStats.shotsHit++;
                    
                    // Track UFO destroyed
                    gameStats.ufosDestroyed++;
                    
                    checkAndUpdateHighScore(); // Check for high score after UFO destruction
                    screenFlashFrames = SCREEN_FLASH_DURATION; // Trigger screen flash effect
                    giveAllPowerUps(); // Activate all power-ups
                    updateDisplays(); // Update score display
                    break; // Laser hit one UFO, stop checking this laser
                }
            }
        }
    }

    // Move and draw power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        pu.x += pu.xv;
        pu.y += pu.yv;

        // Screen wrap for power-ups
        if (pu.x < 0 - pu.size) pu.x = canvas.width + pu.size;
        else if (pu.x > canvas.width + pu.size) pu.x = 0 - pu.size;
        if (pu.y < 0 - pu.size) pu.y = canvas.height + pu.size;
        else if (pu.y > canvas.height + pu.size) pu.y = 0 - pu.size;

        // Check collision with ship
        if (!ship.dead && distBetweenPoints(ship.x, ship.y, pu.x, pu.y) < ship.r + pu.size / 2) {
            activatePowerUp(pu.type);
            powerUps.splice(i, 1); // Remove collected power-up
            continue; // Skip drawing this frame as it's collected
        }
    }
    drawPowerUps(); // Draw remaining power-ups

    // Check for asteroid collisions (if not exploding, not dead, and not invincible)
    if (!exploding && !ship.dead && ship.blinkNum == 0) {
        for (let i = 0; i < asteroids.length; i++) {
            // Skip exploding asteroids for collision detection
            if (asteroids[i].explodeTime > 0) continue;
            
            if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.r + asteroids[i].r) {
                explodeShip();
                destroyAsteroid(i);
                // Ship explosion sound is already played in explodeShip()
                // Asteroid explosion sound for the one that hit the ship:
                playAsteroidExplosionSound();
                break;
            }
        }
    }

    // Check for UFO collisions (if not exploding, not dead, and not invincible)
    if (!exploding && !ship.dead && ship.blinkNum == 0) {
        for (let i = 0; i < ufos.length; i++) {
            if (distBetweenPoints(ship.x, ship.y, ufos[i].x, ufos[i].y) < ship.r + ufos[i].r) {
                explodeShip();
                // Remove the UFO that hit the ship
                ufos.splice(i, 1);
                // Ship explosion sound is already played in explodeShip()
                // UFO explosion sound for the one that hit the ship:
                playUfoExplosionSound();
                break;
            }
        }
    }
    
    // Check for UFO laser collisions with ship
    if (!exploding && !ship.dead && ship.blinkNum == 0) {
        for (let i = ufoLasers.length - 1; i >= 0; i--) {
            let laser = ufoLasers[i];
            if (distBetweenPoints(ship.x, ship.y, laser.x, laser.y) < ship.r) {
                // Remove the laser
                ufoLasers.splice(i, 1);
                // Destroy the ship
                explodeShip();
                break;
            }
        }
    }

    // Rotate and move the ship (if not exploding and not dead)
    if (!exploding && !ship.dead) {
        // Rotate ship
        ship.a += ship.rot;

        // Normalize angle to keep it between 0 and 2*PI
        ship.a = (ship.a % TWO_PI + TWO_PI) % TWO_PI;

        // Move the ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } else if (exploding && !ship.dead) { // Handle explosion countdown only if exploding and not yet fully dead
        ship.explodeTime--;
        if (ship.explodeTime == 0) {
            lives--;
            livesDisplay.textContent = lives; // Update lives display immediately
            // Lose all power-ups on death
            activePowerUp.FAST_SHIP = null;
            activePowerUp.FAST_SHOTS = null;
            activePowerUp.SPRAY_SHOTS = null;
            if (lives == 0) {
                gameOver();
            } else {
                ship = newShip();
            }
        }
    }

    // Handle edge of screen
    if (!ship.dead) { // Ship should only wrap if not dead
        if (ship.x < 0 - ship.r) {
            ship.x = canvas.width + ship.r;
        }
        else if (ship.x > canvas.width + ship.r) {
            ship.x = 0 - ship.r;
        }
        if (ship.y < 0 - ship.r) {
            ship.y = canvas.height + ship.r;
        }
        else if (ship.y > canvas.height + ship.r) {
            ship.y = 0 - ship.r;
        }
    }

    // Move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
        // Check distance travelled
        if (ship.lasers[i].dist > LASER_DIST * canvas.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // Move the laser
        ship.lasers[i].x += ship.lasers[i].xv;
        ship.lasers[i].y += ship.lasers[i].yv;

        // Add to distance travelled
        ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2));

        // Handle edge of screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canvas.width;
        }
        else if (ship.lasers[i].x > canvas.width) {
            ship.lasers[i].x = 0;
        }
        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canvas.height;
        }
        else if (ship.lasers[i].y > canvas.height) {
            ship.lasers[i].y = 0;
        }
    }

    // Move the asteroids and handle explosions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        // Handle explosion countdown
        if (asteroids[i].explodeTime > 0) {
            asteroids[i].explodeTime--;
            if (asteroids[i].explodeTime == 0) {
                // Remove asteroid after explosion completes
                asteroids.splice(i, 1);
                continue;
            }
            // Don't move exploding asteroids
            continue;
        }

        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // Handle asteroid edge of screen
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canvas.width + asteroids[i].r;
        }
        else if (asteroids[i].x > canvas.width + asteroids[i].r) {
            asteroids[i].x = 0 - asteroids[i].r;
        }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canvas.height + asteroids[i].r;
        }
        else if (asteroids[i].y > canvas.height + asteroids[i].r) {
            asteroids[i].y = 0 - asteroids[i].r;
        }
    }

    // Draw asteroids
    for (let i = 0; i < asteroids.length; i++) {
        let roid = asteroids[i];
        
        // Check if asteroid is exploding
        if (roid.explodeTime > 0) {
            // Draw explosion effects (similar to ship explosion)
            context.fillStyle = "darkred";
            context.beginPath();
            context.arc(roid.x, roid.y, roid.r * 1.7, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "red";
            context.beginPath();
            context.arc(roid.x, roid.y, roid.r * 1.4, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "orange";
            context.beginPath();
            context.arc(roid.x, roid.y, roid.r * 1.1, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "yellow";
            context.beginPath();
            context.arc(roid.x, roid.y, roid.r * 0.8, 0, Math.PI * 2, false);
            context.fill();
            context.fillStyle = "white";
            context.beginPath();
            context.arc(roid.x, roid.y, roid.r * 0.5, 0, Math.PI * 2, false);
            context.fill();
        } else {
            // Draw normal asteroid
            if (roid.image && roid.image.complete && roid.image.naturalWidth !== 0) {
                context.save();
                context.translate(roid.x, roid.y);
                // Optional: Rotate asteroids if desired. 
                // context.rotate(roid.a); 
                context.drawImage(
                    roid.image, // Use the specific image for this asteroid
                    // roid.sprite.sx, // No longer using sprite sheet
                    // roid.sprite.sy,
                    // roid.sprite.sWidth,
                    // roid.sprite.sHeight,
                    -roid.drawWidth / 2, // Draw centered
                    -roid.drawHeight / 2, // Draw centered
                    roid.drawWidth,
                    roid.drawHeight
                );
                context.restore();
            } else {
                // Fallback: Draw vector asteroids if image not loaded (should be less likely now)
                context.strokeStyle = "slategrey";
                context.lineWidth = SHIP_SIZE / 20;
                let x, y, r_fallback, a_fallback, vert_fallback, offs_fallback; // Renamed to avoid conflict
                // Get the asteroid properties
                x = roid.x;
                y = roid.y;
                r_fallback = roid.r;
                a_fallback = roid.a;
                // Need to ensure vert and offs are available if we hit this fallback
                // For now, this fallback might not work well without them.
                // Consider removing vector fallback or ensuring vert/offs are still populated if needed.

                // Simplified fallback circle if image fails
                context.beginPath();
                context.arc(x, y, r_fallback, 0, Math.PI * 2);
                context.stroke();
            }
        }
    }

    // Update score, lives, and level display
    updateDisplays();

    // Draw power-up legend at the bottom of the screen
    drawPowerUpLegend();
    
    // Draw HUD elements at the top of the screen
    drawHUD();

    // Draw screen flash effect if needed
    drawScreenFlash();

    // New level if all asteroids are destroyed OR timer runs out, and game not over
    if ((asteroids.length == 0 || roundTimeRemaining <= 0) && !ship.dead) { // !ship.dead is technically covered by gameRunning
        level++;
        console.log("New level:", level, roundTimeRemaining <= 0 ? "(timer expired)" : "(all asteroids destroyed)"); // DEBUG
        
        // Check if it's time for a bonus level (every 3 levels)
        if (level % 3 === 0) {
            startBonusLevel();
        } else {
            createAsteroidBelt();
            
            // Reset timer for new level
            roundStartFrame = 0;
            roundTimeRemaining = ROUND_TIME_FRAMES;
        }
        
        updateDisplays(); // Update level display immediately
    }
    
    // Handle bonus level completion
    if (bonusLevel && bonusUfosRemaining <= 0) {
        if (bonusWave < 3) {
            // Start next wave
            bonusWave++;
            spawnBonusWave();
            console.log("Starting bonus wave:", bonusWave); // DEBUG
        } else {
            // End bonus level
            endBonusLevel();
        }
    }
}

function destroyAsteroid(index) {
    let x = asteroids[index].x;
    let y = asteroids[index].y;
    let r = asteroids[index].r;

    // Start explosion animation
    asteroids[index].explodeTime = Math.ceil(0.2 * FPS); // Shorter explosion than ship

    // Split the asteroid if necessary
    if (r == Math.ceil(ASTEROID_SIZE / 2)) { // Large asteroid
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 4)));
        score += POINTS_LRG;
        // Track large asteroid destroyed
        gameStats.asteroidsDestroyed.large++;
    } else if (r == Math.ceil(ASTEROID_SIZE / 4)) { // Medium asteroid
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 8)));
        score += POINTS_MED;
        // Track medium asteroid destroyed
        gameStats.asteroidsDestroyed.medium++;
    } else { // Small asteroid
        score += POINTS_SML;
        // Track small asteroid destroyed
        gameStats.asteroidsDestroyed.small++;
    }
    
    // Increment total asteroids destroyed
    gameStats.asteroidsDestroyed.total++;

    // Check and update high score after scoring points
    checkAndUpdateHighScore();

    // Asteroid will be removed after explosion animation completes
    // Sound is now played when destroyAsteroid is called

    // Chance to spawn a power-up
    if (Math.random() < POWERUP_CHANCE) {
        spawnPowerUp(x, y);
    }
}

// Add a new function to draw the HUD elements at the top of the canvas
function drawHUD() {
    const hudHeight = 40; // Height of the HUD bar
    const padding = 15; // Padding from screen edges
    
    // Draw semi-transparent background for the HUD
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, hudHeight);
    
    // Set text properties
    context.fillStyle = "white";
    context.font = "bold 16px 'Courier New'";
    context.textAlign = "left";
    context.textBaseline = "middle";
    
    // Calculate positions for each element
    const centerY = hudHeight / 2;
    const fifthWidth = canvas.width / 5; // Divide into 5 sections
    
    // Draw score
    context.fillText(`SCORE: ${score}`, padding, centerY);
    
    // Draw lives
    context.fillText(`LIVES: ${lives}`, fifthWidth + padding, centerY);
    
    // Draw level
    context.fillText(`LEVEL: ${level + 1}`, fifthWidth * 2 + padding, centerY);
    
    // Draw high score with gold color
    context.fillStyle = "#ffd700"; // Gold color
    context.fillText(`HIGH: ${highScore}`, fifthWidth * 3 + padding, centerY);
    
    // Draw timer
    const timeInSeconds = Math.max(0, Math.ceil(roundTimeRemaining / FPS));
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    context.fillStyle = "white";
    context.fillText(`TIME: ${timeString}`, fifthWidth * 4 + padding, centerY);
    
    // Draw subtle dividing lines between HUD elements
    context.strokeStyle = "rgba(255, 255, 255, 0.3)";
    context.lineWidth = 1;
    context.beginPath();
    
    for (let i = 1; i < 5; i++) {
        const x = fifthWidth * i;
        context.moveTo(x, 0);
        context.lineTo(x, hudHeight);
    }
    
    context.stroke();
    context.restore();
}

// Add a new function to draw the power-up legend
function drawPowerUpLegend() {
    const legendHeight = 30; // Height of the legend bar
    const padding = 10; // Padding from screen edges
    const itemWidth = canvas.width / 3; // Divide the width into 3 equal parts
    const starSize = 8; // Size of the star icons

    // Draw semi-transparent background for the legend
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, canvas.height - legendHeight, canvas.width, legendHeight);

    // Draw dividing lines between legend items
    context.strokeStyle = "rgba(255, 255, 255, 0.3)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(itemWidth, canvas.height - legendHeight);
    context.lineTo(itemWidth, canvas.height);
    context.moveTo(itemWidth * 2, canvas.height - legendHeight);
    context.lineTo(itemWidth * 2, canvas.height);
    context.stroke();

    // Draw legend items (one for each power-up type)
    const powerUpTypes = Object.keys(POWERUP_TYPES);
    const descriptions = {
        FAST_SHIP: "Speed Boost",
        FAST_SHOTS: "Rapid Fire",
        SPRAY_SHOTS: "Spread Shot"
    };

    for (let i = 0; i < powerUpTypes.length; i++) {
        const type = powerUpTypes[i];
        const color = POWERUP_COLORS[type];
        const centerX = (i + 0.5) * itemWidth;
        const centerY = canvas.height - legendHeight / 2;

        // Check if this power-up is active
        const isActive = activePowerUp[type] && activePowerUp[type].expiryFrame > currentFrame;

        // No highlight background for active power-ups - timer will indicate active status

        // Draw mini star icon
        context.save();
        context.translate(centerX - 40, centerY);

        // Draw glow
        const glowGradient = context.createRadialGradient(
            0, 0, starSize * 0.2,
            0, 0, starSize * 1.5
        );
        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(1, "rgba(0,0,0,0)");

        // Make the glow pulse if power-up is active
        if (isActive) {
            const timeFactor = currentFrame / FPS;
            const pulseFactor = 0.3 * Math.sin(timeFactor * Math.PI * 2) + 0.7;
            context.globalAlpha = pulseFactor;
        } else {
            context.globalAlpha = 0.7;
        }

        context.fillStyle = glowGradient;
        context.beginPath();
        context.arc(0, 0, starSize * 1.5, 0, Math.PI * 2);
        context.fill();

        // Draw the star
        drawStar(0, 0, 5, starSize, starSize / 2, "gold", "white", 1);
        context.restore();

        // Draw power-up name and remaining time if active
        context.textAlign = "left";
        context.textBaseline = "middle";

        if (isActive) {
            const timeLeft = Math.ceil((activePowerUp[type].expiryFrame - currentFrame) / FPS);
            context.font = "bold 12px Arial, sans-serif";
            context.fillStyle = color;
            context.fillText(descriptions[type] + " - " + timeLeft + "s", centerX - 25, centerY);
        } else {
            context.font = "bold 12px Arial, sans-serif";
            context.fillStyle = color;
            context.fillText(descriptions[type], centerX - 25, centerY);
        }
    }

    context.restore();
}

function drawHelpScreen() {
    // Draw the game in the background first (paused state)
    let blinkOn = ship.blinkNum % 2 == 0;
    let exploding = ship.explodeTime > 0;

    // Draw space
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield first (background layer)
    drawStarfield();

    // Draw distant planet second (foreground layer that occludes stars)
    drawDistantPlanet();

    // Draw comets
    drawComets();

    // Draw UFOs
    drawUfos();

    // Draw the ship (paused)
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
        }
    } else {
        // Ship explosion handled elsewhere
    }

    // Draw asteroids
    for (let i = 0; i < asteroids.length; i++) {
        let imageToUse = asteroids[i].image;
        if (imageToUse && imageToUse.complete) {
            context.save();
            context.translate(asteroids[i].x, asteroids[i].y);
            context.rotate(asteroids[i].a);
            context.drawImage(
                imageToUse,
                -asteroids[i].drawWidth / 2,
                -asteroids[i].drawHeight / 2,
                asteroids[i].drawWidth,
                asteroids[i].drawHeight
            );
            context.restore();
        }
    }

    // Draw lasers
    context.strokeStyle = "yellow";
    context.lineWidth = SHIP_SIZE / 20;
    for (let i = 0; i < ship.lasers.length; i++) {
        let laser = ship.lasers[i];
        context.beginPath();
        context.moveTo(laser.x - laser.xv, laser.y - laser.yv);
        context.lineTo(laser.x, laser.y);
        context.stroke();
    }

    // Draw power-ups
    drawPowerUps();

    // Draw semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate responsive sizing
    const scaleFactor = Math.min(1, Math.min(canvas.width / 800, canvas.height / 600));
    const minScaleFactor = Math.max(0.85, scaleFactor);

    // Help screen content
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Title
    context.font = "bold " + Math.max(28, Math.floor(36 * minScaleFactor)) + "px 'Courier New'";
    const titleY = canvas.height / 6;
    context.fillText("HELP", canvas.width / 2, titleY);

    // Controls section
    const controlsY = titleY + 60;
    context.font = "bold " + Math.max(20, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("CONTROLS", canvas.width / 2, controlsY);

    // Create columns for controls
    const colWidth = Math.min(220, canvas.width / 3);
    const col1X = canvas.width / 2 - colWidth / 2;
    const col2X = canvas.width / 2 + colWidth / 2;
    const startY = controlsY + 35;
    const lineHeight = Math.max(28, Math.floor(32 * minScaleFactor));

    context.textAlign = "left";
    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";

    // Draw Up Arrow (Thrust)
    const upArrowY = startY;
    context.fillStyle = "white";
    context.beginPath();
    context.moveTo(col1X, upArrowY - 5);
    context.lineTo(col1X - 10, upArrowY + 5);
    context.lineTo(col1X - 5, upArrowY + 5);
    context.lineTo(col1X - 5, upArrowY + 14);
    context.lineTo(col1X + 5, upArrowY + 14);
    context.lineTo(col1X + 5, upArrowY + 5);
    context.lineTo(col1X + 10, upArrowY + 5);
    context.closePath();
    context.fill();
    context.fillText("Thrust", col1X + 20, upArrowY + 5);

    // Left/Right Arrows (Rotate)
    const arrowsY = upArrowY + lineHeight;
    context.beginPath();
    context.moveTo(col1X - 14, arrowsY);
    context.lineTo(col1X - 5, arrowsY - 5);
    context.lineTo(col1X - 5, arrowsY + 5);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(col1X + 14, arrowsY);
    context.lineTo(col1X + 5, arrowsY - 5);
    context.lineTo(col1X + 5, arrowsY + 5);
    context.closePath();
    context.fill();
    context.fillText("Rotate", col1X + 20, arrowsY);

    // P key (Pause) - moved to left column under rotate controls
    const pKeyY = arrowsY + lineHeight;
    context.fillStyle = "white";
    context.fillRect(col1X - 10, pKeyY - 6, 20, 14);
    context.fillStyle = "black";
    context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
    context.textAlign = "center";
    context.fillText("P", col1X, pKeyY + 1);
    context.fillStyle = "white";
    context.textAlign = "left";
    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Pause", col1X + 20, pKeyY + 4);

    // Space Bar (Fire)
    const spaceY = startY;
    context.fillStyle = "white";
    context.fillRect(col2X - 22, spaceY - 6, 44, 14);
    context.fillStyle = "black";
    context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
    context.textAlign = "center";
    context.fillText("SPACE", col2X, spaceY + 1);
    context.fillStyle = "white";
    context.textAlign = "left";
    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Fire", col2X + 28, spaceY + 4);

    // R key (Reset)
    const rKeyY = spaceY + lineHeight;
    context.fillStyle = "white";
    context.fillRect(col2X - 10, rKeyY - 6, 20, 14);
    context.fillStyle = "black";
    context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
    context.textAlign = "center";
    context.fillText("R", col2X, rKeyY + 1);
    context.fillStyle = "white";
    context.textAlign = "left";
    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Reset", col2X + 28, rKeyY + 4);

    // H key (Help)
    const hKeyY = rKeyY + lineHeight;
    context.fillStyle = "white";
    context.fillRect(col2X - 10, hKeyY - 6, 20, 14);
    context.fillStyle = "black";
    context.font = Math.max(10, Math.floor(12 * minScaleFactor)) + "px 'Courier New'";
    context.textAlign = "center";
    context.fillText("H", col2X, hKeyY + 1);
    context.fillStyle = "white";
    context.textAlign = "left";
    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Help", col2X + 28, hKeyY + 4);

    // Power-ups section
    const powerUpY = startY + lineHeight * 4 + 30;
    context.textAlign = "center";
    context.font = "bold " + Math.max(20, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("POWER-UPS", canvas.width / 2, powerUpY);

    // Power-up grid layout
    const puGrid = {
        spacing: Math.min(canvas.width / 3.2, 160),
        iconSize: Math.max(18, Math.floor(22 * minScaleFactor)),
        startY: powerUpY + 40,
        labelOffset: 40
    };

    context.font = Math.max(16, Math.floor(18 * minScaleFactor)) + "px 'Courier New'";

    // Draw power-ups
    const powerUpTypes = [
        { type: POWERUP_TYPES.FAST_SHIP, name: "Speed Boost" },
        { type: POWERUP_TYPES.FAST_SHOTS, name: "Rapid Fire" },
        { type: POWERUP_TYPES.SPRAY_SHOTS, name: "Spread Shot" }
    ];

    // Use Date.now() instead of currentFrame to ensure animations keep working
    // even when the game update loop is paused
    const timeFactor = Date.now() / 1000;

    for (let i = 0; i < powerUpTypes.length; i++) {
        const pu = powerUpTypes[i];
        const x = canvas.width / 2 + (i - 1) * puGrid.spacing;
        const y = puGrid.startY;

        // Draw animated power-up icon
        drawAnimatedPowerUpIcon(x, y, POWERUP_COLORS[pu.type], puGrid.iconSize, timeFactor);

        context.fillStyle = "white";
        context.fillText(pu.name, x, y + puGrid.labelOffset);
    }

    // Add rapid fire note
    context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("(Hold SPACE for continuous fire with Rapid Fire power-up)",
        canvas.width / 2, puGrid.startY + puGrid.labelOffset + 30);
    
    // Add UFO bonus information
    const ufoY = puGrid.startY + puGrid.labelOffset + 70; // Position below power-up info
    
    // Center everything for UFO bonus section
    context.textAlign = "center";
    
    // Draw section title with UFO emojis on both sides
    const ufoTitleSize = Math.max(20, Math.floor(24 * minScaleFactor));
    const ufoEmojiSize = Math.max(24, Math.floor(28 * minScaleFactor)); // Slightly bigger emojis
    
    // Draw title with emojis
    context.save();
    // Add glow effect for UFO emojis
    context.shadowColor = UFO_COLOR || "rgba(150, 255, 150, 0.9)"; // Green glow
    context.shadowBlur = 15;
    
    // Draw left UFO emoji
    context.textBaseline = "middle";
    context.font = ufoEmojiSize + "px sans-serif";
    context.fillStyle = "white";
    context.fillText("🛸", canvas.width / 2 - 110, ufoY);
    
    // Draw right UFO emoji
    context.fillText("🛸", canvas.width / 2 + 110, ufoY);
    context.restore();
    
    // Draw the title text
    context.font = "bold " + ufoTitleSize + "px 'Courier New'";
    context.fillText("UFO BONUS", canvas.width / 2, ufoY);
    
    // Draw description text
    const ufoIconY = ufoY + 40;
    context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
    context.fillStyle = "white";
    context.fillText("Destroy UFOs to activate ALL power-ups at once!", 
        canvas.width / 2, ufoIconY);
        
    // Add comet bonus information
    const cometY = ufoIconY + 70; // Position below UFO info
    
    // Center everything for comet bonus section
    context.textAlign = "center";
    
    // Draw section title with comet emojis on both sides
    const cometTitleSize = Math.max(20, Math.floor(24 * minScaleFactor));
    const cometEmojiSize = Math.max(24, Math.floor(28 * minScaleFactor)); // Slightly bigger emojis
    
    // Draw title with emojis
    context.save();
    // Add glow effect for comet emojis
    context.shadowColor = "rgba(220, 180, 255, 0.9)"; // Purple glow
    context.shadowBlur = 15;
    
    // Draw left comet emoji
    context.textBaseline = "middle";
    context.font = cometEmojiSize + "px sans-serif";
    context.fillStyle = "white";
    context.fillText("☄️", canvas.width / 2 - 110, cometY);
    
    // Draw right comet emoji
    context.fillText("☄️", canvas.width / 2 + 110, cometY);
    context.restore();
    
    // Draw the title text
    context.font = "bold " + cometTitleSize + "px 'Courier New'";
    context.fillText("COMET REWARDS", canvas.width / 2, cometY);
    
    // Draw description text
    const cometIconY = cometY + 40;
    context.font = Math.max(14, Math.floor(16 * minScaleFactor)) + "px 'Courier New'";
    context.fillStyle = "white";
    context.fillText("Destroy comets for a chance at an extra life", 
        canvas.width / 2, cometIconY);
    context.fillText("or to clear all asteroids from the screen!", 
        canvas.width / 2, cometIconY + 25);

    // Instructions to close help
    context.textAlign = "center";
    context.font = "bold " + Math.max(18, Math.floor(22 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Press 'H' again to close", canvas.width / 2, canvas.height - 40);

    // Helper function for animated power-up icons (reuse from start screen)
    function drawAnimatedPowerUpIcon(x, y, color, size, timeFactor) {
        // Note: timeFactor comes from Date.now()/1000 instead of currentFrame
        // to ensure animations continue even when the help screen is displayed
        const pulseRate = 2;
        const pulseFactor = 0.2 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 0.8;
        const scaleFactor = 0.15 * Math.sin(timeFactor * (Math.PI * 2 / pulseRate)) + 1;
        const rotation = timeFactor * 0.7;

        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.scale(scaleFactor, scaleFactor);

        const gradient = context.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace(')', ', 0.6)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, color.replace(')', ', 0)').replace('rgb', 'rgba'));

        context.fillStyle = gradient;
        context.globalAlpha = pulseFactor * 0.9;
        context.beginPath();
        context.arc(0, 0, size * 1.2, 0, Math.PI * 2);
        context.fill();

        context.globalAlpha = 1;
        drawStar(0, 0, 5, size * 0.8, size * 0.4, "gold", "white", 2);

        context.save();
        context.rotate(-rotation * 2);
        drawStar(0, 0, 5, size * 0.5, size * 0.25, "#FFF7D6", "white", 1);
        context.restore();

        const sparkleCount = 4;
        for (let j = 0; j < sparkleCount; j++) {
            const sparkleAngle = (j / sparkleCount) * Math.PI * 2 + timeFactor * 2;
            const sparkleDistance = size * 0.7;
            const sparkleX = Math.cos(sparkleAngle) * sparkleDistance;
            const sparkleY = Math.sin(sparkleAngle) * sparkleDistance;
            const sparkleSize = (0.1 + 0.05 * Math.sin(timeFactor * 3 + j)) * size;

            context.save();
            context.translate(sparkleX, sparkleY);
            context.rotate(sparkleAngle);
            context.beginPath();
            context.fillStyle = "white";
            context.arc(0, 0, sparkleSize, 0, Math.PI * 2);
            context.fill();

            context.beginPath();
            context.strokeStyle = "white";
            context.lineWidth = 1;
            context.moveTo(-sparkleSize * 1.5, 0);
            context.lineTo(sparkleSize * 1.5, 0);
            context.moveTo(0, -sparkleSize * 1.5);
            context.lineTo(0, sparkleSize * 1.5);
            context.stroke();
            context.restore();
        }

        context.restore();
    }
}

function drawPauseScreen() {
    // Draw the game in the background first (frozen state)
    let blinkOn = ship.blinkNum % 2 == 0;
    let exploding = ship.explodeTime > 0;

    // Draw space
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield first (background layer)
    drawStarfield();

    // Draw distant planet second (foreground layer that occludes stars)
    drawDistantPlanet();

    // Draw comets
    drawComets();

    // Draw the ship (frozen)
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a);
        }
    } else {
        // Ship explosion handled elsewhere
    }

    // Draw asteroids
    for (let i = 0; i < asteroids.length; i++) {
        let imageToUse = asteroids[i].image;
        if (imageToUse && imageToUse.complete) {
            context.save();
            context.translate(asteroids[i].x, asteroids[i].y);
            context.rotate(asteroids[i].a);
            context.drawImage(
                imageToUse,
                -asteroids[i].drawWidth / 2,
                -asteroids[i].drawHeight / 2,
                asteroids[i].drawWidth,
                asteroids[i].drawHeight
            );
            context.restore();
        }
    }

    // Draw lasers
    context.strokeStyle = "yellow";
    context.lineWidth = SHIP_SIZE / 20;
    for (let i = 0; i < ship.lasers.length; i++) {
        let laser = ship.lasers[i];
        context.beginPath();
        context.moveTo(laser.x - laser.xv, laser.y - laser.yv);
        context.lineTo(laser.x, laser.y);
        context.stroke();
    }

    // Draw power-ups
    drawPowerUps();

    // Draw power-up legend
    drawPowerUpLegend();
    
    // Draw HUD elements at the top of the screen
    drawHUD();

    // Draw semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate responsive sizing
    const scaleFactor = Math.min(1, Math.min(canvas.width / 800, canvas.height / 600));
    const minScaleFactor = Math.max(0.85, scaleFactor);

    // Pause message
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Main pause message
    context.font = "bold " + Math.max(48, Math.floor(64 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("GAME PAUSED", canvas.width / 2, canvas.height / 2 - 40);

    // Instructions
    context.font = "bold " + Math.max(24, Math.floor(32 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Press 'P' to Resume", canvas.width / 2, canvas.height / 2 + 20);

    // Additional controls
    context.font = Math.max(18, Math.floor(24 * minScaleFactor)) + "px 'Courier New'";
    context.fillText("Press 'H' for Help  •  Press 'R' to Reset", canvas.width / 2, canvas.height / 2 + 60);
}

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
        
        // Collision with player ship is handled in the main update function
    }
}

// Function to draw UFO lasers
function drawUfoLasers() {
    // Set up for drawing lasers
    context.lineWidth = 2;
    context.strokeStyle = UFO_LASER_COLOR;
    context.shadowColor = UFO_LASER_COLOR;
    context.shadowBlur = 5;
    
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
