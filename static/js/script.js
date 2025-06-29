class TeachableChatbot {
    async generateImage(prompt) {
        try {
            this.setLoading(true);
            const response = await fetch('/generate_image', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ prompt: prompt })
            });

            if (response.ok) {
                const imageBlob = await response.blob();
                const imageUrl = URL.createObjectURL(imageBlob);
                this.addMessage(`<img src="${imageUrl}" class="generated-image">`, 'bot');
            } else {
                this.addMessage('Image generation failed', 'bot', true);
            }
        } catch (error) {
            console.error('Image generation error:', error);
            this.addMessage('Error generating image', 'bot', true);
        } finally {
            this.setLoading(false);
        }
    }

    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.userInput = document.getElementById('user-input');
        this.sendButton = document.getElementById('send-btn');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.chatList = document.getElementById('chatList');

        this.userInitial = document.getElementById('userInitial');
        this.isLoading = false;
        this.currentChatId = null;
        this.chats = [];
        
        this.initializeEventListeners();
        this.loadChatHistory();
        this.addWelcomeMessage();
        this.loadUserInfo();
    }
    
    initializeEventListeners() {
        // Send button click
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }
        
        // Enter key press and auto-resize textarea
        if (this.userInput) {
            this.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            this.userInput.addEventListener('input', () => {
                this.userInput.style.height = 'auto';
                this.userInput.style.height = this.userInput.scrollHeight + 'px';
            });
        }
        
        // Sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // New chat button
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.startNewChat());
        }
        
        // Logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        // Image generation handler
        document.getElementById('generate-image-btn')?.addEventListener('click', async () => {
            const prompt = prompt('Enter image description:');
            if (prompt) await this.generateImage(prompt);
        });
        
        // Header logout button removed - dropdown disabled
        

        
        // User profile dropdown - disabled
        // if (this.userProfileBtn) {
        //     this.userProfileBtn.addEventListener('click', (e) => {
        //         e.stopPropagation();
        //         this.toggleUserDropdown();
        //     });
        // }
        
        // Close dropdown when clicking outside - disabled
        // document.addEventListener('click', (e) => {
        //     if (!this.userProfileBtn?.contains(e.target) && !this.userDropdown?.contains(e.target)) {
        //         this.hideUserDropdown();
        //     }
        // });
        

    }
    
    async loadChatHistory() {
        try {
            const response = await fetch('/get_chats');
            if (response.ok) {
                const data = await response.json();
                this.chats = data.chats || [];
                this.renderChatHistory();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    renderChatHistory() {
        if (!this.chatList) return;
        
        this.chatList.innerHTML = '';
        
        if (this.chats.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'chat-item empty';
            emptyDiv.innerHTML = `
                <div class="chat-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <div class="chat-title">No chats yet</div>
            `;
            this.chatList.appendChild(emptyDiv);
            return;
        }
        
        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
            chatItem.dataset.chatId = chat.id;
            
            const date = new Date(chat.created_at).toLocaleDateString();
            
            chatItem.innerHTML = `
                <div class="chat-icon">
                    <i class="fas fa-comment"></i>
                </div>
                <div class="chat-info">
                    <div class="chat-title" data-chat-id="${chat.id}">${chat.title}</div>
                    <div class="chat-date">${date}</div>
                </div>
                <div class="chat-actions">
                    <button class="edit-chat-btn" title="Edit Chat Name" onclick="event.stopPropagation(); chatbot.editChatName('${chat.id}', this)">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-chat-btn" title="Delete Chat" onclick="event.stopPropagation(); chatbot.deleteChat('${chat.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            chatItem.addEventListener('click', () => this.loadChat(chat.id));
            this.chatList.appendChild(chatItem);
        });
    }
    
    async loadChat(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (!chat) return;
        
        this.currentChatId = chatId;
        this.messagesContainer.innerHTML = '';
        
        // Load chat messages
        if (chat.messages && chat.messages.length > 0) {
            chat.messages.forEach(message => {
                this.addMessage(message.content, message.role === 'user' ? 'user' : 'bot', false, false);
            });
        } else {
            this.addWelcomeMessage();
        }
        
        // Update active chat in sidebar
        this.renderChatHistory();
        this.scrollToBottom();
    }
    
    async startNewChat() {
        // Show modal to get chat name
        const chatName = await this.showChatNameModal();
        if (!chatName) return;
        
        try {
            const response = await fetch('/create_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: chatName })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentChatId = data.chat.id;
                this.messagesContainer.innerHTML = '';
                this.addWelcomeMessage();
                
                // Remove active state from all chat items
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Reload chat list to show new chat
                this.loadChatHistory();
            }
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    }
    
    addWelcomeMessage() {
        const welcomeMessage = "Hello! I'm Mistral 7B Instruct powered by Wafee. Ask me anything and I'll do my best to help you!";
        this.addMessage(welcomeMessage, 'bot', false, false);
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        
        if (!message || this.isLoading) return;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        
        // Show loading
        this.setLoading(true);
        
        try {
            // Send message to server
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    chat_id: this.currentChatId
                })
            });
            
            if (response.ok) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let fullResponse = '';
                
                // Create a new message div for the bot's streaming response
                const botMessageDiv = this.createMessageElement('', 'bot');
                this.messagesContainer.appendChild(botMessageDiv);
                this.scrollToBottom();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.trim() === '') continue;
                        try {
                            const json_data = JSON.parse(line);
                            console.log('Received chunk:', json_data);
                            if (json_data.type === 'content') {
                                fullResponse += json_data.data;
                                const renderedContent = this.renderMarkdown(fullResponse);
                                if (renderedContent) {
                                    botMessageDiv.querySelector('.message-content').innerHTML = renderedContent;
                                    this.scrollToBottom();
                                }
                            } else if (json_data.type === 'chat_id') {
                                if (!this.currentChatId) {
                                    this.currentChatId = json_data.data;
                                    await this.loadChatHistory();
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing JSON chunk:', e, 'Chunk:', line);
                        }
                    }
                }
                this.setLoading(false);

            } else {
                const data = await response.json();
                if (response.status === 401) {
                    window.location.href = '/auth';
                    return;
                }
                this.addMessage(`Error: ${data.error || 'Something went wrong'}`, 'bot', true);
                this.setLoading(false);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'bot', true);
            this.setLoading(false);
        }
    }
    
    createMessageElement(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message${isError ? ' error' : ''}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = this.formatTime(new Date());
        
        bubbleDiv.appendChild(contentDiv);
        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timestampDiv);
        
        return messageDiv;
    }

    addMessage(content, sender, isError = false, shouldScroll = true) {
        const messageDiv = this.createMessageElement(content, sender, isError);
        const contentDiv = messageDiv.querySelector('.message-content');

        if (!isError) {
            contentDiv.innerHTML = this.renderMarkdown(content);
        } else {
            contentDiv.textContent = content;
        }
        
        this.messagesContainer.appendChild(messageDiv);
        
        if (shouldScroll) {
            this.scrollToBottom();
        }
        this.addCopyEventListeners();
    }
    
    setLoading(loading) {
        this.isLoading = loading;

        if (loading) {
            this.addTypingIndicator();
        } else {
            this.removeTypingIndicator();
        }
        
        // Disable/enable send button
        if (this.sendButton) {
            this.sendButton.disabled = loading;
        }
        if (this.userInput) {
            this.userInput.disabled = loading;
        }
    }

    addTypingIndicator() {
        const typingMessageDiv = this.createMessageElement('', 'bot');
        typingMessageDiv.classList.add('typing-indicator');
        typingMessageDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.messagesContainer.appendChild(typingMessageDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingMessage = this.messagesContainer.querySelector('.typing-indicator');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed');
        }
    }
    
    logout() {
        window.location.href = '/logout';
    }
    
    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }
    addCopyEventListeners() {
        document.querySelectorAll('.copy-code-btn').forEach(button => {
            button.onclick = async () => {
                const codeBlock = button.closest('.code-block-container').querySelector('code');
                if (codeBlock) {
                    try {
                        await navigator.clipboard.writeText(codeBlock.textContent);
                        button.textContent = 'Copied!';
                        setTimeout(() => {
                            button.textContent = 'Copy';
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy: ', err);
                    }
                }
            };
        });
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    renderMarkdown(text) {
        // Enhanced markdown rendering with more features
        return text
            // Code blocks (must be processed before inline code)
            .replace(/```([a-zA-Z]*)?\n?([\s\S]*?)```/g, (match, lang, code) => {
                const language = lang ? lang.toLowerCase() : 'text';
                const escapedCode = this.escapeHtml(code.trim());
                return `
                    <div class="code-block-container" data-lang="${language}">
                        <div class="code-block-header">
                            <span class="code-block-language">${language}</span>
                            <button class="copy-code-btn">Copy</button>
                        </div>
                        <pre><code class="language-${language}">${escapedCode}</code></pre>
                    </div>
                `;
            })
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Italic text
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Strikethrough
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Lists
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^\+ (.+)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in ul tags
            .replace(/(<li>.*<\/li>)/gs, (match) => {
                return `<ul>${match}</ul>`;
            })
            // Blockquotes
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            // Line breaks
            .replace(/\n/g, '<br>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Load user information and set initial
    async loadUserInfo() {
        try {
            const response = await fetch('/get_user_info');
            if (response.ok) {
                const data = await response.json();
                if (data.username && this.userInitial) {
                    this.userInitial.textContent = data.username.charAt(0).toUpperCase();
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            // Fallback to 'U' if error
            if (this.userInitial) {
                this.userInitial.textContent = 'U';
            }
        }
    }
    
    // User dropdown methods removed - functionality disabled
    

    
    // Chat name modal functionality
    showChatNameModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'chat-name-modal';
            modal.innerHTML = `
                <div class="chat-name-modal-content">
                    <div class="chat-name-modal-header">
                        <h3>Name Your Chat</h3>
                        <button class="close-btn">&times;</button>
                    </div>
                    <div class="chat-name-modal-body">
                        <input type="text" id="chatNameInput" placeholder="Enter chat name..." maxlength="50">
                        <div class="chat-name-modal-buttons">
                            <button class="cancel-btn">Cancel</button>
                            <button class="create-btn">Create Chat</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Get elements
            const input = modal.querySelector('#chatNameInput');
            const closeBtn = modal.querySelector('.close-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            const createBtn = modal.querySelector('.create-btn');
            
            // Event handlers
            const closeModal = () => {
                modal.remove();
                resolve(null);
            };
            
            const createChat = () => {
                const name = input.value.trim();
                if (name) {
                    modal.remove();
                    resolve(name);
                }
            };
            
            // Add event listeners
            closeBtn.addEventListener('click', closeModal);
            cancelBtn.addEventListener('click', closeModal);
            createBtn.addEventListener('click', createChat);
            
            // Focus input and handle enter key
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    createChat();
                }
            });
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        });
    }
    
    async editChatName(chatId, editBtn) {
        const chatTitleElement = editBtn.closest('.chat-item').querySelector('.chat-title');
        const currentTitle = chatTitleElement.textContent;
        
        // Create inline input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'chat-title-input';
        input.maxLength = 50;
        
        // Replace title with input
        chatTitleElement.style.display = 'none';
        chatTitleElement.parentNode.insertBefore(input, chatTitleElement.nextSibling);
        
        // Focus and select text
        input.focus();
        input.select();
        
        // Handle save/cancel
        const saveEdit = async () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== currentTitle) {
                try {
                    const response = await fetch('/rename_chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            chat_id: chatId,
                            new_title: newTitle
                        })
                    });
                    
                    if (response.ok) {
                        chatTitleElement.textContent = newTitle;
                        // Update the chat in our local array
                        const chat = this.chats.find(c => c.id === chatId);
                        if (chat) chat.title = newTitle;
                    } else {
                        console.error('Failed to rename chat');
                    }
                } catch (error) {
                    console.error('Error renaming chat:', error);
                }
            }
            
            // Restore original display
            input.remove();
            chatTitleElement.style.display = '';
        };
        
        const cancelEdit = () => {
            input.remove();
            chatTitleElement.style.display = '';
        };
        
        // Event listeners
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        input.addEventListener('blur', saveEdit);
        
        // Stop propagation to prevent chat loading
        input.addEventListener('click', (e) => e.stopPropagation());
    }
    
    async deleteChat(chatId) {
        if (!confirm('Are you sure you want to delete this chat?')) return;
        
        try {
            const response = await fetch('/delete_chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ chat_id: chatId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // If deleted chat was current, start new chat
                if (this.currentChatId === chatId) {
                    this.currentChatId = null;
                    this.messagesContainer.innerHTML = '';
                    this.addWelcomeMessage();
                }
                
                // Reload chat list
                this.loadChatHistory();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new TeachableChatbot();
});