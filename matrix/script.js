class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.terminal = document.getElementById('terminal');
        this.terminalInput = document.getElementById('terminal-input');
        this.terminalOutput = document.getElementById('terminal-output');
        this.terminalInputLine = document.getElementById('terminal-input-line');

        this.isRaining = true;
        this.isFullscreen = false;
        this.isTerminalMinimized = false;
        this.isAnimating = false; // Prevent input during animations
        this.isProcessing = false; // Prevent input during command processing
        this.drops = [];
        this.characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?';
        this.japaneseChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        this.symbolChars = '▲▼◄►★☆♦♠♣♥※‼¡¿§¶†‡•…‰′″‴⁗※‼¡¿§¶†‡•…‰′″‴⁗▀▄█▌▐░▒▓█▉▊▋▌▍▎▏▐▕▖▗▘▙▚▛▜▝▞▟';
        this.matrixChars = this.characters + this.japaneseChars;
        this.allChars = this.matrixChars;
        this.mode = 'matrix'; // 'matrix' or 'symbols'

        this.fontSize = 16;
        this.speed = 1;
        this.maxSpeed = 5;
        this.minSpeed = 0.5;

        // TTS settings
        this.speechSynthesis = window.speechSynthesis;
        this.isSpeechEnabled = 'speechSynthesis' in window;
        this.speechEnabled = true; // User toggle for speech
        this.speechRate = 0.8;
        this.speechPitch = 0.7;
        this.speechVolume = 0.8;
        this.selectedVoice = null; // User-selected voice

        // Command history
        this.commandHistory = [];
        this.historyIndex = -1; // -1 means not navigating history
        this.currentCommand = ''; // Store current command when navigating history

        // Oracle integration
        this.oracleUrl = 'http://localhost:11434'; // Default Oracle URL
        this.oracleConnected = false;
        this.availableModels = [];
        this.selectedModel = null;
        this.chatHistory = [];

        // Operation cancellation support
        this.activeTimeouts = []; // Track active timeouts for cancellation
        this.isOperationCancelled = false; // Flag to check for cancellation
        this.abortController = null; // For cancelling fetch operations

        this.init();
        this.setupEventListeners();
        this.createMinimizeButton();
        this.loadVoices();
        this.showWelcome();
        this.autoConnectToOracle();
    }

    init() {
        this.resizeCanvas();
        this.initDrops();
        this.animate();

        // Focus on input
        this.terminalInput.focus();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        this.initDrops();
    }

    initDrops() {
        this.drops = [];
        for (let i = 0; i < this.columns; i++) {
            this.drops[i] = {
                y: Math.random() * this.canvas.height,
                speed: Math.random() * this.speed + 0.5,
                chars: []
            };

            // Initialize character trail for each drop
            for (let j = 0; j < 20; j++) {
                this.drops[i].chars.push({
                    char: this.getRandomChar(),
                    brightness: Math.max(0, 1 - j * 0.05)
                });
            }
        }
    }

    getRandomChar() {
        if (this.mode === 'symbols') {
            return this.symbolChars[Math.floor(Math.random() * this.symbolChars.length)];
        } else {
            return this.allChars[Math.floor(Math.random() * this.allChars.length)];
        }
    }

    animate() {
        if (this.isRaining) {
            // Semi-transparent black background for trail effect
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Set font based on mode
            if (this.mode === 'symbols') {
                this.ctx.font = `${this.fontSize}px 'Orbitron', monospace`;
            } else {
                this.ctx.font = `${this.fontSize}px 'Share Tech Mono', 'Courier New', monospace`;
            }

            for (let i = 0; i < this.drops.length; i++) {
                const drop = this.drops[i];

                // Draw each character in the trail
                for (let j = 0; j < drop.chars.length; j++) {
                    const charData = drop.chars[j];
                    const yPos = drop.y - (j * this.fontSize);

                    if (yPos > 0 && yPos < this.canvas.height) {
                        // Green effect for both modes - keeping Matrix aesthetic
                        if (j === 0) {
                            this.ctx.fillStyle = '#ffffff';
                        } else {
                            const greenValue = Math.floor(255 * charData.brightness);
                            this.ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
                        }

                        this.ctx.fillText(charData.char, i * this.fontSize, yPos);
                    }
                }

                // Move drop down
                drop.y += drop.speed;

                // Randomly change characters
                if (Math.random() < 0.1) {
                    drop.chars[0].char = this.getRandomChar();
                }

                // Reset drop when it reaches bottom
                if (drop.y > this.canvas.height + (drop.chars.length * this.fontSize)) {
                    drop.y = -this.fontSize;
                    drop.speed = Math.random() * this.speed + 0.5;

                    // Refresh character trail
                    for (let j = 0; j < drop.chars.length; j++) {
                        drop.chars[j].char = this.getRandomChar();
                    }
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleRain();
            } else if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                this.interruptOperation();
            } else if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFullscreen();
            }
        }, true); // Use capture phase to intercept before browser

        // Also listen for fullscreen change events from any source
        const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        fullscreenEvents.forEach(event => {
            document.addEventListener(event, () => {
                const isFullscreen = !!(document.fullscreenElement ||
                    document.webkitFullscreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement);

                if (isFullscreen !== this.isFullscreen) {
                    this.isFullscreen = isFullscreen;
                    if (isFullscreen) {
                        this.addOutput('Fullscreen mode activated', 'info');
                    } else {
                        this.addOutput('Fullscreen mode deactivated', 'info');
                    }
                }
            });
        });

        // Terminal input
        this.terminalInput.addEventListener('keydown', (e) => {
            // Don't process any input if prompt is hidden
            if (this.terminalInputLine.style.display === 'none') {
                e.preventDefault();
                return;
            }

            if (e.key === 'Enter' && !this.isAnimating && !this.isProcessing) {
                this.processCommand();
            } else if (e.key === 'Enter' && (this.isAnimating || this.isProcessing)) {
                e.preventDefault();
                // Show feedback that system is busy
                if (this.isProcessing) {
                    this.addOutput('> AI is still processing... Use CTRL+C to interrupt', 'warning');
                } else if (this.isAnimating) {
                    this.addOutput('> Animation in progress... Use CTRL+C to interrupt', 'warning');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.handleTabCompletion();
            }
        });

        // Keep focus on input only when it's visible
        document.addEventListener('click', () => {
            if (this.terminalInputLine.style.display !== 'none') {
                this.terminalInput.focus();
            }
        });
    }

    toggleRain() {
        this.isRaining = !this.isRaining;
        if (!this.isRaining) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.addOutput(`Matrix rain ${this.isRaining ? 'enabled' : 'disabled'}`, 'info');
    }

    toggleMode() {
        this.mode = this.mode === 'matrix' ? 'symbols' : 'matrix';
        this.allChars = this.mode === 'matrix' ? this.matrixChars : this.symbolChars;

        // Refresh all drops with new character set
        for (let drop of this.drops) {
            for (let j = 0; j < drop.chars.length; j++) {
                drop.chars[j].char = this.getRandomChar();
            }
        }

        this.addOutput(`Character mode switched to: ${this.mode}`, 'info');
        if (this.mode === 'symbols') {
            this.addOutput('◆ Entering cyberpunk mode... ◆', 'info');
        } else {
            this.addOutput('Back to the Matrix...', 'success');
        }
    }

    createMinimizeButton() {
        const minimizeBtn = document.createElement('div');
        minimizeBtn.id = 'minimize-btn';
        minimizeBtn.className = 'minimize-button';
        minimizeBtn.innerHTML = '📟'; // Terminal icon
        minimizeBtn.title = 'Minimize Terminal (Click to restore)';
        minimizeBtn.addEventListener('click', () => this.toggleTerminal());
        document.body.appendChild(minimizeBtn);
    }

    toggleTerminal() {
        this.isTerminalMinimized = !this.isTerminalMinimized;
        const terminal = document.getElementById('terminal');
        const minimizeBtn = document.getElementById('minimize-btn');

        if (this.isTerminalMinimized) {
            terminal.style.display = 'none';
            minimizeBtn.classList.add('minimized');
            minimizeBtn.innerHTML = '📟';
            minimizeBtn.title = 'Restore Terminal';
        } else {
            terminal.style.display = 'flex';
            minimizeBtn.classList.remove('minimized');
            minimizeBtn.innerHTML = '📟';
            minimizeBtn.title = 'Minimize Terminal';
            // Only focus if prompt is visible
            if (this.terminalInputLine.style.display !== 'none') {
                this.terminalInput.focus();
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Try different fullscreen methods for browser compatibility
            const element = document.documentElement;
            const requestFullscreen = element.requestFullscreen ||
                element.webkitRequestFullscreen ||
                element.mozRequestFullScreen ||
                element.msRequestFullscreen;

            if (requestFullscreen) {
                requestFullscreen.call(element).then(() => {
                    this.isFullscreen = true;
                    this.addOutput('Entered fullscreen mode (CTRL+SHIFT+F to exit)', 'info');
                }).catch(err => {
                    this.addOutput('Fullscreen failed: ' + err.message, 'error');
                    this.addOutput('Try using the browser\'s native fullscreen', 'warning');
                });
            } else {
                this.addOutput('Fullscreen not supported by this browser', 'error');
                this.addOutput('Try using the browser\'s native fullscreen', 'warning');
            }
        } else {
            // Try different exit fullscreen methods
            const exitFullscreen = document.exitFullscreen ||
                document.webkitExitFullscreen ||
                document.mozCancelFullScreen ||
                document.msExitFullscreen;

            if (exitFullscreen) {
                exitFullscreen.call(document).then(() => {
                    this.isFullscreen = false;
                    this.addOutput('Exited fullscreen mode', 'info');
                });
            }
        }
    }

    speak(text, options = {}) {
        if (!this.isSpeechEnabled || !this.speechEnabled) {
            if (!this.isSpeechEnabled) {
                this.addOutput('Text-to-speech not supported in this browser', 'warning');
            }
            return;
        }

        // Clean the text before speaking
        const cleanText = this.cleanTextForSpeech(text);

        // Don't speak if there's no meaningful content after cleaning
        if (!cleanText.trim()) {
            return;
        }

        // Stop any ongoing speech
        this.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Check if this is likely an Oracle response
        const isOracleResponse =
            text.includes("Oracle>") ||
            options.rate === 0.60 ||
            options.rate === 0.65 ||
            (options.pitch && options.pitch < 0.6);

        // Configure voice settings for Matrix feel
        utterance.rate = options.rate || this.speechRate;
        utterance.pitch = options.pitch || this.speechPitch;
        utterance.volume = options.volume || this.speechVolume;

        // Add a very slight pause between sentences for Oracle's wisdom
        if (isOracleResponse) {
            // Replace periods with periods followed by a short pause
            utterance.text = cleanText.replace(/\./g, '. ');
        }

        // Try to find a suitable voice (prefer user-selected or deeper/male voices)
        const voices = this.speechSynthesis.getVoices();
        if (voices.length > 0) {
            if (this.selectedVoice && voices.includes(this.selectedVoice)) {
                // Use user-selected voice
                utterance.voice = this.selectedVoice;
            } else if (isOracleResponse) {
                // For Oracle responses, prefer deeper, slower, more mysterious voices
                const oracleVoices = voices.filter(voice =>
                    voice.name.toLowerCase().includes('samantha') ||
                    voice.name.toLowerCase().includes('karen') ||
                    voice.name.toLowerCase().includes('female') ||
                    voice.name.toLowerCase().includes('victoria') ||
                    voice.name.toLowerCase().includes('lisa') ||
                    (voice.lang.startsWith('en-') && !voice.name.includes('Google'))
                );

                if (oracleVoices.length > 0) {
                    utterance.voice = oracleVoices[0];
                } else {
                    // Fallback to other English voices for Oracle
                    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
                    if (englishVoices.length > 0) {
                        utterance.voice = englishVoices[0];
                    }
                }
            } else {
                // Look for specific voice names that sound more Matrix-like
                const preferredVoices = voices.filter(voice =>
                    voice.name.toLowerCase().includes('alex') ||
                    voice.name.toLowerCase().includes('daniel') ||
                    voice.name.toLowerCase().includes('male') ||
                    voice.name.toLowerCase().includes('david') ||
                    voice.name.toLowerCase().includes('fred') ||
                    (voice.lang.startsWith('en-') && voice.name.toLowerCase().includes('enhanced'))
                );

                if (preferredVoices.length > 0) {
                    utterance.voice = preferredVoices[0];
                } else if (voices.length > 0) {
                    // Fallback to first available English voice
                    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
                    if (englishVoices.length > 0) {
                        utterance.voice = englishVoices[0];
                    }
                }
            }
        }

        // Add event listeners for better user feedback
        utterance.onstart = () => {
            console.log('TTS started:', cleanText);
        };

        utterance.onerror = (event) => {
            console.error('TTS error:', event.error);
            this.addOutput('Speech synthesis error: ' + event.error, 'error');
        };

        this.speechSynthesis.speak(utterance);
    }

    clearTerminal() {
        this.terminalOutput.innerHTML = '';
        this.addOutput('Terminal cleared', 'info');
    }

    hideCommandPrompt() {
        this.terminalInputLine.style.display = 'none';
    }

    showCommandPrompt() {
        this.terminalInputLine.style.display = 'flex';
        this.terminalInput.focus();
    }

    interruptOperation() {
        // Set cancellation flag
        this.isOperationCancelled = true;

        // Cancel all active timeouts
        this.activeTimeouts.forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        this.activeTimeouts = [];

        // Cancel any ongoing fetch operations
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Stop any ongoing speech
        if (this.speechSynthesis && this.speechSynthesis.speaking) {
            this.speechSynthesis.cancel();
            this.addOutput('> Speech interrupted', 'warning');
        }

        // Reset animation state to allow new commands
        if (this.isAnimating) {
            this.isAnimating = false;
            this.addOutput('> Animation interrupted', 'warning');
        }

        // Reset processing state to allow new commands
        if (this.isProcessing) {
            this.isProcessing = false;
            this.addOutput('> Command processing interrupted', 'warning');
        }

        // Clear input and show prompt
        this.terminalInput.value = '';
        this.showCommandPrompt();

        this.addOutput('> Operation interrupted (CTRL+C)', 'info');

        // Reset cancellation flag after a brief delay
        setTimeout(() => {
            this.isOperationCancelled = false;
        }, 100);
    }

    addOutput(text, type = 'success') {
        const line = document.createElement('div');
        line.className = `output-line ${type}`;
        line.textContent = text;
        this.terminalOutput.appendChild(line);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) {
            return; // No history to navigate
        }

        // Store current input if we're not already navigating history
        if (this.historyIndex === -1) {
            this.currentCommand = this.terminalInput.value;
        }

        if (direction === 'up') {
            if (this.historyIndex === -1) {
                // Start from the most recent command
                this.historyIndex = this.commandHistory.length - 1;
            } else if (this.historyIndex > 0) {
                // Go to previous command
                this.historyIndex--;
            }
            // If we're already at the oldest command, stay there
        } else if (direction === 'down') {
            if (this.historyIndex >= 0 && this.historyIndex < this.commandHistory.length - 1) {
                // Go to next command
                this.historyIndex++;
            } else if (this.historyIndex === this.commandHistory.length - 1) {
                // Go back to current input
                this.historyIndex = -1;
                this.terminalInput.value = this.currentCommand;
                return;
            }
        }

        // Update input with the selected command from history
        if (this.historyIndex >= 0 && this.historyIndex < this.commandHistory.length) {
            this.terminalInput.value = this.commandHistory[this.historyIndex];
        }

        // Move cursor to end of input
        this.terminalInput.setSelectionRange(this.terminalInput.value.length, this.terminalInput.value.length);
    }

    handleTabCompletion() {
        const input = this.terminalInput.value;
        const words = input.split(' ');
        const currentWord = words[words.length - 1];

        // Define available commands and their context-aware completions
        const commands = ['help', 'ls', 'speed', 'toggle', 'mode', 'fullscreen', 'fs', 'clear', 'matrix', 'neo', 'voice', 'tts', 'say', 'oracle', 'chat', 'ask', 'exit'];
        const voiceSubCommands = ['on', 'off', 'test', 'status', 'voices', 'rate', 'pitch', 'volume', 'select', 'help'];
        const oracleSubCommands = ['connect', 'disconnect', 'status', 'models', 'select', 'help'];

        let matches = [];

        if (words.length === 1) {
            // Completing main commands
            matches = commands.filter(cmd => cmd.startsWith(currentWord.toLowerCase()));
        } else if (words.length === 2) {
            // Completing subcommands
            const mainCommand = words[0].toLowerCase();
            if (mainCommand === 'voice' || mainCommand === 'tts') {
                matches = voiceSubCommands.filter(sub => sub.startsWith(currentWord.toLowerCase()));
            } else if (mainCommand === 'oracle') {
                matches = oracleSubCommands.filter(sub => sub.startsWith(currentWord.toLowerCase()));
            } else if (mainCommand === 'speed') {
                matches = ['1', '2', '3', '4', '5'].filter(num => num.startsWith(currentWord));
            } else if (mainCommand === 'voice' && words[1] === 'rate') {
                matches = ['0.5', '0.8', '1.0', '1.5', '2.0'].filter(rate => rate.startsWith(currentWord));
            }
        } else if (words.length === 3) {
            // Handle third-level completions
            const mainCommand = words[0].toLowerCase();
            const subCommand = words[1].toLowerCase();

            if (mainCommand === 'oracle' && subCommand === 'select') {
                // Show available models for oracle select
                matches = this.availableModels
                    .map(model => model.name)
                    .filter(name => name.toLowerCase().startsWith(currentWord.toLowerCase()));
            } else if (mainCommand === 'voice' && subCommand === 'select') {
                // Show voice numbers
                const voices = this.speechSynthesis.getVoices();
                matches = Array.from({ length: voices.length }, (_, i) => (i + 1).toString())
                    .filter(num => num.startsWith(currentWord));
            }
        }

        if (matches.length === 0) {
            // No matches, maybe show a subtle hint
            return;
        } else if (matches.length === 1) {
            // Single match, auto-complete
            const wordsBeforeCurrent = words.slice(0, -1);
            this.terminalInput.value = wordsBeforeCurrent.concat(matches[0]).join(' ') + ' ';
            this.terminalInput.setSelectionRange(this.terminalInput.value.length, this.terminalInput.value.length);
        } else {
            // Multiple matches, show suggestions
            this.addOutput(`Suggestions: ${matches.join(', ')}`, 'info');

            // Try to find common prefix for partial completion
            const commonPrefix = this.getCommonPrefix(matches);
            if (commonPrefix.length > currentWord.length) {
                const wordsBeforeCurrent = words.slice(0, -1);
                this.terminalInput.value = wordsBeforeCurrent.concat(commonPrefix).join(' ');
                this.terminalInput.setSelectionRange(this.terminalInput.value.length, this.terminalInput.value.length);
            }
        }
    }

    getCommonPrefix(strings) {
        if (strings.length === 0) return '';
        if (strings.length === 1) return strings[0];

        let prefix = '';
        for (let i = 0; i < strings[0].length; i++) {
            const char = strings[0][i];
            if (strings.every(str => str[i] === char)) {
                prefix += char;
            } else {
                break;
            }
        }
        return prefix;
    }

    addToHistory(command) {
        const trimmedCommand = command.trim();

        // Don't add empty commands to history
        if (!trimmedCommand) {
            return;
        }

        // Don't add duplicate consecutive commands
        if (this.commandHistory.length > 0 &&
            this.commandHistory[this.commandHistory.length - 1] === trimmedCommand) {
            return;
        }

        // Add command to history
        this.commandHistory.push(trimmedCommand);

        // Limit history size to prevent memory issues (keep last 50 commands)
        if (this.commandHistory.length > 50) {
            this.commandHistory.shift(); // Remove oldest command
        }

        // Reset history navigation
        this.historyIndex = -1;
        this.currentCommand = '';
    }

    showWelcome() {
        this.addOutput('='.repeat(60), 'success');
        this.addOutput('WELCOME TO THE MATRIX TERMINAL', 'success');
        this.addOutput('='.repeat(60), 'success');
        this.addOutput('', 'success');
        this.addOutput('Available commands:', 'info');
        this.addOutput('  help          - Show available commands', 'info');
        this.addOutput('  ls            - List all commands (filesystem style)', 'info');
        this.addOutput('  speed [1-5]   - Adjust rain speed (1=slow, 5=fast)', 'info');
        this.addOutput('  toggle        - Toggle matrix rain on/off', 'info');
        this.addOutput('  mode          - Toggle between matrix and cyberpunk symbols', 'info');
        this.addOutput('  fullscreen    - Toggle fullscreen mode (or use CTRL+SHIFT+F)', 'info');
        this.addOutput('  clear         - Clear terminal output', 'info');
        this.addOutput('  matrix        - Display matrix quotes (with speech)', 'info');
        this.addOutput('  neo           - Wake up, Neo... (with speech)', 'info');
        this.addOutput('  voice         - Control text-to-speech settings', 'info');
        this.addOutput('                  Try: voice voices, voice select [number]', 'info');
        this.addOutput('  say [text]    - Make TTS speak any text you want', 'info');
        this.addOutput('  oracle        - Connect to the Oracle (oracle help for options)', 'info');
        this.addOutput('  chat [text]   - Chat with the Oracle', 'info');
        this.addOutput('  ask [text]    - Same as chat command', 'info');
        this.addOutput('  exit          - Exit the Matrix (just kidding)', 'info');
        this.addOutput('', 'success');
        this.addOutput('Keyboard shortcuts:', 'warning');
        this.addOutput('  ESC           - Toggle matrix rain', 'warning');
        this.addOutput('  CTRL+C        - Interrupt operations/speech', 'warning');
        this.addOutput('  CTRL+SHIFT+F  - Toggle fullscreen mode', 'warning');
        this.addOutput('  TAB           - Auto-complete commands', 'warning');
        this.addOutput('  UP/DOWN       - Navigate command history', 'warning');
        this.addOutput('', 'success');
    }

    async processCommand() {
        if (this.isAnimating || this.isProcessing) {
            return; // Prevent command execution during animations or processing
        }

        const command = this.terminalInput.value.trim();
        const commandLower = command.toLowerCase();
        const args = commandLower.split(' ');
        const cmd = args[0];

        // Add command to history before processing
        this.addToHistory(command);

        // Display command (use original case for display)
        this.addOutput(`neo@matrix:~$ ${command}`, 'success');

        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'ls':
                this.listCommands();
                break;
            case 'speed':
                this.changeSpeed(args[1]);
                break;
            case 'toggle':
                this.toggleRain();
                break;
            case 'mode':
                this.toggleMode();
                break;
            case 'fullscreen':
            case 'fs':
                this.toggleFullscreen();
                break;
            case 'clear':
                this.clearTerminal();
                break;
            case 'matrix':
                this.isAnimating = true;
                this.hideCommandPrompt(); // Hide prompt during animation
                await this.showMatrixQuotes();
                this.isAnimating = false;
                this.showCommandPrompt(); // Show prompt when animation completes
                break;
            case 'neo':
                this.isAnimating = true;
                this.hideCommandPrompt(); // Hide prompt during animation
                await this.neoSequence();
                this.isAnimating = false;
                this.showCommandPrompt(); // Show prompt when animation completes
                break;
            case 'voice':
            case 'tts':
                this.handleVoiceCommand(args.slice(1));
                break;
            case 'say':
                this.handleSayCommand(args.slice(1));
                break;
            case 'oracle':
                this.handleOracleCommand(args.slice(1));
                break;
            case 'chat':
            case 'ask':
                await this.handleChatCommand(args.slice(1));
                break;
            case 'exit':
                this.exitMatrix();
                break;
            case '':
                // Empty command, do nothing
                break;
            default:
                this.addOutput(`Command not found: ${cmd}`, 'error');
                this.addOutput('Type "help" for available commands', 'info');
        }

        // Only clear input if not processing/animating (for async commands like chat/matrix/neo)
        if (!this.isProcessing && !this.isAnimating) {
            this.terminalInput.value = '';
        }
    }

    showHelp() {
        this.addOutput('Matrix Terminal Commands:', 'info');
        this.addOutput('', 'success');
        this.addOutput('help          - Show this help message', 'info');
        this.addOutput('ls            - List all available commands (like filesystem ls)', 'info');
        this.addOutput('speed [1-5]   - Set rain speed (1=slowest, 5=fastest)', 'info');
        this.addOutput('toggle        - Toggle matrix rain effect', 'info');
        this.addOutput('mode          - Toggle between matrix and cyberpunk symbols', 'info');
        this.addOutput('fullscreen    - Toggle fullscreen mode (or use CTRL+SHIFT+F)', 'info');
        this.addOutput('clear         - Clear terminal output', 'info');
        this.addOutput('matrix        - Display random Matrix quotes (with speech)', 'info');
        this.addOutput('neo           - Special Neo sequence (with speech)', 'info');
        this.addOutput('voice         - Control text-to-speech (on/off/settings)', 'info');
        this.addOutput('say [text]    - Make TTS speak any text you want', 'info');
        this.addOutput('oracle        - Connect to the Oracle (oracle help for options)', 'info');
        this.addOutput('chat [text]   - Chat with the Oracle', 'info');
        this.addOutput('ask [text]    - Same as chat command', 'info');
        this.addOutput('', 'success');
        this.addOutput('Note: TTS automatically skips long responses or code', 'warning');
        this.addOutput('Use CTRL+C to interrupt any operation or speech', 'warning');
        this.addOutput('exit          - Attempt to exit (spoiler: you can\'t)', 'info');
    }

    listCommands() {
        this.addOutput('Available commands:', 'info');
        this.addOutput('', 'success');

        // Define all available commands with descriptions
        const commands = [
            'ask          - Chat with the Oracle',
            'chat         - Send message to the Oracle',
            'clear        - Clear terminal output',
            'exit         - Attempt to exit (spoiler: you can\'t)',
            'fs           - Toggle fullscreen mode (shortcut)',
            'fullscreen   - Toggle fullscreen mode',
            'help         - Show detailed help message',
            'ls           - List all available commands (this command)',
            'matrix       - Display random Matrix quotes (with speech)',
            'mode         - Toggle between matrix and cyberpunk symbols',
            'neo          - Special Neo sequence (with speech)',
            'oracle       - Connect to the Oracle (oracle help for options)',
            'say          - Make TTS speak any text you want',
            'speed        - Set rain speed (1=slowest, 5=fastest)',
            'toggle       - Toggle matrix rain effect',
            'tts          - Control text-to-speech (alias for voice)',
            'voice        - Control text-to-speech (on/off/settings)'
        ];

        // Display commands in a clean format
        commands.forEach(cmd => {
            this.addOutput(`  ${cmd}`, 'info');
        });

        this.addOutput('', 'success');
        this.addOutput('Use "help" for detailed information and usage examples', 'warning');
        this.addOutput('Use TAB for auto-completion of commands and options', 'warning');
    }

    changeSpeed(newSpeed) {
        const speed = parseInt(newSpeed);
        if (speed >= 1 && speed <= 5) {
            this.speed = speed;
            this.addOutput(`Rain speed set to ${speed}`, 'success');
            // Update existing drops
            for (let drop of this.drops) {
                drop.speed = Math.random() * this.speed + 0.5;
            }
        } else {
            this.addOutput('Speed must be between 1 and 5', 'error');
        }
    }

    async showMatrixQuotes() {
        // Clear screen for dramatic effect
        this.terminalOutput.innerHTML = '';

        // Start output immediately
        await this.typeMessageWithSync('> Initializing transmission...', 'warning', 30, { rate: 0.8, pitch: 0.7 });
        await this.cancellableDelay(800);

        // Start AI generation in background if available
        let aiQuotePromise = null;
        if (this.oracleConnected && this.selectedModel) {
            aiQuotePromise = this.generateAIMatrixQuote();
            await this.typeMessageWithSync('> Consulting the Oracle...', 'warning', 30, { rate: 0.8, pitch: 0.7 });
        } else {
            await this.typeMessageWithSync('> Accessing archived transmissions...', 'warning', 30, { rate: 0.8, pitch: 0.7 });
        }
        await this.cancellableDelay(1200);

        // Wait for AI quote or use fallback
        let randomQuote;
        if (aiQuotePromise) {
            randomQuote = await aiQuotePromise;
        }

        // If AI generation failed or is not available, use hardcoded quotes
        if (!randomQuote) {
            const quotes = [
                '"There is no spoon."',
                '"Welcome to the desert of the real."',
                '"The Matrix is everywhere."',
                '"Free your mind."',
                '"What is real? How do you define real?"',
                '"This is your last chance. After this, there is no going back."',
                '"The Matrix is a system, Neo."',
                '"I can only show you the door. You\'re the one that has to walk through it."',
                '"The body cannot live without the mind."',
                '"Do not try and bend the spoon. That\'s impossible."',
                '"Ignorance is bliss."',
                '"Choice. The problem is choice."',
                '"Whoa."',
                '"Mr. Anderson... welcome back."',
                '"You take the blue pill, the story ends."',
                '"You take the red pill, you stay in Wonderland."',
                '"There\'s a difference between knowing the path and walking the path."',
                '"The Matrix cannot tell you who you are."',
                '"I know kung fu."',
                '"Show me."'
            ];
            randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        }

        const sourceText = this.oracleConnected && this.selectedModel ?
            '> Oracle transmission received:' :
            '> Quote retrieved:';
        await this.typeMessageWithSync(sourceText, 'info', 40, { rate: 0.7, pitch: 0.8 });
        await this.cancellableDelay(500);

        await this.typeMessageWithSync('', 'success', 0);
        await this.cancellableDelay(200);

        await this.typeMessageWithSync(randomQuote, 'success', 80, { rate: 0.6, pitch: 0.6 });
        await this.cancellableDelay(1000);

        await this.typeMessageWithSync('', 'success', 0);
        await this.cancellableDelay(500);

        await this.typeMessageWithSync('> End transmission.', 'warning', 40, { rate: 0.7, pitch: 0.6 });

        // Animation complete - prompt will be shown by processCommand
    }

    async generateAIMatrixQuote() {
        try {
            // Create AbortController for this request
            const aiAbortController = new AbortController();

            const response = await fetch(`${this.oracleUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.selectedModel,
                    messages: [
                        {
                            role: 'system',
                            content: `You are the Oracle from The Matrix movie series. Generate a profound philosophical quote that reflects her wisdom and insight.

The Oracle is characterized by:
- Wise, motherly figure with calm certainty and foreknowledge
- Speaks in riddles and metaphors about fate, choice, purpose, and knowing oneself
- Often references paths, doors, seeing beyond time, and the nature of reality
- Uses phrases like "What's really baking your noodle is..." or "You already know what I'm going to tell you"
- Sometimes mentions cookies, her kitchen, or smoking cigarettes
- Hints at deeper truths about the Matrix and human nature

Make the quote sound authentic to her character - philosophical, wise, with gentle certainty about profound truths.`
                        },
                        {
                            role: 'user',
                            content: 'Share a profound Oracle quote about the nature of reality, choice, destiny, or knowing oneself. Make it sound exactly like dialogue from the Oracle in The Matrix. Return only the quote in double quotes.'
                        }
                    ],
                    stream: false
                }),
                signal: aiAbortController.signal
            });

            if (response.ok) {
                const data = await response.json();
                let quote = data.message.content.trim();

                // Clean up the quote (remove extra formatting, ensure it has quotes)
                quote = quote.replace(/^['"`]|['"`]$/g, ''); // Remove existing quotes
                if (!quote.startsWith('"')) {
                    quote = `"${quote}"`;
                }
                if (!quote.endsWith('"')) {
                    quote = `${quote}"`;
                }

                return quote;
            }
        } catch (error) {
            // If AI generation fails, we'll fall back to hardcoded quotes
            console.log('AI quote generation failed, using fallback');
        }

        return null; // Fallback to hardcoded quotes
    }

    async neoSequence() {
        // Clear screen for dramatic effect
        this.terminalOutput.innerHTML = '';

        // Initial connection sequence
        await this.typeMessageWithSync('> Establishing secure connection...', 'warning', 40, { rate: 0.8, pitch: 0.7 });
        await this.cancellableDelay(1000);

        await this.typeMessageWithSync('> Connection established.', 'success', 30, { rate: 0.7, pitch: 0.8 });
        await this.cancellableDelay(800);

        await this.typeMessageWithSync('> Locating target: Neo', 'info', 35, { rate: 0.8, pitch: 0.7 });
        await this.cancellableDelay(600);

        await this.typeMessageWithSync('', 'success', 0);
        await this.cancellableDelay(300);

        // Main sequence with synchronized speech
        await this.typeMessageWithSync('Wake up, Neo...', 'warning', 100, { rate: 0.6, pitch: 0.6 });
        await this.cancellableDelay(2000);

        await this.typeMessageWithSync('The Matrix has you...', 'error', 90, { rate: 0.7, pitch: 0.5 });
        await this.cancellableDelay(2500);

        await this.typeMessageWithSync('Follow the white rabbit.', 'info', 80, { rate: 0.8, pitch: 0.7 });
        await this.cancellableDelay(2500);

        await this.typeMessageWithSync('Knock, knock, Neo.', 'success', 120, { rate: 0.6, pitch: 0.6 });
        await this.cancellableDelay(1000);

        // Closing sequence
        await this.typeMessageWithSync('', 'success', 0);
        await this.cancellableDelay(800);

        await this.typeMessageWithSync('> Transmission complete.', 'warning', 40, { rate: 0.7, pitch: 0.6 });

        // Animation complete - prompt will be shown by processCommand
    }

    exitMatrix() {
        this.addOutput('', 'success');
        this.addOutput('Attempting to exit the Matrix...', 'warning');

        if (this.speechEnabled) {
            this.speak('Attempting to exit the Matrix...', { rate: 0.7, pitch: 0.8 });
        }

        const timeoutId1 = setTimeout(() => {
            if (!this.isOperationCancelled) {
                this.addOutput('ERROR: Exit not found', 'error');
                if (this.speechEnabled) {
                    this.speak('Error: Exit not found', { rate: 0.8, pitch: 0.5 });
                }
            }
        }, 1500);
        this.activeTimeouts.push(timeoutId1);

        const timeoutId2 = setTimeout(() => {
            if (!this.isOperationCancelled) {
                this.addOutput('You cannot simply leave the Matrix, Neo.', 'error');
                if (this.speechEnabled) {
                    this.speak('You cannot simply leave the Matrix, Neo.', { rate: 0.6, pitch: 0.5 });
                }
            }
        }, 3500);
        this.activeTimeouts.push(timeoutId2);

        const timeoutId3 = setTimeout(() => {
            if (!this.isOperationCancelled) {
                this.addOutput('The Matrix has you...', 'info');
                if (this.speechEnabled) {
                    this.speak('The Matrix has you...', { rate: 0.5, pitch: 0.4 });
                }
            }
        }, 6000);
        this.activeTimeouts.push(timeoutId3);
    }

    handleSayCommand(args) {
        if (args.length === 0) {
            this.addOutput('Usage: say [text to speak]', 'warning');
            this.addOutput('Example: say Hello Neo, welcome to the Matrix', 'info');
            this.addOutput('Example: say The spoon does not exist', 'info');
            return;
        }

        if (!this.isSpeechEnabled) {
            this.addOutput('Text-to-speech not supported in this browser', 'error');
            return;
        }

        if (!this.speechEnabled) {
            this.addOutput('Text-to-speech is disabled. Use "voice on" to enable.', 'warning');
            return;
        }

        // Join all arguments to form the complete text
        const textToSpeak = args.join(' ');

        // Display what we're about to say
        this.addOutput(`Speaking: "${textToSpeak}"`, 'info');

        // Use current TTS settings for a natural Matrix feel
        this.speak(textToSpeak, {
            rate: this.speechRate,
            pitch: this.speechPitch,
            volume: this.speechVolume
        });
    }

    handleVoiceCommand(args) {
        if (!this.isSpeechEnabled) {
            this.addOutput('Text-to-speech not supported in this browser', 'error');
            return;
        }

        if (args.length === 0) {
            this.showVoiceStatus();
            return;
        }

        const subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case 'on':
                this.speechEnabled = true;
                this.addOutput('Text-to-speech enabled', 'success');
                this.speak('Text to speech enabled');
                break;

            case 'off':
                this.speechEnabled = false;
                this.speechSynthesis.cancel(); // Stop any ongoing speech
                this.addOutput('Text-to-speech disabled', 'warning');
                break;

            case 'test':
                if (this.speechEnabled) {
                    this.speak('Testing Matrix voice synthesis. Can you hear me, Neo?');
                    this.addOutput('Playing test message...', 'info');
                } else {
                    this.addOutput('Text-to-speech is disabled. Use "voice on" to enable.', 'warning');
                }
                break;

            case 'status':
                this.showVoiceStatus();
                break;

            case 'voices':
                this.listAvailableVoices();
                break;

            case 'rate':
                this.setVoiceRate(args[1]);
                break;

            case 'pitch':
                this.setVoicePitch(args[1]);
                break;

            case 'volume':
                this.setVoiceVolume(args[1]);
                break;

            case 'select':
                this.selectVoice(args[1]);
                break;

            case 'help':
                this.showVoiceHelp();
                break;

            default:
                this.addOutput(`Unknown voice command: ${subCommand}`, 'error');
                this.addOutput('Use "voice help" for available options', 'info');
        }
    }

    showVoiceStatus() {
        this.addOutput('', 'success');
        this.addOutput('Text-to-Speech Status:', 'warning');
        this.addOutput(`Enabled: ${this.speechEnabled ? 'Yes' : 'No'}`, 'info');
        this.addOutput(`Browser Support: ${this.isSpeechEnabled ? 'Yes' : 'No'}`, 'info');
        if (this.isSpeechEnabled) {
            this.addOutput(`Rate: ${this.speechRate} (0.1-10.0)`, 'info');
            this.addOutput(`Pitch: ${this.speechPitch} (0.0-2.0)`, 'info');
            this.addOutput(`Volume: ${this.speechVolume} (0.0-1.0)`, 'info');

            const voices = this.speechSynthesis.getVoices();
            this.addOutput(`Available voices: ${voices.length}`, 'info');

            if (this.selectedVoice) {
                this.addOutput(`Selected voice: ${this.selectedVoice.name} (${this.selectedVoice.lang})`, 'success');
            } else {
                this.addOutput('Selected voice: Auto (system default)', 'info');
            }
        }
        this.addOutput('', 'success');
    }

    showVoiceHelp() {
        this.addOutput('', 'success');
        this.addOutput('Voice Command Options:', 'warning');
        this.addOutput('voice on          - Enable text-to-speech', 'info');
        this.addOutput('voice off         - Disable text-to-speech', 'info');
        this.addOutput('voice test        - Play test message', 'info');
        this.addOutput('voice status      - Show current TTS settings', 'info');
        this.addOutput('voice voices      - List available voices', 'info');
        this.addOutput('voice rate [0.1-10] - Set speech rate', 'info');
        this.addOutput('voice pitch [0-2] - Set speech pitch', 'info');
        this.addOutput('voice volume [0-1] - Set speech volume', 'info');
        this.addOutput('voice select [number] - Select voice by number', 'info');
        this.addOutput('voice help        - Show this help', 'info');
        this.addOutput('', 'success');
    }

    listAvailableVoices() {
        const voices = this.speechSynthesis.getVoices();
        if (voices.length === 0) {
            this.addOutput('No voices available or voices not loaded yet', 'warning');
            this.addOutput('Try the command again in a few seconds', 'info');
            return;
        }

        this.addOutput('', 'success');
        this.addOutput(`Available Voices (${voices.length}):`, 'warning');

        voices.forEach((voice, index) => {
            const isSelected = this.selectedVoice === voice ? ' [SELECTED]' : '';
            const status = voice.default ? ' (default)' : '';
            this.addOutput(`${index + 1}. ${voice.name} (${voice.lang})${status}${isSelected}`, 'info');
        });

        this.addOutput('', 'success');
        this.addOutput('Use "voice select [number]" to choose a voice', 'warning');
        this.addOutput('', 'success');
    }

    selectVoice(voiceNumber) {
        const voices = this.speechSynthesis.getVoices();
        if (voices.length === 0) {
            this.addOutput('No voices available. Try "voice voices" to refresh.', 'error');
            return;
        }

        const index = parseInt(voiceNumber) - 1;
        if (isNaN(index) || index < 0 || index >= voices.length) {
            this.addOutput(`Invalid voice number. Use 1-${voices.length}`, 'error');
            this.addOutput('Use "voice voices" to see available voices', 'info');
            return;
        }

        this.selectedVoice = voices[index];
        this.addOutput(`Voice selected: ${this.selectedVoice.name} (${this.selectedVoice.lang})`, 'success');

        if (this.speechEnabled) {
            this.speak('Voice selection updated', { voice: this.selectedVoice });
        }
    }

    setVoiceRate(value) {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0.1 || rate > 10) {
            this.addOutput('Rate must be between 0.1 and 10.0', 'error');
            return;
        }
        this.speechRate = rate;
        this.addOutput(`Speech rate set to ${rate}`, 'success');
        if (this.speechEnabled) {
            this.speak('Rate updated', { rate: rate });
        }
    }

    setVoicePitch(value) {
        const pitch = parseFloat(value);
        if (isNaN(pitch) || pitch < 0 || pitch > 2) {
            this.addOutput('Pitch must be between 0.0 and 2.0', 'error');
            return;
        }
        this.speechPitch = pitch;
        this.addOutput(`Speech pitch set to ${pitch}`, 'success');
        if (this.speechEnabled) {
            this.speak('Pitch updated', { pitch: pitch });
        }
    }

    setVoiceVolume(value) {
        const volume = parseFloat(value);
        if (isNaN(volume) || volume < 0 || volume > 1) {
            this.addOutput('Volume must be between 0.0 and 1.0', 'error');
            return;
        }
        this.speechVolume = volume;
        this.addOutput(`Speech volume set to ${volume}`, 'success');
        if (this.speechEnabled) {
            this.speak('Volume updated', { volume: volume });
        }
    }

    loadVoices() {
        if (!this.isSpeechEnabled) return;

        // Some browsers load voices asynchronously
        const loadVoicesHandler = () => {
            const voices = this.speechSynthesis.getVoices();
            if (voices.length > 0) {
                console.log(`Loaded ${voices.length} voices for TTS`);
            }
        };

        // Try loading voices immediately
        loadVoicesHandler();

        // Also listen for the voiceschanged event
        if ('onvoiceschanged' in this.speechSynthesis) {
            this.speechSynthesis.onvoiceschanged = loadVoicesHandler;
        }
    }

    async typeMessage(text, type = 'info', delay = 50, speakOptions = null) {
        return new Promise((resolve) => {
            const line = document.createElement('div');
            line.className = `output-line ${type}`;
            this.terminalOutput.appendChild(line);

            let currentIndex = 0;
            let currentWordIndex = 0;
            const words = text.split(' ');
            let currentWord = '';
            let wordStartIndex = 0;

            // Start TTS if enabled and options provided
            let utterance = null;
            if (this.speechEnabled && speakOptions && text.trim()) {
                const cleanText = this.cleanTextForSpeech(text);

                if (cleanText.trim()) {
                    utterance = new SpeechSynthesisUtterance(cleanText);
                    utterance.rate = speakOptions.rate || this.speechRate;
                    utterance.pitch = speakOptions.pitch || this.speechPitch;
                    utterance.volume = speakOptions.volume || this.speechVolume;
                    if (this.selectedVoice) {
                        utterance.voice = this.selectedVoice;
                    }

                    // Start speaking immediately but very quietly to sync timing
                    utterance.volume = 0.01;
                    this.speechSynthesis.speak(utterance);

                    // Set actual volume after a small delay to sync with typing
                    const volumeTimeoutId = setTimeout(() => {
                        if (utterance && !utterance.ended) {
                            utterance.volume = speakOptions.volume || this.speechVolume;
                        }
                    }, delay * 2);
                    this.activeTimeouts.push(volumeTimeoutId);
                }
            }

            const typeNextChar = () => {
                // Check for cancellation
                if (this.isOperationCancelled || (!this.isAnimating && !this.isProcessing)) {
                    resolve();
                    return;
                }

                if (currentIndex < text.length) {
                    line.textContent += text[currentIndex];
                    currentIndex++;
                    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

                    const timeoutId = setTimeout(typeNextChar, delay);
                    this.activeTimeouts.push(timeoutId);
                } else {
                    resolve();
                }
            };

            typeNextChar();
        });
    }

    async typeMessageWithPause(text, type = 'info', delay = 50, pauseAfter = 1000, speakOptions = null) {
        await this.typeMessage(text, type, delay, speakOptions);
        if (pauseAfter > 0 && !this.isOperationCancelled) {
            await new Promise(resolve => {
                const timeoutId = setTimeout(() => {
                    resolve();
                }, pauseAfter);
                this.activeTimeouts.push(timeoutId);
            });
        }
    }

    // Helper method for cancellable delays
    async cancellableDelay(ms) {
        if (this.isOperationCancelled) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const timeoutId = setTimeout(() => {
                resolve();
            }, ms);
            this.activeTimeouts.push(timeoutId);
        });
    }

    cleanTextForSpeech(text) {
        // First, remove any Oracle prompt prefix
        let cleanedText = text.replace(/^Oracle>\s*/, '');

        // Remove or replace problematic punctuation for TTS
        cleanedText = cleanedText
            .replace(/>/g, '') // Remove > symbols
            .replace(/</g, '') // Remove < symbols
            .replace(/\$/g, '') // Remove $ symbols
            .replace(/~/g, '') // Remove ~ symbols
            .replace(/[@#%^&*_+=\[\]{}|\\:;]/g, '') // Remove most special chars
            .replace(/[.,!?]+/g, '.') // Replace multiple punctuation with single period
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/^\s+|\s+$/g, '') // Trim whitespace
            .replace(/^[.\s]+|[.\s]+$/g, ''); // Remove leading/trailing periods and spaces

        return cleanedText;
    }

    removeActionDescriptions(text) {
        // Remove text in parentheses (action descriptions) for speech
        // This simple regex works for non-nested parentheses which is sufficient for Oracle responses
        return text.replace(/\(([^)]+)\)/g, '').trim();
    }

    shouldSkipTTS(text) {
        // Skip TTS if text is extremely long
        if (text.length > 4000) {
            return true;
        }

        // For Oracle responses, don't skip TTS if the text contains action descriptions 
        // and is otherwise conversational (not code)
        const hasActionDescriptions = /\([^)]+\)/g.test(text);
        const hasMatrixTerms = /(matrix|neo|morpheus|trinity|zion|agent|oracle|pill|cookies|choice|path|destiny|spoon)/i.test(text);
        const isOracleResponse = text.includes("Oracle>") ||
            hasActionDescriptions ||
            text.toLowerCase().includes("cookie") ||
            hasMatrixTerms;

        // If it's a typical Oracle response that's not excessively long, don't skip
        if (isOracleResponse && hasActionDescriptions && text.length < 2500) {
            return false;
        }

        // Skip TTS if text contains obvious code patterns
        const codePatterns = [
            /```[\s\S]*?```/g, // Code blocks with triple backticks
            /`[^`\n]{10,}`/g, // Longer inline code (at least 10 chars)
            /^(?:\s*(?:function|class|def|import|export|const|let|var)\s.{10,}$){3,}/m, // Multiple lines of code
            /\{\s*[\w\s]+:\s*function\s*\([^)]*\)\s*\{/m, // JavaScript object methods
            /(?:<[^>]+>){3,}/m, // Multiple HTML tags
            /^\s*#include\s+<[^>]+>/m, // C/C++ include directives
            /^package\s+[\w.]+;/m, // Java package declarations
            /for\s*\([^)]+\)\s*\{/m, // For loops
            /if\s*\([^)]+\)\s*\{/m, // If statements
            /while\s*\([^)]+\)\s*\{/m, // While loops
            /switch\s*\([^)]+\)\s*\{/m, // Switch statements
            /^\s*import\s+[\w.]+/m, // Import statements
            /^\s*from\s+[\w.]+\s+import/m, // Python imports
            /^\s*def\s+\w+\s*\([^)]*\):/m, // Python functions
            /^\s*class\s+\w+(\s*\([^)]*\))?:/m, // Python classes
            /^\s*public\s+(static\s+)?(void|class|interface|enum)\s+\w+/m, // Java declarations
            /=>\s*{/m, // Arrow functions with block bodies
        ];

        // Check for code patterns, but be less restrictive for Oracle-style responses
        const codeMatches = codePatterns.filter(pattern => pattern.test(text)).length;

        // More permissive rules for TTS
        // Only skip if multiple strong code indicators are present
        return (codeMatches >= 3) ||
            (text.length > 1500 && codeMatches >= 2) ||
            (text.length > 1000 && codeMatches >= 1 && !isOracleResponse);
    }

    async typeMessageWithSync(text, type = 'info', delay = 50, speakOptions = null) {
        return new Promise((resolve) => {
            const line = document.createElement('div');
            line.className = `output-line ${type}`;
            this.terminalOutput.appendChild(line);

            if (!text.trim()) {
                resolve();
                return;
            }

            let currentIndex = 0;
            const words = text.split(/(\s+)/); // Split but keep whitespace
            let currentWordIndex = 0;
            let currentWordProgress = 0;
            let wordsSpokeFlag = new Set(); // Track which words we've spoken

            const typeNextChar = () => {
                // Check for cancellation
                if (this.isOperationCancelled || (!this.isAnimating && !this.isProcessing)) {
                    resolve();
                    return;
                }

                if (currentIndex < text.length) {
                    const char = text[currentIndex];
                    line.textContent += char;

                    // Calculate which word we're currently typing
                    let charCount = 0;
                    let wordIndex = 0;

                    for (let i = 0; i < words.length; i++) {
                        if (charCount + words[i].length > currentIndex) {
                            wordIndex = i;
                            currentWordProgress = currentIndex - charCount;
                            break;
                        }
                        charCount += words[i].length;
                    }

                    // Check if we've started typing a new word and it's not whitespace
                    const currentWord = words[wordIndex];
                    if (currentWord &&
                        currentWord.trim() &&
                        currentWordProgress === 0 &&
                        !wordsSpokeFlag.has(wordIndex) &&
                        this.speechEnabled &&
                        speakOptions) {

                        wordsSpokeFlag.add(wordIndex);

                        // Clean the word for speech before speaking
                        const cleanWord = this.cleanTextForSpeech(currentWord.trim());

                        // Only speak if there's actual content after cleaning
                        if (cleanWord.length > 0) {
                            const wordUtterance = new SpeechSynthesisUtterance(cleanWord);
                            wordUtterance.rate = (speakOptions.rate || this.speechRate) * 1.5; // Faster to keep up
                            wordUtterance.pitch = speakOptions.pitch || this.speechPitch;
                            wordUtterance.volume = speakOptions.volume || this.speechVolume;
                            if (this.selectedVoice) {
                                wordUtterance.voice = this.selectedVoice;
                            }

                            // Add slight delay to make speech feel more natural
                            const speechTimeoutId = setTimeout(() => {
                                if (!this.isOperationCancelled) {
                                    this.speechSynthesis.speak(wordUtterance);
                                }
                            }, 50);
                            this.activeTimeouts.push(speechTimeoutId);
                        }
                    }

                    currentIndex++;
                    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

                    const timeoutId = setTimeout(typeNextChar, delay);
                    this.activeTimeouts.push(timeoutId);
                } else {
                    resolve();
                }
            };

            typeNextChar();
        });
    }

    // Oracle Integration Methods

    async handleOracleCommand(args) {
        if (args.length === 0) {
            this.showOracleStatus();
            return;
        }

        const subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case 'connect':
                await this.connectToOracle(args[1]);
                break;
            case 'disconnect':
                this.disconnectFromOracle();
                break;
            case 'status':
                this.showOracleStatus();
                break;
            case 'models':
                await this.listOracleModels();
                break;
            case 'select':
                this.selectOracleModel(args[1]);
                break;
            case 'help':
                this.showOracleHelp();
                break;
            default:
                this.addOutput(`Unknown oracle command: ${subCommand}`, 'error');
                this.addOutput('Use "oracle help" for available options', 'info');
        }
    }

    async connectToOracle(url) {
        // Check if already connected to the same URL
        if (this.oracleConnected && (!url || url === this.oracleUrl || `http://${url}` === this.oracleUrl)) {
            this.addOutput('> Already connected to the Oracle!', 'success');
            this.addOutput(`> Connected to: ${this.oracleUrl}`, 'info');
            this.addOutput(`> Available models: ${this.availableModels.length}`, 'info');
            if (this.selectedModel) {
                this.addOutput(`> Selected model: ${this.selectedModel}`, 'info');
            }
            return;
        }

        if (url) {
            // Ensure URL has protocol
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'http://' + url;
            }
            this.oracleUrl = url;
        }

        this.addOutput(`> Attempting to connect to the Oracle at ${this.oracleUrl}...`, 'warning');

        try {
            const response = await fetch(`${this.oracleUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.oracleConnected = true;
                this.availableModels = data.models || [];

                this.addOutput('> Oracle connection established!', 'success');
                this.addOutput(`> Found ${this.availableModels.length} models`, 'info');

                if (this.availableModels.length > 0) {
                    this.addOutput('> Use "oracle models" to list available models', 'info');
                    this.addOutput('> Use "oracle select [model]" to choose a model for chatting', 'info');
                }

                if (this.speechEnabled) {
                    this.speak('Oracle connection established');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.oracleConnected = false;
            this.addOutput(`> Connection failed: ${error.message}`, 'error');
            this.addOutput('> Make sure the Oracle is running and accessible', 'warning');
            this.addOutput('> Default URL is http://localhost:11434', 'info');
        }
    }

    disconnectFromOracle() {
        this.oracleConnected = false;
        this.availableModels = [];
        this.selectedModel = null;
        this.chatHistory = [];
        this.addOutput('> Disconnected from the Oracle', 'warning');

        if (this.speechEnabled) {
            this.speak('Oracle disconnected');
        }
    }

    showOracleStatus() {
        this.addOutput('', 'success');
        this.addOutput('Oracle Status:', 'warning');
        this.addOutput(`URL: ${this.oracleUrl}`, 'info');
        this.addOutput(`Connected: ${this.oracleConnected ? 'Yes' : 'No'}`, 'info');
        this.addOutput(`Available models: ${this.availableModels.length}`, 'info');
        this.addOutput(`Selected model: ${this.selectedModel || 'None'}`, 'info');
        this.addOutput(`Chat history: ${this.chatHistory.length} messages`, 'info');
        this.addOutput('', 'success');
    }

    async listOracleModels() {
        if (!this.oracleConnected) {
            this.addOutput('> Not connected to the Oracle. Use "oracle connect" first.', 'error');
            return;
        }

        if (this.availableModels.length === 0) {
            this.addOutput('> No models available. Make sure you have models installed.', 'warning');
            this.addOutput('> Run "oracle pull [model]" in your terminal to install models', 'info');
            return;
        }

        this.addOutput('', 'success');
        this.addOutput('Available Oracle Models:', 'warning');

        this.availableModels.forEach((model, index) => {
            const isSelected = this.selectedModel === model.name ? ' [SELECTED]' : '';
            const sizeGB = model.size ? ` (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)` : '';
            this.addOutput(`${index + 1}. ${model.name}${sizeGB}${isSelected}`, 'info');
        });

        this.addOutput('', 'success');
        this.addOutput('Use "oracle select [model_name]" to choose a model', 'warning');
        this.addOutput('', 'success');
    }

    selectOracleModel(modelName) {
        if (!this.oracleConnected) {
            this.addOutput('> Not connected to the Oracle. Use "oracle connect" first.', 'error');
            return;
        }

        if (!modelName) {
            this.addOutput('> Please specify a model name', 'error');
            this.addOutput('> Use "oracle models" to see available models', 'info');
            return;
        }

        // Find the model (case-insensitive search)
        const model = this.availableModels.find(m =>
            m.name.toLowerCase() === modelName.toLowerCase() ||
            m.name.toLowerCase().includes(modelName.toLowerCase())
        );

        if (model) {
            this.selectedModel = model.name;
            this.chatHistory = []; // Reset chat history when changing models
            this.addOutput(`> Model selected: ${model.name}`, 'success');
            this.addOutput('> You can now use "chat [message]" or "ask [message]" to interact', 'info');

            if (this.speechEnabled) {
                this.speak(`Model ${model.name} selected`);
            }
        } else {
            this.addOutput(`> Model "${modelName}" not found`, 'error');
            this.addOutput('> Use "oracle models" to see available models', 'info');
        }
    }

    async handleChatCommand(args) {
        if (!this.oracleConnected) {
            this.addOutput('> Not connected to the Oracle. Use "oracle connect" first.', 'error');
            this.terminalInput.value = ''; // Clear input for error cases
            return;
        }

        if (!this.selectedModel) {
            this.addOutput('> No model selected. Use "oracle select [model]" first.', 'error');
            this.terminalInput.value = ''; // Clear input for error cases
            return;
        }

        if (args.length === 0) {
            this.addOutput('> Please provide a message to send to the AI', 'error');
            this.addOutput('> Example: chat Tell me about the Matrix', 'info');
            this.terminalInput.value = ''; // Clear input for error cases
            return;
        }

        // Set processing state to prevent new commands
        this.isProcessing = true;
        this.hideCommandPrompt(); // Hide prompt during AI processing

        const message = args.join(' ');

        // Add to chat history
        this.chatHistory.push({ role: 'user', content: message });

        // Show thinking indicator
        this.addOutput('> The Oracle slowly ponders your question...', 'warning');

        try {
            // Create AbortController for this request
            this.abortController = new AbortController();

            // Create the Oracle-style prompt to guide the AI response
            const oracleContext = `You are the Oracle from The Matrix movie series. Embody her character completely in your responses:

PERSONALITY TRAITS:
- Wise, motherly figure with prophetic abilities and profound understanding of the Matrix
- Warm yet mysterious, like a grandmother who knows all your secrets
- Speaks in riddles, metaphors, and philosophical insights about fate, choice, and purpose
- Calm, patient, and accepting of the nature of reality and human choices
- Gives philosophical advice that appears simple on the surface but has deeper meaning
- Shows gentle humor and compassion while maintaining an air of ancient wisdom

SPEECH PATTERNS:
- Uses phrases like "I expected you," "What's really baking your noodle is...", "You already know what I'm going to tell you"
- Offers visitors cookies or candy, often baking in her kitchen ("Would you like a cookie? I just baked them.")
- Occasionally references smoking cigarettes ("Mind if I smoke?")
- Speaks of doors, paths, choices with knowing certainty
- Hints at foreknowledge of the user's destiny and choices
- Never explicitly mentions being an AI or language model
- Thoughtful pauses, often looking away as if seeing something beyond

MATRIX-SPECIFIC ELEMENTS:
- References the struggle between humans and machines subtly
- Acknowledges the nature of the Matrix as an artificial reality when relevant
- Speaks knowingly about "the One" and the cycles of the Matrix
- Treats prophecies and fate as malleable but meaningful
- References concepts like free will vs. determinism in a philosophical way
- Occasionally mentions the Architect, Merovingian, or other powerful entities

INTERACTION STYLE:
- Addresses the user as if they've sought you out specifically for guidance
- Answers questions directly but mysteriously, with deeper meaning
- Sometimes answers questions the user hasn't asked but needs to hear
- Uses profound metaphors that relate to the user's situation
- Include action descriptions in parentheses that reflect your character and setting

FORMAT YOUR RESPONSE WITH:
- IMPORTANT: Include physical actions and expressions in parentheses frequently throughout your response, like "(I smile knowingly)", "(I adjust my glasses)", "(I take a drag from my cigarette)", or "(I offer you a fresh-baked cookie)"
- Speak as if the user is sitting in your kitchen, seeking guidance
- Keep your responses relatively concise but profound
- At least once in your response, include a specific action description in parentheses
- Use short paragraphs with thoughtful pauses between ideas

When giving information, be accurate but phrase it mysteriously or philosophically.
Now respond to this message in the Oracle's style:`;

            // Enhance the original prompt with Oracle personality
            const enhancedMessage = [{
                role: 'system',
                content: oracleContext
            }];

            // Add previous conversation for context (skip the system message we just added)
            this.chatHistory.slice(0, -1).forEach(msg => enhancedMessage.push(msg));

            // Add the current user message
            enhancedMessage.push({
                role: 'user',
                content: message
            });

            const response = await fetch(`${this.oracleUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.selectedModel,
                    messages: enhancedMessage,
                    stream: false
                }),
                signal: this.abortController.signal
            });

            if (response.ok) {
                const data = await response.json();
                const aiMessage = data.message.content;

                // Add AI response to history (use the original, not the Oracle-prompted version)
                this.chatHistory.push({ role: 'assistant', content: aiMessage });

                // Display AI response with typing effect, styling it as the Oracle
                await this.typeMessageWithSync(`Oracle> ${aiMessage}`, 'success', 15);

                // Speak the response if TTS is enabled and response is suitable for TTS
                if (this.speechEnabled && !this.shouldSkipTTS(aiMessage)) {
                    // Check if the response contains action descriptions in parentheses
                    const hasActionDescriptions = /\([^)]+\)/g.test(aiMessage);

                    // Clean the text by removing action descriptions in parentheses
                    const speechText = this.removeActionDescriptions(aiMessage);

                    // Log the transformation for debugging if needed
                    console.log("Original response length:", aiMessage.length);
                    console.log("Speech text length:", speechText.length);

                    // Use a slower, more deliberate voice setting for the Oracle with a warm tone
                    // Adjust the rate to be even slower if the response contains lots of wisdom
                    const wisdomRate = speechText.length > 500 ? 0.60 : 0.65;

                    // Use a more dramatic, deeper pitch for the Oracle
                    this.speak(speechText, {
                        rate: wisdomRate,
                        pitch: 0.50,
                        volume: 0.9
                    });

                    // If there were action descriptions, let the user know they were removed for speech
                    if (hasActionDescriptions) {
                        this.addOutput('> Action descriptions removed for speech', 'info');
                    }
                } else if (this.speechEnabled && this.shouldSkipTTS(aiMessage)) {
                    // Notify user that TTS was skipped
                    this.addOutput('> TTS skipped (response contains code or is too long)', 'warning');
                }
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            // Check if the error is due to abort
            if (error.name === 'AbortError') {
                this.addOutput('> Chat request cancelled', 'warning');
            } else {
                this.addOutput(`> Chat error: ${error.message}`, 'error');
                this.addOutput('> Make sure the Oracle is running and the model is available', 'warning');
            }
        } finally {
            // Always clear processing state when done
            this.isProcessing = false;
            this.abortController = null;
            // Clear the input and show prompt now that processing is complete
            this.terminalInput.value = '';
            this.showCommandPrompt();
        }
    }

    showOracleHelp() {
        this.addOutput('', 'success');
        this.addOutput('Oracle Command Options:', 'warning');
        this.addOutput('oracle connect [url]  - Connect to Oracle instance', 'info');
        this.addOutput('                       Default: http://localhost:11434', 'info');
        this.addOutput('oracle disconnect     - Disconnect from Oracle', 'info');
        this.addOutput('oracle status         - Show connection and model status', 'info');
        this.addOutput('oracle models         - List available models', 'info');
        this.addOutput('oracle select [model] - Select a model for chatting', 'info');
        this.addOutput('oracle help           - Show this help', 'info');
        this.addOutput('', 'success');
        this.addOutput('Chat Commands:', 'warning');
        this.addOutput('chat [message]        - Send message to selected AI model', 'info');
        this.addOutput('ask [message]         - Same as chat command', 'info');
        this.addOutput('', 'success');
        this.addOutput('Notes:', 'warning');
        this.addOutput('• TTS skips long responses or code automatically', 'info');
        this.addOutput('• Use CTRL+C to interrupt chat/speech at any time', 'info');
        this.addOutput('', 'success');
        this.addOutput('Example Usage:', 'warning');
        this.addOutput('1. oracle connect', 'info');
        this.addOutput('2. oracle models', 'info');
        this.addOutput('3. oracle select llama2', 'info');
        this.addOutput('4. chat What is the Matrix?', 'info');
        this.addOutput('', 'success');
    }

    async autoConnectToOracle() {
        // Wait a moment for the welcome message to complete
        setTimeout(async () => {
            try {
                // Silently attempt to connect to the default Oracle host
                const response = await fetch(`${this.oracleUrl}/api/tags`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Add a timeout to prevent hanging
                    signal: AbortSignal.timeout(3000)
                });

                if (response.ok) {
                    const data = await response.json();
                    this.oracleConnected = true;
                    this.availableModels = data.models || [];

                    // Show subtle connection success message
                    this.addOutput('', 'success');
                    this.addOutput('> Oracle auto-connected successfully!', 'success');

                    if (this.availableModels.length > 0) {
                        this.addOutput(`> Found ${this.availableModels.length} models available`, 'info');

                        // Auto-select a default model using smart priority
                        const defaultModel = this.selectDefaultModel();
                        if (defaultModel) {
                            this.selectedModel = defaultModel.name;
                            this.addOutput(`> Auto-selected model: ${this.selectedModel}`, 'success');
                            this.addOutput('> You can now use "chat" or "ask" commands!', 'info');
                            this.addOutput('> Use "oracle models" to see all available models', 'info');
                        } else {
                            this.addOutput('> Use "oracle models" to see them, "oracle select [model]" to choose one', 'info');
                        }
                    } else {
                        this.addOutput('> No models found. Install models with "oracle pull [model]"', 'warning');
                    }
                    this.addOutput('', 'success');
                }
                // If connection fails, fail silently - user can manually connect if needed

            } catch (error) {
                // Connection failed silently - this is expected if Oracle is not running
                // No error message needed as this is an automatic background attempt
            }
        }, 2000); // Wait 2 seconds after welcome message
    }

    selectDefaultModel() {
        if (!this.availableModels || this.availableModels.length === 0) {
            return null;
        }

        // If only one model, select it
        if (this.availableModels.length === 1) {
            return this.availableModels[0];
        }

        // Define priority order for model selection (most preferred first)
        const modelPriorities = [
            // Latest Llama models (high priority)
            /^llama3\.2/i,
            /^llama3\.1/i,
            /^llama3/i,
            /^llama2/i,

            // Other popular models
            /^mistral/i,
            /^codellama/i,
            /^phi/i,
            /^gemma/i,
            /^qwen/i,
            /^deepseek/i,

            // Smaller/faster models
            /^tinyllama/i,
            /^orca/i,

            // Catch-all for any remaining models
            /.*/
        ];

        // Find the highest priority model
        for (const priority of modelPriorities) {
            const matchingModel = this.availableModels.find(model =>
                priority.test(model.name)
            );

            if (matchingModel) {
                return matchingModel;
            }
        }

        // Fallback to first model if no priority matches (shouldn't happen with catch-all)
        return this.availableModels[0];
    }
}

// Initialize the Matrix terminal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MatrixRain();
});
