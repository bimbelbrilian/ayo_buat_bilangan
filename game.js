document.addEventListener('DOMContentLoaded', function() {
    // ==============================================
    // === 1. DEKLARASI VARIABEL GLOBAL & KONSTANTA ===
    // ==============================================

    let player1Score = 0;
    let player2Score = 0;
    let timeLeft = 300; // 5 menit default
    let gameActive = true;
    let timerInterval;
    let selectedTiles = {
        player1: [],
        player2: []
    };
    let currentTarget = 10;
    // WINNING_SCORE_LIMIT 30 = 15 Pasang untuk P1 + 15 Pasang untuk P2
    const WINNING_SCORE_LIMIT = 30; 
    const TILES_PER_PLAYER = 30; 
    let isAnimating = false; 
    let bgmEnabled = true; 
    let sfxEnabled = true;

    // Elemen DOM
    const mainMenu = document.getElementById('main-menu');
    const menuBtn = document.getElementById('menu-btn');
    const targetBtns = document.querySelectorAll('.target-btn');
    const player1Grid = document.getElementById('player1-grid');
    const player2Grid = document.getElementById('player2-grid');
    const player1ScoreElement = document.getElementById('player1-score');
    const player2ScoreElement = document.getElementById('player2-score');
    const timerElement = document.getElementById('timer');
    const targetDisplay = document.getElementById('target-display');
    const winnerPopup = document.getElementById('winner-popup');
    const winnerTitle = document.querySelector('#winner-popup .winner-title');
    const winnerMessage = document.getElementById('winner-message');
    const popupPlayer1Score = document.getElementById('popup-player1-score');
    const popupPlayer2Score = document.getElementById('popup-player2-score');
    const bgmToggle = document.getElementById('bgm-toggle');
    const sfxToggle = document.getElementById('sfx-toggle');

    // Asumsi fungsi utilitas (shuffleArray, checkOrientation, playMatchSound, dll.) diakses secara global.

    // --- FUNGSI BARU: MENENTUKAN NILAI MINIMUM TILE BERDASARKAN TARGET ---
    function getMinTileValue(target) {
        if (target >= 500) return 100;
        if (target >= 200) return 50;
        if (target >= 75) return 15;
        if (target >= 40) return 10;
        if (target >= 30) return 5;
        return 1; 
    }

    // ==============================================
    // === 2. FUNGSI GENERATOR DAN LOGIKA TILE ===
    // ==============================================

    /**
     * Menghasilkan array angka yang sudah di-shuffle untuk satu set 30 ubin (15 pasang).
     * Set ini DIJAMIN memiliki 15 pasang yang lengkap dan menghormati batas minimum leveling.
     */
    function generateBalancedTileSet(target) {
        const uniquePairs = [];
        const minVal = getMinTileValue(target); // Dapatkan batas minimum
        
        // 1. Buat daftar semua pasangan unik yang mungkin (i dan target-i)
        // Dimulai dari minVal, bukan 1
        for (let i = minVal; i <= target; i++) {
            const complement = target - i;
            
            // Validasi: i <= complement (mencegah duplikasi) DAN complement >= minVal
            if (i <= complement && complement >= minVal) { 
                 uniquePairs.push([i, complement]);
            }
            // Optimasi: Hentikan perulangan setelah mencapai titik tengah target
            if (i >= target / 2) {
                break;
            }
        }
        
        if (uniquePairs.length === 0) {
            console.error("Target terlalu kecil atau minVal terlalu besar, tidak ada pasangan yang mungkin.");
            return [];
        }

        const requiredPairs = 15; // 15 pasang untuk SATU pemain (30 kartu)
        const allPairs = [];
        
        // 2. Tentukan berapa kali setiap pasangan unik harus diulang secara seimbang
        const numUnique = uniquePairs.length;
        const baseRepetitions = Math.floor(requiredPairs / numUnique); 
        let remainder = requiredPairs % numUnique; 
        
        // 3. Bangun daftar 15 pasangan (dijamin 15 pasang)
        uniquePairs.forEach(pair => {
            for (let i = 0; i < baseRepetitions; i++) {
                allPairs.push(pair);
            }
            if (remainder > 0) {
                allPairs.push(pair);
                remainder--;
            }
        });
        
        // 4. Ubah daftar 15 pasangan menjadi daftar 30 angka (ubins)
        const finalNumbers = allPairs.flatMap(pair => [pair[0], pair[1]]);
        
        // 5. Acak dan kembalikan array 30 angka tersebut
        if (typeof shuffleArray === 'function') {
            // Asumsi shuffleArray ada di utils.js
            return shuffleArray(finalNumbers); 
        } else {
            return finalNumbers; 
        }
    }

 /**
 * Membuat 30 ubin (kartu) untuk grid pemain tertentu dari array angka yang sudah balance.
 */
function createTiles(player, numbers) {
    const grid = player === 'player1' ? player1Grid : player2Grid;
    grid.innerHTML = '';
    
    numbers.forEach((number) => {
        // Logika Siklus Warna (Formula: (nilai - 1) MODULO 20 + 1)
        const colorIndex = (number - 1) % 20 + 1;

        // --- KODE BARU: HANYA BUAT SATU ELEMEN TILE ---
        const tile = document.createElement('div');
        
        // Terapkan dua kelas untuk spesifisitas tinggi di CSS
        tile.className = `tile card-variant-${colorIndex}`; 
        
        // Data value dan konten angka diletakkan langsung di tile
        tile.dataset.value = number; 
        tile.textContent = number; 
        
        // Tambahkan listener klik
        tile.addEventListener('click', () => handleTileClick(player, tile));
        grid.appendChild(tile);
    });
}

    /**
     * Menangani klik pada ubin.
     */
    function handleTileClick(player, tile) {
        // Cek kelas is-hidden agar kartu yang sudah cocok tidak bisa diklik lagi
        if (!gameActive || isAnimating || tile.classList.contains('is-hidden')) return;

        if (typeof playSelectSound === 'function') playSelectSound();

        // --- KODE LAMA YANG MENGHAPUS PILIHAN PEMAIN LAIN DIHILANGKAN ---
        // Deseleksi ubin yang sudah dipilih pemain lain (INI YANG MENYEBABKAN MASALAH)
        // const otherPlayer = player === 'player1' ? 'player2' : 'player1';
        // if (selectedTiles[otherPlayer].length > 0) {
        //      selectedTiles[otherPlayer].forEach(t => t.classList.remove('selected'));
        //      selectedTiles[otherPlayer] = [];
        // }
        // --------------------------------------------------------------------

        // Toggle selected state
        if (tile.classList.contains('selected')) {
            tile.classList.remove('selected');
            selectedTiles[player] = selectedTiles[player].filter(t => t !== tile);
        } else {
            // Memastikan pemain hanya dapat memilih maksimal 2 ubin miliknya sendiri
            if (selectedTiles[player].length < 2) {
                tile.classList.add('selected');
                selectedTiles[player].push(tile);
            }
        }

        // Cek pasangan jika sudah ada 2 ubin terpilih
        if (selectedTiles[player].length === 2) {
            checkMatch(player);
        }
    }
    
    /**
     * Memeriksa apakah ubin yang dipilih cocok.
     */
    function checkMatch(player) {
        isAnimating = true;
        const [tile1, tile2] = selectedTiles[player];
        const val1 = parseInt(tile1.dataset.value);
        const val2 = parseInt(tile2.dataset.value);

        if (val1 + val2 === currentTarget) {
            // Match
            if (typeof playMatchSound === 'function') playMatchSound(); 
            
            tile1.classList.add('matched');
            tile2.classList.add('matched');
            
            // Perbarui Skor
            if (player === 'player1') {
                player1Score++;
                player1ScoreElement.textContent = player1Score;
            } else {
                player2Score++;
                player2ScoreElement.textContent = player2Score;
            }
            
            // Sembunyikan ubin tanpa menghapus dari DOM
            setTimeout(() => {
                // Tambahkan kelas is-hidden untuk menyembunyikan dan mempertahankan posisi
                tile1.classList.add('is-hidden'); 
                tile2.classList.add('is-hidden'); 

                // Hapus kelas animasi dan selected
                tile1.classList.remove('selected', 'matched');
                tile2.classList.remove('selected', 'matched');
                
                selectedTiles[player] = [];
                isAnimating = false;
                checkGameEnd();
            }, 500);

        } else {
            // Wrong Match
            if (typeof playWrongSound === 'function') playWrongSound(); 
            
            tile1.classList.add('wrong');
            tile2.classList.add('wrong');
            
            setTimeout(() => {
                tile1.classList.remove('selected', 'wrong');
                tile2.classList.remove('selected', 'wrong');
                selectedTiles[player] = [];
                isAnimating = false;
            }, 800);
        }
    }

    // ==============================================
    // === 3. FUNGSI UTAMA GAMEFLOW & TIMER ===
    // ==============================================

    /**
     * Memulai permainan atau level baru.
     */
    function startGame(target) {
        currentTarget = target;
        player1Score = 0;
        player2Score = 0;
        timeLeft = 300; 
        gameActive = true;
        isAnimating = false;
        
        mainMenu.classList.add('hidden');
        document.querySelector('.container').style.display = 'flex'; 
        
        targetDisplay.textContent = currentTarget;
        player1ScoreElement.textContent = player1Score;
        player2ScoreElement.textContent = player2Score;
        
        // 1. Generate dua set angka yang SEIMBANG secara INDEPENDEN
        const p1Numbers = generateBalancedTileSet(currentTarget); // Set 30 angka, 15 pasang P1
        const p2Numbers = generateBalancedTileSet(currentTarget); // Set 30 angka, 15 pasang P2
        
        // 2. Buat Ubin
        createTiles('player1', p1Numbers);
        createTiles('player2', p2Numbers);

        // 3. Mulai Timer
        clearInterval(timerInterval);
        startTimer();
    }
    
    /**
     * Memulai Timer 5 menit (300 detik).
     */
    function startTimer() {
        const updateTimerDisplay = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        };

        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                gameActive = false;
                showWinner('Waktu Habis!');
            }
        }, 1000);
    }

    /**
     * Memeriksa apakah permainan sudah berakhir.
     */
    function checkGameEnd() {
        const PLAYER_WIN_SCORE = TILES_PER_PLAYER / 2; // 30 / 2 = 15
        const totalScore = player1Score + player2Score;

        // KONDISI 1: Pemain 1 mencapai skor maksimum (15 poin)
        if (player1Score >= PLAYER_WIN_SCORE) {
            clearInterval(timerInterval);
            gameActive = false;
            showWinner('Pemain 1 Menang!');
            return;
        }

        // KONDISI 2: Pemain 2 mencapai skor maksimum (15 poin)
        if (player2Score >= PLAYER_WIN_SCORE) {
            clearInterval(timerInterval);
            gameActive = false;
            showWinner('Pemain 2 Menang!');
            return;
        }

        // KONDISI 3: Semua ubin habis (Skor total mencapai 30).
        // Ini hanya akan tercapai jika P1 dan P2 mencapai 15 secara simultan (Seri 15 vs 15),
        // atau sebagai fallback jika kedua kondisi di atas terlewat.
        if (totalScore >= WINNING_SCORE_LIMIT) { // WINNING_SCORE_LIMIT = 30
             clearInterval(timerInterval);
             gameActive = false;
             // Jika sampai sini, pasti Seri 15 vs 15.
             showWinner('Seri!'); 
             return;
        }
    }

    /**
     * Menampilkan pop-up pemenang.
     */
    function showWinner(message) {
        if (typeof createConfetti === 'function') createConfetti();
        if (typeof playWinSound === 'function') playWinSound(); 

        winnerTitle.textContent = message.includes('Menang') ? 'SELAMAT!' : message;
        winnerMessage.textContent = message;
        popupPlayer1Score.textContent = player1Score;
        popupPlayer2Score.textContent = player2Score;
        winnerPopup.classList.add('active'); 
    }
    
    /**
     * Mereset permainan tanpa mengubah target (untuk "Main Lagi").
     */
    function resetGame() {
        winnerPopup.classList.remove('active');
        startGame(currentTarget);
    }
    
    /**
     * Kembali ke menu utama.
     */
    function backToMenu() {
        clearInterval(timerInterval);
        gameActive = false;
        winnerPopup.classList.remove('active');
        mainMenu.classList.remove('hidden');
        document.querySelector('.container').style.display = 'none'; 
    }


    // ==============================================
    // === 4. INISIALISASI DAN EVENT LISTENERS ===
    // ==============================================

    function initGame() {
        // Event Listeners untuk Tombol Target di Menu
        targetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof playMenuSound === 'function') playMenuSound(); 
                const target = parseInt(btn.dataset.target);
                startGame(target);
            });
        });
        
        // Event Listeners untuk Tombol Pop-up Pemenang
        document.getElementById('play-again-btn').addEventListener('click', () => { 
            if (typeof playMenuSound === 'function') playMenuSound(); 
            resetGame(); 
        });
        document.getElementById('back-to-menu-btn').addEventListener('click', () => { 
            if (typeof playMenuSound === 'function') playMenuSound(); 
            backToMenu(); 
        });
        
        // Tombol Dalam Game
        menuBtn.addEventListener('click', () => { 
            if (typeof playMenuSound === 'function') playMenuSound(); 
            backToMenu(); 
        });

        // Kontrol Suara
        if (bgmToggle) bgmToggle.addEventListener('click', function() {
            if (typeof playMenuSound === 'function') playMenuSound();
            if (typeof bgmSound !== 'undefined') {
                bgmEnabled = !bgmEnabled;
                this.innerHTML = bgmEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
                bgmEnabled ? bgmSound.play().catch(e => console.error("BGM Play Error:", e)) : bgmSound.pause();
            }
        });
        
        if (sfxToggle) sfxToggle.addEventListener('click', function() {
            if (typeof playMenuSound === 'function') playMenuSound();
            if (typeof sfxEnabled !== 'undefined') {
                sfxEnabled = !sfxEnabled;
                this.innerHTML = sfxEnabled ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>';
            }
        });
        
        // Inisialisasi BGM (Menggunakan variabel global dari sound.js)
        if (typeof bgmSound !== 'undefined') {
            bgmSound.loop = true;
            bgmSound.volume = 0.3;
             if (bgmEnabled) bgmSound.play().catch(e => console.error("BGM Start Error:", e));
        }

        // Mobile orientation handling (Fungsi dari utils.js)
        if (typeof checkOrientation === 'function') {
            window.addEventListener('resize', checkOrientation);
            window.addEventListener('orientationchange', checkOrientation);
            checkOrientation();
        }
        
        // Tampilkan menu utama di awal
        if(mainMenu) mainMenu.classList.remove('hidden');
        if(document.querySelector('.container')) document.querySelector('.container').style.display = 'none';
    }

    initGame();
});
