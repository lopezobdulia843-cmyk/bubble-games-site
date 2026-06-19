window.gameCache = { global: null, user: null };
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, limitToLast, getDocs, deleteDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- 0. DARK MODE (LOAD IMMEDIATELY) ---
if (localStorage.getItem('bubbleTheme') === 'dark') {
    document.body.classList.add('dark-theme');
    const toggle = document.getElementById('darkToggle');
    if (toggle) toggle.checked = true;
}

// --- 1. ONLY SHOW DATA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const welcomeText = document.getElementById('welcome-text');
        const emailPrefix = user.email ? user.email.split('@')[0] : "Player";
        if (welcomeText) welcomeText.innerText = `Welcome back, ${emailPrefix}! ✨`;

        const getUsername = async (uid, attempts = 0) => {
            try {
                const docRef = doc(db, "profiles", uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) return docSnap.data().username;
                else if (attempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return getUsername(uid, attempts + 1);
                }
            } catch (err) { console.error("Firestore lookup failed:", err); }
            return emailPrefix; 
        };

        const displayName = await getUsername(user.uid);
        if (welcomeText) welcomeText.innerText = `Welcome back, ${displayName}! ✨`;
        window.currentUsername = displayName;
        const profileRef = doc(db, "profiles", user.uid);
const profileSnap = await getDoc(profileRef);

window.currentRank = profileSnap.exists()
    ? (profileSnap.data().rank || "user")
    : "user";
        
        loadGlobalGames();
        loadUserGames(); 
        
    }
});

// --- 2. LOAD GAMES ---
async function loadGlobalGames() {
    const globalGrid = document.getElementById('global-game-grid');
    if (!globalGrid) return;
    globalGrid.innerHTML = `<p class="no-games">Loading... 🫧</p>`;

    try {
        const snap = await getDocs(collection(db, 'games'));
        const publicGames = snap.docs.filter(d => d.data().isPublic === true);

        if (publicGames.length === 0) {
            globalGrid.innerHTML = `<p class="no-games">No public games yet! Be the first 🫧</p>`;
            return;
        }

        globalGrid.innerHTML = '';
        publicGames.forEach(docSnap => {
            globalGrid.appendChild(makeGameCard(docSnap.id, docSnap.data(), false));
        });
    } catch (e) {
        console.error("Error loading global games:", e);
        globalGrid.innerHTML = `<p class="no-games">Failed to load games 😢</p>`;
    }
}

async function loadUserGames() {
    const userGrid = document.getElementById('owned-game-grid');
    if (!userGrid) return;

    // Check if we already have the data locally
    if (window.gameCache.user) {
        renderGames(window.gameCache.user, userGrid, true);
        return;
    }

    userGrid.innerHTML = `<p class="no-games">Loading... 🚀</p>`;
    
    // If no cache, fetch once from DB
    const snap = await getDocs(collection(db, 'games'));
    window.gameCache.user = snap.docs.filter(d => d.data().authorId === auth.currentUser?.uid);
    
    renderGames(window.gameCache.user, userGrid, true);
}

function renderGames(games, container, isOwner) {
    container.innerHTML = '';
    if (games.length === 0) {
        container.innerHTML = `<p class="no-games">No games found! 🫧</p>`;
        return;
    }
    games.forEach(docSnap => {
        container.appendChild(makeGameCard(docSnap.id, docSnap.data(), isOwner));
    });
}

