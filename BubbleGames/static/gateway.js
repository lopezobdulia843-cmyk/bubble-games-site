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

        const { data, error } = await supabase
            .from('profiles')
            .insert([{ username: username }])
            .select();

        if (error) {
            alert("Error: " + error.message);
            mainButton.innerText = "Create Account!";
            return;
        }

        console.log("Account Created for ID:", data[0].id);
        showWelcome(username);

    } else {
        mainButton.innerText = "VERIFYING...";
        
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

function showWelcome(user) {
    const card = document.querySelector('.bubble-card');
    const pageTitle = document.getElementById('page-title');

    card.style.display = 'none';
    pageTitle.innerText = `Welcome ${user}!`;
    pageTitle.style.fontSize = "3rem";
    pageTitle.classList.add('bouncy-animation');

    setTimeout(() => {
        console.log("Launching Bubbles...");
        // Launch game here
    }, 2000);
}
