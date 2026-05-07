// ========== QUANTUM ESCAPE ROOM - GAME LOGIC ========== 

// Global Game State
const gameState = {
    room1Completed: false,
    room2Completed: false,
    room1Attempts: 0,
    room2Attempts: 0,
    startTime: null,
    room1Matches: {
        blue0: null,
        blue1: null
    }
};

// ========== INITIALIZATION ========== 

document.addEventListener('DOMContentLoaded', () => {
    generateParticles();
    loadGameState();
    initializeCurrentPage();
});

// Generate Floating Particles
function generateParticles() {
    const container = document.getElementById('particlesContainer');
    if (!container) return;

    const particleCount = window.innerWidth > 768 ? 60 : 35;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 30 + 's';
        particle.style.animationDuration = (20 + Math.random() * 30) + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        
        container.appendChild(particle);
    }
}

// ========== STORAGE FUNCTIONS ========== 

function loadGameState() {
    const saved = localStorage.getItem('quantumGameState');
    if (saved) {
        const data = JSON.parse(saved);
        gameState.room1Completed = data.room1Completed || false;
        gameState.room2Completed = data.room2Completed || false;
    }
}

function saveGameState() {
    localStorage.setItem('quantumGameState', JSON.stringify({
        room1Completed: gameState.room1Completed,
        room2Completed: gameState.room2Completed
    }));
}

function resetGameState() {
    gameState.room1Completed = false;
    gameState.room2Completed = false;
    gameState.room1Attempts = 0;
    gameState.room2Attempts = 0;
    localStorage.removeItem('quantumGameState');
}

// ========== PAGE NAVIGATION ========== 

function startGame() {
    window.location.href = 'room1.html';
}

function goHome() {
    if (confirm('Ana sayfaya dönmek istediğine emin misin?')) {
        window.location.href = 'index.html';
    }
}

function goToRoom2() {
    closeModal();
    setTimeout(() => {
        window.location.href = 'room2.html';
    }, 300);
}

function goToFinal() {
    closeModal();
    setTimeout(() => {
        window.location.href = 'final.html';
    }, 300);
}

function restartGame() {
    resetGameState();
    window.location.href = 'index.html';
}

// ========== ROOM 1 - SUPERPOSITION DOOR ========== 

let selectedCard = null;

function initializeCurrentPage() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('room1.html')) {
        initializeRoom1();
    } else if (currentPage.includes('room2.html')) {
        checkRoom2Access();
        initializeRoom2();
    } else if (currentPage.includes('final.html')) {
        checkFinalAccess();
    }
}

function initializeRoom1() {
    setupRoom1Cards();
    setupRoom1Measurement();
    startTimer();
    updateEnergyBar();
}

function setupRoom1Cards() {
    const cards = document.querySelectorAll('.quantum-card');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Önceki seçimi kaldır
            cards.forEach(c => c.classList.remove('selected'));
            // Yeni seçimi ekle
            card.classList.add('selected');
            selectedCard = card;
            
            // Status update
            const stateValue = card.dataset.state;
            document.getElementById('selectedState').textContent = stateValue;
            document.getElementById('systemStatus').textContent = 'Seçildi: ' + stateValue;
            
            // Hint güncelle
            document.getElementById('hintText').textContent = 'Seçim yapıldı. Ölçüm yapmaya hazır!';
        });
    });
}

function setupRoom1Measurement() {
    const measureBtn = document.getElementById('measureBtn');
    
    measureBtn.addEventListener('click', () => {
        if (!selectedCard) {
            showHint('Lütfen bir kuantum durumu seç!', 'room1');
            return;
        }
        
        gameState.room1Attempts++;
        updateStats();
        
        const selectedState = selectedCard.dataset.state;
        
        if (selectedState === 'psi') {
            // Correct answer!
            completeRoom1();
        } else {
            // Wrong answer
            showHint('Yanlış seçim! İpucu: Klasik durumlar değil, süperpozisyon durumunu seç.', 'room1');
            const cards = document.querySelectorAll('.quantum-card');
            cards.forEach(c => c.classList.remove('selected'));
            selectedCard = null;
        }
    });
}

