// Main script for general functionality

// Mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        }
    });
});

// Add rainbow effect to all text elements
document.querySelectorAll('p, .about-text p, .footer-section p').forEach(element => {
    const originalText = element.textContent;
    element.innerHTML = '';
    
    // Split text into individual characters and wrap each in a span
    for (let i = 0; i < originalText.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = originalText[i];
        charSpan.style.transition = 'color 0.3s ease';
        charSpan.style.cursor = 'default';
        
        // Add hover effect
        charSpan.addEventListener('mouseover', () => {
            const colors = ['#ff6b6b', '#ff9e6b', '#ffd56b', '#a3ff6b', '#6bffd5', '#6ba3ff', '#9e6bff', '#ff6bff', '#ff6b9e'];
            charSpan.style.color = colors[Math.floor(Math.random() * colors.length)];
        });
        
        charSpan.addEventListener('mouseout', () => {
            charSpan.style.color = '';
        });
        
        element.appendChild(charSpan);
    }
});