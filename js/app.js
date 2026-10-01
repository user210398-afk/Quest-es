/* ==========================================================================
   MOTOR MEDHUB SIMULADOS (SimEngine v2.0)
   ========================================================================== */
let globalBank = [];
let currentQuestions = [];
let userAnswers = [];
let score = 0;
let streak = 0;
let isFocusMode = false;

// 1. CARREGAMENTO DINÂMICO VIA URL
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const provaId = urlParams.get('prova') || 'farmaco-p2-simulado-2025-novo'; // Fallback
    
    try {
        const response = await fetch(`provas/${provaId}.json`);
        const data = await response.json();
        
        document.getElementById('hub-dynamic-title').innerText = data.titulo;
        document.getElementById('hub-dynamic-subtitle').innerText = `Matéria: ${data.materia} | ${data.questoes.length} Questões`;
        
        globalBank = data.questoes;
        document.getElementById('btn-start-sim').disabled = false;
    } catch (e) {
        document.getElementById('hub-dynamic-title').innerText = "Erro ao carregar banco de dados.";
    }
    
    initFloatingMenu();
};

// 2. INÍCIO E GERAÇÃO DE SIMULADO ALEATÓRIO
function startModule() {
    const isRandom = document.getElementById('chk-shuffle-q').checked;
    const numQ = parseInt(document.getElementById('num-random-q').value);
    
    let baseQs = [...globalBank];
    
    if (isRandom) baseQs.sort(() => Math.random() - 0.5);
    if (numQ && numQ > 0) baseQs = baseQs.slice(0, numQ);
    
    currentQuestions = baseQs;
    userAnswers = new Array(currentQuestions.length).fill(null);
    score = 0; streak = 0;
    
    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('game-hud').style.display = 'flex';
    
    loadQuestion(0);
}

// 3. TIPOS DE QUESTÕES HÍBRIDAS E MÍDIA
function loadQuestion(idx) {
    const q = currentQuestions[idx];
    document.getElementById('q-statement').innerHTML = q.statement;
    
    // Suporte a Mídia (Raio-X, ECG)
    const mediaBox = document.getElementById('q-media-box');
    mediaBox.innerHTML = '';
    if (q.media) {
        mediaBox.innerHTML = `<img src="${q.media.url}" onclick="openLightbox('${q.media.url}')" style="cursor:zoom-in; max-width:100%; border-radius:10px; margin-bottom:15px;" alt="${q.media.caption}">`;
    }

    const optsContainer = document.getElementById('options-group');
    optsContainer.innerHTML = '';
    
    // Suporte a Verdadeiro/Falso ou Múltipla Escolha
    q.options.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = optText;
        
        // Acessibilidade no teclado
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        
        btn.onclick = () => {
            document.querySelectorAll('.opt-btn').forEach(b => {
                b.classList.remove('selected-choice');
                b.setAttribute('aria-checked', 'false');
            });
            btn.classList.add('selected-choice');
            btn.setAttribute('aria-checked', 'true');
            // Logic to enable confirm button...
        };
        optsContainer.appendChild(btn);
    });
}

// 4. MICROINTERAÇÕES E ÁUDIO
function playSound(type) {
    // Efeitos sonoros sutis usando Web Audio API (Opcional, respeita SO)
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'error') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start(); oscillator.stop(audioCtx.currentTime + 0.2);
    }
}

function confirmAnswer() {
    const isCorrect = true; // Logica de verificação omitida para brevidade
    
    if (isCorrect) {
        playSound('correct');
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
    } else {
        playSound('error');
        document.getElementById('bento-q-card').classList.add('shake-animated');
        setTimeout(() => document.getElementById('bento-q-card').classList.remove('shake-animated'), 400);
    }
}

// 5. TEXT-TO-SPEECH (Leitor de Tela Nativo)
function readQuestionTTS() {
    if ('speechSynthesis' in window) {
        const text = document.getElementById('q-statement').innerText;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1; // Velocidade levemente mais rápida para dinamismo
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Seu navegador não suporta leitura de tela.");
    }
}

// 6. MODO FOCO (Pausa cronômetro e embaça texto)
function toggleFocusMode() {
    isFocusMode = !isFocusMode;
    document.body.classList.toggle('focus-mode-active', isFocusMode);
    document.getElementById('btn-focus').innerHTML = isFocusMode ? '<i class="ph-bold ph-play"></i> Retomar' : '<i class="ph-bold ph-pause"></i> Modo Foco';
    
    if (isFocusMode) {
        // stopTimer()
    } else {
        // startTimer()
    }
}

// 7. LIGHTBOX MODAL DE IMAGEM
function openLightbox(url) {
    document.getElementById('lightbox-img').src = url;
    document.getElementById('lightbox-modal').style.display = 'flex';
}
function closeLightbox() {
    document.getElementById('lightbox-modal').style.display = 'none';
}

// 8. MENU FLUTUANTE DE GRIFO (Kindle Style)
function initFloatingMenu() {
    const menu = document.getElementById('floating-highlighter-menu');
    
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (selection.toString().trim().length > 0 && document.getElementById('bento-q-card').contains(selection.anchorNode)) {
            const rect = selection.getRangeAt(0).getBoundingClientRect();
            menu.style.display = 'flex';
            menu.style.top = `${rect.top + window.scrollY - 45}px`;
            menu.style.left = `${rect.left + (rect.width / 2) - (menu.offsetWidth / 2)}px`;
        } else {
            menu.style.display = 'none';
        }
    });
}

function applyHighlight(color) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = `hl-word ${color}`;
    range.surroundContents(span);
    selection.removeAllRanges();
}

// 9. THROTTLE DO EFEITO GLOW (Performance)
let isGlowThrottled = false;
document.addEventListener("mousemove", (e) => {
    if (isGlowThrottled || window.innerWidth < 768) return; // Desativa no mobile
    isGlowThrottled = true;
    requestAnimationFrame(() => {
        document.querySelectorAll(".bento-card").forEach((card) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
            card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        });
        isGlowThrottled = false;
    });
});
