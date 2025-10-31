// login.js - Enhanced version for new design
document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("loginForm");
    const errorDiv = document.getElementById("error");
    const submitBtn = form.querySelector('button[type="submit"]');

    // Initialize error display
    errorDiv.style.display = 'none';

    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        // Hide previous errors
        errorDiv.style.display = 'none';
        
        // Get form data
        const data = {
            email: form.email.value.trim(),
            password: form.password.value
        };

        // Validate required fields
        if (!data.email || !data.password) {
            showError("Please fill in all required fields");
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        submitBtn.disabled = true;

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Store JWT token in localStorage
                localStorage.setItem("token", result.token);
                
                // Show success message briefly before redirect
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
                submitBtn.style.background = 'linear-gradient(135deg, #00b894 0%, #00a085 100%)';
                
                setTimeout(() => {
                    window.location.href = "/home";
                }, 1000);
            } else {
                showError(result.message || "Invalid email or password. Please try again.");
            }
        } catch (error) {
            console.error("Login error:", error);
            showError("Network error. Please check your connection and try again.");
        } finally {
            // Restore button state (unless we're redirecting)
            if (!localStorage.getItem("token")) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Add shake animation to error element
        errorDiv.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            errorDiv.style.animation = '';
        }, 500);
    }

    // Add real-time validation styling
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    emailInput.addEventListener('input', function() {
        validateEmailField(this);
    });

    passwordInput.addEventListener('input', function() {
        validatePasswordField(this);
    });

    function validateEmailField(field) {
        const email = field.value.trim();
        const icon = field.parentElement.querySelector('i');
        
        if (email === '') {
            field.style.borderColor = '#e1e5e9';
            icon.style.color = '#666';
        } else if (isValidEmail(email)) {
            field.style.borderColor = '#00b894';
            icon.style.color = '#00b894';
        } else {
            field.style.borderColor = '#e74c3c';
            icon.style.color = '#e74c3c';
        }
    }

    function validatePasswordField(field) {
        const password = field.value;
        const icon = field.parentElement.querySelector('i');
        
        if (password === '') {
            field.style.borderColor = '#e1e5e9';
            icon.style.color = '#666';
        } else if (password.length >= 6) {
            field.style.borderColor = '#00b894';
            icon.style.color = '#00b894';
        } else {
            field.style.borderColor = '#e74c3c';
            icon.style.color = '#e74c3c';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);

    // Auto-focus on email field
    emailInput.focus();
});