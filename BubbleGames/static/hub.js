// --- BUBBLE GAMES HYBRID HUB ENGINE ---

// 1. DATA: The Global Library
const gameTemplates = [
    { id: 't1', title: 'Platformer Pro', icon: '🏃‍♂️', category: 'Global' },
    { id: 't2', title: 'Bubble Pop', icon: '🫧', category: 'Global' },
    { id: 't3', title: 'Speed Racer', icon: '🏎️', category: 'Global' },
    { id: 't4', title: 'Physics Sandbox', icon: '📦', category: 'Global' },
    { id: 't5', title: 'Obby Master', icon: '🧗', category: 'Global' },
    { id: 't6', title: 'Clicker Tycoon', icon: '💰', category: 'Global' }
];

// 2. UI NAVIGATION: The "Juicy" Controller
function switchTab(tabName) {
    closePanel();
    
    // UI Logic: Hide all views
    ['view-home', 'view-create', 'view-settings'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // UI Logic: Deactivate all icons
    ['nav-home', 'nav-create', 'nav-settings'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });

    // UI Logic: Activate current tab
    const targetView = document.getElementById('view-' + tabName);
    const targetNav = document.getElementById('nav-' + tabName);
    
    if (targetView) targetView.style.display = 'flex';
    if (targetNav) targetNav.classList.add('active');

    // ENGINE LOGIC: Refresh games based on the tab
    renderGames();
}

// 3. THE RENDER ENGINE: Creating the Tiles
function renderGames(filter = '') {
    const gameList = document.getElementById('game-list');
    if (!gameList) return; 

    gameList.innerHTML = ''; 

    // Filter logic: Decide if we show Global or User games
    let gamesToShow = [];
    const activeNav = document.querySelector('.side-icon.active');
    
    if (activeNav && activeNav.id === 'nav-home') {
        gamesToShow = gameTemplates;
    } else if (activeNav && activeNav.id === 'nav-create') {
        gamesToShow = [{ id: 'user1', title: 'Bubble Craft', icon: '🫧', category: 'Mine' }];
    }

    const filtered = gamesToShow.filter(g => 
        g.title.toLowerCase().includes(filter.toLowerCase())
    );

    filtered.forEach(game => {
        const card = document.createElement('div');
        card.className = 'market-card'; // Using your CSS class name
        card.innerHTML = `
            <span class="market-icon">${game.icon}</span>
            <h3>${game.title}</h3>
        `;
        
        // Link the click to the UI Panel
        card.onclick = () => openPanel(game.title, game.icon, (game.category === 'Mine'));
        gameList.appendChild(card);
    });
}

// 4. ACTION PANEL LOGIC: The Slide-up Menu
function openPanel(name, icon, isOwned) {
    document.getElementById('panelTitle').innerText = name;
    document.getElementById('panelIcon').innerText = icon;
    
    const ownedControls = document.getElementById('ownedControls');
    const visitorStats = document.getElementById('visitorStats');
    const editNameInput = document.getElementById('editName');

    if (isOwned) {
        if (ownedControls) ownedControls.style.display = 'block';
        if (visitorStats) visitorStats.style.display = 'none';
        if (editNameInput) editNameInput.value = name;
    } else {
        if (ownedControls) ownedControls.style.display = 'none';
        if (visitorStats) visitorStats.style.display = 'block';
    }

    document.getElementById('actionPanel').classList.add('open');
}

function closePanel() {
    document.getElementById('actionPanel').classList.remove('open');
}

// 5. SETTINGS & SYSTEM
function fakeLogout() {
    if(confirm("Are you sure you want to log out of Bubble Games?")) {
        alert("You have been logged out! (Returning to gateway...)");
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('bubbleTheme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

// 6. INITIALIZATION: Keeping it Alive
window.onload = () => {
    // Apply Theme
    if (localStorage.getItem('bubbleTheme') === 'dark') {
        document.body.classList.add('dark-theme');
        const darkToggle = document.getElementById('darkToggle');
        if (darkToggle) darkToggle.checked = true;
    }

    // Connect Search Bar to Engine
    const searchBar = document.querySelector('.hero-search');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            renderGames(e.target.value);
        });
    }

    // Initial render
    renderGames();
};
