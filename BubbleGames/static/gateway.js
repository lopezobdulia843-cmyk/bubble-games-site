import { supabase } from './supabase.js';

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
        if (password.includes(" ")) {
            alert("No spaces allowed in your password! 🫧");
            return;
        }
        if (password.length < 6) {
            alert("Your password is too short! (At least 6 characters). 🛡️");
            return;
        }
        if (username.includes(" ")) {
            alert("Usernames can't have spaces! ✨");
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
            loader.style.display = 'none';
            mainButton.style.opacity = '1';
            mainButton.disabled = false;
            mainButton.innerText = "Create Account!";
            return;
        }

        const playerID = newUser.id;
        const ghostEmail = `${playerID}@bubblegames.com`;

        const { error: authError } = await supabase.auth.signUp({
            email: ghostEmail,
            password: password,
        });

        if (authError) {
            alert("Something went wrong! Let's try that again. 🎈");
            loader.style.display = 'none';
            mainButton.style.opacity = '1';
            mainButton.disabled = false;
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
                loader.style.display = 'none';
                mainButton.style.opacity = '1';
                mainButton.disabled = false;
                mainButton.innerText = "Let's Play!";
            }
        } else {
            alert("We couldn't find that player! ✨");
            loader.style.display = 'none';
            mainButton.style.opacity = '1';
            mainButton.disabled = false;
            mainButton.innerText = "Let's Play!";
        }
    }
};

// --- SYNCED WITH YOUR HTML IDS ---
function showWelcome(user) {
    const authArea = document.getElementById('auth-area');
    const hubArea = document.getElementById('hub-area');
    const userStatus = document.getElementById('user-status');
    const displayUsername = document.getElementById('display-username');
    const pageTitle = document.getElementById('page-title');

    // Hide Login, Show Hub inside the card
    if (authArea) authArea.style.display = 'none';
    if (hubArea) hubArea.style.display = 'block';
    
    // Show Top-Right Status and update title
    if (userStatus) userStatus.style.display = 'flex';
    if (displayUsername) displayUsername.innerText = user;
    if (pageTitle) pageTitle.innerText = "Welcome Back!";

    // Trigger game rendering from hub.js
    if (window.renderGames) window.renderGames();
}

const checkSession = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const playerID = user.email.split('@')[0];
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', playerID)
            .single();

        if (profile) {
            showWelcome(profile.username);
        }
    }
};

checkSession();

window.handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
};