function makeGameCard(id, g, isOwner) {
    const card = document.createElement('div');
    const isPublic = g.isPublic === true;
    const safeId = id;
    const safeName = (g.name || 'Untitled').replace(/`/g, '');
    const safeDesc = (g.description || 'No description.').replace(/`/g, '');

    card.style.cssText = `
        background: var(--card-bg);
        border-radius: 35px;
        padding: 30px;
        border: 6px solid var(--border-color);
        text-align: center;
        cursor: pointer;
        color: var(--text-sub);
        font-family: 'Arial Rounded MT Bold', sans-serif;
        font-size: 22px;
        font-weight: 900;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 4px 15px var(--shadow);
    `;

    card.innerHTML = `🎮 ${g.name || 'Untitled'}`;

    card.onmouseover = () => {
        card.style.transform = 'translateY(-10px)';
        card.style.borderColor = 'var(--text-main)';
        card.style.boxShadow = '0 15px 30px var(--shadow)';
    };
    card.onmouseout = () => {
        card.style.transform = '';
        card.style.borderColor = 'var(--border-color)';
        card.style.boxShadow = '0 4px 15px var(--shadow)';
    };

    card.onclick = () => openGamePanel(safeId, safeName, safeDesc, isOwner, isPublic);

    return card;
}

function openGamePanel(id, name, desc, isOwner, isPublic) {
    const panel = document.getElementById('actionPanel');

    panel.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:13px; opacity:0.5; margin-bottom:4px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Now Playing</div>
                    <h2 style="margin:0; font-size:32px; color:var(--text-main);">🎮 ${name}</h2>
                </div>
                <button onclick="closePanel()" style="cursor:pointer; background:none; border:none; font-size:32px; color:var(--text-sub); margin-top:-8px;">✕</button>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                <div style="max-width:60%;">
                    <p style="margin:0; font-size:15px; opacity:0.7; color:var(--text-sub);">${desc}</p>
                    ${isOwner ? `
                    <div style="display:flex; align-items:center; gap:10px; margin-top:16px;">
                        <span style="font-size:13px; color:var(--text-sub); opacity:0.7;">Private</span>
                        <div id="panel-track-${id}" onclick="toggleGamePublic('${id}', ${!isPublic})" style="
                            position:relative;
                            width:48px; height:26px;
                            background:${isPublic ? '#2ed573' : '#ccc'};
                            border-radius:26px;
                            cursor:pointer;
                            transition:background 0.3s;
                        ">
                            <div id="panel-knob-${id}" style="
                                position:absolute;
                                width:20px; height:20px;
                                background:white;
                                border-radius:50%;
                                top:3px;
                                left:${isPublic ? '25px' : '3px'};
                                transition:left 0.3s;
                                box-shadow:0 1px 4px rgba(0,0,0,0.2);
                            "></div>
                        </div>
                        <span style="font-size:13px; color:var(--text-sub); opacity:0.7;">Public</span>
                        <button onclick="editGameInfo('${id}', \`${name}\`, \`${desc}\`)" style="
                            margin-left:10px;
                            background:var(--border-color);
                            color:var(--text-main);
                            border:none;
                            padding:6px 14px;
                            border-radius:20px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:bold;
                        ">✏️ Edit</button>
                    </div>
                    ` : ''}
                </div>

                <button onclick="alert('Play coming soon!')" style="
                    background: linear-gradient(135deg, #4f46e5, #ec4899);
                    color: white;
                    padding: 20px 50px;
                    border-radius: 60px;
                    border: none;
                    font-size: 24px;
                    font-weight: 900;
                    cursor: pointer;
                    box-shadow: 0 10px 0 #3730a3, 0 15px 30px rgba(236, 72, 153, 0.4);
                    transition: 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    font-family: 'Arial Rounded MT Bold', sans-serif;
                    animation: float 3s ease-in-out infinite;
                "
                onmouseover="this.style.transform='scale(1.08) translateY(-4px)'"
                onmouseout="this.style.transform=''"
                onmousedown="this.style.transform='translateY(6px) scale(0.95)'; this.style.boxShadow='0 2px 0 #3730a3'"
                onmouseup="this.style.transform=''; this.style.boxShadow='0 10px 0 #3730a3, 0 15px 30px rgba(236, 72, 153, 0.4)'"
                >🎮 Play Now</button>
            </div>
        </div>
    `;

    panel.classList.add('open');
}
window.toggleGamePublic = async (gameId, makePublic) => {
    // 1. Get references to UI elements
    const track = document.getElementById('panel-track-' + gameId);
    const knob = document.getElementById('panel-knob-' + gameId);
    
    // 2. Cache the old state for a potential revert
    const previousState = !makePublic;

    // 3. OPTIMISTIC UI: Update the look immediately so it feels instant
    if (track) {
        track.style.background = makePublic ? '#2ed573' : '#ccc';
        track.setAttribute('onclick', `toggleGamePublic('${gameId}', ${!makePublic})`);
    }
    if (knob) knob.style.left = makePublic ? '25px' : '3px';

    try {
        // 4. DATABASE: Save the change to Firestore exactly once
        await updateDoc(doc(db, 'games', gameId), { isPublic: makePublic });

        // 5. LOCAL CACHE: Update your cache so no future reads are needed
        if (window.gameCache && window.gameCache.user) {
            const gameIndex = window.gameCache.user.findIndex(g => g.id === gameId);
            if (gameIndex !== -1) {
                // Update the property in the local cache object
                const gameData = window.gameCache.user[gameIndex].data();
                gameData.isPublic = makePublic;
            }
        }
    } catch (e) {
        // 6. ERROR HANDLING: Revert UI if the save failed
        console.error("Toggle failed:", e);
        alert("❌ Couldn't update visibility. Reverting...");
        
        if (track) {
            track.style.background = previousState ? '#2ed573' : '#ccc';
            track.setAttribute('onclick', `toggleGamePublic('${gameId}', ${!previousState})`);
        }
        if (knob) knob.style.left = previousState ? '25px' : '3px';
    }
};

window.editGameInfo = async (gameId, currentName, currentDesc) => {
    const newName = prompt("Game name:", currentName);
    if (newName === null) return;
    const newDesc = prompt("Description (max 100 chars):", currentDesc);
    if (newDesc === null) return;

    try {
        await updateDoc(doc(db, 'games', gameId), {
            name: newName.trim().slice(0, 60),
            description: newDesc.trim().slice(0, 100)
        });
        alert("✅ Updated!");
        loadUserGames();
        loadGlobalGames();
    } catch (e) {
        console.error("Edit failed:", e);
        alert("❌ Couldn't update.");
    }
};

// --- 3. LOGOUT ---
window.handleLogout = async () => {
    try { await signOut(auth); window.location.replace('index.html'); }
    catch (error) { console.error("Logout failed", error); }
};

// --- 4. TABS & PANELS ---
window.closePanel = () => {
    const panel = document.getElementById('actionPanel');
    if (panel) panel.classList.remove('open');
};

window.switchTab = (tabName) => {
    ['home', 'create', 'settings'].forEach(view => {
        const el = document.getElementById('view-' + view);
        if (el) el.style.display = (view === tabName) ? 'flex' : 'none';
        const nav = document.getElementById('nav-' + view);
        if (nav) (view === tabName) ? nav.classList.add('active') : nav.classList.remove('active');
    });

    // Refresh data when switching to these tabs
    if (tabName === 'home') loadGlobalGames();
    if (tabName === 'create') loadUserGames();

    window.closePanel();
};

window.toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('bubbleTheme', isDark ? 'dark' : 'light');
};

// --- 5. MODERATION TOOLS ---
window.deleteMessageNow = async (messageId) => {
    if (window.currentRank !== "Owner" && window.currentRank !== "Moderator") return;
    await deleteDoc(doc(db, "global-chat", messageId));
    await setDoc(doc(db, "chat-metadata", "status"), { lastUpdated: serverTimestamp() });
};

window.editMessage = async (messageId) => {
    if (window.currentRank !== "Owner" && window.currentRank !== "Moderator") return;
    const newText = prompt("Edit this message:");
    if (!newText || newText.trim() === "" || newText.trim().length > 100) return;
    await updateDoc(doc(db, "global-chat", messageId), { text: newText.trim() });
    await setDoc(doc(db, "chat-metadata", "status"), { lastUpdated: serverTimestamp() });
};
