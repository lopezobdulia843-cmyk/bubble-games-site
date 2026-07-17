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

    // Check if we already have the global data in cache
    if (window.gameCache.global) {
        renderGlobalGames(window.gameCache.global, globalGrid);
        return;
    }

    globalGrid.innerHTML = `<p class="no-games">Loading... 🫧</p>`;

    try {
        const snap = await getDocs(collection(db, 'games'));
        // Save to cache once
        window.gameCache.global = snap.docs.filter(docSnap => {
    const data = docSnap.data();

 return (
    data.isPublic === true ||
    data.public === true ||
    data.visibility === "public" ||
    data.p === 1
);
});
        
        renderGlobalGames(window.gameCache.global, globalGrid);
    } catch (e) {
        console.error("Error loading global games:", e);
        globalGrid.innerHTML = `<p class="no-games">Failed to load games 😢</p>`;
    }
}

// Helper to render the global list
function renderGlobalGames(games, container) {
    container.innerHTML = '';
    // Show this message only if we have a finished cache but nothing matched
    if (games.length === 0) {
        container.innerHTML = `<p class="no-games">Nothing found, create a game! 🫧</p>`;
        return;
    }
    // ... rest of your code
    games.forEach(docSnap => {
        container.appendChild(makeGameCard(docSnap.id, docSnap.data(), false));
    });
}

async function loadUserGames() {
    const userGrid = document.getElementById('owned-game-grid');
    if (!userGrid) return;

    // PROTECTION: Check if logged in
    if (!auth.currentUser) {
        userGrid.innerHTML = `<p class="no-games">Please log in to manage your games! 🔒</p>`;
        return;
    }

    window.gameCache.user = null;
    userGrid.innerHTML = `<p class="no-games">Loading... 🚀</p>`;
    
    const snap = await getDocs(collection(db, 'games'));
    window.gameCache.user = snap.docs.filter(docSnap => {
        const data = docSnap.data();
        return (
            data.authorId === auth.currentUser?.uid ||
            data.ownerId === auth.currentUser?.uid ||
            data.creatorId === auth.currentUser?.uid ||
            data.userId === auth.currentUser?.uid ||
            data.uid === auth.currentUser?.uid ||
            data.u === auth.currentUser?.uid
        );
    });
    
    renderGames(window.gameCache.user, userGrid, true);
}

