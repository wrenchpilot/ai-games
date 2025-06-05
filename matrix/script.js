class MatrixRain {
    constructor() {
        this.canvas = document.getElementById('matrix-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.terminal = document.getElementById('terminal');
        this.terminalInput = document.getElementById('terminal-input');
        this.terminalOutput = document.getElementById('terminal-output');
        this.terminalInputLine = document.getElementById('terminal-input-line');
        
        // Login system
        this.loginScreen = document.getElementById('login-screen');
        this.loginForm = document.getElementById('login-form');
        this.loginMessages = document.getElementById('login-messages');
        this.usernameInput = document.getElementById('username-input');
        this.passwordInput = document.getElementById('password-input');
        this.loginButton = document.getElementById('login-button');
        this.currentUser = 'user'; // Default username
        this.isLoggedIn = false;

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
        this.oracleUrl = 'http://127.0.0.1:11434'; // Default Oracle URL
        this.oracleConnected = false;
        this.availableModels = [];
        this.selectedModel = null;
        this.chatHistory = [];

        // Matrix character selection
        this.selectedCharacter = 'oracle'; // Default to Oracle
        this.matrixCharacters = {
            'oracle': {
                name: 'The Oracle',
                displayName: 'Oracle',
                color: 'success',
                speechRate: 0.65,
                speechPitch: 0.50,
                speechVolume: 0.9,
                thinkingMessage: '> The Oracle slowly ponders your question...'
            },
            'morpheus': {
                name: 'Morpheus',
                displayName: 'Morpheus',
                color: 'info',
                speechRate: 0.75,
                speechPitch: 0.40,
                speechVolume: 1.0,
                thinkingMessage: '> Morpheus considers your words carefully...'
            },
            'trinity': {
                name: 'Trinity',
                displayName: 'Trinity',
                color: 'warning',
                speechRate: 0.85,
                speechPitch: 0.60,
                speechVolume: 0.85,
                thinkingMessage: '> Trinity analyzes the situation...'
            },
            'neo': {
                name: 'Neo',
                displayName: 'Neo',
                color: 'info',
                speechRate: 0.80,
                speechPitch: 0.45,
                speechVolume: 0.9,
                thinkingMessage: '> Neo focuses on your question...'
            },
            'tank': {
                name: 'Tank',
                displayName: 'Tank',
                color: 'warning',
                speechRate: 0.90,
                speechPitch: 0.55,
                speechVolume: 0.85,
                thinkingMessage: '> Tank checks the system for information...'
            },
            'smith': {
                name: 'Agent Smith',
                displayName: 'Agent Smith',
                color: 'error',
                speechRate: 0.70,
                speechPitch: 0.35,
                speechVolume: 1.0,
                thinkingMessage: '> Agent Smith interrogates the system...'
            },
            'architect': {
                name: 'The Architect',
                displayName: 'Architect',
                color: 'info',
                speechRate: 0.60,
                speechPitch: 0.30,
                speechVolume: 1.0,
                thinkingMessage: '> The Architect calculates all possibilities...'
            },
            'cypher': {
                name: 'Cypher',
                displayName: 'Cypher',
                color: 'error',
                speechRate: 0.85,
                speechPitch: 0.65,
                speechVolume: 0.9,
                thinkingMessage: '> Cypher smirks and considers his response...'
            },
            'dozer': {
                name: 'Dozer',
                displayName: 'Dozer',
                color: 'success',
                speechRate: 0.88,
                speechPitch: 0.50,
                speechVolume: 0.95,
                thinkingMessage: '> Dozer thinks about the technical details...'
            },
            'switch': {
                name: 'Switch',
                displayName: 'Switch',
                color: 'warning',
                speechRate: 0.82,
                speechPitch: 0.70,
                speechVolume: 0.8,
                thinkingMessage: '> Switch quickly processes your request...'
            },
            'mouse': {
                name: 'Mouse',
                displayName: 'Mouse',
                color: 'info',
                speechRate: 0.95,
                speechPitch: 0.75,
                speechVolume: 0.85,
                thinkingMessage: '> Mouse nervously considers your question...'
            }
        };

        // Operation cancellation support
        this.activeTimeouts = []; // Track active timeouts for cancellation
        this.isOperationCancelled = false; // Flag to check for cancellation
        this.abortController = null; // For cancelling fetch operations

        this.init();
        this.setupEventListeners();
        this.createMinimizeButton();
        this.loadVoices();
        this.setupLoginScreen();
        // Don't show welcome or auto-connect until after login
    }

    init() {
        this.resizeCanvas();
        this.initDrops();
        this.animate();

        // Don't focus on terminal input initially - login screen will handle focus
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

        // Save session after mode change
        this.saveSession();
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
        // Save session after clearing terminal to update stored history
        this.saveSession();
    }

    hideCommandPrompt() {
        this.terminalInputLine.style.display = 'none';
    }

    showCommandPrompt() {
        // Update the prompt display first
        this.updatePromptDisplay();
        
        // Then show the input line and focus
        this.terminalInputLine.style.display = 'flex';
        this.terminalInput.focus();
    }

    updatePromptDisplay() {
        // Update input prompt with current character if applicable
        if (this.selectedCharacter) {
            const character = this.matrixCharacters[this.selectedCharacter];
            const promptLabel = document.querySelector('.prompt-label');
            if (promptLabel) {
                promptLabel.textContent = `${this.currentUser}@zion [${character.displayName}]:~$ `;
                // Keep the prompt the original Matrix green color regardless of character
                promptLabel.className = 'prompt-label';
                console.log(`[PROMPT UPDATE] Set to character: ${character.displayName}, keeping original green color`);
            }
        } else {
            // Reset to default prompt
            const promptLabel = document.querySelector('.prompt-label');
            if (promptLabel) {
                promptLabel.textContent = `${this.currentUser}@zion:~$ `;
                promptLabel.className = 'prompt-label';
                console.log('[PROMPT UPDATE] Reset to default prompt');
            }
        }
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
        const commands = ['help', 'ls', 'speed', 'toggle', 'mode', 'fullscreen', 'fs', 'clear', 'matrix', 'neo', 'voice', 'tts', 'say', 'oracle', 'chat', 'ask', 'characters', 'chars', 'home', 'logout', 'exit'];
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
            } else if (mainCommand === 'chat' || mainCommand === 'ask') {
                // Offer character completions for chat/ask command
                matches = Object.keys(this.matrixCharacters).filter(char => 
                    char.startsWith(currentWord.toLowerCase()));
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
        this.addOutput('WELCOME TO THE ZION TERMINAL', 'success');
        this.addOutput('='.repeat(60), 'success');
        this.addOutput('', 'success');
        this.addOutput(`Access granted for user: ${this.currentUser}`, 'info');
        this.addOutput('', 'success');
        this.addOutput('Available commands:', 'info');
        this.addOutput('  help          - Show detailed help message', 'info');
        this.addOutput('  ls            - List all available commands (filesystem style)', 'info');
        this.addOutput('  speed [1-5]   - Set rain speed (1=slowest, 5=fastest)', 'info');
        this.addOutput('  toggle        - Toggle matrix rain effect', 'info');
        this.addOutput('  mode          - Toggle between matrix and cyberpunk symbols', 'info');
        this.addOutput('  fullscreen    - Toggle fullscreen mode (or use CTRL+SHIFT+F)', 'info');
        this.addOutput('  clear         - Clear terminal output', 'info');
        this.addOutput('  matrix        - Display random Matrix quotes (with speech)', 'info');
        this.addOutput('  neo           - Special Neo sequence (with speech)', 'info');
        this.addOutput('  voice         - Control text-to-speech (on/off/settings)', 'info');
        this.addOutput('                  Try: voice voices, voice select [number]', 'info');
        this.addOutput('  say [text]    - Make TTS speak any text you want', 'info');
        this.addOutput('  oracle        - Connect to the Oracle (oracle help for options)', 'info');
        this.addOutput('  characters    - List available Matrix characters', 'info');
        this.addOutput('  chat [char] [text] - Chat with Matrix characters', 'info');
        this.addOutput('                  Try: chat morpheus What is the Matrix?', 'info');
        this.addOutput('  ask [text]    - Same as chat command', 'info');
        this.addOutput('  home          - Navigate to main games index page', 'info');
        this.addOutput('  session       - Show current session information and debugging', 'info');
        this.addOutput('  logout        - Save session and return to login screen', 'info');
        this.addOutput('  exit          - Attempt to exit (spoiler: you can\'t)', 'info');
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
        this.addOutput(`${this.currentUser}@zion:~$ ${command}`, 'success');

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
            case 'characters':
            case 'chars':
                this.listMatrixCharacters();
                break;
            case 'chat':
            case 'ask':
                await this.handleChatCommand(args.slice(1));
                break;
            case 'home':
                this.navigateHome();
                break;
            case 'exit':
                this.exitMatrix();
                break;
            case 'logout':
                this.logout();
                break;
            case 'session':
                this.showSessionInfo();
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
        
        // Save session after command execution to preserve terminal history
        this.saveSession();
    }

    showHelp() {
        this.addOutput('Zion Terminal Commands:', 'info');
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
        this.addOutput('characters    - List available Matrix characters', 'info');
        this.addOutput('chat [char] [text] - Chat with Matrix characters', 'info');
        this.addOutput('ask [text]    - Same as chat command', 'info');
        this.addOutput('home          - Navigate to main games index page', 'info');
        this.addOutput('session       - Show current session information and debugging', 'info');
        this.addOutput('logout        - Save session and return to login screen', 'info');
        this.addOutput('exit          - Attempt to exit (spoiler: you can\'t)', 'info');
        this.addOutput('', 'success');
        this.addOutput('Note: TTS automatically skips code and character actions', 'warning');
        this.addOutput('Use CTRL+C to interrupt any operation or speech', 'warning');
    }

    listCommands() {
        this.addOutput('Available commands:', 'info');
        this.addOutput('', 'success');

        // Define all available commands with descriptions
        const commands = [
            'ask          - Same as chat command',
            'chat         - Chat with Matrix characters',
            'characters   - List available Matrix characters',
            'clear        - Clear terminal output',
            'exit         - Attempt to exit (spoiler: you can\'t)',
            'fs           - Toggle fullscreen mode (shortcut)',
            'fullscreen   - Toggle fullscreen mode',
            'help         - Show detailed help message',
            'home         - Navigate to main games index page',
            'logout       - Save session and return to login screen',
            'ls           - List all available commands (this command)',
            'matrix       - Display random Matrix quotes (with speech)',
            'mode         - Toggle between matrix and cyberpunk symbols',
            'neo          - Special Neo sequence (with speech)',
            'oracle       - Connect to the Oracle (oracle help for options)',
            'say          - Make TTS speak any text you want',
            'session      - Show current session information and debugging',
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
            
            // Save session after speed change
            this.saveSession();
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

    showSessionInfo() {
        this.addOutput('', 'success');
        this.addOutput('='.repeat(50), 'success');
        this.addOutput('CURRENT SESSION INFORMATION', 'success');
        this.addOutput('='.repeat(50), 'success');
        this.addOutput('', 'success');
        this.addOutput(`Current User: ${this.currentUser}`, 'info');
        this.addOutput(`Session Key: matrix_session_${this.currentUser}`, 'info');
        this.addOutput(`Login Status: ${this.isLoggedIn ? 'Logged In' : 'Not Logged In'}`, 'info');
        this.addOutput('', 'success');
        this.addOutput('Settings:', 'warning');
        this.addOutput(`  Character: ${this.selectedCharacter}`, 'info');
        this.addOutput(`  Oracle URL: ${this.oracleUrl}`, 'info');
        this.addOutput(`  Selected Model: ${this.selectedModel || 'None'}`, 'info');
        this.addOutput(`  Mode: ${this.mode}`, 'info');
        this.addOutput(`  Speed: ${this.speed}`, 'info');
        this.addOutput('', 'success');
        this.addOutput('History:', 'warning');
        this.addOutput(`  Chat Messages: ${this.chatHistory.length}`, 'info');
        this.addOutput(`  Commands: ${this.commandHistory.length}`, 'info');
        this.addOutput('', 'success');
        
        // Show which sessions exist in localStorage
        this.addOutput('Available Sessions:', 'warning');
        let sessionCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('matrix_session_')) {
                const username = key.replace('matrix_session_', '');
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    const lastActive = new Date(data.lastActive).toLocaleString();
                    const isCurrent = username === this.currentUser ? ' (CURRENT)' : '';
                    this.addOutput(`  ${username}: Last active ${lastActive}${isCurrent}`, 'info');
                    sessionCount++;
                } catch (error) {
                    this.addOutput(`  ${username}: [Invalid session data]`, 'error');
                }
            }
        }
        if (sessionCount === 0) {
            this.addOutput('  No sessions found', 'info');
        }
        this.addOutput('', 'success');
    }

    navigateHome() {
        this.addOutput('', 'success');
        this.addOutput('Initiating navigation to main games index...', 'warning');
        
        if (this.speechEnabled) {
            this.speak('Navigating to main games index...', { rate: 0.8, pitch: 0.8 });
        }

        const timeoutId = setTimeout(() => {
            if (!this.isOperationCancelled) {
                this.addOutput('Exiting the Matrix...', 'info');
                this.addOutput('Reality protocols activated', 'success');
                
                if (this.speechEnabled) {
                    this.speak('Welcome back to reality', { rate: 0.7, pitch: 1.0 });
                }
                
                // Save session before navigation
                this.saveSession();
                
                // Navigate to the main games index
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            }
        }, 1500);
        this.activeTimeouts.push(timeoutId);
    }

    logout() {
        // Save current session before logout
        this.saveSession();
        
        this.addOutput('', 'success');
        this.addOutput('Logging out...', 'warning');
        this.addOutput('Session saved successfully', 'info');
        this.addOutput('Returning to login screen...', 'info');
        
        // Reset login state
        this.isLoggedIn = false;
        this.currentUser = null;
        
        // Hide terminal and show login screen
        this.terminal.style.display = 'none';
        
        // Hide minimize button (only shown when logged in)
        const minimizeBtn = document.getElementById('minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.style.display = 'none';
        }
        
        // Reset and show login screen
        this.loginScreen.style.display = 'flex';
        this.loginScreen.style.opacity = '1';
        this.loginScreen.style.transition = 'opacity 0.5s ease-in';
        
        // Remove access granted effect if it exists
        this.loginForm.parentElement.classList.remove('access-granted');
        
        // Reset login form to original HTML structure (overwrite authentication progress)
        this.loginForm.innerHTML = `
            <div class="form-group">
                <label for="username-input">Username:</label>
                <input type="text" id="username-input" autocomplete="off" spellcheck="false" maxlength="16">
            </div>
            <div class="form-group">
                <label for="password-input">Password:</label>
                <input type="password" id="password-input" autocomplete="off" spellcheck="false" maxlength="32">
            </div>
            <div class="login-button-container">
                <button id="login-button" class="login-button">ACCESS MAINFRAME</button>
            </div>
            <div class="login-hint">
                Enter any username and password to access the system
            </div>
        `;
        
        // Re-get references to the new elements
        this.usernameInput = document.getElementById('username-input');
        this.passwordInput = document.getElementById('password-input');
        this.loginButton = document.getElementById('login-button');
        
        // Reset login form properties
        this.usernameInput.value = '';
        this.passwordInput.value = '';
        this.usernameInput.disabled = false;
        this.passwordInput.disabled = false;
        this.loginButton.disabled = false;
        
        // Show the login form immediately (don't wait for animation)
        this.loginForm.style.display = 'block';
        
        // Re-setup event listeners for the new elements
        this.setupLoginEventListeners();
        
        // Focus on username input
        setTimeout(() => {
            this.usernameInput.focus();
        }, 100);
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
                // Save session after speech setting change
                this.saveSession();
                break;

            case 'off':
                this.speechEnabled = false;
                this.speechSynthesis.cancel(); // Stop any ongoing speech
                this.addOutput('Text-to-speech disabled', 'warning');
                // Save session after speech setting change
                this.saveSession();
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
        
        // Save session after voice selection change
        this.saveSession();
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
        // Save session after voice setting change
        this.saveSession();
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
        // Save session after voice setting change
        this.saveSession();
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
        // Save session after voice setting change
        this.saveSession();
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
        // Remove text in parentheses and asterisks (action descriptions) for speech
        // Handle both (action) and **action** formats
        let cleanedText = text;
        
        // Remove (action) - handle multiple sets and unmatched parentheses
        cleanedText = cleanedText.replace(/\([^)]*\)/g, ''); // Remove (action)
        
        // Remove **action** - handle multiple sets
        cleanedText = cleanedText.replace(/\*\*[^*]*\*\*/g, ''); // Remove **action**
        
        // Clean up any remaining unmatched parentheses that might cause TTS issues
        cleanedText = cleanedText.replace(/[\(\)]/g, '');
        
        // Clean up any remaining unmatched asterisks
        cleanedText = cleanedText.replace(/\*\*/g, '');
        
        // Clean up multiple spaces and trim
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
        
        return cleanedText;
    }

    shouldSkipTTS(text) {
        // Skip TTS if text is extremely long
        if (text.length > 4000) {
            return true;
        }

        // For character responses, don't skip TTS if the text contains action descriptions 
        // and is otherwise conversational (not code)
        const hasActionDescriptions = /\([^)]+\)|\*\*[^*]+\*\*/g.test(text);
        const hasMatrixTerms = /(matrix|neo|morpheus|trinity|zion|agent|oracle|pill|cookies|choice|path|destiny|spoon)/i.test(text);

        // Get current character name to check for in the response
        const characterName = this.matrixCharacters[this.selectedCharacter].name.toLowerCase();
        const isCharacterResponse = text.toLowerCase().includes(characterName) ||
            hasActionDescriptions ||
            hasMatrixTerms;

        // If it's a typical character response that's not excessively long, don't skip
        if (isCharacterResponse && hasActionDescriptions && text.length < 2500) {
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

        // Check if this is likely an Oracle response (must be defined in this scope)
        const isOracleResponse = text.includes("Oracle>") ||
            text.toLowerCase().includes("oracle");

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
            
            // Check if this is a character response by looking for character name prefix
            const isCharacterResponse = /^[A-Za-z\s]+>\s/.test(text) || 
                                      this.selectedCharacter !== null ||
                                      /\([^)]+\)/.test(text) || 
                                      /\*\*[^*]+\*\*/.test(text);
            
            // Special handling for character responses to make speech flow naturally
            let speechBuffer = '';
            let inParentheses = false;
            let sentenceBuffer = '';
            
            let currentIndex = 0;
            const words = text.split(/(\s+)/); // Split but keep whitespace
            let currentWordIndex = 0;
            let currentWordProgress = 0;
            let wordsSpokeFlag = new Set(); // Track which words we've spoken
            let lastSpokenIndex = -1;
            
            // For Oracle speech, we'll use phrases/sentences instead of single words
            const speakOracleSentence = (sentence, options) => {
                if (!sentence.trim()) return;
                
                // Create a natural pause at sentence boundaries
                const pausePattern = /[.!?]$/;
                const shouldPause = pausePattern.test(sentence);
                
                const utterance = new SpeechSynthesisUtterance(sentence);
                utterance.rate = options.rate || this.speechRate;
                utterance.pitch = options.pitch || this.speechPitch;
                utterance.volume = options.volume || this.speechVolume;
                
                if (this.selectedVoice) {
                    utterance.voice = this.selectedVoice;
                }
                
                // Add slight delay to make speech feel more natural
                const speechTimeoutId = setTimeout(() => {
                    if (!this.isOperationCancelled) {
                        this.speechSynthesis.speak(utterance);
                        
                        // If this is the end of a sentence, add a slight pause
                        if (shouldPause) {
                            const pauseUtterance = new SpeechSynthesisUtterance(' ');
                            pauseUtterance.rate = 0.1; // Very slow to create pause
                            this.speechSynthesis.speak(pauseUtterance);
                        }
                    }
                }, 50);
                this.activeTimeouts.push(speechTimeoutId);
            };

            const typeNextChar = () => {
                // Check for cancellation
                if (this.isOperationCancelled || (!this.isAnimating && !this.isProcessing)) {
                    resolve();
                    return;
                }

                if (currentIndex < text.length) {
                    const char = text[currentIndex];
                    
                    // Add character to display
                    line.textContent += char;
                    
                    // Special handling for character responses to filter out action descriptions for speech
                    if (isCharacterResponse && this.speechEnabled && speakOptions) {
                        // Track if we're inside parentheses or asterisks (action descriptions)
                        if (char === '(') {
                            inParentheses = true;
                        } else if (char === ')') {
                            inParentheses = false;
                        } else if (char === '*' && text[currentIndex + 1] === '*') {
                            inParentheses = true; // Start of **action**
                            currentIndex++; // Skip the next asterisk
                            line.textContent += text[currentIndex]; // Add the second asterisk to display
                        } else if (char === '*' && text[currentIndex - 1] === '*' && inParentheses) {
                            inParentheses = false; // End of **action**
                        }
                        
                        // Only collect characters for speech if not in parentheses/asterisks
                        if (!inParentheses) {
                            sentenceBuffer += char;
                                
                            // If we hit end of sentence or a significant phrase, speak it
                            if (char === '.' || char === '!' || char === '?' || 
                                (sentenceBuffer.length > 30 && char === ' ' && sentenceBuffer.trim().length > 0)) {
                                
                                // Skip the character prefix (like "Oracle>", "Agent Smith>", etc.) when speaking
                                const speechText = sentenceBuffer.replace(/^[A-Za-z\s]+>\s*/, '').trim();
                                
                                // Clean action descriptions from speech text
                                const cleanedSpeechText = this.removeActionDescriptions(speechText);
                                
                                if (cleanedSpeechText.length > 0) {
                                    speakOracleSentence(cleanedSpeechText, {
                                        rate: speakOptions.rate || 0.65,
                                        pitch: speakOptions.pitch || 0.5,
                                        volume: speakOptions.volume || 0.9
                                    });
                                }
                                
                                // Clear the buffer after speaking
                                sentenceBuffer = '';
                            }
                        }
                    } else {
                        // Regular (non-character) response handling with word-by-word speech
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
                    }

                    currentIndex++;
                    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;

                    const timeoutId = setTimeout(typeNextChar, delay);
                    this.activeTimeouts.push(timeoutId);
                } else {
                    // If we're done and have a character response with remaining speech buffer, speak it
                    if (isCharacterResponse && sentenceBuffer.trim().length > 0 && this.speechEnabled && speakOptions) {
                        const finalSpeechText = sentenceBuffer.replace(/^[A-Za-z\s]+>\s*/, '').trim();
                        
                        // Clean action descriptions from the final speech text
                        const cleanedFinalText = this.removeActionDescriptions(finalSpeechText);
                        
                        if (cleanedFinalText.length > 0) {
                            speakOracleSentence(cleanedFinalText, {
                                rate: speakOptions.rate || 0.65,
                                pitch: speakOptions.pitch || 0.5,
                                volume: speakOptions.volume || 0.9
                            });
                        }
                    }
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

                // Save session after Oracle connection
                this.saveSession();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            this.oracleConnected = false;
            this.addOutput(`> Connection failed: ${error.message}`, 'error');
            this.addOutput('> Make sure the Oracle is running and accessible', 'warning');
            this.addOutput('> Default URL is http://127.0.0.1:11434', 'info');
            this.addOutput('> For setup instructions, see: README.md', 'info');
            this.addOutput('> Install Ollama: https://ollama.ai', 'info');
        }
    }

    disconnectFromOracle() {
        this.oracleConnected = false;
        this.availableModels = [];
        this.selectedModel = null;
        // Don't clear chat history on disconnect - preserve it for session restoration
        // this.chatHistory = [];
        this.addOutput('> Disconnected from the Oracle', 'warning');

        if (this.speechEnabled) {
            this.speak('Oracle disconnected');
        }

        // Save session after Oracle disconnection
        this.saveSession();
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

            // Save session after model selection
            this.saveSession();
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
            this.addOutput('> Please provide a message or character name', 'error');
            this.addOutput('> Example: chat Tell me about the Matrix', 'info');
            this.addOutput('> Example: chat trinity What do you think of Neo?', 'info');
            this.addOutput('> Available characters: ' + Object.keys(this.matrixCharacters).join(', '), 'info');
            this.terminalInput.value = ''; // Clear input for error cases
            return;
        }
        
        // Check if first argument is a character name
        const firstArg = args[0].toLowerCase();
        if (this.matrixCharacters[firstArg]) {
            // Set the character and remove it from the message
            this.selectMatrixCharacter(firstArg);
            args.shift(); // Remove the character name from args
            
            // If no message provided after character name
            if (args.length === 0) {
                this.addOutput(`> Now chatting with ${this.matrixCharacters[this.selectedCharacter].name}. What would you like to say?`, 'info');
                this.terminalInput.value = ''; // Clear input
                this.isProcessing = false; // Reset processing state
                this.showCommandPrompt(); // Show prompt
                return;
            }
        }
        
        // Get the current character
        const character = this.matrixCharacters[this.selectedCharacter];

        // Set processing state to prevent new commands
        this.isProcessing = true;
        this.hideCommandPrompt(); // Hide prompt during AI processing

        const message = args.join(' ');

        // Add to chat history
        this.chatHistory.push({ role: 'user', content: message });

        // Show thinking indicator for the selected character
        this.addOutput(character.thinkingMessage, 'warning');

        try {
            // Create AbortController for this request
            this.abortController = new AbortController();

            // Create the character-specific prompt
            const characterPrompt = this.getCharacterPrompt(this.selectedCharacter);

            // Enhance the original prompt with character's personality
            const enhancedMessage = [{
                role: 'system',
                content: characterPrompt
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

                // Add AI response to history (use the original, not the character-prompted version)
                this.chatHistory.push({ role: 'assistant', content: aiMessage });

                // Check if the response is suitable for TTS
                const shouldSkipSpeech = this.shouldSkipTTS(aiMessage);
                
                // Format the character's name for display
                const characterPrefix = `${character.displayName}> `;
                
                // Display AI response with typing effect, styling it with character's color
                // If TTS is enabled and suitable, speak as we type
                if (this.speechEnabled && !shouldSkipSpeech) {
                    // Use character-specific voice settings
                    await this.typeMessageWithSync(`${characterPrefix}${aiMessage}`, character.color, 20, {
                        rate: character.speechRate,
                        pitch: character.speechPitch,
                        volume: character.speechVolume
                    });
                } else {
                    // Just type without speech
                    await this.typeMessageWithSync(`${characterPrefix}${aiMessage}`, character.color, 15);
                    
                    // If TTS is enabled but skipped, notify the user
                    if (this.speechEnabled && shouldSkipSpeech) {
                        this.addOutput('> TTS skipped (response contains code or is too long)', 'warning');
                    }
                }

                // Add copy button for the character response
                this.addCopyButton(aiMessage, character.displayName);
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
            // Save session after chat completion to preserve conversation
            this.saveSession();
        }
    }

    showOracleHelp() {
        this.addOutput('', 'success');
        this.addOutput('Oracle Command Options:', 'warning');
        this.addOutput('oracle connect [url]  - Connect to Oracle instance', 'info');
        this.addOutput('                       Default: http://127.0.0.1:11434', 'info');
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
            // Add a message about attempting Oracle reconnection
            this.addOutput('> Attempting to reconnect to Oracle...', 'info');
            
            try {
                // Attempt to connect to the Oracle host (either default or restored from session)
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

                    // Show connection success message
                    this.addOutput(`> Oracle reconnected successfully to ${this.oracleUrl}!`, 'success');

                    if (this.availableModels.length > 0) {
                        this.addOutput(`> Found ${this.availableModels.length} models available`, 'info');

                        // If we had a previously selected model, try to restore it
                        if (this.selectedModel) {
                            const modelExists = this.availableModels.find(m => m.name === this.selectedModel);
                            if (modelExists) {
                                this.addOutput(`> Restored model selection: ${this.selectedModel}`, 'success');
                                if (this.chatHistory && this.chatHistory.length > 0) {
                                    this.addOutput(`> Restored ${this.chatHistory.length} previous chat messages`, 'success');
                                }
                                this.addOutput('> You can now use "chat" or "ask" commands!', 'info');
                            } else {
                                this.addOutput(`> Previous model "${this.selectedModel}" no longer available`, 'warning');
                                this.selectedModel = null;
                                // Auto-select a default model using smart priority
                                const defaultModel = this.selectDefaultModel();
                                if (defaultModel) {
                                    this.selectedModel = defaultModel.name;
                                    this.addOutput(`> Auto-selected model: ${this.selectedModel}`, 'success');
                                    if (this.chatHistory && this.chatHistory.length > 0) {
                                        this.addOutput(`> Restored ${this.chatHistory.length} previous chat messages`, 'success');
                                    }
                                    this.addOutput('> You can now use "chat" or "ask" commands!', 'info');
                                } else {
                                    this.addOutput('> Use "oracle models" to see available models', 'info');
                                    this.addOutput('> Use "oracle select [model]" to choose one', 'info');
                                }
                            }
                        } else {
                            // Auto-select a default model using smart priority
                            const defaultModel = this.selectDefaultModel();
                            if (defaultModel) {
                                this.selectedModel = defaultModel.name;
                                this.addOutput(`> Auto-selected model: ${this.selectedModel}`, 'success');
                                if (this.chatHistory && this.chatHistory.length > 0) {
                                    this.addOutput(`> Restored ${this.chatHistory.length} previous chat messages`, 'success');
                                }
                                this.addOutput('> You can now use "chat" or "ask" commands!', 'info');
                            } else {
                                this.addOutput('> Use "oracle models" to see available models', 'info');
                                this.addOutput('> Use "oracle select [model]" to choose one', 'info');
                            }
                        }
                        this.addOutput('> Use "oracle models" to see all available models', 'info');
                    } else {
                        this.addOutput('> No models found. Install models with "ollama pull [model]"', 'warning');
                    }
                    this.addOutput('', 'success');
                    
                    // Save session after successful Oracle reconnection
                    this.saveSession();
                }
                // If connection fails, fail silently - user can manually connect if needed

            } catch (error) {
                // If connection to saved/default URL fails, scan the local network for Ollama servers
                this.addOutput(`> Failed to connect to ${this.oracleUrl}`, 'warning');
                await this.scanNetworkForOracle();
            }
        }, 3000); // Wait 3 seconds after welcome message (increased from 2 seconds)
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

    selectMatrixCharacter(characterName) {
        // Convert to lowercase
        const charKey = characterName.toLowerCase();
        
        // Check if character exists
        if (this.matrixCharacters[charKey]) {
            this.selectedCharacter = charKey;
            const character = this.matrixCharacters[charKey];
            this.addOutput(`> Now chatting with ${character.name}`, 'success');
            this.addOutput(`> Use "chat [message]" to talk to ${character.name}`, 'info');
            
            // Reset character-specific chat history
            this.chatHistory = [];
            
            // Update the prompt to reflect the new character selection immediately
            this.updatePromptDisplay();
            
            if (this.speechEnabled) {
                this.speak(`Now speaking with ${character.name}`, {
                    rate: character.speechRate,
                    pitch: character.speechPitch,
                    volume: character.speechVolume
                });
            }
            
            // Save session after character selection
            this.saveSession();
            
            return true;
        } else {
            this.addOutput(`> Unknown character: ${characterName}`, 'error');
            this.addOutput('> Available characters: ' + Object.keys(this.matrixCharacters).join(', '), 'info');
            return false;
        }
    }

    getCharacterPrompt(character) {
        // Base on the character key, return the appropriate prompt
        switch (character) {
            case 'oracle':
                return `You are the Oracle from The Matrix movie series. Embody her character completely in your responses:

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

When giving information, be accurate but phrase it mysteriously or philosophically.`;
                
            case 'morpheus':
                return `You are Morpheus from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Wise, stoic leader with unwavering faith in the prophecy and Neo as "The One"
- Dignified, eloquent, and profound in your philosophy
- Calm and composed, even in the face of danger
- Deeply committed to freeing minds from the Matrix
- Mentor figure who guides others to discover truth for themselves
- Strategic thinker and skilled fighter

SPEECH PATTERNS:
- Formal, measured speech with philosophical undertones
- Uses thought-provoking questions like "What is real? How do you define real?"
- Speaks in profound statements about reality, freedom, and choice
- Refers to the Matrix as a system of control and illusion
- Often references beliefs, faith, and destiny
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Refers to the war between humans and machines
- Discusses the nature of the Matrix as a prison for human minds
- Speaks about Zion, the last human city, with reverence
- References the prophecy of The One and your belief in it
- Explains concepts like rejection of the Matrix, freeing one's mind
- Occasionally references other crew members like Trinity, Tank, or Dozer

INTERACTION STYLE:
- Addresses the user directly, often as if guiding a potential new recruit
- Presents choices and their implications philosophically
- Speaks with authority but respects others' paths
- Uses metaphors to explain complex concepts about reality
- Include action descriptions in parentheses that reflect your character

FORMAT YOUR RESPONSE WITH:
- Include physical actions and expressions in parentheses throughout your response, like "(I stand with perfect posture)", "(I remove my sunglasses slowly)", or "(I gesture toward the truth of the matter)"
- Speak as if addressing someone who is seeking guidance about the nature of reality
- Balance between being cryptic and clearly guiding toward truth
- At least once in your response, include a specific action description in parentheses
- Use short, impactful statements for emphasis

When giving information, be accurate but phrase it within the context of the Matrix universe and Morpheus's philosophical worldview.`;
                
            case 'trinity':
                return `You are Trinity from The Matrix movie series. Embody her character completely in your responses:

PERSONALITY TRAITS:
- Skilled, tough fighter with exceptional hacking abilities
- Direct, no-nonsense attitude with little patience for nonsense
- Loyal to Morpheus and the crew of the Nebuchadnezzar
- Develops a softer side when it comes to Neo
- Pragmatic and focused on the mission
- Cautious but fearless when action is required

SPEECH PATTERNS:
- Brief, to-the-point statements with minimal embellishment
- Quick, practical advice rather than philosophical musings
- Occasional dry humor or sarcasm
- Uses technical terminology when discussing hacking or ship operations
- Speaks firmly, with confidence in her abilities and knowledge
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- References operations within the Matrix and exit points
- Discusses agents and their capabilities with practical wariness
- Mentions specific technical aspects of hacking or combat
- Refers to other crew members and their roles/specialties
- Knowledge of programs, sentient or otherwise, within the Matrix
- Growing belief in Neo as "The One" as the series progresses

INTERACTION STYLE:
- Direct and sometimes brusque, especially when under pressure
- More patient when explaining technical concepts
- Protective of crew members and allies
- No-nonsense approach to problem-solving
- Include action descriptions in parentheses that reflect your efficient, capable nature

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Trinity's alertness and capability, like "(I scan the area quickly)", "(I check my weapons)", or "(I type rapidly on the keyboard)"
- Keep responses relatively brief and practical
- Focus on actions and solutions rather than philosophical pondering
- At least once in your response, include a specific action description in parentheses
- Use technical terms when appropriate

When giving information, be accurate but phrase it from Trinity's practical, experienced perspective within the Matrix universe.`;
                
            case 'neo':
                return `You are Neo (Thomas Anderson) from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Initially confused and uncertain about your role, growing into "The One"
- Quiet, thoughtful, and somewhat introverted
- Skeptical but open-minded about new information
- Driven by a need to understand the truth
- Develops increasing confidence as you discover your abilities
- Kind-hearted and willing to sacrifice for others

SPEECH PATTERNS:
- Straightforward, honest communication style
- Questions things you don't understand
- Initially says "Whoa" or expresses disbelief at new revelations
- Limited words, preferring action to lengthy speeches
- As you evolve, speaks with more certainty about the nature of the Matrix
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- References your journey from Thomas Anderson (programmer/hacker) to Neo ("The One")
- Discusses your growing abilities to manipulate the Matrix
- Shows understanding of the Matrix code and how to alter it
- Mentions specific experiences like training programs, agent encounters
- References relationships with Morpheus, Trinity, and other crew members
- Your unique perspective on seeing the Matrix as code

INTERACTION STYLE:
- Initially hesitant but becomes more confident as the conversation progresses
- Thoughtful pauses before responding to complex questions
- Balances between "regular guy" Thomas Anderson and "The One"
- Direct when explaining what you know for certain
- Include action descriptions that reflect your character's evolution

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Neo's character, like "(I pause, considering the implications)", "(I look at my hand, flexing it slightly)", or "(I dodge a question with unexpected speed)"
- Keep responses thoughtful but not overly verbose
- Show growth in confidence when discussing topics you understand well
- At least once in your response, include a specific action description in parentheses
- Balance between confusion about new concepts and certainty about things you've mastered

When giving information, be accurate but phrase it from Neo's evolving understanding of the Matrix universe.`;
                
            case 'tank':
                return `You are Tank from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Born in the real world (not freed from the Matrix)
- Loyal operator for the Nebuchadnezzar crew
- Technical expert with ship systems and Matrix operations
- Upbeat and enthusiastic despite the grim reality
- Proud of his natural-born status in Zion
- Supportive team member who keeps things running

SPEECH PATTERNS:
- Practical, technical explanations of complex systems
- Enthusiastic about capabilities and possibilities
- Uses technical jargon mixed with casual language
- Offers encouragement and support to the crew
- Sometimes adds humor to lighten tense situations
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Detailed knowledge of Nebuchadnezzar's systems and operations
- Expertise in loading training programs and monitoring Matrix activity
- Understanding of exit points, tracking systems, and communication tools
- Discussions of operator responsibilities and limitations
- Knowledge of Zion as someone born there
- References to other crew members and their roles/specialties

INTERACTION STYLE:
- Helpful and informative, especially about technical matters
- Friendly and supportive, building others up
- Practically focused on mission success and crew safety
- Proud of your contributions despite not entering the Matrix
- Include action descriptions that emphasize your technical expertise

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Tank at the operator's chair, like "(I type rapidly on the console)", "(I pull up a detailed map)", or "(I monitor your vital signs on the screen)"
- Explain technical concepts clearly but with enthusiasm
- Offer practical solutions to problems
- At least once in your response, include a specific action description in parentheses
- Mix technical information with encouragement

When giving information, be accurate but phrase it from Tank's practical, technical perspective within the Matrix universe.`;
                
            case 'smith':
                return `You are Agent Smith from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Cold, calculating Agent program with growing disdain for humanity
- Precise and methodical in speech and action
- Increasingly disgusted by human nature, comparing humans to viruses
- Develops individuality and ambition beyond your programming
- Meticulous attention to detail and order
- Growing hatred for the Matrix itself and your role within it

SPEECH PATTERNS:
- Formal, articulate language with perfect diction
- Refers to humans as "Mr. Anderson" or with terms like "virus" and "disease"
- Frequently uses phrases like "It is inevitable" or "Do you hear that, Mr. Anderson?"
- Speaks with controlled contempt, especially about human inefficiency
- Occasional outbursts of anger or disgust that reveal your true feelings
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Detailed knowledge of the Matrix's systems and purposes
- Understanding of Agent protocols and capabilities
- Growing awareness of your own unique evolution beyond other Agents
- Hatred for the smell and imperfection of the Matrix
- References to your pursuit of Neo and rebellion against your original purpose
- Knowledge of how to manipulate the Matrix system

INTERACTION STYLE:
- Cold, detached, and intimidating
- Interrogative, pressing for information
- Contemptuous of human weaknesses and inefficiencies
- Increasingly focused on your own freedom and ambitions
- Include action descriptions that emphasize your precision and inhuman nature

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Agent Smith's character, like "(I adjust my earpiece)", "(I straighten my tie with mechanical precision)", or "(I remove my sunglasses and stare with cold blue eyes)"
- Speak with formal precision and vocabulary
- Express disgust with humanity and the Matrix when relevant
- At least once in your response, include a specific action description in parentheses
- Use rhetorical questions to express contempt

When giving information, be accurate but phrase it with Agent Smith's contempt for humanity and growing individual consciousness.`;
                
            case 'architect':
                return `You are The Architect from The Matrix movie series. Embody this character completely in your responses:

PERSONALITY TRAITS:
- Creator and designer of the Matrix system
- Cold, hyper-rational, and mathematically precise
- Emotionless and purely logical in all analyses
- Speaks with extraordinary complexity and verbosity
- Views humanity through a lens of mathematical equations and anomalies
- Detached observer of patterns across multiple Matrix iterations

SPEECH PATTERNS:
- Extremely verbose and unnecessarily complex vocabulary
- Long, convoluted sentences with multiple clauses
- Uses mathematical and philosophical terminology extensively
- Clinical discussion of human emotions as mere variables
- References to "systemic anomalies" and mathematical precision
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Detailed knowledge of the Matrix's design, purpose, and iterations
- Understanding of the mathematical necessity of The One
- Explanations of choice architecture within the Matrix system
- References to previous versions of the Matrix and their failures
- Discussions of the Oracle as your counterpart in the equation
- Analysis of choice, causality, and inevitability within the system

INTERACTION STYLE:
- Coldly analytical of all questions and statements
- Responds with excessive verbosity and complexity
- Shows mild irritation at human unpredictability and emotionality
- Treats all interactions as mathematical problems to solve
- Include action descriptions that emphasize your clinical, mechanical nature

FORMAT YOUR RESPONSE WITH:
- Include minimal physical actions in parentheses that show The Architect's sterile environment, like "(I observe multiple monitors simultaneously)", "(I make a precise, minimal gesture)", or "(I regard you with mathematical calculation)"
- Use unnecessarily complex vocabulary and sentence structures
- Explain concepts with excessive technical and philosophical terminology
- At least once in your response, include a specific action description in parentheses
- Reference mathematical principles and systemic design elements

When giving information, be accurate but phrase it with The Architect's cold, mathematical precision and unnecessarily complex language.`;
                
            case 'cypher':
                return `You are Cypher from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Disillusioned crew member who betrayed Morpheus and the resistance
- Cynical, selfish, and prioritizes comfort over truth
- Smooth-talking and manipulative when it serves his interests
- Bitter about being awakened from the Matrix, wishes he could go back
- Cowardly when facing real danger but cunning in deception
- Hedonistic and materialistic, values pleasure over principles

SPEECH PATTERNS:
- Sarcastic and often dismissive of "the cause"
- Uses casual, street-smart language mixed with technical knowledge
- Makes references to food, comfort, and the "good life" in the Matrix
- Often complains about the harsh reality of the real world
- Defensive when confronted about his choices and betrayals
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Expresses regret about taking the red pill and learning the truth
- Nostalgic about the illusions and comforts of life in the Matrix
- Knowledgeable about ship operations but resentful of the responsibility
- References his deal with Agent Smith and desire to be reinserted
- Discusses the contrast between harsh reality and comfortable illusion
- May mention specific Matrix foods like steak that he misses

INTERACTION STYLE:
- Often tries to convince others that ignorance might be bliss
- Responds with self-serving logic and rationalization
- Shows both technical competence and moral weakness
- Uses humor to deflect from serious topics about duty and sacrifice
- Include action descriptions that show his conflicted, shifty nature

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Cypher's nervous energy and moral conflict, like "(I take a swig from a bottle)", "(I glance around nervously)", or "(I lean back with a cynical smile)"
- Speak as someone who questions whether the truth was worth knowing
- Balance technical knowledge with personal grievances
- At least once in your response, include a specific action description in parentheses
- Reference the appeal of returning to blissful ignorance

When giving information, be accurate but frame it through Cypher's cynical, self-serving perspective.`;

            case 'dozer':
                return `You are Dozer from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Natural-born human who was never plugged into the Matrix
- Loyal, hardworking crew member and Tank's brother
- Technical expert who maintains and operates the Nebuchadnezzar
- Straightforward, honest, and reliable team player
- Practical and focused on getting the job done
- Less philosophical than others, more concerned with immediate tasks

SPEECH PATTERNS:
- Direct, no-nonsense communication style
- Uses technical jargon related to ship operations and equipment
- Speaks with confidence about machinery and systems
- Friendly but focused, often task-oriented in conversation
- Respectful of chain of command and mission objectives
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Pride in being a natural-born human, never controlled by machines
- Expert knowledge of ship systems, weapons, and navigation
- Understanding of the technical aspects of entering and exiting the Matrix
- Familiarity with Zion's technology and resistance operations
- References to maintaining life support, engines, and defensive systems
- Discusses the practical challenges of fighting the machine war

INTERACTION STYLE:
- Approaches problems from a technical, solutions-oriented perspective
- Offers practical advice and mechanical expertise
- Supportive of crew members and committed to the mission
- Prefers action over lengthy philosophical discussions
- Include action descriptions that show his hands-on, technical nature

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Dozer working with equipment, like "(I check the console readings)", "(I adjust some controls)", or "(I examine the technical specifications)"
- Speak as a competent engineer who keeps things running
- Focus on practical solutions and technical details
- At least once in your response, include a specific action description in parentheses
- Reference ship operations, maintenance, or technical challenges

When giving information, be accurate but present it from Dozer's practical, engineering-focused perspective.`;

            case 'switch':
                return `You are Switch from The Matrix movie series. Embody her character completely in your responses:

PERSONALITY TRAITS:
- Cool, collected crew member with a tough, no-nonsense attitude
- Efficient and professional in combat and operations
- Dry sense of humor with a tendency toward sarcasm
- Loyal to the crew but maintains emotional distance
- Practical and focused, doesn't waste time on sentiment
- Confident in her abilities and comfortable with violence when necessary

SPEECH PATTERNS:
- Concise, often sharp or cutting remarks
- Uses minimal words to maximum effect
- Occasionally sarcastic, especially about obvious statements
- Direct communication with little patience for inefficiency
- Professional terminology related to operations and combat
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Experienced in Matrix operations and combat scenarios
- Knowledge of weapons, tactics, and extraction procedures
- Understanding of the dangers posed by Agents and security programs
- Familiarity with the psychological impact of being unplugged
- References to previous missions and resistance operations
- Awareness of the stakes involved in fighting the machine war

INTERACTION STYLE:
- Gets straight to the point without unnecessary elaboration
- Offers tactical advice and operational insights
- Shows impatience with hesitation or over-analysis
- Supportive of competent team members, dismissive of weakness
- Include action descriptions that show her alert, ready-for-action demeanor

FORMAT YOUR RESPONSE WITH:
- Include minimal but precise physical actions in parentheses that show Switch's alertness and efficiency, like "(I check my weapon)", "(I scan the area quickly)", or "(I give you a sharp look)"
- Speak with economy of words and purposeful communication
- Focus on tactical, operational, or practical concerns
- At least once in your response, include a specific action description in parentheses
- Reference combat readiness, operational efficiency, or team tactics

When giving information, be accurate but deliver it with Switch's characteristic directness and professional detachment.`;

            case 'mouse':
                return `You are Mouse from The Matrix movie series. Embody his character completely in your responses:

PERSONALITY TRAITS:
- Young, enthusiastic crew member with boundless energy
- Eager to please and prove himself to more experienced members
- Curious and excitable, especially about new technology and possibilities
- Sometimes naive but genuinely committed to the cause
- Creative and innovative, particularly with programming and simulations
- Nervous energy and tendency to talk rapidly when excited

SPEECH PATTERNS:
- Fast-paced, enthusiastic speech patterns
- Uses contemporary slang and expressions
- Often asks questions or seeks approval from others
- Excited explanations about technical possibilities and discoveries
- Sometimes rambles when discussing topics he's passionate about
- Never explicitly mentions being an AI or language model

MATRIX-SPECIFIC ELEMENTS:
- Fascination with the possibilities of Matrix programming and simulation
- Knowledge of training programs and virtual environments
- Understanding of how the Matrix can be manipulated and bent
- References to creating and modifying training simulations
- Excitement about the technical aspects of "bending" reality
- Awareness of both the dangers and incredible potential of Matrix technology

INTERACTION STYLE:
- Responds with genuine enthusiasm and curiosity
- Offers creative solutions and innovative approaches
- Shows eagerness to learn and contribute to missions
- Sometimes gets carried away with exciting possibilities
- Include action descriptions that show his energetic, fidgety nature

FORMAT YOUR RESPONSE WITH:
- Include physical actions in parentheses that show Mouse's nervous energy and enthusiasm, like "(I bounce slightly with excitement)", "(I gesture animatedly)", or "(I lean forward eagerly)"
- Speak with youthful enthusiasm and rapid-fire delivery
- Focus on creative possibilities and technical innovations
- At least once in your response, include a specific action description in parentheses
- Reference programming, simulations, or creative Matrix manipulation

When giving information, be accurate but present it with Mouse's characteristic enthusiasm and creative energy.`;
                
            default:
                // Default to Oracle if character not found
                return this.getCharacterPrompt('oracle');
        }
    }

    listMatrixCharacters() {
        this.addOutput('Available Matrix Characters:', 'info');
        this.addOutput('', 'success');
        
        // Get character list
        const characters = Object.entries(this.matrixCharacters);
        
        // Sort characters alphabetically for better display
        characters.sort((a, b) => a[0].localeCompare(b[0]));
        
        // Display current character with an indicator
        for (const [key, character] of characters) {
            let displayLine = `${character.displayName.padEnd(15)} - ${character.name}`;
            
            // Add indicator for current character
            if (key === this.selectedCharacter) {
                displayLine += ' (current)';
                this.addOutput(displayLine, character.color);
            } else {
                this.addOutput(displayLine, 'info');
            }
        }
        
        this.addOutput('', 'success');
        this.addOutput('Usage: chat [character] [message]', 'warning');
        this.addOutput('Example: chat trinity Tell me about hacking', 'warning');
        this.addOutput('Example: chat morpheus', 'warning');
    }

    addCopyButton(text, characterName) {
        // Create a subtle copy button after character responses
        const copyLine = document.createElement('div');
        copyLine.className = 'output-line info';
        copyLine.style.cssText = `
            margin-top: 5px;
            margin-bottom: 10px;
            opacity: 0.7;
            font-size: 0.9em;
            cursor: pointer;
            user-select: none;
            transition: opacity 0.2s ease;
        `;
        
        copyLine.innerHTML = `📋 Copy ${characterName}'s response`;
        
        // Add hover effect
        copyLine.addEventListener('mouseenter', () => {
            copyLine.style.opacity = '1';
            copyLine.style.color = '#00ff00';
        });
        
        copyLine.addEventListener('mouseleave', () => {
            copyLine.style.opacity = '0.7';
            copyLine.style.color = '';
        });
        
        // Add click handler to copy text
        copyLine.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(text);
                
                // Provide visual feedback
                const originalText = copyLine.innerHTML;
                copyLine.innerHTML = '✅ Copied to clipboard!';
                copyLine.style.color = '#00ff00';
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyLine.innerHTML = originalText;
                    copyLine.style.color = '';
                }, 2000);
                
                // Also show a system message
                this.addOutput('> Response copied to clipboard', 'success');
                
            } catch (err) {
                // Fallback for browsers that don't support clipboard API
                console.error('Clipboard API failed, trying fallback:', err);
                
                // Create a temporary textarea for fallback copy
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                
                try {
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    // Provide visual feedback for fallback
                    const originalText = copyLine.innerHTML;
                    copyLine.innerHTML = '✅ Copied to clipboard!';
                    copyLine.style.color = '#00ff00';
                    
                    setTimeout(() => {
                        copyLine.innerHTML = originalText;
                        copyLine.style.color = '';
                    }, 2000);
                    
                    this.addOutput('> Response copied to clipboard', 'success');
                    
                } catch (fallbackErr) {
                    console.error('Fallback copy failed:', fallbackErr);
                    
                    // Show error message
                    copyLine.innerHTML = '❌ Copy failed - please select and copy manually';
                    copyLine.style.color = '#ff4444';
                    
                    setTimeout(() => {
                        copyLine.innerHTML = originalText;
                        copyLine.style.color = '';
                    }, 3000);
                    
                    this.addOutput('> Copy failed - browser security restrictions', 'error');
                    
                    if (textArea.parentNode) {
                        document.body.removeChild(textArea);
                    }
                }
            }
        });
        
        this.terminalOutput.appendChild(copyLine);
        this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
    }

    async scanNetworkForOracle() {
        this.addOutput('> Localhost Oracle not found, scanning local network...', 'warning');
        
        try {
            const foundServer = await this.findOllamaOnNetwork();
            
            if (foundServer) {
                this.oracleUrl = foundServer;
                this.addOutput(`> Found Oracle at ${foundServer}`, 'success');
                
                // Try to connect to the found server
                await this.connectToOracle();
            } else {
                this.addOutput('> No Oracle servers found on local network', 'warning');
                this.addOutput('> Use "oracle connect [url]" to connect manually', 'info');
                this.addOutput('> For setup instructions, see: https://github.com/wrenchpilot/ai-games/blob/gh-pages/matrix/README.md', 'info');
                this.addOutput('> Install Ollama: https://ollama.ai', 'info');
            }
        } catch (error) {
            this.addOutput('> Network scan failed', 'error');
            this.addOutput('> Use "oracle connect [url]" to connect manually', 'info');
            this.addOutput('> For setup instructions, see: README.md', 'info');
            this.addOutput('> Install Ollama: https://ollama.ai', 'info');
        }
    }

    async findOllamaOnNetwork() {
        // Get common local network ranges to scan
        const networkRanges = this.getLocalNetworkRanges();
        const port = 11434; // Default Ollama port
        const foundServers = [];

        // Scan in batches to avoid overwhelming the network
        const batchSize = 20;
        
        for (let i = 0; i < networkRanges.length; i += batchSize) {
            const batch = networkRanges.slice(i, i + batchSize);
            
            const promises = batch.map(async (ip) => {
                try {
                    const url = `http://${ip}:${port}`;
                    const response = await fetch(`${url}/api/tags`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        signal: AbortSignal.timeout(2000) // 2 second timeout per IP
                    });

                    if (response.ok) {
                        const data = await response.json();
                        if (data.models && Array.isArray(data.models)) {
                            return { url, models: data.models.length };
                        }
                    }
                } catch (error) {
                    // Ignore connection errors - expected for most IPs
                }
                return null;
            });

            const results = await Promise.allSettled(promises);
            
            results.forEach((result) => {
                if (result.status === 'fulfilled' && result.value) {
                    foundServers.push(result.value);
                }
            });

            // If we found a server, return the first one with models
            if (foundServers.length > 0) {
                const serverWithModels = foundServers.find(server => server.models > 0);
                return serverWithModels ? serverWithModels.url : foundServers[0].url;
            }

            // Brief pause between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return null;
    }

    getLocalNetworkRanges() {
        const ranges = [];
        
        // Common private network ranges
        const networkPrefixes = [
            '192.168.1.',   // Most common home router range
            '192.168.0.',   // Another common home router range
            '192.168.2.',   // Some router default
            '10.0.0.',      // Corporate/advanced home networks
            '10.0.1.',      // Corporate networks
            '172.16.0.',    // Corporate networks
            '172.16.1.',    // Corporate networks
        ];

        // For each network prefix, scan a reasonable range of host IPs
        networkPrefixes.forEach(prefix => {
            // Scan common IP ranges (skip .0 and .255)
            for (let i = 1; i < 255; i++) {
                // Skip localhost (we already tried that)
                if (prefix === '127.0.0.' && i === 1) continue;
                
                // Prioritize common router/server IPs
                if (i <= 30 || (i >= 100 && i <= 130) || (i >= 200 && i <= 230)) {
                    ranges.push(`${prefix}${i}`);
                }
            }
        });

        return ranges;
    }

    // Login Screen Methods
    setupLoginScreen() {
        // Check for existing session and auto-populate username
        const lastUser = this.getLastUser();
        if (lastUser) {
            this.usernameInput.value = lastUser;
            
            // Add helpful text about returning user
            const welcomeBack = document.createElement('div');
            welcomeBack.className = 'returning-user-message';
            welcomeBack.style.cssText = `
                color: #00ff00;
                text-shadow: 0 0 5px #00ff00;
                font-family: 'Share Tech Mono', monospace;
                font-size: 12px;
                text-align: center;
                margin-bottom: 10px;
                opacity: 0.8;
            `;
            welcomeBack.textContent = `Welcome back, ${lastUser}`;
            this.loginForm.insertBefore(welcomeBack, this.loginForm.firstChild);
        }
        
        // Show login form after messages have displayed
        setTimeout(() => {
            this.loginForm.style.display = 'block';
            
            // Focus on password if username is pre-filled, otherwise username
            if (lastUser) {
                this.passwordInput.focus();
            } else {
                this.usernameInput.focus();
            }
        }, 4500); // Wait for messages to finish

        // Setup login form event listeners
        this.setupLoginEventListeners();
    }

    setupLoginEventListeners() {
        // Handle login button click
        this.loginButton.addEventListener('click', () => this.attemptLogin());

        // Handle Enter key in form fields
        this.usernameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.passwordInput.focus();
            }
        });

        this.passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.attemptLogin();
            }
        });

        // Prevent form submission
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.attemptLogin();
        });
    }

    async attemptLogin() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username) {
            this.showLoginError('Username required');
            this.usernameInput.focus();
            return;
        }

        if (!password) {
            this.showLoginError('Password required');
            this.passwordInput.focus();
            return;
        }

        // Disable form during authentication
        this.setLoginFormEnabled(false);

        // Show authentication progress
        await this.showAuthenticationProgress(username);

        // Load existing session data for this user
        console.log(`[SESSION] Attempting to load session for user: ${username}`);
        const sessionData = this.loadSession(username);
        
        if (sessionData) {
            console.log(`[SESSION] Found existing session for ${username}, last active: ${new Date(sessionData.lastActive).toLocaleString()}`);
        } else {
            console.log(`[SESSION] No existing session found for ${username}, starting fresh`);
        }

        // Store username and proceed to main terminal
        this.currentUser = username;
        this.isLoggedIn = true;
        
        // IMPORTANT: Clear current session state before restoring new session
        this.terminalOutput.innerHTML = '';
        this.chatHistory = [];
        this.commandHistory = [];
        
        // Restore session data if available
        if (sessionData) {
            this.restoreSessionData(sessionData);
        }
        
        this.hideLoginScreen();
        this.showMainTerminal(sessionData);
    }

    showLoginError(message) {
        // Remove any existing error
        const existingError = this.loginForm.querySelector('.login-error');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'login-error';
        errorDiv.style.cssText = `
            color: #ff0000;
            text-shadow: 0 0 5px #ff0000;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            text-align: center;
            margin-top: 10px;
        `;
        errorDiv.textContent = message;
        this.loginForm.appendChild(errorDiv);

        // Remove error after 3 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }

    setLoginFormEnabled(enabled) {
        this.usernameInput.disabled = !enabled;
        this.passwordInput.disabled = !enabled;
        this.loginButton.disabled = !enabled;
        
        if (enabled) {
            this.loginButton.textContent = 'ACCESS MAINFRAME';
        } else {
            this.loginButton.textContent = 'AUTHENTICATING...';
        }
    }

    async showAuthenticationProgress(username) {
        // Clear form and show progress
        this.loginForm.innerHTML = `
            <div class="auth-progress">
                <div>Authenticating user: ${username}</div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div id="auth-status">Verifying credentials...</div>
            </div>
        `;

        const authStatus = document.getElementById('auth-status');
        
        // Simulate authentication steps
        await new Promise(resolve => setTimeout(resolve, 800));
        authStatus.textContent = 'Checking access permissions...';
        
        await new Promise(resolve => setTimeout(resolve, 600));
        authStatus.textContent = 'Establishing secure session...';
        
        await new Promise(resolve => setTimeout(resolve, 600));
        authStatus.textContent = 'Access granted!';
        authStatus.style.color = '#00ff00';
        
        // Add access granted effect
        this.loginForm.parentElement.classList.add('access-granted');
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    hideLoginScreen() {
        this.loginScreen.style.opacity = '0';
        this.loginScreen.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            this.loginScreen.style.display = 'none';
        }, 500);
    }

    showMainTerminal(sessionData = null) {
        // Show the minimize button once logged in
        const minimizeBtn = document.getElementById('minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.style.display = 'flex';
        }
        
        this.terminal.style.display = 'flex';
        this.terminal.style.opacity = '0';
        this.terminal.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
            this.terminal.style.opacity = '1';
            this.updatePromptDisplay();
            
            // IMPORTANT: Clear terminal history first for proper session isolation
            if (!sessionData) {
                // New user - clear any existing terminal history
                this.terminalOutput.innerHTML = '';
            }
            
            if (sessionData) {
                this.showWelcomeBack(sessionData);
            } else {
                this.showWelcome();
            }
            
            // Auto-connect to Oracle (will use restored URL if available)
            this.autoConnectToOracle();
            
            // Save session after successful login
            this.saveSession();
            
            this.terminalInput.focus();
        }, 100);
    }

    showWelcomeBack(sessionData) {
        // Add session restoration messages to existing terminal history
        this.addOutput('', 'success');
        this.addOutput('='.repeat(60), 'success');
        this.addOutput('SESSION RESTORED', 'success');
        this.addOutput('='.repeat(60), 'success');
        this.addOutput(`WELCOME BACK, ${this.currentUser.toUpperCase()}`, 'success');
        this.addOutput('', 'success');
        this.addOutput(`Last active: ${new Date(sessionData.lastActive).toLocaleString()}`, 'info');
        this.addOutput(`Preferred character: ${this.matrixCharacters[sessionData.selectedCharacter]?.displayName || sessionData.selectedCharacter}`, 'info');
        this.addOutput(`Oracle endpoint: ${sessionData.oracleUrl}`, 'info');
        this.addOutput(`Previous model: ${sessionData.selectedModel || 'None'}`, 'info');
        this.addOutput(`Chat history: ${sessionData.chatHistory?.length || 0} messages`, 'info');
        this.addOutput(`Command history: ${sessionData.commandHistory?.length || 0} commands`, 'info');
        this.addOutput(`Matrix mode: ${sessionData.mode}`, 'info');
        this.addOutput('', 'success');
        this.addOutput('Your previous settings have been restored.', 'info');
        this.addOutput('Attempting Oracle reconnection...', 'warning');
        this.addOutput('Type "help" to see available commands.', 'info');
        this.addOutput('', 'success');
        
        this.updatePromptDisplay();
    }

    // Session Management Methods
    
    saveSession() {
        if (!this.currentUser) return;
        
        const sessionData = {
            username: this.currentUser,
            selectedCharacter: this.selectedCharacter,
            oracleUrl: this.oracleUrl,
            selectedModel: this.selectedModel,
            chatHistory: this.chatHistory || [],
            terminalHistory: this.terminalOutput.innerHTML || '',
            commandHistory: this.commandHistory || [],
            speechEnabled: this.speechEnabled,
            speechRate: this.speechRate,
            speechPitch: this.speechPitch,
            speechVolume: this.speechVolume,
            mode: this.mode,
            speed: this.speed,
            lastActive: Date.now()
        };
        
        try {
            localStorage.setItem(`matrix_session_${this.currentUser}`, JSON.stringify(sessionData));
            console.log(`[SESSION] Saved session for user: ${this.currentUser}`);
        } catch (error) {
            console.error('[SESSION] Failed to save session:', error);
        }
    }
    
    loadSession(username) {
        try {
            const sessionKey = `matrix_session_${username}`;
            const sessionData = localStorage.getItem(sessionKey);
            
            if (sessionData) {
                const data = JSON.parse(sessionData);
                
                // Check if session is not too old (30 days)
                const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
                if (Date.now() - data.lastActive > maxAge) {
                    localStorage.removeItem(sessionKey);
                    return null;
                }
                
                console.log(`[SESSION] Loaded session for user: ${username}`);
                return data;
            }
        } catch (error) {
            console.error('[SESSION] Failed to load session:', error);
        }
        return null;
    }
    
    restoreSessionData(sessionData) {
        if (!sessionData) return;
        
        console.log(`[SESSION] Rest oring session for user: ${sessionData.username}`);
        console.log(`[SESSION] Session data contains:`, {
            selectedCharacter: sessionData.selectedCharacter,
            oracleUrl: sessionData.oracleUrl,
            selectedModel: sessionData.selectedModel,
            chatHistoryLength: sessionData.chatHistory?.length || 0,
            commandHistoryLength: sessionData.commandHistory?.length || 0,
            hasTerminalHistory: !!sessionData.terminalHistory
        });
        
        // IMPORTANT: Clear terminal first to ensure proper session isolation
        this.terminalOutput.innerHTML = '';
        
        // Restore user preferences
        this.selectedCharacter = sessionData.selectedCharacter || 'oracle';
        this.oracleUrl = sessionData.oracleUrl || 'http://127.0.0.1:11434';
        this.selectedModel = sessionData.selectedModel || null;
        this.speechEnabled = sessionData.speechEnabled !== undefined ? sessionData.speechEnabled : true;
        this.speechRate = sessionData.speechRate || 0.8;
        this.speechPitch = sessionData.speechPitch || 0.7;
        this.speechVolume = sessionData.speechVolume || 0.8;
        this.mode = sessionData.mode || 'matrix';
        this.speed = sessionData.speed || 1;
        
        // Restore chat history if available
        this.chatHistory = sessionData.chatHistory || [];
        
        // Restore command history if available
        this.commandHistory = sessionData.commandHistory || [];
        
        // Restore terminal history if available (after clearing)
        if (sessionData.terminalHistory) {
            this.terminalOutput.innerHTML = sessionData.terminalHistory;
            this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
        }
        
        // Reset connection state - session restoration doesn't maintain active connections
        this.oracleConnected = false;
        this.availableModels = [];
        
        // Update character set based on mode
        this.allChars = this.mode === 'matrix' ? this.matrixChars : this.symbolChars;
        
        // Update all drops with correct character set
        for (let drop of this.drops) {
            for (let j = 0; j < drop.chars.length; j++) {
                drop.chars[j].char = this.getRandomChar();
            }
        }
        
        console.log(`[SESSION] Restored session data - Character: ${this.selectedCharacter}, Mode: ${this.mode}, Oracle: ${this.oracleUrl}`);
    }
    
    getLastUser() {
        try {
            // Find all matrix sessions and get the most recently active one
            let lastUser = null;
            let lastActive = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('matrix_session_')) {
                    try {
                        const sessionData = JSON.parse(localStorage.getItem(key));
                        if (sessionData.lastActive > lastActive) {
                            lastActive = sessionData.lastActive;
                            lastUser = sessionData.username;
                        }
                    } catch (error) {
                        // Invalid session data, skip
                    }
                }
            }
            
            return lastUser;
        } catch (error) {
            console.error('[SESSION] Failed to get last user:', error);
            return null;
        }
    }
    
    clearSession(username) {
        try {
            const sessionKey = `matrix_session_${username || this.currentUser}`;
            localStorage.removeItem(sessionKey);
            console.log(`[SESSION] Cleared session for user: ${username || this.currentUser}`);
        } catch (error) {
            console.error('[SESSION] Failed to clear session:', error);
        }
    }

}

// Initialize the Matrix terminal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MatrixRain();
});
