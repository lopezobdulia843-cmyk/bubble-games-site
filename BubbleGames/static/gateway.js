import { supabase } from './supabase.js';

window.handleAuth = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const mainButton = document.getElementById('main-button');

    if (!username || !password) {
        alert("Enter both username and password, hacker!");
        return;
    }

    if (window.mode === "signup") {
        mainButton.innerText = "INITIALIZING...";

        // 1. Create a unique ID based on the current time
        const playerID = Date.now(); 
        const ghostEmail = `${playerID}@bubblegames.com`;

        // 2. Push to the Profiles table first
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: playerID, username: username }]);

        if (profileError) {
            alert("Username taken! Try another.");
            mainButton.innerText = "Create Account!";
            return;
        }

        // 3. Push to the Authentication Vault (The ID-Email style)
        const { error: authError } = await supabase.auth.signUp({
            email: ghostEmail,
            password: password,
        });

        if (authError) {
            alert("Auth Error: " + authError.message);
        } else {
            showWelcome(username);
        }

    } else {
        mainButton.innerText = "VERIFYING...";
        
        // LOGIN LOGIC: 
        // 1. Find the ID for this username
        const { data: profile, error: searchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (profile) {
            // 2. Login using the ID-Email
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: `${profile.id}@bubblegames.com`,
                password: password,
            });

            if (!loginError) {
                showWelcome(username);
            } else {
                alert("Wrong password!");
                mainButton.innerText = "Let's Play!";
            }
        } else {
            alert("Username not found!");
            mainButton.innerText = "Let's Play!";
        }
    }
};

function showWelcome(user) {
    const card = document.querySelector('.bubble-card');
    const pageTitle = document.getElementById('page-title');
    card.style.display = 'none';
    pageTitle.innerText = `Welcome ${user}!`;
    pageTitle.style.fontSize = "3rem";
    pageTitle.classList.add('bouncy-animation');
    setTimeout(() => { console.log("Launching Bubbles..."); }, 2000);
}
