import { supabase } from './supabase.js';

// 1. SET DEFAULT MODE
window.mode = "login"; 

// 2. TOGGLE BETWEEN SIGNUP AND LOGIN (NOW WITH MORE HYPE!)
window.switchMode = () => {
    const title = document.getElementById('page-title');
    const btn = document.getElementById('main-button');
    const toggleContainer = document.getElementById('toggle-container');
    const forgotPass = document.getElementById('forgot-pass');

    if (window.mode === "login") {
        window.mode = "signup";
        title.innerText = "Join the Club! ✨";
        btn.innerText = "🫧 Let's Play! 🫧"; // Keeping it fun!
        if (forgotPass) forgotPass.style.display = 'none'; // Bye bye link!
        toggleContainer.innerHTML = `
            Already a pro? 
            <a href="#" class="signup-link" onclick="switchMode()">Log In!</a>
        `;
    } else {
        window.mode = "login";
        title.innerText = "Getting Started";
        btn.innerText = "🫧 Let's Play! 🫧";
        if (forgotPass) forgotPass.style.display = 'inline'; // Welcome back link!
        toggleContainer.innerHTML = `
            New here? 
            <a href="#" class="signup-link" onclick="switchMode()">Sign Up!</a>
        `;
    }
};

// 3. HANDLE AUTHENTICATION
window.handleAuth = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const mainButton = document.getElementById('main-button');
    const loader = document.getElementById('loader');

    if (!username || !password) {
        alert("Oops! Don't forget your username and password! ✨");
        return;
    }

    if (window.mode === "signup") {
        if (password.includes(" ") || username.includes(" ")) {
            alert("No spaces allowed! 🫧");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters! 🛡️");
            return;
        }
    }

    loader.style.display = 'block';
    mainButton.style.opacity = '0.5'; 
    mainButton.disabled = true;

    if (window.mode === "signup") {
        mainButton.innerText = "CREATING PLAYER...";

        const { data: newUser, error: profileError } = await supabase
            .from('profiles')
            .insert([{ username: username }])
            .select('id')
            .single();

        if (profileError) {
            alert("That username is already taken! 🫧");
            resetButton(mainButton, loader);
            return;
        }

        const { error: authError } = await supabase.auth.signUp({
            email: `${newUser.id}@bubblegames.com`,
            password: password,
        });

        if (authError) {
            alert("Auth error! Try again. 🎈");
            resetButton(mainButton, loader);
        } else {
            showWelcome(username);
        }

    } else {
        mainButton.innerText = "LOADING PROFILE...";
        
        const { data: profile, error: searchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (profile) {
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: `${profile.id}@bubblegames.com`,
                password: password,
            });

            if (!loginError) {
                showWelcome(username);
            } else {
                alert("Wrong password! 🔑");
                resetButton(mainButton, loader);
            }
        } else {
            alert("Player not found! ✨");
            resetButton(mainButton, loader);
        }
    }
};

function resetButton(btn, ldr) {
    ldr.style.display = 'none';
    btn.style.opacity = '1';
    btn.disabled = false;
    btn.innerText = "Let's Play! 🫧"; // Always stay fun!
}

// 4. UI SWAP TO HUB
function showWelcome(user) {
    const authArea = document.getElementById('auth-area');
    const hubArea = document.getElementById('hub-area');
    const userStatus = document.getElementById('user-status');
    const displayUsername = document.getElementById('display-username');
    const pageTitle = document.getElementById('page-title');

    if (authArea) authArea.style.display = 'none';
    if (hubArea) hubArea.style.display = 'block';
    if (userStatus) userStatus.style.display = 'flex';
    if (displayUsername) displayUsername.innerText = user;
    if (pageTitle) pageTitle.innerText = "Welcome Back!";

    if (window.renderGameList) window.renderGameList();
}

// 5. AUTO-LOGIN CHECK
const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const playerID = user.email.split('@')[0];
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', playerID)
            .single();

        if (profile) showWelcome(profile.username);
    }
};

checkSession();

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
};
