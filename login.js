// Clear any existing sessions on login page load
window.onload = function() {
    console.log('Clearing previous session...');
    sessionStorage.clear();
    localStorage.removeItem('currentUser');
    
    // Reset users for testing
    console.log('Resetting default users...');
    const defaultUsers = [
        {
            id: 'admin1',
            username: 'admin',
            password: 'admin123', // Plain text for now
            role: 'admin',
            name: 'System Admin',
            status: 'active'
        },
        {
            id: 'user_1739866164514',
            name: 'MD HAMIDUL ISLAM',
            username: 'hamidul',
            password: '1234', // Plain text for now
            role: 'manager',
            status: 'active'
        },
        {
            id: 'act1',
            username: 'act',
            password: '123', // Plain text for now
            role: 'accountant',
            name: 'System Accountant',
            status: 'active'
        }
    ];

    // Hash all passwords before storing
    Promise.all(defaultUsers.map(async user => {
        user.password = await hashPassword(user.password);
        return user;
    })).then(hashedUsers => {
        localStorage.setItem('users', JSON.stringify(hashedUsers));
        console.log('Default users reset with hashed passwords');
    });
};

// Hash password using SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Initialize default users if none exist
if (!localStorage.getItem('users')) {
    console.log('Creating default users...');
    const defaultUsers = [
        {
            id: 'admin1',
            username: 'admin',
            password: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin123
            role: 'admin',
            name: 'System Admin',
            status: 'active'
        },
        {
            id: 'user_1739866164514',
            name: 'MD HAMIDUL ISLAM',
            username: 'hamidul',
            password: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', // 1234
            role: 'manager',
            status: 'active'
        },
        {
            id: 'act1',
            username: 'act',
            password: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', // 123
            role: 'accountant',
            name: 'System Accountant',
            status: 'active'
        }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
}

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.replace('index.html');
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            showNotification('Invalid username or password', 'error');
            return;
        }
        
        // Check if user is active
        if (user.status !== 'active') {
            showNotification('Your account is not active. Please contact admin.', 'error');
            return;
        }
        
        // Hash input password and compare
        const hashedPassword = await hashPassword(password);
        if (hashedPassword !== user.password) {
            showNotification('Invalid username or password', 'error');
            return;
        }
        
        // Create session user object
        const sessionUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            status: user.status
        };
        
        // Store in session
        sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
        
        // Show success message
        showNotification('Login successful!', 'success');
        
        // Redirect to main page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login', 'error');
    }
});

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    notification.textContent = message;
    
    // Remove any existing notifications
    document.querySelectorAll('.alert').forEach(alert => alert.remove());
    
    // Add new notification
    document.querySelector('.card-body').insertBefore(notification, document.getElementById('loginForm'));
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle user management (Admin only)
async function addUser(userData) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser?.role !== 'admin') {
        showNotification('Only admin can add users!', 'error');
        return false;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username already exists
    if (users.some(u => u.username === userData.username)) {
        showNotification('Username already exists!', 'error');
        return false;
    }
    
    // Hash password before storing
    userData.password = await hashPassword(userData.password);
    userData.status = 'active';
    users.push(userData);
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// Update user
async function updateUser(userId, userData) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) return false;
    
    if (userData.password) {
        userData.password = await hashPassword(userData.password);
    } else {
        userData.password = users[index].password;
    }
    
    users[index] = { ...users[index], ...userData };
    localStorage.setItem('users', JSON.stringify(users));
    return true;
}

// Delete user
function deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    return true;
}
