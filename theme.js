// theme.js - Simple theme management
document.addEventListener('DOMContentLoaded', function() {
    // Get current theme or set default to 'light'
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Apply the theme immediately
    applyTheme(currentTheme);
    
    // Add theme toggle functionality
    setupThemeToggle();
});

function applyTheme(theme) {
    console.log('Applying theme:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateToggleButton(theme);
}

function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    
    if (toggleBtn) {
        console.log('Theme toggle button found');
        toggleBtn.addEventListener('click', function() {
            console.log('Toggle button clicked');
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });
        
        // Set initial button text
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        updateToggleButton(currentTheme);
    } else {
        console.log('Theme toggle button not found');
    }
}

function updateToggleButton(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        if (theme === 'light') {
            toggleBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
    }
}