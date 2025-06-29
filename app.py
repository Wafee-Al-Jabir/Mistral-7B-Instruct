from flask import Flask, render_template, request, jsonify, session, redirect, url_for, Response, send_file
import json
import requests
from io import BytesIO
import requests
import hashlib
import uuid
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# OpenRouter API configuration
api_key = "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"
api_url = "https://openrouter.ai/api/v1/chat/completions"

def load_users():
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"users": [], "chats": {}}

def save_users(data):
    with open('users.json', 'w') as f:
        json.dump(data, f, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth_page'))
    return render_template('index.html')

@app.route('/auth')
def auth_page():
    return render_template('auth.html')

@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    users_data = load_users()
    hashed_password = hash_password(password)
    
    for user in users_data['users']:
        if user['email'] == email and user['password'] == hashed_password:
            session['user_id'] = user['id']
            session['username'] = user['username']
            return jsonify({'success': True, 'user': {'id': user['id'], 'username': user['username']}})
    
    return jsonify({'success': False, 'message': 'Invalid email or password'})

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    users_data = load_users()
    
    # Check if user already exists
    for user in users_data['users']:
        if user['email'] == email:
            return jsonify({'success': False, 'message': 'Email already registered'})
        if user['username'] == username:
            return jsonify({'success': False, 'message': 'Username already taken'})
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        'id': user_id,
        'username': username,
        'email': email,
        'password': hash_password(password),
        'created_at': datetime.now().isoformat()
    }
    
    users_data['users'].append(new_user)
    users_data['chats'][user_id] = []
    save_users(users_data)
    
    session['user_id'] = user_id
    session['username'] = username
    
    return jsonify({'success': True, 'user': {'id': user_id, 'username': username}})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth_page'))

@app.route('/get_chats')
def get_chats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    users_data = load_users()
    user_chats = users_data['chats'].get(session['user_id'], [])
    return jsonify({'chats': user_chats})

@app.route('/get_user_info')
def get_user_info():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    return jsonify({
        'user_id': session['user_id'],
        'username': session.get('username', 'User')
    })

@app.route('/create_chat', methods=['POST'])
def create_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    chat_name = request.json.get('name', 'New Chat')
    
    users_data = load_users()
    user_id = session['user_id']
    
    chat_id = str(uuid.uuid4())
    new_chat = {
        'id': chat_id,
        'title': chat_name,
        'created_at': datetime.now().isoformat(),
        'messages': []
    }
    
    if user_id not in users_data['chats']:
        users_data['chats'][user_id] = []
    
    users_data['chats'][user_id].append(new_chat)
    save_users(users_data)
    
    return jsonify({'success': True, 'chat': new_chat})

@app.route('/rename_chat', methods=['POST'])
def rename_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    chat_id = request.json.get('chat_id')
    new_name = request.json.get('new_title')  # Changed from 'name' to 'new_title' to match frontend
    
    if not chat_id or not new_name:
        return jsonify({'error': 'Chat ID and name required'}), 400
    
    users_data = load_users()
    user_id = session['user_id']
    
    for chat in users_data['chats'].get(user_id, []):
        if chat['id'] == chat_id:
            chat['title'] = new_name
            save_users(users_data)
            return jsonify({'success': True})
    
    return jsonify({'error': 'Chat not found'}), 404

@app.route('/delete_chat', methods=['POST'])
def delete_chat():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    chat_id = request.json.get('chat_id')
    
    if not chat_id:
        return jsonify({'error': 'Chat ID required'}), 400
    
    users_data = load_users()
    user_id = session['user_id']
    
    user_chats = users_data['chats'].get(user_id, [])
    users_data['chats'][user_id] = [chat for chat in user_chats if chat['id'] != chat_id]
    
    save_users(users_data)
    return jsonify({'success': True})

@app.route('/generate_image', methods=['POST'])
def generate_image():
    try:
        prompt = request.json.get('prompt')
        if not prompt:
            return jsonify({'error': 'No prompt provided'}), 400

        # Call DALL-E API
        response = requests.post(
            'https://api.openai.com/v1/images/generations',
            headers={
                'Authorization': f'Bearer {os.getenv("OPENAI_API_KEY")}',
                'Content-Type': 'application/json'
            },
            json={
                'prompt': prompt,
                'n': 1,
                'size': '512x512'
            }
        )

        if response.status_code == 200:
            image_url = response.json()['data'][0]['url']
            img_data = requests.get(image_url).content
            return send_file(BytesIO(img_data), mimetype='image/png')
        return jsonify({'error': 'Image generation failed'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/chat', methods=['POST'])
def chat():
    try:
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
            
        user_message = request.json.get('message')
        chat_id = request.json.get('chat_id')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Prepare the request to OpenRouter API
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "Mistral 7B Instruct"
        }
        
        data = {
            "model": "mistralai/mistral-7b-instruct:free",
            "messages": [
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        }
        
        # Make request to OpenRouter API with streaming
        response = requests.post(api_url, headers=headers, json=data, stream=True)
        
        if response.status_code == 200:
            user_id = session['user_id']
            def generate(user_id):
                full_bot_response = ""
                current_chat_id = chat_id
                
                # Initial setup for chat saving
                users_data = load_users()
                
                if not current_chat_id:
                    current_chat_id = str(uuid.uuid4())
                    new_chat = {
                        'id': current_chat_id,
                        'title': user_message[:50] + '...' if len(user_message) > 50 else user_message,
                        'created_at': datetime.now().isoformat(),
                        'messages': []
                    }
                    if user_id not in users_data['chats']:
                        users_data['chats'][user_id] = []
                    users_data['chats'][user_id].append(new_chat)
                
                # Add user message to chat history immediately
                for chat_entry in users_data['chats'][user_id]:
                    if chat_entry['id'] == current_chat_id:
                        chat_entry['messages'].append({'role': 'user', 'content': user_message, 'timestamp': datetime.now().isoformat()})
                        break
                save_users(users_data)

                for chunk in response.iter_content(chunk_size=1024):
                    if chunk:
                        try:
                            decoded_chunk = chunk.decode('utf-8')
                            for line in decoded_chunk.splitlines():
                                if line.strip().startswith('data:'):
                                    json_data = line.strip()[len('data:'):].strip()
                                    if json_data:
                                        event_data = json.loads(json_data)
                                        if 'choices' in event_data and event_data['choices']:
                                            delta = event_data['choices'][0].get('delta', {})
                                            if 'content' in delta:
                                                content_chunk = delta['content']
                                                full_bot_response += content_chunk
                                                yield json.dumps({'type': 'content', 'data': content_chunk}) + '\n'
                        except json.JSONDecodeError:
                            continue
                
                # After streaming, save the full bot response to chat history
                for chat_entry in users_data['chats'][user_id]:
                    if chat_entry['id'] == current_chat_id:
                        chat_entry['messages'].append({'role': 'assistant', 'content': full_bot_response, 'timestamp': datetime.now().isoformat()})
                        break
                save_users(users_data)
                
                # Send chat_id as the last piece of information as a separate JSON object
                yield json.dumps({'type': 'chat_id', 'data': current_chat_id}) + '\n'

            return Response(generate(user_id), mimetype='application/json')
        else:
            return jsonify({'error': f'API request failed: {response.status_code}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)