// Audio elements
const selectSound = new Audio('sound_memilih_angka.mp3');
const matchSound = new Audio('sound_jawaban_benar.mp3');
const wrongSound = new Audio('sound_jawaban_salah.mp3');
const winSound = new Audio('sound_pemenang.mp3');
const bgmSound = new Audio('sound_menu_utama.mp3');
const menuSound = new Audio('sound_memilih_menu.mp3');

// Game state variables related to sound
let bgmEnabled = true;
let sfxEnabled = true;

// Sound Control Functions
function playSelectSound() {
    if (sfxEnabled) {
        selectSound.currentTime = 0;
        selectSound.play().catch(e => console.log("Audio error (select):", e));
    }
}

function playMatchSound() {
    if (sfxEnabled) {
        matchSound.currentTime = 0;
        matchSound.play().catch(e => console.log("Audio error (match):", e));
    }
}

function playWrongSound() {
    if (sfxEnabled) {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => console.log("Audio error (wrong):", e));
    }
}

function playWinSound() {
    if (sfxEnabled) {
        winSound.currentTime = 0;
        winSound.play().catch(e => console.log("Audio error (win):", e));
    }
}

function playMenuSound() {
    if (sfxEnabled) {
        menuSound.currentTime = 0;
        menuSound.play().catch(e => console.log("Audio error (menu):", e));
    }
}

function initAudio() {
    bgmSound.loop = true;
    bgmSound.volume = 0.3;
    if (bgmEnabled) {
        // Attempt to play BGM, it might fail due to browser auto-play policy
        bgmSound.play().catch(console.log); 
    }
}