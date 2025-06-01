# Matrix Digital Rain Terminal

An interactive terminal interface that simulates the iconic digital rain effect from The Matrix movie. Features a fully functional command-line interface with Matrix-themed commands and real-time digital rain animation.

## Features

- **Digital Rain Effect**: Animated falling characters including letters, numbers, symbols, and Japanese katakana
- **Cyberpunk Symbols Mode**: Alternative mode with futuristic symbols and Matrix green coloring
- **Interactive Terminal**: Functional command-line interface with Matrix-themed commands
- **Text-to-Speech**: Immersive audio experience with Matrix quotes and Neo sequences
- **Authentic Fonts**: Uses Matrix-style web fonts (Share Tech Mono and Orbitron)
- **Mode Switching**: Toggle between classic Matrix mode and cyberpunk symbols mode
- **Adjustable Speed**: Control the speed of falling characters (1-5 scale)
- **Fullscreen Mode**: Toggle fullscreen with minimize/restore functionality
- **Keyboard Shortcuts**: Quick access to common functions
- **Matrix Quotes**: Display and speak random quotes from The Matrix movies
- **Responsive Design**: Works on desktop and mobile devices

## Controls

### Keyboard Shortcuts

- `ESC` - Toggle matrix rain on/off
- `CTRL+C` - Clear terminal output
- `CTRL+SHIFT+F` - Toggle fullscreen mode

### Terminal Commands

- `help` - Show available commands
- `speed [1-5]` - Adjust rain speed (1=slow, 5=fast)
- `toggle` - Toggle matrix rain on/off
- `mode` - Toggle between Matrix and cyberpunk symbols character modes
- `fullscreen` - Toggle fullscreen mode (or use CTRL+SHIFT+F)
- `clear` - Clear terminal output
- `matrix` - Display random Matrix quotes (with speech)
- `neo` - Special Neo wake-up sequence (with speech)
- `voice` - Control text-to-speech settings
- `exit` - Attempt to exit the Matrix (spoiler: you can't)

### Voice Commands

- `voice on` - Enable text-to-speech
- `voice off` - Disable text-to-speech
- `voice test` - Play test message
- `voice status` - Show current TTS settings
- `voice voices` - List available voices
- `voice rate [0.1-10]` - Set speech rate (speed)
- `voice pitch [0-2]` - Set speech pitch
- `voice volume [0-1]` - Set speech volume
- `voice help` - Show voice command help

## How to Run

1. Open `index.html` in a web browser
2. The terminal will automatically start with the digital rain effect
3. Click anywhere to focus on the terminal input
4. Type commands and press Enter to execute

## Technical Details

- **Canvas Animation**: Uses HTML5 Canvas for smooth 60fps digital rain animation
- **Character Set**: Includes ASCII characters and Japanese katakana for authenticity, plus cyberpunk symbols
- **Dual Modes**: Switch between classic Matrix green rain and cyberpunk symbols rain
- **Text-to-Speech**: Browser-based speech synthesis with configurable voice settings
- **Trail Effect**: Each falling character leaves a fading trail behind it
- **Responsive**: Automatically adjusts to window size changes
- **Fullscreen Support**: Cross-browser fullscreen API with minimize/restore controls
- **Pure JavaScript**: No external dependencies required

## File Structure

```text
matrix/
├── index.html          # Main HTML structure
├── style.css           # Matrix-themed styling
├── script.js           # Digital rain animation and terminal logic
├── prompt.md           # Original project requirements
└── README.md           # This documentation
```

## Customization

You can modify various aspects of the interface:

- **Colors**: Change the green theme in `style.css` or emoji colors in `script.js`
- **Characters**: Modify the character sets in `script.js` (matrix, emoji, or add your own)
- **Modes**: Add new visual modes beyond matrix and emoji
- **Speed**: Adjust default speed and limits in the MatrixRain class
- **Commands**: Add new commands to the `processCommand()` function
- **Quotes**: Add more Matrix quotes to the quotes array

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.
