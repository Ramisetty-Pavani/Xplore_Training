const form = document.querySelector('#user-form');
const submitButton = document.querySelector('#submit-button');
const message = document.querySelector('#form-message');
const userList = document.querySelector('#user-list');
const memberCount = document.querySelector('#member-count');

function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type}`;
}

function renderUsers(users) {
    const orderedUsers = [...users].sort((first, second) => second.id - first.id);
    memberCount.textContent = `${orderedUsers.length} ${orderedUsers.length === 1 ? 'member' : 'members'}`;
    userList.replaceChildren();

    if (orderedUsers.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'Be the first to create a profile.';
        userList.append(emptyState);
        return;
    }

    for (const user of orderedUsers) {
        const card = document.createElement('article');
        card.className = 'user-card';

        const initial = document.createElement('span');
        initial.className = 'user-initial';
        initial.setAttribute('aria-hidden', 'true');
        initial.textContent = user.name?.trim().charAt(0).toUpperCase() || '?';

        const details = document.createElement('div');
        details.className = 'user-details';

        const name = document.createElement('strong');
        name.textContent = user.name;

        const email = document.createElement('span');
        email.textContent = user.email;

        details.append(name, email);
        card.append(initial, details);

        if (user.bio) {
            const bio = document.createElement('span');
            bio.className = 'user-bio';
            bio.textContent = user.bio;
            details.append(bio);
        }

        userList.append(card);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Could not load profiles. Please refresh to try again.');
        }
        renderUsers(await response.json());
    } catch (error) {
        memberCount.textContent = 'Unable to load profiles';
        userList.replaceChildren();
        const errorMessage = document.createElement('p');
        errorMessage.className = 'empty-state';
        errorMessage.textContent = error.message || 'Could not load profiles.';
        userList.append(errorMessage);
    }
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    submitButton.disabled = true;
    showMessage('', '');

    const formData = new FormData(form);
    const user = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.detail || errorBody?.message
                || 'Could not create your profile. Check your details and try again.');
        }

        const createdUser = await response.json();
        form.reset();
        showMessage(`Welcome, ${createdUser.name}! Your profile is ready.`, 'success');
        await loadUsers();
    } catch (error) {
        showMessage(error.message || 'Something went wrong. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
    }
});

loadUsers();
