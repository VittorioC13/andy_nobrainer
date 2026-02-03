// Data
const data = {
    drinks: ['鲜芋仙', '快乐柠檬', '珍煮丹', '满记甜品', 'kissaten'],
    food: ['miss rice', 'jollibee', 'kfc', 'monga fried chicken', '花间一串', '泰酷辣', '烧味双拼', '麻辣香锅']
};

// State
let currentCategory = '';
let currentItems = [];
let currentIndex = 0;
let likedItems = [];
let tournamentRound = [];
let currentRoundIndex = 0;

// Elements
const screens = {
    home: document.getElementById('home-screen'),
    swipe: document.getElementById('swipe-screen'),
    tournament: document.getElementById('tournament-screen'),
    winner: document.getElementById('winner-screen')
};

const card = document.querySelector('.card');
const cardTitle = document.querySelector('.card-title');
const progressFill = document.querySelector('.progress-fill');
const progressText = document.querySelector('.progress-text');
const swipeButtons = document.querySelectorAll('.swipe-btn');
const roundContainer = document.getElementById('round-container');
const nextRoundBtn = document.getElementById('next-round-btn');
const winnerName = document.querySelector('.winner-name');
const restartBtn = document.getElementById('restart-btn');

// Initialize
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentCategory = e.currentTarget.dataset.category;
        startSwipePhase();
    });
});

swipeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const isLike = e.currentTarget.classList.contains('like');
        handleSwipe(isLike);
    });
});

nextRoundBtn.addEventListener('click', nextTournamentRound);
restartBtn.addEventListener('click', restart);

// Swipe Phase
function startSwipePhase() {
    currentItems = [...data[currentCategory]];
    currentIndex = 0;
    likedItems = [];

    showScreen('swipe');
    updateCard();
    updateProgress();
}

function updateCard() {
    if (currentIndex >= currentItems.length) {
        startTournament();
        return;
    }

    cardTitle.textContent = currentItems[currentIndex];
    card.className = 'card';
}

function updateProgress() {
    const progress = (currentIndex / currentItems.length) * 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = `${currentIndex}/${currentItems.length}`;
}

function handleSwipe(isLike) {
    if (currentIndex >= currentItems.length) return;

    const currentItem = currentItems[currentIndex];

    if (isLike) {
        likedItems.push(currentItem);
        card.classList.add('swipe-right');
    } else {
        card.classList.add('swipe-left');
    }

    setTimeout(() => {
        currentIndex++;
        updateProgress();
        updateCard();
    }, 500);
}

// Touch/Mouse Swipe Support
let startX = 0;
let currentX = 0;
let isDragging = false;

card.addEventListener('mousedown', startDrag);
card.addEventListener('touchstart', startDrag);
card.addEventListener('mousemove', drag);
card.addEventListener('touchmove', drag);
card.addEventListener('mouseup', endDrag);
card.addEventListener('touchend', endDrag);
card.addEventListener('mouseleave', endDrag);

function startDrag(e) {
    if (currentIndex >= currentItems.length) return;

    isDragging = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    card.classList.add('dragging');
}

function drag(e) {
    if (!isDragging) return;

    currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const diff = currentX - startX;
    const rotation = diff / 20;

    card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
}

function endDrag(e) {
    if (!isDragging) return;

    isDragging = false;
    card.classList.remove('dragging');

    const diff = currentX - startX;

    if (Math.abs(diff) > 100) {
        handleSwipe(diff > 0);
    } else {
        card.style.transform = '';
    }

    startX = 0;
    currentX = 0;
}

// Tournament Phase
function startTournament() {
    if (likedItems.length < 2) {
        // Not enough items, pick random from all
        const winner = currentItems[Math.floor(Math.random() * currentItems.length)];
        showWinner(winner);
        return;
    }

    // Shuffle liked items
    likedItems = shuffle(likedItems);

    // If 3 or fewer items, show all in one final battle
    if (likedItems.length <= 3) {
        tournamentRound = [likedItems];
        currentRoundIndex = 0;
        showScreen('tournament');
        displayTournamentRound();
        return;
    }

    // For even numbers, create normal pairs
    if (likedItems.length % 2 === 0) {
        tournamentRound = [];
        for (let i = 0; i < likedItems.length; i += 2) {
            tournamentRound.push([likedItems[i], likedItems[i + 1]]);
        }
    } else {
        // For odd numbers, pair what we can and put remaining in one battle
        tournamentRound = [];
        const remainder = likedItems.length % 2;
        const pairableCount = likedItems.length - remainder - 2;

        // Create pairs for items that can be paired
        for (let i = 0; i < pairableCount; i += 2) {
            tournamentRound.push([likedItems[i], likedItems[i + 1]]);
        }

        // Put last 3 items in one battle
        const lastThree = likedItems.slice(pairableCount);
        tournamentRound.push(lastThree);
    }

    currentRoundIndex = 0;
    showScreen('tournament');
    displayTournamentRound();
}

