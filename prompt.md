# Prompt for AI Games Codebase Generation

**Create a retro-style arcade game collection website with the following specifications:**

## Overall Project Structure

Create a multi-game arcade collection with a central homepage that serves as a launcher for 4 classic games: Asteroids, Flappy Bird, Gorillas, and Pac-Man. Structure the project with:

- Main index.html homepage
- Individual game folders: asteroids, flappy-bird, gorillas, pacman
- Each game folder contains: index.html, game script files, and style.css
- Asteroid assets folder with sprite images for ship and asteroids

### Visual Design Theme

Implement a consistent retro cyberpunk aesthetic throughout:

- **Color Palette**: Primary green (#00ff00), accent orange (#ff6b00), dark backgrounds (#0a0a0a, #1a1a2e, #16213e)
- **Typography**: "Press Start 2P" Google Font for retro pixel aesthetic
- **Visual Effects**: Glowing text shadows, neon borders, animated grid overlays, shimmer effects
- **Background**: Animated grid pattern with pulsing opacity, scanline effects

### Homepage Features (index.html)

- **Header**: Large glowing title "AI GENERATED GAMES" with animated text shadows
- **Subtitle**: "Retro Arcade Collection" in orange
- **Game Grid**: 2x2 responsive grid of game cards with:
  - 3D hover effects with rotation based on mouse position
  - Shimmer animation overlay on hover
  - Game title, description, and "Play Now" button for each game
  - Smooth scaling and elevation effects
- **Background**: Fixed animated grid pattern, moving scanlines
- **Responsive Design**: Mobile-friendly with adjusted layouts
- **Interactive Effects**: Mouse tracking for card rotations, keyboard navigation support

### Game 1: Asteroids (asteroids)

**Full-featured space shooter with:**

- Ship sprite graphics and asteroid images (4 sizes)
- Complete physics engine with thrust, rotation, momentum, friction
- Asteroid field generation with random shapes and movement
- Laser shooting system with limited ammo
- Collision detection between ship, asteroids, and lasers
- Asteroid destruction with size reduction (large → medium → small → smallest)
- Power-up system (fast ship, fast shots, spray shots) with visual indicators
- UFO enemies with AI movement and shooting capabilities
- Comet system with particle trails
- Parallax starfield background with distant planets
- Sound effects using Web Audio API (laser, thrust, explosions)
- Progressive difficulty with level advancement
- Timer-based rounds (3 minutes per level)
- Score system with points for different asteroid sizes
- Lives system and game over conditions
- High score persistence in localStorage

### Game 2: Flappy Bird (flappy-bird)

**Classic obstacle avoidance game with:**

- Smooth bird physics with gravity and jump mechanics
- Infinite scrolling pipe generation with random gap positions
- Pixel-perfect collision detection
- Score system based on pipes passed
- Particle effects for visual flair
- High score tracking with localStorage
- Game states: waiting, playing, game over
- Retro visual styling with neon colors
- Restart functionality

### Game 3: Gorillas (gorillas)

**Turn-based artillery game featuring:**

- Procedurally generated city skyline with buildings
- Two gorillas placed on random buildings (player vs AI)
- Physics-based projectile system with banana throwing
- Wind effects that influence trajectory
- Destructible terrain (buildings get holes when hit)
- Intelligent AI opponent with adaptive difficulty
- AI learning system that improves over time
- Visual trajectory trails and rotation animation
- Explosion effects with expanding circles
- Input controls for angle (0-90°) and velocity (1-100)
- Score tracking (first to 3 wins)
- Sound effects for throwing and explosions
- Game state management with turn indicators

### Technical Implementation Requirements

**For all games:**

- HTML5 Canvas rendering
- Vanilla JavaScript (no frameworks)
- 60 FPS game loops using `requestAnimationFrame`
- Object-oriented game architecture
- Proper game state management
- Local storage for high scores
- Web Audio API for sound generation
- Responsive canvas sizing
- Keyboard and mouse input handling

**Consistent Navigation:**

- "Back to Home" button in top-left of each game
- Styled with same green/orange theme
- Smooth hover transitions

### Code Quality Standards

- Clean, commented JavaScript code
- Modular CSS with consistent naming
- Proper HTML semantic structure
- Cross-browser compatibility
- Mobile-responsive design
- Optimized asset loading
- Error handling for audio context
- Performance optimization for smooth gameplay

### File Organization

```text
ai-games/
├── index.html (homepage)
├── asteroids/
│   ├── index.html
│   ├── scripts/script.js
│   ├── styles/style.css
│   └── assets/sprites/ (ship and asteroid images)
├── flappy-bird/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── gorillas/
│   ├── index.html
│   ├── game.js
│   └── style.css

```

**This prompt should generate a polished, professional retro game collection with consistent theming, smooth gameplay mechanics, and modern web development practices while maintaining that classic arcade aesthetic.**
