// התחברות לשרת הסוקט בפורט הנוכחי
const socket = io();

// אם השרת והלקוח בפרויקטים אחרים
// const socket = io.connect("http://localhost:8000");

const h1 = document.querySelector('h1');
const userForm = document.getElementById('user-form');
const usernameInput = document.getElementById('username');
const colorInput = document.getElementById('user-color');
const statusText = document.getElementById('status');
const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

let myUser = {
    id: null,
    name: null,
    color: '#0088ff'
};

// Handle profile update form submission
userForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = usernameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
        alert('Please enter username.');
        return;
    }

    myUser.name = name;
    myUser.color = color;

    socket.emit('update client details', {
        name: myUser.name,
        color: myUser.color
    });

    statusText.textContent = 'Saving profile...';
    statusText.style.color = '#444';
});

// Handle chat message form submission
form.addEventListener('submit', e => {
    e.preventDefault();

    const message = input.value.trim();
    if (message) {
        socket.emit('new message', message);

        // Clear the input
        input.value = '';
    }
});

// Listen for incoming messages
socket.on('user connected', ({ userId }) => {
    myUser.id = userId;
    h1.textContent += ` - user ${userId}`;
});

socket.on('client details updated', ({ userId, name, color }) => {
    if (userId === myUser.id) {
        h1.textContent += ` (username ${name})`;
        statusText.textContent = 'Profile saved!';
        statusText.style.color = 'green';

        setTimeout(() => {
            statusText.textContent = '';
        }, 2500);
    }
});

socket.on('send message', msgFromServer => {
    const item = document.createElement('li');

    const fromName = msgFromServer.name || 'unknown';
    item.textContent = `${fromName}: ${msgFromServer.msg}`;
    item.style.color = msgFromServer.color || '#000000';

    messages.append(item);

    // Scroll to the bottom
    messages.scrollTop = messages.scrollHeight;
});