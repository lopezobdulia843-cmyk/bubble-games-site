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
    userGrid.innerHTML = `<p class="no-games">Loading your games... 🚀</p>`;

    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
            const snap = await getDocs(collection(db, 'games'));
            const myGames = snap.docs.filter(d => d.data().authorId === user.uid);

            if (myGames.length === 0) {
                userGrid.innerHTML = `<p class="no-games">You haven't created any games yet. Start creating! 🚀</p>`;
                return;
            }

            userGrid.innerHTML = '';
            myGames.forEach(docSnap => {
                userGrid.appendChild(makeGameCard(docSnap.id, docSnap.data(), true));
            });
        } catch (e) {
            console.error("Error loading user games:", e);
            userGrid.innerHTML = `<p class="no-games">Failed to load 😢</p>`;
        }
    });
}

function makeGameCard(id, g, isOwner) {
    const card = document.createElement('div');
    card.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 220px;
    `;

    const isPublic = g.isPublic === true;

    const safeId = id;
    const safeName = (g.name || 'Untitled').replace(/`/g, '');
    const safeDesc = (g.description || 'No description.').replace(/`/g, '');

    card.innerHTML = `
        <div style="font-weight:bold; font-size:15px;">🎮 ${g.name || 'Untitled'}</div>
        <div style="font-size:12px; color:#777;">${g.description || 'No description.'}</div>
        <div style="font-size:11px; color:#aaa;">By ${g.authorName || 'Unknown'}</div>

        ${isOwner ? `
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
            <span style="font-size:12px; color:#999;">Private</span>

            <div id="track-${safeId}" onclick="toggleGamePublic('${safeId}', ${!isPublic})" style="
                position:relative;
                width:40px; height:22px;
                background:${isPublic ? '#2ed573' : '#ccc'};
                border-radius:22px;
                cursor:pointer;
                transition:background 0.3s;
            ">
                <div id="knob-${safeId}" style="
                    position:absolute;
                    width:16px; height:16px;
                    background:white;
                    border-radius:50%;
                    top:3px;
                    left:${isPublic ? '21px' : '3px'};
                    transition:left 0.3s;
                "></div>
            </div>

            <span style="font-size:12px; color:#999;">Public</span>
        </div>

        <button onclick="editGameInfo('${safeId}', \`${safeName}\`, \`${safeDesc}\`)" style="
            margin-top:4px;
            background:#00a8ff;
            color:white;
            border:none;
            padding:6px 10px;
            border-radius:8px;
            cursor:pointer;
            font-size:12px;
            font-weight:bold;
        ">✏️ Edit Info</button>
        ` : ''}
    `;

    return card;
}

window.toggleGamePublic = async (gameId, makePublic) => {
    try {
        await updateDoc(doc(db, 'games', gameId), { isPublic: makePublic });

        const track = document.getElementById('track-' + gameId);
        const knob = document.getElementById('knob-' + gameId);
        if (track) track.style.background = makePublic ? '#2ed573' : '#ccc';
        if (knob) knob.style.left = makePublic ? '21px' : '3px';

        // Update onclick so next tap flips it the other way
        if (track) track.setAttribute('onclick', `toggleGamePublic('${gameId}', ${!makePublic})`);

        loadGlobalGames();
    } catch (e) {
        console.error("Toggle failed:", e);
        alert("❌ Couldn't update visibility. Try again!");
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
