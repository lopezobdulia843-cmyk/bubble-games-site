// --- BUBBLE GAMES HUB ENGINE ---

// 1. Game Templates (The "Global" Library)
const gameTemplates = [
    { id: 't1', title: 'Platformer Pro', icon: '🏃‍♂️', category: 'Global' },
    { id: 't2', title: 'Bubble Pop', icon: '🫧', category: 'Global' },
    { id: 't3', title: 'Speed Racer', icon: '🏎️', category: 'Global' },
    { id: 't4', title: 'Physics Sandbox', icon: '📦', category: 'Global' },
    { id: 't5', title: 'Obby Master', icon: '🧗', category: 'Global' },
    { id: 't6', title: 'Clicker Tycoon', icon: '💰', category: 'Global' }
];

let currentTab = 'global'; // Default view

// 2. The Core Render Function
window.renderGames = (filter = '') => {
    const gameList = document.getElementById('game-list');
    if (!gameList) return; // Safety check

    gameList.innerHTML = ''; // Clear the "ghost" games

    // Decide what to show
    let gamesToShow = [];
    if (currentTab === 'global') {
        gamesToShow = gameTemplates;
    } else {
        // This is where we will eventually fetch YOUR games from Supabase
        gamesToShow = [{ id: 'user1', title: 'My First Project', icon: '🏗️', category: 'Mine' }];
    }

    // Filter by search if the user typed something
    const filtered = gamesToShow.filter(g => 
        g.title.toLowerCase().includes(filter.toLowerCase())
    );

    // Create the big Roblox-style tiles
    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <span class="game-icon">${game.icon}</span>
            <h3>${game.title}</h3>
        `;
        
        card.onclick = () => console.log(`Opening ${game.title}...`);
        gameList.appendChild(card);
    });
};

// 3. Tab Switching Logic
window.switchTab = (tab) => {
    currentTab = tab;
    
    // Update Button Styles
    document.getElementById('tab-mine').classList.toggle('active', tab === 'mine');
    document.getElementById('tab-global').classList.toggle('active', tab === 'global');

    window.renderGames();
};

// 4. Initialization (The "Anti-Flicker" Fix)
document.addEventListener('DOMContentLoaded', () => {
    // Look for the search bar (if you added it)
    const searchBar = document.getElementById('game-search');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            window.renderGames(e.target.value);
        });
    }

    // If we are already logged in (checked by gateway.js), show games
    // Note: showWelcome() in gateway.js calls this too.
});
