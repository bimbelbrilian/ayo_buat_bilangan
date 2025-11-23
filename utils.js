// Utility functions

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createConfetti() {
    const colors = ['#FFB6C1', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD', '#FFA07A', '#F0E68C', '#E0FFFF'];
    for (let i = 0; i < 20; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 6 + 3 + 'px';
        confetti.style.height = Math.random() * 6 + 3 + 'px';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

function checkOrientation() {
    const orientationWarning = document.getElementById('orientation-warning');
    const container = document.querySelector('.container');
    const mainMenu = document.getElementById('main-menu');
    const winnerPopup = document.getElementById('winner-popup');

    if (window.innerHeight > window.innerWidth) {
        // Portrait mode
        if (window.innerWidth < 768) {
            orientationWarning.style.display = 'flex';
            container.style.display = 'none';
            mainMenu.style.display = 'none';
            winnerPopup.style.display = 'none';
        }
    } else {
        // Landscape mode
        orientationWarning.style.display = 'none';
        container.style.display = 'flex';
        if (!mainMenu.classList.contains('hidden')) {
            mainMenu.style.display = 'flex';
        }
        if (winnerPopup.classList.contains('active')) {
            winnerPopup.style.display = 'flex';
        } else if (mainMenu.classList.contains('hidden')) {
             // Ensure game content is shown if menu is hidden and not winner popup
             container.style.display = 'flex';
        }
    }
}