function renderGames(games, container, isOwner) {
    container.innerHTML = '';
    if (games.length === 0) {
        container.innerHTML = `<p class="no-games">No games found! Start creating? 🫧</p>`;
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
    const safeName = (g.name || g.n || 'Untitled').replace(/`/g, '');
    const safeDesc = (g.description || g.d || 'No description.').replace(/`/g, '');
    const safeAuthor = (g.authorName || g.a || 'Unknown').replace(/`/g, '');

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

    card.innerHTML = `🎮 ${g.name || g.n || 'Untitled'}`;

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

    card.onclick = () => openGamePanel(safeId, safeName, safeDesc, isOwner, isPublic, safeAuthor);

    return card;
}

function openGamePanel(id, name, desc, isOwner, isPublic, author) {
    const panel = document.getElementById('actionPanel');

    panel.innerHTML = `
        <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-size:13px; opacity:0.5; margin-bottom:4px; font-weight:bold; letter-spacing:1px; text-transform:uppercase;">Now Playing</div>
                    <h2 style="margin:0; font-size:32px; color:var(--text-main);">🎮 ${name}</h2>
                    <div style="font-size:13px; opacity:0.6; color:var(--text-sub); margin-top:4px;">Made by: ${author}</div>
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
                        <button onclick="<button onclick="window.location.href='engine.html?id=${id}&mode=edit'" style="" style="
                            margin-left:6px;
                            background:#f1c40f;
                            color:white;
                            border:none;
                            padding:6px 14px;
                            border-radius:20px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:bold;
                        ">🛠️ Open Editor</button>
                        <button onclick="deleteGameNow('${id}')" style="
                            margin-left:6px;
                            background:#ff4757;
                            color:white;
                            border:none;
                            padding:6px 14px;
                            border-radius:20px;
                            cursor:pointer;
                            font-size:12px;
                            font-weight:bold;
                        ">🗑️ Delete</button>
                    </div>
                    ` : ''}
                </div>

                <button onclick="window.location.href='https://bubblegames.onrender.com/engine.html?id=${id}&mode=play'" style="
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

    // 3. OPTIMISTIC UI: Update the look immediately
    if (track) {
        track.style.background = makePublic ? '#2ed573' : '#ccc';
        track.setAttribute('onclick', `toggleGamePublic('${gameId}', ${!makePublic})`);
    }
    if (knob) knob.style.left = makePublic ? '25px' : '3px';

    try {
        // 4. DATABASE: Save the change to Firestore
        await updateDoc(doc(db, 'games', gameId), { isPublic: makePublic });

     // 5. LOCAL CACHE: Update your 'user' cache
        if (window.gameCache?.user) {
            const idx = window.gameCache.user.findIndex(g => g.id === gameId);
            if (idx !== -1) {
                // Merge current data with the new isPublic status
                const updatedData = { ...window.gameCache.user[idx].data(), isPublic: makePublic };

                // Swap in a plain object with the same id/data() shape
                // instead of trying to mutate the (immutable) Firestore snapshot
                window.gameCache.user[idx] = { id: gameId, data: () => updatedData };
            }
        }

        // 6. LOCAL CACHE: Update your 'global' cache
        if (window.gameCache?.global) {
            const globalIndex = window.gameCache.global.findIndex(g => g.id === gameId);
            
            if (makePublic && globalIndex === -1) {
                // If made public, clear cache to force a fresh pull on next Home visit
                window.gameCache.global = null; 
            } else if (!makePublic && globalIndex !== -1) {
                // If made private, remove from global list immediately
                window.gameCache.global.splice(globalIndex, 1);
            }
        }

    } catch (e) {
        // 7. ERROR HANDLING: Revert UI if the save failed
        console.error("Toggle failed:", e);
        alert("❌ Couldn't update visibility. Reverting...");
        
        if (track) {
            track.style.background = previousState ? '#2ed573' : '#ccc';
            track.setAttribute('onclick', `toggleGamePublic('${gameId}', ${!previousState})`);
        }
        if (knob) knob.style.left = previousState ? '25px' : '3px';
    }
};

window.deleteGameNow = async (gameId) => {
    const sure = confirm("Are you sure you would like to delete? This is permanent.");
    if (!sure) return;

    try {
        await deleteDoc(doc(db, 'games', gameId));

        // Remove from local caches so it disappears instantly
        if (window.gameCache?.user) {
            window.gameCache.user = window.gameCache.user.filter(g => g.id !== gameId);
        }
        if (window.gameCache?.global) {
            window.gameCache.global = window.gameCache.global.filter(g => g.id !== gameId);
        }

        closePanel();
        loadUserGames();
        loadGlobalGames();
    } catch (e) {
        console.error("Delete failed:", e);
        alert("❌ Couldn't delete game.");
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

window.searchGames = (query) => {
    const searchTerm = query.toLowerCase();
    const globalGrid = document.getElementById('global-game-grid');
    
    // Fallback if cache isn't ready
    if (!window.gameCache.global) {
        console.warn("Cache not ready yet.");
        return;
    }

    const filtered = window.gameCache.global.filter(doc => {
        const data = doc.data();
        // Check both 'name' and 'n' (since your makeGameCard uses both)
        const name = (data.name || data.n || "").toLowerCase();
        const desc = (data.description || data.d || "").toLowerCase();
        return name.includes(searchTerm) || desc.includes(searchTerm);
    });

    renderGlobalGames(filtered, globalGrid);
};
// Add this at the very end of hub.js to expose the function to the HTML
window.searchGames = searchGames;

// --- BUBBLE BACKGROUND GENERATOR ---
const container = document.getElementById('bubbles-container');
if (container) {
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        const color = Math.random() > 0.5 ? '#00a8ff' : '#ff4757';
        bubble.style.cssText = `
            position: absolute;
            left: ${Math.random() * 95}%;
            top: 100%;
            width: ${Math.random() * 40 + 20}px;
            height: ${Math.random() * 40 + 20}px;
            border: 4px solid ${color};
            border-radius: 50%;
            animation: rise ${Math.random() * 5 + 5}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(bubble);
    }
    const style = document.createElement('style');
    style.innerHTML = `@keyframes rise { from { transform: translateY(0); } to { transform: translateY(-110vh); } }`;
    document.head.appendChild(style);
}
