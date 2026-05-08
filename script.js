// ========== QUANTUM ESCAPE ROOM - GAME LOGIC ========== 

const gameState = {
    room1Completed: false,
    room2Completed: false,
    room1Attempts: 0,
    room2Attempts: 0,
    startTime: null
};

const ROOM1_REQUIRED_SHOTS = 4;
const ROOM2_REQUIRED_CONFIRMATIONS = 2;
const ROOM2_TOTAL_PAIRS = 3;

let timerInterval = null;
let selectedStation = null;
let isMeasuringRoom1 = false;
let room1Stations = {};
let room1AnswerStation = null;

let selectedBlue = null;
let selectedRed = null;
let room2PairMap = {};
let room2PairStats = {};
let room2ConfirmedPairs = new Map();
let isMeasuringRoom2 = false;

// ========== INITIALIZATION ========== 

document.addEventListener('DOMContentLoaded', () => {
    generateParticles();
    loadGameState();
    initializeCurrentPage();
});

function initializeCurrentPage() {
    const currentPage = window.location.pathname;

    if (currentPage.includes('room1.html')) {
        initializeRoom1();
    } else if (currentPage.includes('room2.html')) {
        checkRoom2Access();
        initializeRoom2();
    } else if (currentPage.includes('final.html')) {
        checkFinalAccess();
    } else {
        // index.html ve quantum-basics.html
    }
}

function generateParticles() {
    const container = document.getElementById('particlesContainer');
    if (!container) return;

    const particleCount = window.innerWidth > 768 ? 60 : 35;
    container.innerHTML = '';

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
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        gameState.room1Completed = Boolean(data.room1Completed);
        gameState.room2Completed = Boolean(data.room2Completed);
    } catch (error) {
        localStorage.removeItem('quantumGameState');
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

function goBasics() {
    window.location.href = 'quantum-basics.html';
}

function goHome() {
    window.location.href = 'index.html';
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

// ========== ROOM 1 - SUPERPOSITION EVIDENCE DOOR ========== 

function initializeRoom1() {
    gameState.room1Attempts = 0;
    setupRoom1HiddenStations();
    setupRoom1Cards();
    setupRoom1Buttons();
    renderRoom1Evidence();
    startTimer();
    updateEnergyBar();
    updateStats();
}

function setupRoom1HiddenStations() {
    const stationNames = ['A', 'B', 'C'];
    const states = shuffleArray(['zero', 'one', 'superposition']);

    room1Stations = {};
    stationNames.forEach((station, index) => {
        room1Stations[station] = {
            type: states[index],
            shots: 0,
            zeros: 0,
            ones: 0,
            history: []
        };
        if (states[index] === 'superposition') {
            room1AnswerStation = station;
        }
    });
}

function setupRoom1Cards() {
    const cards = document.querySelectorAll('.mystery-card');
    cards.forEach(card => {
        card.addEventListener('click', () => selectRoom1Station(card));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectRoom1Station(card);
            }
        });
    });
}

function setupRoom1Buttons() {
    const measureBtn = document.getElementById('measureBtn');
    const submitBtn = document.getElementById('submitRoom1Btn');

    if (measureBtn) measureBtn.addEventListener('click', measureRoom1Station);
    if (submitBtn) submitBtn.addEventListener('click', submitRoom1Guess);
}

function selectRoom1Station(card) {
    if (isMeasuringRoom1) return;

    document.querySelectorAll('.mystery-card').forEach(item => item.classList.remove('selected'));
    card.classList.add('selected');
    selectedStation = card.dataset.station;

    safeText('selectedState', `Kaynak ${selectedStation}`);
    safeText('systemStatus', 'Kaynak seçildi; ölçüm yapılabilir.');
    showHint('Seçtiğin kaynağı birkaç kez ölç. Tek sonuç mu geliyor, yoksa 0 ve 1 birlikte görünüyor mu?', 'room1');
}

