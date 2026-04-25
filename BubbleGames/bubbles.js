function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // 1. Random Size
    const size = Math.random() * 60 + 20 + "px";
    bubble.style.width = size;
    bubble.style.height = size;

    // 2. Random Start Position
    bubble.style.left = Math.random() * 100 + "vw";

    // 3. COLOR PICKER (Pink, Blue, or Purple)
    const colors = ['#ec4899', '#4f46e5', '#a855f7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    bubble.style.border = `3px solid ${randomColor}`; // Thick colorful border
    bubble.style.boxShadow = `0 0 15px ${randomColor}44`; // Soft color glow

    // 4. Random Speed
    const duration = Math.random() * 4 + 6 + "s";
    bubble.style.animation = `floatUp ${duration} linear forwards`;

    // 5. Interaction: Pop on Click!
    bubble.addEventListener('mousedown', () => {
        bubble.style.transform = 'scale(1.8)';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 150);
    });

    document.body.appendChild(bubble);

    // Clean up
    setTimeout(() => {
        bubble.remove();
    }, 10000);
}

// Spawn bubbles faster (every 400ms)
setInterval(createBubble, 400);

// Animation
const style = document.createElement('style');
style.innerHTML = `
    @keyframes floatUp {
        from { transform: translateY(0) rotate(0deg); }
        to { transform: translateY(-125vh) rotate(360deg); }
    }
`;
document.head.appendChild(style);
