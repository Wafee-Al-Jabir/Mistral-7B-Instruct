# AI Teachable Chatbot

A modern, responsive chatbot application that combines AI capabilities with a teachable knowledge base. The chatbot uses Google's Gemini 2.0 Flash model via OpenRouter API and can learn from user interactions.

## Features

### 🤖 AI-Powered Responses
- Integration with Google's Gemini 2.0 Flash model via OpenRouter
- Maintains conversation context for natural interactions
- Fallback to local knowledge base when AI service is unavailable

### 📚 Teachable Knowledge Base
- Add custom question-answer pairs
- View and manage stored knowledge
- Clear knowledge base functionality
- JSON-based storage for easy backup

### 💬 Modern Chat Interface
- Real-time messaging with typing indicators
- Responsive design for mobile and desktop
- Dark mode support
- Message timestamps
- Chat export functionality

### 🎨 User Experience
- Beautiful gradient design
- Smooth animations and transitions
- Toast notifications for user feedback
- Keyboard shortcuts (Ctrl+K to focus input, Esc to close modals)
- Sidebar navigation with quick actions

## Prerequisites

- Python 3.7 or higher
- OpenRouter API key (for AI functionality)

## Installation

### 1. Clone or Download the Project
```bash
git clone <repository-url>
cd "Teachable Chatbot"
```

### 2. Create Virtual Environment
```bash
python -m venv .venv
```

### 3. Activate Virtual Environment

**Windows (Command Prompt/PowerShell):**
```bash
.venv\Scripts\activate
```

**Windows (Git Bash):**
```bash
.venv/Scripts/activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Configure API Key

Open `app.py` and replace the placeholder with your actual OpenRouter API key:

```python
OPENROUTER_API_KEY = "your_openrouter_api_key_here"
```

**Getting an OpenRouter API Key:**
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to the API Keys section
4. Generate a new API key
5. Copy and paste it into your `app.py` file

### 6. Run the Application
```bash
python app.py
```

The application will start on `http://localhost:5000`

## Usage

### Basic Chat
1. Type your message in the input field
2. Press Enter or click the send button
3. The AI will respond using Google's Gemini model
4. If AI is unavailable, it falls back to the knowledge base

### Teaching the Chatbot
1. Click the "Teach Mode" button in the header
2. Enter a question and its corresponding answer
3. Click "Save" to add it to the knowledge base
4. The chatbot will use this information for future responses

### Managing Knowledge Base
1. Open the sidebar using the menu button
2. Click "View Knowledge" to see all stored Q&A pairs
3. Click "Clear Knowledge" to remove all stored data

### Chat Management
1. Use "Clear Chat" to remove conversation history
2. Use "Export Chat" to download chat history as JSON
3. Conversation history is automatically saved in browser storage

## Project Structure

```
Teachable Chatbot/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── knowledge_base.json   # Stored Q&A pairs (created automatically)
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── style.css         # Main stylesheet
│   ├── responsive.css    # Responsive design styles
│   ├── script.js         # Frontend JavaScript
│   └── images/           # Image assets (if any)
└── .venv/                # Virtual environment (created by you)
```

## API Endpoints

### POST `/api/chat`
Send a message to the chatbot

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "conversation_history": [
    {"role": "user", "content": "Previous message"},
    {"role": "assistant", "content": "Previous response"}
  ]
}
```

**Response:**
```json
{
  "response": "I'm doing well, thank you!",
  "source": "ai"
}
```

### POST `/api/teach`
Add new knowledge to the chatbot

**Request Body:**
```json
{
  "question": "What is Python?",
  "answer": "Python is a programming language."
}
```

### GET `/api/knowledge`
Retrieve all stored knowledge

**Response:**
```json
{
  "What is Python?": "Python is a programming language.",
  "How to install Flask?": "Use pip install Flask"
}
```

### DELETE `/api/knowledge`
Clear all stored knowledge

## Configuration

### Environment Variables (Recommended)
For production use, consider using environment variables:

1. Install python-dotenv (already in requirements.txt)
2. Create a `.env` file:
```
OPENROUTER_API_KEY=your_actual_api_key_here
FLASK_ENV=production
```

3. Update `app.py` to use environment variables:
```python
import os
from dotenv import load_dotenv

load_dotenv()
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
```

### Customization

**Change AI Model:**
In `app.py`, modify the model parameter:
```python
data = {
    "model": "google/gemini-2.0-flash-exp:free",  # Change this
    # ... other parameters
}
```

**Adjust Response Length:**
Modify the `max_tokens` parameter in the `get_ai_response` function.

**Conversation History Limit:**
Change the slice value in `getConversationHistoryForAPI()` function in `script.js`.

## Troubleshooting

### Common Issues

**Virtual Environment Activation Error:**
- Ensure you're using the correct path separator for your OS
- On Windows: `\` (backslash)
- On macOS/Linux: `/` (forward slash)

**API Key Issues:**
- Verify your OpenRouter API key is correct
- Check your OpenRouter account has sufficient credits
- Ensure the API key has proper permissions

**Port Already in Use:**
```bash
# Change the port in app.py
app.run(debug=True, port=5001)  # Use different port
```

**Dependencies Installation Failed:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Browser Issues
- Clear browser cache and cookies
- Disable browser extensions that might interfere
- Check browser console for JavaScript errors

## Security Considerations

- Never commit API keys to version control
- Use environment variables for sensitive data
- Implement rate limiting for production use
- Validate and sanitize user inputs
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the browser console for errors
3. Ensure all dependencies are properly installed
4. Verify your API key configuration

## Future Enhancements

- [ ] Voice input/output support
- [ ] File upload capabilities
- [ ] Multi-language support
- [ ] User authentication
- [ ] Chat rooms/channels
- [ ] Advanced text formatting
- [ ] Plugin system
- [ ] Database integration
- [ ] Docker containerization
- [ ] Progressive Web App (PWA) features

---

**Enjoy chatting with your AI-powered teachable chatbot!** 🤖✨