function completeRoom1() {
    gameState.room1Completed = true;
    saveGameState();
    
    // Door opening animation
    const door = document.getElementById('gameDoor');
    const doorStatus = document.getElementById('doorStatus');
    
    door.classList.add('opened');
    doorStatus.classList.add('opened');
    doorStatus.textContent = '🔓 KİLİT: AÇILDI';
    
    // Play success sound effect (optional)
    playSuccessEffect();
    
    // Show success modal after delay
    setTimeout(() => {
        showModal('room1');
    }, 1000);
    
    document.getElementById('puzzleStatus').textContent = '✓ ÇÖZÜLDÜ';
    document.getElementById('lockStatus').textContent = '🔓 AÇILDI';
}

function showHint(message, room) {
    const hintElement = document.getElementById('hintText');
    if (hintElement) {
        hintElement.textContent = message;
    }
}

// ========== ROOM 2 - ENTANGLEMENT ========== 

let room2SelectedBlue = null;
let room2MatchCount = 0;

function checkRoom2Access() {
    if (!gameState.room1Completed) {
        // Redirect to room1
        window.location.href = 'room1.html';
    }
}

function initializeRoom2() {
    setupEntanglementCards();
    setupOpenCasaButton();
    startTimer();
    updateEnergyBar();
}

function setupEntanglementCards() {
    const blueCards = document.querySelectorAll('[data-box="blue"]');
    const redCards = document.querySelectorAll('[data-box="red"]');
    
    blueCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('matched')) return;
            
            // Deselect other blue cards
            blueCards.forEach(c => {
                if (!c.classList.contains('matched')) {
                    c.classList.remove('selected');
                }
            });
            
            card.classList.add('selected');
            room2SelectedBlue = card;
            
            document.getElementById('match1Status').textContent = card.dataset.index === '0' ? '↑' : '0';
        });
    });
    
    redCards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('matched')) return;
            
            if (!room2SelectedBlue) {
                showHint('Önce mavi kutudan bir kart seç!', 'room2');
                return;
            }
            
            const blueIndex = room2SelectedBlue.dataset.index;
            const redIndex = card.dataset.index;
            
            // Check if match is correct
            // Correct pairs: blue0 (↑) with red0 (↓), blue1 (0) with red1 (1)
            const isCorrectMatch = (blueIndex === '0' && redIndex === '0') || 
                                  (blueIndex === '1' && redIndex === '1');
            
            if (isCorrectMatch) {
                // Correct match!
                room2SelectedBlue.classList.add('matched');
                room2SelectedBlue.classList.add('correct');
                room2SelectedBlue.classList.remove('selected');
                
                card.classList.add('matched');
                card.classList.add('correct');
                
                room2MatchCount++;
                
                document.getElementById('matchStatus').textContent = `${room2MatchCount}/2 ✓`;
                showHint('✓ Doğru eşleşme! Dolanıklık bulundu!', 'room2');
                
                room2SelectedBlue = null;
                
                // Check if all matches are done
                if (room2MatchCount === 2) {
                    setTimeout(() => completeRoom2(), 500);
                }
            } else {
                // Wrong match
                showHint('Yanlış eşleşme! Dolanık parçacıklar birbirinin zıttı durumlarda bulunur.', 'room2');
            }
            
            gameState.room2Attempts++;
            updateStats();
        });
    });
}

function setupOpenCasaButton() {
    const openBtn = document.getElementById('openCasaBtn');
    
    openBtn.addEventListener('click', () => {
        if (room2MatchCount === 2) {
            completeRoom2();
        } else {
            showHint('Tüm eşleşmeleri tamamla! (' + room2MatchCount + '/2)', 'room2');
        }
    });
}

