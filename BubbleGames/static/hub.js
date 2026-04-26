// hub.js - Managing the Game Dashboard
window.currentTab = 'your-games';

// Example Data (You can move this to Supabase later!)
const games = [
    { id: 1, title: "Bubble Pop Rage", type: "global", icon: "🫧" },
    { id: 2, title: "iPad Parkour", type: "global", icon: "🏃" },
    { id: 3, title: "My Secret Level", type: "personal", icon: "💎" }
];

window.switchTab = (tabName) => {
    window.currentTab = tabName;
    
    // Update Button Styles
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase().includes(tabName.split('-')[0])) {
            btn.classList.add('active');
        }
    });

    renderGames();
};

window.renderGames = (filter = "") => {
    const list = document.getElementById('game-list');
    list.innerHTML = ""; // Clear current list

    const filtered = games.filter(g => {
        const matchesTab = (window.currentTab === 'global-games' && g.type === 'global') || 
                           (window.currentTab === 'your-games' && g.type === 'personal');
        const matchesSearch = g.title.toLowerCase().includes(filter.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<p class="no-games">No games found... yet! 🎈</p>`;
        return;
    }

    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card bouncy-animation';
        card.innerHTML = `
            <div class="game-icon">${game.icon}</div>
            <h3>${game.title}</h3>
            <button class="play-small-btn">Launch</button>
        `;
        list.appendChild(card);
    });
};

// Search Bar Listener
document.getElementById('game-search')?.addEventListener('input', (e) => {
    renderGames(e.target.value);
});

window.resetHub = () => {
    document.getElementById('game-search').value = "";
    switchTab('your-games');
    document.getElementById('hub-back').style.display = 'none';
};
