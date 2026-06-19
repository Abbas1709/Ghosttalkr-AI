// Chatbot functionality
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Function to add a message to the chat
function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
    
    // Create span for each character for rainbow effect
    const textContainer = document.createElement('div');
    for (let i = 0; i < text.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.textContent = text[i];
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
        
        textContainer.appendChild(charSpan);
    }
    
    messageDiv.appendChild(textContainer);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to show loading animation
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading');
    loadingDiv.id = 'loading';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('loading-dot');
        loadingDiv.appendChild(dot);
    }
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to hide loading animation
function hideLoading() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Function to send message to backend (LAMA integration)
async function sendMessageToBackend(message) {
    try {
        // Replace this URL with your actual backend API endpoint
        const response = await fetch('https://your-backend-api.com/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error('Error communicating with backend:', error);
        throw error;
    }
}

// Handle send button click
sendBtn.addEventListener('click', async () => {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);
        userInput.value = '';
        
        showLoading();
        
        try {
            const response = await sendMessageToBackend(message);
            hideLoading();
            addMessage(response, false);
        } catch (error) {
            hideLoading();
            addMessage("Sorry, I'm having trouble connecting to the AI service. Please try again later.", false);
            console.error('Error:', error);
        }
    }
});

// Allow sending message with Enter key
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Initialize with focus on input
userInput.focus();