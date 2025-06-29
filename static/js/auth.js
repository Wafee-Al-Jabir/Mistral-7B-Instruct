class AuthManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form switching
        document.getElementById('show-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignUpForm();
        });

        document.getElementById('show-signin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignInForm();
        });

        // Form submissions
        document.getElementById('signin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        document.getElementById('signup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });
    }

    showSignUpForm() {
        document.getElementById('signin-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Sign Up';
    }

    showSignInForm() {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('signin-form').style.display = 'block';
        document.getElementById('auth-title').textContent = 'Sign In';
    }

    async handleSignIn() {
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        try {
            const response = await fetch('/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('user', JSON.stringify(result.user));
                window.location.href = '/';
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('An error occurred. Please try again.');
        }
    }

    async handleSignUp() {
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;

        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('user', JSON.stringify(result.user));
                window.location.href = '/';
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('An error occurred. Please try again.');
        }
    }

    showError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.auth-error');
        if (existingError) {
            existingError.remove();
        }

        // Create and show new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error alert alert-danger';
        errorDiv.textContent = message;
        
        const authCard = document.querySelector('.auth-card');
        authCard.insertBefore(errorDiv, authCard.firstChild.nextSibling);

        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});