function completeRoom2() {
    gameState.room2Completed = true;
    saveGameState();
    
    // Vault opening animation
    const vaultDoor = document.getElementById('vaultDoor');
    const vaultLock = vaultDoor.querySelector('.vault-lock');
    const vaultStatus = document.getElementById('vaultStatus');
    
    vaultLock.classList.add('opened');
    vaultStatus.classList.add('opened');
    vaultStatus.textContent = '🔓 KASA: AÇILDI';
    
    playSuccessEffect();
    
    setTimeout(() => {
        showModal('room2');
    }, 1000);
    
    document.getElementById('puzzleStatus').textContent = '✓ ÇÖZÜLDÜ';
    document.getElementById('lockStatus').textContent = '🔓 AÇILDI';
}

// ========== FINAL PAGE ACCESS CHECK ========== 

function checkFinalAccess() {
    if (!gameState.room1Completed || !gameState.room2Completed) {
        window.location.href = 'room1.html';
    }
}

// ========== MODAL MANAGEMENT ========== 

function showModal(room) {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close modal on outside click or escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ========== UI UPDATES ========== 

function updateEnergyBar() {
    const energyFill = document.getElementById('energyFill');
    const energyValue = document.getElementById('energyValue');
    
    if (!energyFill || !energyValue) return;
    
    let energy = 0;
    const interval = setInterval(() => {
        energy += Math.random() * 15;
        if (energy > 100) energy = 100;
        
        energyFill.style.width = energy + '%';
        energyValue.textContent = Math.floor(energy) + '%';
        
        if (energy >= 100) clearInterval(interval);
    }, 200);
}

function updateStats() {
    const attemptValue = document.getElementById('attemptValue');
    if (attemptValue) {
        const currentPage = window.location.pathname;
        if (currentPage.includes('room1.html')) {
            attemptValue.textContent = gameState.room1Attempts;
        } else if (currentPage.includes('room2.html')) {
            attemptValue.textContent = gameState.room2Attempts;
        }
    }
    
    updateSuccessRate();
}

function updateSuccessRate() {
    const successRate = document.getElementById('successRate');
    if (successRate) {
        const currentPage = window.location.pathname;
        let attempts = 0;
        
        if (currentPage.includes('room1.html')) {
            attempts = gameState.room1Attempts;
            const rate = attempts > 0 ? Math.max(0, Math.floor((1 / attempts) * 100)) : 0;
            successRate.textContent = rate + '%';
        } else if (currentPage.includes('room2.html')) {
            attempts = gameState.room2Attempts;
            const rate = attempts > 0 ? Math.max(0, Math.floor((1 / attempts) * 100)) : 0;
            successRate.textContent = rate + '%';
        }
    }
}

// ========== TIMER ========== 

let timerInterval;

function startTimer() {
    gameState.startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeValue = document.getElementById('timeValue');
        if (timeValue) {
            timeValue.textContent = 
                (minutes < 10 ? '0' : '') + minutes + ':' +
                (seconds < 10 ? '0' : '') + seconds;
        }
    }, 1000);
}

// ========== AUDIO/VISUAL EFFECTS ========== 

function playSuccessEffect() {
    // Visual flash
    const container = document.body;
    container.style.animation = 'none';
    setTimeout(() => {
        container.style.animation = '';
    }, 10);
    
    // Sound (optional - using Web Audio API or simply visual)
    try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // Audio not supported or blocked
    }
}

// ========== RESPONSIVE PARTICLES ========== 

let particleResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(particleResizeTimeout);
    particleResizeTimeout = setTimeout(() => {
        const container = document.getElementById('particlesContainer');
        if (container && window.innerWidth < 768) {
            // Optional: regenerate particles for mobile optimization
        }
    }, 250);
});

// ========== EVENT LISTENERS FOR MODALS ========== 

window.addEventListener('load', () => {
    // Setup modal close buttons if they exist
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
});
