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

        // 1. Just send the username. The database will make the ID (1, 2, 3...)
        // .select('id').single() tells the database: "Send that new ID back to me immediately!"
        const { data: newUser, error: profileError } = await supabase
            .from('profiles')
            .insert([{ username: username }])
            .select('id')
            .single();

        if (profileError) {
            alert("Username taken! Try another.");
            mainButton.innerText = "Create Account!";
            return;
        }

        // 2. Now we have the clean ID (like 1 or 2)! Use it for the Vault.
        const playerID = newUser.id;
        const ghostEmail = `${playerID}@bubblegames.com`;

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

// This runs as soon as the file loads
const checkSession = async () => {
    // 1. Ask Supabase if a session exists
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // 2. Extract the ID from the email (e.g., "1" from "1@bubblegames.com")
        const playerID = user.email.split('@')[0];

        // 3. Get the username for that ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', playerID)
            .single();

        if (profile) {
            // 4. Skip the login card and show the welcome!
            showWelcome(profile.username);
        }
    }
};

checkSession();