function measureRoom1Station() {
    if (isMeasuringRoom1) return;

    if (!selectedStation) {
        showHint('Önce A, B veya C kaynaklarından birini seçmelisin.', 'room1');
        return;
    }

    const station = room1Stations[selectedStation];
    if (!station) return;

    isMeasuringRoom1 = true;
    gameState.room1Attempts++;
    updateStats();

    const selectedCard = document.querySelector(`.mystery-card[data-station="${selectedStation}"]`);
    const measureBtn = document.getElementById('measureBtn');
    const originalCardLabel = selectedStation;

    if (measureBtn) {
        measureBtn.disabled = true;
        const text = measureBtn.querySelector('.btn-action-text');
        if (text) text.textContent = '⚛️ ÖLÇÜM YAPILIYOR...';
    }

    if (selectedCard) {
        selectedCard.classList.add('collapsing');
        const value = selectedCard.querySelector('.card-value');
        if (value) value.textContent = '?';
    }

    showHint('Ölçüm yapılıyor. Kuantum kaynakta sonuç tek bir klasik değere çökecek...', 'room1');

    setTimeout(() => {
        const result = getRoom1MeasurementResult(station.type);
        station.shots++;
        station.history.push(result);
        if (result === 0) station.zeros++;
        if (result === 1) station.ones++;

        if (selectedCard) {
            selectedCard.classList.remove('collapsing');
            selectedCard.classList.add('measured-flash');
            const value = selectedCard.querySelector('.card-value');
            if (value) value.textContent = String(result);
            setTimeout(() => {
                selectedCard.classList.remove('measured-flash');
                if (value) value.textContent = originalCardLabel;
            }, 650);
        }

        safeText('lastMeasurement', `Kaynak ${selectedStation} → ${result}`);
        safeText('systemStatus', `Kaynak ${selectedStation}: ${station.shots}. ölçüm tamamlandı.`);
        renderRoom1Evidence();
        updateStats();

        if (station.zeros > 0 && station.ones > 0) {
            showHint(`Kaynak ${selectedStation} hem 0 hem 1 verdi. Bu güçlü bir süperpozisyon kanıtı olabilir; yeterli ölçümden sonra kilide gönder.`, 'room1');
        } else if (station.shots >= ROOM1_REQUIRED_SHOTS) {
            showHint(`Kaynak ${selectedStation} şu ana kadar hep aynı sonucu verdi. Bu klasik kaynak olabilir; diğer kaynakları da dene.`, 'room1');
        } else {
            showHint(`Sonuç kaydedildi: ${result}. Aynı kaynağı tekrar ölçerek desen aramalısın.`, 'room1');
        }

        if (measureBtn) {
            measureBtn.disabled = false;
            const text = measureBtn.querySelector('.btn-action-text');
            if (text) text.textContent = '🔬 ÖLÇÜM YAP';
        }

        isMeasuringRoom1 = false;
    }, 800);
}

function getRoom1MeasurementResult(type) {
    if (type === 'zero') return 0;
    if (type === 'one') return 1;
    return Math.random() < 0.5 ? 0 : 1;
}

function submitRoom1Guess() {
    if (!selectedStation) {
        showHint('Kilide göndermek için önce bir kaynak seçmelisin.', 'room1');
        return;
    }

    const station = room1Stations[selectedStation];
    if (!station) return;

    const hasBothResults = station.zeros > 0 && station.ones > 0;
    const hasEnoughShots = station.shots >= ROOM1_REQUIRED_SHOTS;

    if (station.type === 'superposition' && hasBothResults && hasEnoughShots) {
        completeRoom1(selectedStation);
        return;
    }

    gameState.room1Attempts++;
    updateStats();

    const selectedCard = document.querySelector(`.mystery-card[data-station="${selectedStation}"]`);
    if (selectedCard) {
        selectedCard.classList.add('wrong-shake');
        setTimeout(() => selectedCard.classList.remove('wrong-shake'), 600);
    }

    if (station.type === 'superposition' && !hasEnoughShots) {
        showHint(`Kaynak ${selectedStation} iyi aday olabilir; ama kapı en az ${ROOM1_REQUIRED_SHOTS} ölçüm kanıtı ister. Biraz daha ölç.`, 'room1');
    } else if (station.type === 'superposition' && !hasBothResults) {
        showHint(`Kaynak ${selectedStation} için henüz hem 0 hem 1 görmedin. Süperpozisyon kanıtı tamamlanmadan kapı açılmaz.`, 'room1');
    } else {
        showHint(`Kaynak ${selectedStation} kilidi açmadı. Ölçüm kayıtlarına bak: süperpozisyon kaynağı zamanla hem 0 hem 1 göstermelidir.`, 'room1');
    }
}

function renderRoom1Evidence() {
    ['A', 'B', 'C'].forEach(stationName => {
        const station = room1Stations[stationName];
        if (!station) return;
        const history = station.history.length ? station.history.join(', ') : '-';
        const status = station.zeros > 0 && station.ones > 0 ? 'aday' : 'belirsiz';
        safeText(`readout-${stationName}`, `${stationName}: ${station.shots} ölçüm · 0:${station.zeros} / 1:${station.ones} · kayıt: ${history} · ${status}`);
    });
}

