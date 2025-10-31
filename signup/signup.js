// signup.js - Enhanced version for new design
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const errorDiv = document.getElementById("error");
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Initialize error display
    errorDiv.style.display = 'none';

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';

        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            age: form.age.value,
            password: form.password.value,
            confirmPassword: form.confirmPassword.value
        };

        // Validate required fields
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            showError("Please fill in all required fields");
            return;
        }

        // Validate email format
        if (!isValidEmail(formData.email)) {
            showError("Please enter a valid email address");
            return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            showError("Passwords do not match");
            highlightMismatch();
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            showError("Password must be at least 6 characters long");
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        submitBtn.disabled = true;

        try {
            const res = await fetch("/signup", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    age: formData.age,
                    password: formData.password
                })
            });

            const result = await res.json();
            
            if (result.success) {
                // Store JWT token
                localStorage.setItem("token", result.token);
                
                // Show success state
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Account Created!';
                submitBtn.style.background = 'linear-gradient(135deg, #00b894 0%, #00a085 100%)';
                
                // Redirect after brief success display
                setTimeout(() => {
                    window.location.href = "/home";
                }, 1500);
            } else {
                showError(result.message || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Signup error:", error);
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
        
        // Add shake animation
        errorDiv.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            errorDiv.style.animation = '';
        }, 500);
    }

    function highlightMismatch() {
        const passwordField = document.getElementById('password');
        const confirmField = document.getElementById('confirmPassword');
        
        passwordField.style.borderColor = '#e74c3c';
        confirmField.style.borderColor = '#e74c3c';
        
        const passwordIcon = passwordField.parentElement.querySelector('i');
        const confirmIcon = confirmField.parentElement.querySelector('i');
        
        passwordIcon.style.color = '#e74c3c';
        confirmIcon.style.color = '#e74c3c';
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Real-time field validation
    const fields = {
        name: document.getElementById('name'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        age: document.getElementById('age'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword')
    };

    // Add input event listeners for real-time validation
    Object.entries(fields).forEach(([fieldName, field]) => {
        if (field) {
            field.addEventListener('input', function() {
                validateField(fieldName, this);
            });
        }
    });

    function validateField(fieldName, field) {
        const value = field.value.trim();
        const icon = field.parentElement.querySelector('i');
        
        switch(fieldName) {
            case 'name':
                if (value === '') {
                    field.style.borderColor = '#e1e5e9';
                    icon.style.color = '#666';
                } else if (value.length >= 2) {
                    field.style.borderColor = '#00b894';
                    icon.style.color = '#00b894';
                } else {
                    field.style.borderColor = '#e74c3c';
                    icon.style.color = '#e74c3c';
                }
                break;
                
            case 'email':
                if (value === '') {
                    field.style.borderColor = '#e1e5e9';
                    icon.style.color = '#666';
                } else if (isValidEmail(value)) {
                    field.style.borderColor = '#00b894';
                    icon.style.color = '#00b894';
                } else {
                    field.style.borderColor = '#e74c3c';
                    icon.style.color = '#e74c3c';
                }
                break;
                
            case 'password':
                if (value === '') {
                    field.style.borderColor = '#e1e5e9';
                    icon.style.color = '#666';
                } else if (value.length >= 6) {
                    field.style.borderColor = '#00b894';
                    icon.style.color = '#00b894';
                } else {
                    field.style.borderColor = '#e74c3c';
                    icon.style.color = '#e74c3c';
                }
                break;
                
            case 'confirmPassword':
                const password = fields.password.value;
                if (value === '') {
                    field.style.borderColor = '#e1e5e9';
                    icon.style.color = '#666';
                } else if (value === password) {
                    field.style.borderColor = '#00b894';
                    icon.style.color = '#00b894';
                } else {
                    field.style.borderColor = '#e74c3c';
                    icon.style.color = '#e74c3c';
                }
                break;
                
            default:
                if (value === '') {
                    field.style.borderColor = '#e1e5e9';
                    icon.style.color = '#666';
                } else {
                    field.style.borderColor = '#00b894';
                    icon.style.color = '#00b894';
                }
        }
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

    // Auto-focus on name field
    fields.name.focus();
});