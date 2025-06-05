# Matrix Digital Rain Terminal

An interactive terminal interface that simulates the iconic digital rain effect from The Matrix movie. Features a fully functional command-line interface with Matrix-themed commands, real-time digital rain animation, and AI-powered chat with Matrix characters through Ollama integration.

## Features

- **Digital Rain Effect**: Animated falling characters including letters, numbers, symbols, and Japanese katakana
- **Cyberpunk Symbols Mode**: Alternative mode with futuristic symbols and Matrix green coloring
- **Interactive Terminal**: Functional command-line interface with Matrix-themed commands
- **AI Chat Integration**: Chat with Matrix characters (Oracle, Morpheus, Trinity, Neo, Agent Smith, etc.) using Ollama
- **Automatic Network Discovery**: Automatically finds Ollama servers on your local network
- **Character-Specific Voices**: Each Matrix character has unique TTS settings and personality
- **Text-to-Speech**: Immersive audio experience with Matrix quotes and character responses
- **Authentic Fonts**: Uses Matrix-style web fonts (Share Tech Mono and Orbitron)
- **Mode Switching**: Toggle between classic Matrix mode and cyberpunk symbols mode
- **Adjustable Speed**: Control the speed of falling characters (1-5 scale)
- **Fullscreen Mode**: Toggle fullscreen with minimize/restore functionality
- **Keyboard Shortcuts**: Quick access to common functions
- **Matrix Quotes**: Display and speak random quotes from The Matrix movies
- **Copy to Clipboard**: Easy copying of character responses
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

### Ollama Installation

To use the AI chat features with Matrix characters, you need to install and set up Ollama:

