// Import the secure connection we planned
import { supabase } from './supabase.js';

// This handles the "Let's Play!" button click
window.handleAuth = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const mainButton = document.getElementById('main-button');
    const welcomeMsg = document.getElementById('page-title'); // We'll use this for the welcome

    if (!username || !password) {
        alert("Enter both username and password, hacker!");
        return;
    }

    // Check if the user is Signing Up or Logging In
    if (mode === "signup") {
        mainButton.innerText = "INITIALIZING...";

        // STEP 1: The Profiles Colmn Handshake
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ username: username }])
            .select();

        if (error) {
            alert("Error: " + error.message);
            mainButton.innerText = "Create Account!";
            return;
        }

        // STEP 2: The Authentication Vault
        // Now that the ID is created, we'd usually link the password here
        console.log("Account Created for ID:", data[0].id);
        showWelcome(username);

    } else {
        mainButton.innerText = "VERIFYING...";
        
        // LOGIN LOGIC: Check if username exists in profiles
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

        if (user) {
            showWelcome(username);
        } else {
            alert("Identity not found in database!");
            mainButton.innerText = "Let's Play!";
        }
    }
};

// The "Welcome [USER]!" Celebration we planned
function showWelcome(user) {
    const card = document.querySelector('.bubble-card');
    const pageTitle = document.getElementById('page-title');

    // 1. Hide the login card
    card.style.display = 'none';

    // 2. Show the Welcome Message
    pageTitle.innerText = `Welcome ${user}!`;
    pageTitle.style.fontSize = "3rem";
    pageTitle.classList.add('bouncy-animation'); // Fits your bouncy style!

    // 3. Launch the game after 2 seconds
    setTimeout(() => {
        console.log("Launching Bubbles...");
        // This is where bubbles.js takes over!
    }, 2000);
}
