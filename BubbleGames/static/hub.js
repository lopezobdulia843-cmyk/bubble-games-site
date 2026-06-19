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
    if (globalGrid) globalGrid.innerHTML = `<p class="no-games">No games here! Time to start creating? 🫧</p>`;
}

async function loadUserGames() {
    const userGrid = document.getElementById('owned-game-grid'); 
    if (userGrid) userGrid.innerHTML = `<p class="no-games">You haven't created any games yet. Start creating! 🚀</p>`;
}

// --- 3. LOGOUT ---
window.handleLogout = async () => {
    try { await signOut(auth); window.location.replace('index.html'); } 
    catch (error) { console.error("Logout failed", error); }
};

// --- 4. TABS & PANELS ---
window.switchTab = (tabName) => {
    ['home', 'create', 'settings', 'chat'].forEach(view => {
        document.getElementById('view-' + view).style.display = (view === tabName) ? 'flex' : 'none';
        const nav = document.getElementById('nav-' + view);
        if (nav) (view === tabName) ? nav.classList.add('active') : nav.classList.remove('active');
    });
    window.closePanel();
};

window.toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('bubbleTheme', isDark ? 'dark' : 'light');
};

// --- 5. CHAT ROOM LOGIC ---
function refreshChat() {}
let peerConnection;
let dataChannel;
let messages = [];

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

window.startChat = async () => {
    peerConnection = new RTCPeerConnection(config);

    dataChannel = peerConnection.createDataChannel("chat");

    dataChannel.onmessage = (event) => {
        messages.push(event.data);
        renderChat();
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("ICE CANDIDATE (SEND THIS TOO):", JSON.stringify(event.candidate));
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log("SEND THIS OFFER:", JSON.stringify(offer));
};

window.connectToFriend = async (offerString) => {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;

        dataChannel.onmessage = (e) => {
            messages.push(e.data);
            renderChat();
        };
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("ICE BACK:", JSON.stringify(event.candidate));
        }
    };

    const offer = JSON.parse(offerString);
    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log("SEND ANSWER BACK:", JSON.stringify(answer));
    return answer;
};

window.sendMessage = () => {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();

    if (!text || !dataChannel) return;
    if (dataChannel.readyState !== "open") return;

    dataChannel.send(text);

    messages.push("You: " + text);
    input.value = "";

    renderChat();
};

function renderChat() {
    const box = document.getElementById("chat-messages");
    box.innerHTML = "";

    messages.forEach(msg => {
        box.innerHTML += `<div>${msg}</div>`;
    });

    box.scrollTop = box.scrollHeight;
}

window.acceptAnswer = async (answerString) => {
    const answer = JSON.parse(answerString);

    if (!peerConnection) {
        console.log("No peer connection yet");
        return;
    }

    await peerConnection.setRemoteDescription(answer);

    console.log("CONNECTED!");
};


// --- 6. MODERATION TOOLS ---

window.deleteMessageNow = async (messageId) => {

    if (
        window.currentRank !== "Owner" &&
        window.currentRank !== "Moderator"
    ) return;

    await deleteDoc(doc(db, "global-chat", messageId));

    await setDoc(doc(db, "chat-metadata", "status"), {
        lastUpdated: serverTimestamp()
    });
};

window.editMessage = async (messageId) => {
    if (
    window.currentRank !== "Owner" &&
    window.currentRank !== "Moderator"
) return;
    const newText = prompt("Edit this message:");
    if (!newText || newText.trim() === "" || newText.trim().length > 100) return;

    

    await updateDoc(doc(db, "global-chat", messageId), {
        text: newText.trim()
    });

    await setDoc(doc(db, "chat-metadata", "status"), {
        lastUpdated: serverTimestamp()
    });
};
