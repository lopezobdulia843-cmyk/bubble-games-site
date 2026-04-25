function createBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';

    // 1. Random Size
    const size = Math.random() * 60 + 20 + "px";
    bubble.style.width = size;
    bubble.style.height = size;

    // 2. Random Start Position (Left to Right)
    bubble.style.left = Math.random() * 100 + "vw";

    // 3. Random Speed
    const duration = Math.random() * 4 + 6 + "s";
    bubble.style.animation = `floatUp ${duration} linear forwards`;

    // 4. Interaction: Pop on Click!
    bubble.addEventListener('mousedown', () => {
        bubble.style.transform = 'scale(1.5)';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 100);
    });

    document.body.appendChild(bubble);

    // Remove bubble after it floats away so the computer doesn't get slow
    setTimeout(() => {
        bubble.remove();
    }, 10000);
}

// Create a new bubble every 500 milliseconds
setInterval(createBubble, 500);

// Add the movement animation to the page
const style = document.createElement('style');
style.innerHTML = `
    @keyframes floatUp {
        from { transform: translateY(0); }
        to { transform: translateY(-120vh); }
    }
`;
document.head.appendChild(style);