1. **Install Ollama**:
   - **macOS**: Download from [ollama.ai](https://ollama.ai) or use Homebrew:

     ```bash
     brew install ollama
     ```

   - **Linux**:

     ```bash
     curl -fsSL https://ollama.ai/install.sh | sh
     ```

   - **Windows**: Download the installer from [ollama.ai](https://ollama.ai)

2. **Start Ollama Service**:

   ```bash
   ollama serve
   ```

   This starts the Ollama API server on `http://localhost:11434`

3. **Install Required Models**:
   The Matrix Terminal works best with Llama 3.1 or newer models. Install at least one:

   ```bash
   # Recommended: Llama 3.1 (8B parameters - good balance of speed and quality)
   ollama pull llama3.1
   
   # Alternative options:
   ollama pull llama3.1:70b    # Larger model for better responses (requires more RAM)
   ollama pull llama3.2        # Latest version
   ollama pull mistral         # Faster alternative
   ollama pull codellama       # Good for technical discussions
   ```

4. **Verify Installation**:

   ```bash
   ollama list
   ```

   This should show your installed models.

### Environment Variables Configuration

You may need to configure Ollama environment variables for optimal performance or custom setups:

#### macOS

**Method 1: launchctl (System-wide, recommended)**

Use `launchctl setenv` for system-wide environment variables that persist across reboots:

```bash
# Set Ollama environment variables system-wide
sudo launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
sudo launchctl setenv OLLAMA_ORIGINS "*"

# Restart Ollama service to apply changes
sudo pkill ollama
ollama serve
```

#### Linux

Similar to macOS, add to your shell profile:

```bash
# Edit your shell profile
nano ~/.bashrc  # or ~/.zshrc if using zsh

# Add Ollama environment variables
export OLLAMA_HOST="0.0.0.0:11434"
export OLLAMA_ORIGINS="*"

# Reload your profile
source ~/.bashrc
```

For system-wide configuration, you can also create a systemd service file:

```bash
# Create or edit the service file
sudo nano /etc/systemd/system/ollama.service

# Add environment variables in the [Service] section:
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

#### Windows

Set environment variables through System Properties or Command Prompt:

**Method 1: System Properties (GUI)**

1. Right-click "This PC" → Properties → Advanced System Settings
2. Click "Environment Variables"
3. Under "User variables" or "System variables", click "New"
4. Add these variables:
   - `OLLAMA_HOST` = `0.0.0.0:11434`
   - `OLLAMA_ORIGINS` = `*`

**Method 2: Command Prompt (PowerShell)**

```powershell
# Set user environment variables
[Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "User")
[Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")

# Restart your terminal or reboot to apply changes
```

**Method 3: Command Prompt (Traditional)**

```cmd
setx OLLAMA_HOST "0.0.0.0:11434"
setx OLLAMA_ORIGINS "*"
```

#### Common Environment Variables

- **`OLLAMA_HOST`**: The host and port for the Ollama server (default: `127.0.0.1:11434`)
- **`OLLAMA_ORIGINS`**: Allowed origins for CORS (use `*` for all, or specific URLs)
- **`OLLAMA_MODELS`**: Custom directory for storing models
- **`OLLAMA_NUM_PARALLEL`**: Number of parallel model requests (default: 1)
- **`OLLAMA_MAX_LOADED_MODELS`**: Maximum number of models to keep in memory
- **`OLLAMA_FLASH_ATTENTION`**: Enable flash attention (set to `1` for better performance on supported hardware)
- **`OLLAMA_KV_CACHE_TYPE`**: Key-value cache type (`f16` or `q8_0` for memory optimization)

#### Security Note

Setting `OLLAMA_ORIGINS="*"` allows all websites to access your Ollama instance. For production use, specify exact origins:

```bash
export OLLAMA_ORIGINS="http://localhost:8080,https://yourdomain.com"
```

### Network Configuration

The Matrix Terminal automatically discovers Ollama servers on your network:

- First tries `localhost:11434` (default)
- If localhost fails, scans common local network IP ranges
- Supports manual connection with `oracle connect [url]`

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

### Oracle (AI Chat) Commands

- `oracle connect [url]` - Connect to Ollama server (auto-connects to localhost by default)
- `oracle disconnect` - Disconnect from Oracle
- `oracle status` - Show connection and model status
- `oracle models` - List available AI models
- `oracle select [model]` - Select an AI model for chatting
- `oracle help` - Show Oracle command help

### Chat Commands

- `chat [character] [message]` - Chat with a Matrix character using AI
- `ask [character] [message]` - Same as chat command
- `characters` - List available Matrix characters

#### Available Characters

- **Oracle** - The wise, cookie-loving prophet who sees all possible futures
- **Morpheus** - The confident leader and mentor, speaking with gravitas and wisdom
- **Trinity** - The skilled hacker and fighter, direct and focused
- **Neo** - The chosen one, curious and learning about his powers
- **Agent Smith** - The ruthless program hunting down humans and anomalies
- **Tank** - The loyal operator who was never plugged into the Matrix
- **Architect** - The cold, mathematical creator of the Matrix system
- **Cypher** - The disillusioned crew member who chose comfort over truth
- **Dozer** - Tank's brother and ship engineer, practical and hardworking
- **Switch** - The cool, professional crew member with sharp wit
- **Mouse** - The young, enthusiastic programmer fascinated by the Matrix

#### Chat Examples

```bash
# Chat with specific characters
chat oracle What is the nature of choice?
chat morpheus Tell me about the red pill
chat trinity How do I hack the Matrix?
chat neo Am I really the one?
chat smith You are an anomaly that must be eliminated

# Quick character selection
chat oracle
# (Then type your message when prompted)
```

## How to Run

### Basic Setup (Digital Rain + Terminal)

1. Open `index.html` in a web browser
2. The terminal will automatically start with the digital rain effect
3. Click anywhere to focus on the terminal input
4. Type commands and press Enter to execute

### Full Setup (With AI Chat Features)

1. **Install and Start Ollama** (see Prerequisites section above):

   ```bash
   # Start Ollama service
   ollama serve
   
   # In another terminal, install a model
   ollama pull llama3.1
   ```

2. **Open the Matrix Terminal**:
   - Open `index.html` in a web browser
   - The terminal will auto-connect to Ollama if running on localhost
   - If Ollama is on a different machine, use `oracle connect [ip:port]`

3. **Start Chatting**:

   ```bash
   # Check connection
   oracle status
   
   # List available models
   oracle models
   
   # Select a model (if not auto-selected)
   oracle select llama3.1
   
   # Chat with Matrix characters
   chat oracle Hello, what is the Matrix?
   chat morpheus Show me the truth
   ```

### Troubleshooting

- **Oracle connection failed**: Make sure Ollama is running (`ollama serve`)
- **No models available**: Install a model with `ollama pull llama3.1`
- **Network discovery fails**: Use manual connection with `oracle connect [ip:port]`
- **Speech not working**: Check browser permissions and use `voice on`

## Technical Details

- **Canvas Animation**: Uses HTML5 Canvas for smooth 60fps digital rain animation
- **Character Set**: Includes ASCII characters and Japanese katakana for authenticity, plus cyberpunk symbols
- **Dual Modes**: Switch between classic Matrix green rain and cyberpunk symbols rain
- **AI Integration**: Connects to Ollama API for character-based chat interactions
- **Network Discovery**: Automatically scans local network for Ollama servers
- **Character Personalities**: Each Matrix character has unique prompts and speaking styles
- **Action Filtering**: TTS intelligently filters out action descriptions from character responses
- **Text-to-Speech**: Browser-based speech synthesis with configurable voice settings and character-specific voices
- **Trail Effect**: Each falling character leaves a fading trail behind it
- **Responsive**: Automatically adjusts to window size changes
- **Fullscreen Support**: Cross-browser fullscreen API with minimize/restore controls
- **Pure JavaScript**: No external dependencies for the frontend (Ollama required for AI features)

### AI Chat Features

- **Character Prompting**: Each character has detailed personality prompts for authentic responses
- **Conversation History**: Maintains chat context throughout the session
- **Smart TTS**: Automatically detects and filters code/long responses from speech
- **Copy Functionality**: Click to copy character responses to clipboard
- **Error Handling**: Graceful handling of network issues and model unavailability
- **Model Selection**: Supports multiple Ollama models with automatic smart defaults

## File Structure

```text
matrix/
├── index.html                  # Main HTML structure
├── style.css                   # Matrix-themed styling
├── script.js                   # Digital rain animation, terminal logic, and AI integration
├── README.md                   # This documentation
├── prompt.md                   # Original project requirements
├── automated-test.html         # Automated testing suite
├── manual-test-guide.html      # Manual testing documentation
├── test-prompt-color.html      # Color testing utility
└── CTRL+C_TEST_PLAN.md        # Interrupt testing plan
```

## Customization

You can modify various aspects of the interface:

- **Colors**: Change the green theme in `style.css` or emoji colors in `script.js`
- **Characters**: Modify the character sets in `script.js` (matrix, emoji, or add your own)
- **Modes**: Add new visual modes beyond matrix and emoji
- **Speed**: Adjust default speed and limits in the MatrixRain class
- **Commands**: Add new commands to the `processCommand()` function
- **Quotes**: Add more Matrix quotes to the quotes array
- **AI Characters**: Add new Matrix characters in the `matrixCharacters` object
- **Character Prompts**: Customize character personalities in the `getCharacterPrompt()` method
- **Voice Settings**: Adjust TTS settings for each character
- **Network Ranges**: Modify network scanning ranges in `getLocalNetworkRanges()`

### Adding New Characters

To add a new Matrix character:

1. Add character definition to `matrixCharacters` object
2. Create character prompt in `getCharacterPrompt()` method
3. Configure voice settings (rate, pitch, volume)
4. Add character color styling if desired

Example:

```javascript
// In matrixCharacters object
'newcharacter': {
    name: 'New Character',
    displayName: 'New Character',
    color: 'info',
    speechRate: 0.8,
    speechPitch: 0.7,
    speechVolume: 0.9
}
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.
