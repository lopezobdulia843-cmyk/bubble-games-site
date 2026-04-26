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

    // --- START BUBBLE LOADING ---
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
            alert("That username is already taken! Pick another cool name. 🫧");
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
                alert("Wrong password! Give it another shot. 🔑");
                loader.style.display = 'none';
                mainButton.style.opacity = '1';
                mainButton.disabled = false;
                mainButton.innerText = "Let's Play!";
            }
        } else {
            alert("We couldn't find that player! Want to Sign Up instead? ✨");
            loader.style.display = 'none';
            mainButton.style.opacity = '1';
            mainButton.disabled = false;
            mainButton.innerText = "Let's Play!";
        }
    }
};

function showWelcome(user) {
    const card = document.querySelector('.bubble-card');
    const pageTitle = document.getElementById('page-title');
    const userStatus = document.getElementById('user-status');
    const displayUser = document.getElementById('display-username');

    card.style.display = 'none';

    pageTitle.innerText = `Welcome ${user}!`;
    pageTitle.style.fontSize = "3rem";
    pageTitle.classList.add('bouncy-animation');

    if (userStatus && displayUser) {
        userStatus.style.display = 'flex';
        displayUser.innerText = user;
    }

    setTimeout(() => { console.log("Game Start! 🫧🚀"); }, 2000);
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