function calculateRoom1EvidenceScore() {
    const scores = Object.values(room1Stations).map(station => {
        if (!station) return 0;
        const diversity = station.zeros > 0 && station.ones > 0 ? 2 : 0;
        const shotScore = Math.min(2, Math.floor(station.shots / 2));
        return Math.min(ROOM1_REQUIRED_SHOTS, diversity + shotScore);
    });
    return scores.length ? Math.max(...scores) : 0;
}

function completeRoom1(answerStation) {
    gameState.room1Completed = true;
    saveGameState();

    const door = document.getElementById('gameDoor');
    const doorStatus = document.getElementById('doorStatus');
    if (door) door.classList.add('opened');
    if (doorStatus) {
        doorStatus.classList.add('opened');
        doorStatus.textContent = `🔓 KİLİT: AÇILDI (Kaynak ${answerStation})`;
    }

    document.querySelectorAll('.mystery-card').forEach(card => {
        if (card.dataset.station === answerStation) {
            card.classList.add('correct', 'matched');
            const label = card.querySelector('.card-label');
            if (label) label.textContent = 'Süperpozisyon';
        }
    });

    safeText('room1Answer', `Kaynak ${answerStation}`);
    safeText('puzzleStatus', '✓ ÇÖZÜLDÜ');
    safeText('lockStatus', '🔓 AÇILDI');
    safeText('systemStatus', 'Süperpozisyon kaynağı kanıtlandı.');
    updateStats();
    playSuccessEffect();

    setTimeout(() => showModal('room1'), 900);
}

// ========== ROOM 2 - ENTANGLEMENT DISCOVERY ========== 

function checkRoom2Access() {
    if (!gameState.room1Completed) {
        window.location.href = 'room1.html';
    }
}

function initializeRoom2() {
    gameState.room2Attempts = 0;
    setupRoom2HiddenPairs();
    setupRoom2Cards();
    setupRoom2Buttons();
    renderRoom2Evidence();
    startTimer();
    updateEnergyBar();
    updateStats();
}

function setupRoom2HiddenPairs() {
    const blues = ['B1', 'B2', 'B3'];
    const reds = shuffleArray(['R1', 'R2', 'R3']);
    room2PairMap = {};
    room2PairStats = {};
    room2ConfirmedPairs = new Map();

    blues.forEach((blue, index) => {
        room2PairMap[blue] = reds[index];
    });
}

function setupRoom2Cards() {
    const cards = document.querySelectorAll('.entangle-card');
    cards.forEach(card => {
        card.addEventListener('click', () => selectRoom2Card(card));
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectRoom2Card(card);
            }
        });
    });
}

function setupRoom2Buttons() {
    const measureBtn = document.getElementById('measurePairBtn');
    const openBtn = document.getElementById('openCasaBtn');
    if (measureBtn) measureBtn.addEventListener('click', measureEntangledPair);
    if (openBtn) openBtn.addEventListener('click', openCasa);
}

function selectRoom2Card(card) {
    if (isMeasuringRoom2 || card.classList.contains('matched')) return;

    const box = card.dataset.box;
    const id = card.dataset.id;

    if (box === 'blue') {
        document.querySelectorAll('.entangle-card[data-box="blue"]').forEach(item => {
            if (!item.classList.contains('matched')) item.classList.remove('selected');
        });
        selectedBlue = id;
        safeText('match1Status', id);
    } else {
        document.querySelectorAll('.entangle-card[data-box="red"]').forEach(item => {
            if (!item.classList.contains('matched')) item.classList.remove('selected');
        });
        selectedRed = id;
        safeText('match2Status', id);
    }

    card.classList.add('selected');

    if (selectedBlue && selectedRed) {
        showHint(`${selectedBlue} ve ${selectedRed} seçildi. Çifti ölçerek aralarında tutarlı korelasyon var mı test et.`, 'room2');
    } else {
        showHint('Bir mavi ve bir kırmızı kapsül seçmelisin.', 'room2');
    }
}