function displayTournamentRound() {
    roundContainer.innerHTML = '';

    tournamentRound.forEach((matchup, index) => {
        const matchupDiv = document.createElement('div');
        matchupDiv.className = 'matchup';

        const title = document.createElement('div');
        title.className = 'matchup-title';
        // If only one matchup with 3+ items, it's the final selection
        if (tournamentRound.length === 1 && matchup.length > 2) {
            title.textContent = 'FINAL SELECTION';
        } else {
            title.textContent = `Battle ${index + 1}`;
        }
        matchupDiv.appendChild(title);

        const competitors = document.createElement('div');
        competitors.className = 'competitors';

        matchup.forEach(item => {
            if (item === null) return; // Bye

            const competitor = document.createElement('div');
            competitor.className = 'competitor';
            competitor.textContent = item;
            competitor.dataset.matchup = index;
            competitor.dataset.item = item;

            competitor.addEventListener('click', selectWinner);

            competitors.appendChild(competitor);
        });

        matchupDiv.appendChild(competitors);
        roundContainer.appendChild(matchupDiv);
    });

    updateTournamentTitle();
}

function selectWinner(e) {
    const matchupIndex = parseInt(e.target.dataset.matchup);
    const matchup = document.querySelectorAll(`[data-matchup="${matchupIndex}"]`);

    matchup.forEach(comp => comp.classList.remove('selected'));
    e.target.classList.add('selected');

    checkAllMatchupsComplete();
}

function checkAllMatchupsComplete() {
    const allSelected = tournamentRound.every((_, index) => {
        return document.querySelector(`[data-matchup="${index}"].selected`) !== null;
    });

    if (allSelected) {
        nextRoundBtn.style.display = 'block';
    }
}

function nextTournamentRound() {
    const winners = [];

    tournamentRound.forEach((matchup, index) => {
        const selected = document.querySelector(`[data-matchup="${index}"].selected`);
        if (selected) {
            winners.push(selected.dataset.item);
        }
    });

    if (winners.length === 1) {
        showWinner(winners[0]);
        return;
    }

    // Setup next round
    likedItems = winners;
    nextRoundBtn.style.display = 'none';
    startTournament();
}

function updateTournamentTitle() {
    const title = document.querySelector('.tournament-title');
    const remaining = tournamentRound.reduce((acc, matchup) => {
        return acc + matchup.length;
    }, 0);

    if (remaining === 2) {
        title.textContent = 'FINALS';
    } else if (remaining === 3) {
        title.textContent = 'FINAL THREE';
    } else {
        title.textContent = `Tournament - ${remaining} Remaining`;
    }
}

// Winner Phase
function showWinner(winner) {
    winnerName.textContent = winner;
    showScreen('winner');
    createConfetti();
}

function createConfetti() {
    const confetti = document.querySelector('.confetti');
    confetti.innerHTML = '';

    const colors = ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'];

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.style.position = 'absolute';
        piece.style.width = '10px';
        piece.style.height = '10px';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';
        piece.style.top = '-10px';
        piece.style.borderRadius = '50%';
        piece.style.animation = `fall ${2 + Math.random() * 2}s linear forwards`;
        piece.style.animationDelay = Math.random() * 2 + 's';

        confetti.appendChild(piece);
    }

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Utility
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function restart() {
    showScreen('home');
    currentCategory = '';
    currentItems = [];
    currentIndex = 0;
    likedItems = [];
    tournamentRound = [];
    currentRoundIndex = 0;
    nextRoundBtn.style.display = 'none';
    card.style.transform = '';
}
