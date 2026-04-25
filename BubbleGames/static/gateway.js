const API_URL = "/status";

// Find the "Let's Play" button using its ID
const playButton = document.getElementById('main-button');

if (playButton) {
    playButton.addEventListener('click', () => {
        console.log("Calling the Roommate Brain...");
        
        // This calls the /status route on the SAME server
        fetch(API_URL)
            .then(response => response.text())
            .then(data => {
                alert("Success! Roommates are talking. Server says: " + data);
            })
            .catch(error => {
                alert("Connection failed! The Brain didn't answer.");
                console.error("Error:", error);
            });
    });
}