function measureEntangledPair() {
    if (isMeasuringRoom2) return;

    if (!selectedBlue || !selectedRed) {
        showHint('Ölçüm için bir mavi ve bir kırmızı kapsül seçmelisin.', 'room2');
        return;
    }

    if ([...room2ConfirmedPairs.keys()].includes(selectedBlue) || [...room2ConfirmedPairs.values()].includes(selectedRed)) {
        showHint('Bu kapsüllerden biri zaten doğrulanmış bir çifte ait. Yeni bir çift seç.', 'room2');
        return;
    }

    isMeasuringRoom2 = true;
    gameState.room2Attempts++;
    updateStats();

    const measureBtn = document.getElementById('measurePairBtn');
    if (measureBtn) {
        measureBtn.disabled = true;
        const text = measureBtn.querySelector('.btn-action-text');
        if (text) text.textContent = '⚛️ ÇİFT ÖLÇÜLÜYOR...';
    }

    const blueCard = document.querySelector(`.entangle-card[data-id="${selectedBlue}"]`);
    const redCard = document.querySelector(`.entangle-card[data-id="${selectedRed}"]`);
    if (blueCard) blueCard.classList.add('collapsing');
    if (redCard) redCard.classList.add('collapsing');

    setTimeout(() => {
        const key = `${selectedBlue}|${selectedRed}`;
        const correctPair = room2PairMap[selectedBlue] === selectedRed;
        const blueResult = Math.random() < 0.5 ? 0 : 1;
        const redResult = correctPair ? 1 - blueResult : blueResult;
        const relation = blueResult === redResult ? 'aynı' : 'ters';

        if (!room2PairStats[key]) {
            room2PairStats[key] = { attempts: 0, opposite: 0, same: 0 };
        }
        room2PairStats[key].attempts++;
        if (relation === 'ters') room2PairStats[key].opposite++;
        if (relation === 'aynı') room2PairStats[key].same++;

        flashPairMeasurement(blueCard, redCard, blueResult, redResult);

        safeText('lastPairMeasurement', `${selectedBlue}:${blueResult} · ${selectedRed}:${redResult} (${relation})`);
        safeText('systemStatus', `${selectedBlue}-${selectedRed} ölçümü kaydedildi.`);

        if (correctPair && room2PairStats[key].opposite >= ROOM2_REQUIRED_CONFIRMATIONS) {
            confirmRoom2Pair(selectedBlue, selectedRed);
            showHint(`✓ ${selectedBlue} ve ${selectedRed} iki kez tutarlı korelasyon verdi. Dolanık çift doğrulandı!`, 'room2');
        } else if (correctPair) {
            showHint(`${selectedBlue}-${selectedRed} güçlü aday. Aynı çifti bir kez daha ölçerek korelasyonu doğrula.`, 'room2');
        } else if (room2PairStats[key].attempts >= 2) {
            showHint(`${selectedBlue}-${selectedRed} tutarlı dolanık çift gibi davranmadı. Başka kombinasyon dene.`, 'room2');
        } else {
            showHint(`Sonuç kaydedildi. Tek ölçüm kanıt sayılmaz; aynı çifti tekrar ölç veya başka çift dene.`, 'room2');
        }

        renderRoom2Evidence();
        updateStats();

        if (measureBtn) {
            measureBtn.disabled = false;
            const text = measureBtn.querySelector('.btn-action-text');
            if (text) text.textContent = '🔬 ÇİFTİ ÖLÇ';
        }

        if (blueCard) blueCard.classList.remove('collapsing');
        if (redCard) redCard.classList.remove('collapsing');
        isMeasuringRoom2 = false;
    }, 800);
}

function flashPairMeasurement(blueCard, redCard, blueResult, redResult) {
    const changes = [
        { card: blueCard, value: blueResult },
        { card: redCard, value: redResult }
    ];

    changes.forEach(({ card, value }) => {
        if (!card) return;
        const symbol = card.querySelector('.card-symbol');
        const original = card.dataset.id;
        card.classList.add('measured-flash');
        if (symbol) symbol.textContent = String(value);
        setTimeout(() => {
            if (!card.classList.contains('matched') && symbol) symbol.textContent = original;
            card.classList.remove('measured-flash');
        }, 650);
    });
}

function confirmRoom2Pair(blue, red) {
    if (room2ConfirmedPairs.has(blue)) return;

    room2ConfirmedPairs.set(blue, red);

    const blueCard = document.querySelector(`.entangle-card[data-id="${blue}"]`);
    const redCard = document.querySelector(`.entangle-card[data-id="${red}"]`);
    [blueCard, redCard].forEach(card => {
        if (!card) return;
        card.classList.add('matched', 'correct');
        card.classList.remove('selected');
        const symbol = card.querySelector('.card-symbol');
        const desc = card.querySelector('.card-desc');
        if (symbol) symbol.textContent = `${card.dataset.id}✓`;
        if (desc) desc.textContent = 'Doğrulandı';
    });

    selectedBlue = null;
    selectedRed = null;
    safeText('match1Status', '-');
    safeText('match2Status', '-');
    safeText('matchStatus', `${room2ConfirmedPairs.size}/3 ✓`);
}

