// Get the necessary elements
const profile = document.querySelector('.profile');
const profilePic = document.querySelector('.profile-img');
const floatingIntro = document.getElementById('intro-block');

// Variables for managing hover state
let isHovered = false;
let timeoutId = null;

// Function to show introduction
const showIntro = () => {
    isHovered = true;
    clearTimeout(timeoutId);

    // Show and animate the intro
    floatingIntro.classList.add('show'); // Add class to show intro
    profilePic.style.transform = 'scale(1.05)';
};

// Function to hide introduction
const hideIntro = () => {
    isHovered = false;
    profilePic.style.transform = 'scale(1)';

    // Animate out
    floatingIntro.classList.remove('show'); // Remove class to hide intro
};

// Mouse enter event
profile.addEventListener('mouseenter', showIntro);

// Mouse leave event
profile.addEventListener('mouseleave', hideIntro);

// Touch support for mobile devices
profile.addEventListener('touchstart', (e) => {
    e.preventDefault();

    if (floatingIntro.classList.contains('show')) {
        hideIntro();
    } else {
        showIntro();
    }
});

// Close intro when clicking outside
document.addEventListener('click', (e) => {
    if (!profile.contains(e.target) && !floatingIntro.contains(e.target)) {
        hideIntro();
    }
});

// Add resize handler to reposition intro on window resize
window.addEventListener('resize', () => {
    if (floatingIntro.classList.contains('show')) {
        // Get profile position
        const profileRect = profile.getBoundingClientRect();

        // Update intro position
        floatingIntro.style.top = `${profileRect.top}px`;
        floatingIntro.style.right = '20px'; // Adjust as necessary
    }
});

