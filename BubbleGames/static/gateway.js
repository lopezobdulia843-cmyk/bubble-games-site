import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. SET DEFAULT MODE
window.mode = "login"; 

// 2. TOGGLE BETWEEN SIGNUP AND LOGIN
window.switchMode = () => {
    const title = document.getElementById('page-title');
    const btn = document.getElementById('main-button');
    const toggleContainer = document.getElementById('toggle-container');
    const forgotPass = document.getElementById('forgot-pass');

    if (!title || !btn) return; 

    if (window.mode === "login") {
        window.mode = "signup";
        title.innerText = "Join the Club! ✨";
        btn.innerText = "🫧 Let's Play! 🫧";
        if (forgotPass) forgotPass.style.display = 'none';
        toggleContainer.innerHTML = `Already a Member? <a href="#" class="signup-link" onclick="switchMode()">Log In!</a>`;
    } else {
        window.mode = "login";
        title.innerText = "Getting Started";
        btn.innerText = "🫧 Let's Play! 🫧";
        if (forgotPass) forgotPass.style.display = 'inline';
        toggleContainer.innerHTML = `New here? <a href="#" class="signup-link" onclick="switchMode()">Sign Up!</a>`;
    }
};

// 3. HANDLE AUTHENTICATION
window.handleAuth = async () => {
    const usernameInput = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const mainButton = document.getElementById('main-button');
    const loader = document.getElementById('loader');

    if (!usernameInput || !password) {
        alert("Oops! Don't forget your username and password! ✨");
        return;
    }

    // --- STRICT VALIDATION: ALPHANUMERIC & LENGTH ---
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphaNumericRegex.test(usernameInput)) {
        alert("Letters and numbers only! No spaces or symbols. 🫧");
        return;
    }
    if (usernameInput.length < 5 || usernameInput.length > 20) {
        alert("Username must be between 5 and 20 characters! 🫧");
        return;
    }
    // ------------------------------------------------

    loader.style.display = 'block';
    mainButton.style.opacity = '0.5'; 
    mainButton.disabled = true;

    // ... rest of your code ...
    // -------------------------------------------------------------------

    loader.style.display = 'block';
    mainButton.style.opacity = '0.5'; 
    mainButton.disabled = true;

    if (window.mode === "signup") {
        if (/^\d+$/.test(usernameInput)) {
            alert("Username cannot be only numbers! Add some letters! 🦆");
            resetButton(mainButton, loader);
            return;
        }

        try {
            // 🕵️‍♂️ THE CODE-SIDE LOWERCASE CHECK
            const allProfiles = await getDocs(collection(db, "profiles"));
            let isTaken = false;

            allProfiles.forEach((doc) => {
                const existingName = doc.data().username;
                // If the name exists (ignoring CAPITALS), we block it!
                if (existingName.toLowerCase() === usernameInput.toLowerCase()) {
                    isTaken = true;
                }
            });

            if (isTaken) {
                alert("That username is already taken! (Check your capitals!) 🫧");
                resetButton(mainButton, loader);
                return;
            }

            const statsRef = doc(db, "stats", "global");
            const statsSnap = await getDoc(statsRef);
            let newId = 1;
            if (statsSnap.exists()) {
                newId = statsSnap.data().total_players + 1;
            }

            const userEmail = `${newId}@bubblegames.com`;
            const userCredential = await createUserWithEmailAndPassword(auth, userEmail, password);

            await setDoc(doc(db, "profiles", userCredential.user.uid), {
                username: usernameInput,
                id: newId,
                email: userEmail,
                rank: newId === 1 ? "Owner" : "Player",
                createdAt: new Date()
            });

            await setDoc(statsRef, { total_players: newId }, { merge: true });

        } catch (error) {
            alert("Error: " + error.message);
            resetButton(mainButton, loader);
        }
    } else {
        // 🕵️‍♂️ LOGIN LOGIC
        try {
            const q = query(collection(db, "profiles"), where("username", "==", usernameInput));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("Player not found! Check your name! 🔍");
                resetButton(mainButton, loader);
                return;
            }

            let foundId;
            querySnapshot.forEach((doc) => {
                foundId = doc.data().id;
            });

            const userEmail = `${foundId}@bubblegames.com`;
            await signInWithEmailAndPassword(auth, userEmail, password);

        } catch (error) {
            alert("Wrong password! 🔑");
            resetButton(mainButton, loader);
        }
    }
};

function resetButton(btn, ldr) {
    if (ldr) ldr.style.display = 'none';
    if (btn) {
        btn.style.opacity = '1';
        btn.disabled = false;
        btn.innerText = "🫧 Let's Play! 🫧"; 
    }
}

// 4. THE BOUNCER
onAuthStateChanged(auth, (user) => {
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    const isHubPage = window.location.pathname.includes('hub.html');
    if (user) {
        if (isLoginPage) {
            setTimeout(() => { window.location.replace('hub.html'); }, 500);
        }
    } else {
        if (isHubPage) { window.location.replace('index.html'); }
    }
});

window.handleLogout = async () => {
    await signOut(auth);
    window.location.replace('index.html'); 
};