function renderRoom2Evidence() {
    const currentKey = selectedBlue && selectedRed ? `${selectedBlue}|${selectedRed}` : null;
    const stat = currentKey ? room2PairStats[currentKey] : null;

    if (stat) {
        safeText('pairReadout', `${currentKey}: ${stat.attempts} ölçüm · ters:${stat.opposite} / aynı:${stat.same}`);
    } else if (currentKey) {
        safeText('pairReadout', `${currentKey}: henüz ölçülmedi.`);
    } else {
        safeText('pairReadout', 'Bir mavi ve bir kırmızı kapsül seç.');
    }

    const confirmed = [...room2ConfirmedPairs.entries()].map(([blue, red]) => `${blue}↔${red}`).join(', ');
    safeText('confirmedPairs', `Doğrulanan çiftler: ${confirmed || '-'}`);
}

function openCasa() {
    if (room2ConfirmedPairs.size === ROOM2_TOTAL_PAIRS) {
        completeRoom2();
    } else {
        showHint(`Kasa açılmadı. Önce 3 dolanık çifti kanıtla. Şu an: ${room2ConfirmedPairs.size}/3`, 'room2');
    }
}

function completeRoom2() {
    gameState.room2Completed = true;
    saveGameState();

    const vaultDoor = document.getElementById('vaultDoor');
    const vaultShell = document.getElementById('vaultShell');
    const vaultLock = vaultDoor ? vaultDoor.querySelector('.vault-lock') : null;
    const vaultStatus = document.getElementById('vaultStatus');

    if (vaultDoor) vaultDoor.classList.add('opened');
    if (vaultShell) vaultShell.classList.add('opened');
    if (vaultLock) vaultLock.classList.add('opened');
    if (vaultStatus) {
        vaultStatus.classList.add('opened');
        vaultStatus.textContent = '🔓 KASA: AÇILDI';
    }

    safeText('lockStatus', '🔓 AÇILDI');
    safeText('systemStatus', 'Tüm dolanık çiftler doğrulandı.');
    playSuccessEffect();
    updateStats();

    setTimeout(() => showModal('room2'), 1000);
}

// ========== FINAL PAGE ACCESS CHECK ========== 

function checkFinalAccess() {
    if (!gameState.room1Completed || !gameState.room2Completed) {
        window.location.href = 'room1.html';
    }
}

// ========== MODAL MANAGEMENT ========== 

function showModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.remove('show');
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
});

// ========== UI UPDATES ========== 

function updateEnergyBar() {
    const energyFill = document.getElementById('energyFill');
    const energyValue = document.getElementById('energyValue');
    if (!energyFill || !energyValue) return;

    let energy = 0;
    const interval = setInterval(() => {
        energy += Math.random() * 12;
        if (energy > 100) energy = 100;
        energyFill.style.width = energy + '%';
        energyValue.textContent = Math.floor(energy) + '%';
        if (energy >= 100) clearInterval(interval);
    }, 220);
}

function updateStats() {
    const currentPage = window.location.pathname;
    const attemptValue = document.getElementById('attemptValue');
    const evidenceValue = document.getElementById('successRate');

    if (currentPage.includes('room1.html')) {
        if (attemptValue) attemptValue.textContent = String(gameState.room1Attempts);
        if (evidenceValue) evidenceValue.textContent = `${calculateRoom1EvidenceScore()}/${ROOM1_REQUIRED_SHOTS}`;
    } else if (currentPage.includes('room2.html')) {
        if (attemptValue) attemptValue.textContent = String(gameState.room2Attempts);
        if (evidenceValue) evidenceValue.textContent = `${room2ConfirmedPairs.size}/${ROOM2_TOTAL_PAIRS} çift`;
    }
}

function startTimer() {
    gameState.startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeValue = document.getElementById('timeValue');
        if (timeValue) {
            timeValue.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }, 1000);
}

// ========== AUDIO/VISUAL EFFECTS ========== 

function playSuccessEffect() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 820;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.28, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // Ses desteklenmiyorsa oyun sessiz devam eder.
    }
}

// ========== HELPERS ========== 

function safeText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

function showHint(message) {
    safeText('hintText', message);
}

function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

let particleResizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(particleResizeTimeout);
    particleResizeTimeout = setTimeout(() => {
        // Mobil performans için parçacıklar sabit bırakıldı.
    }, 250);
});