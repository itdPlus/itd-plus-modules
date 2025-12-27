window.initPrivacyModule = function() {
    'use strict';

    let isPrivateStatus = false;
    let cachedToken = null;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        if (args[1] && args[1].headers) {
            const auth = args[1].headers['Authorization'] || args[1].headers['authorization'];
            if (auth) cachedToken = auth;
        }
        return await originalFetch(...args);
    };

    const getAuthToken = async () => {
        if (cachedToken) return cachedToken;
        const local = localStorage.getItem('token');
        if (local) return `Bearer ${local}`;
        try {
            const res = await fetch('https://xn--d1ah4a.com/api/v1/auth/refresh', { method: 'POST' });
            const data = await res.json();
            cachedToken = `Bearer ${data.token}`;
            return cachedToken;
        } catch (e) { return null; }
    };

    const updatePrivacyAPI = async (newState) => {
        const token = await getAuthToken();
        if (!token) return;
        await fetch('https://xn--d1ah4a.com/api/users/me/privacy', {
            method: 'PUT',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPrivate: newState })
        });
    };

    const injectPrivacySlider = () => {
        if (document.getElementById('itd-private-profile-row')) return;

        const items = document.querySelectorAll('.settings-modal__toggle-item');
        let originalRow = null;
        for (let item of items) {
            if (item.textContent.includes('Закрыть стену')) {
                originalRow = item;
                break;
            }
        }

        if (!originalRow) return;

        const row = document.createElement('div');
        row.id = 'itd-private-profile-row';
        row.className = 'settings-modal__toggle-item svelte-1jqzo7p'; 

        const contentDiv = document.createElement('div');
        contentDiv.className = 'settings-modal__toggle-content svelte-1jqzo7p';

        const title = document.createElement('div');
        title.style.cssText = 'color: var(--color-text); font-size: 14px; font-weight: 500;';
        title.innerText = 'Приватный профиль';

        const description = document.createElement('div');
        description.style.cssText = 'color: var(--color-text-secondary); font-size: 12px;';
        description.innerText = 'Скрывает ваш профиль от пользователей (Бета)';

        contentDiv.appendChild(title);
        contentDiv.appendChild(description);

        const btn = document.createElement('button');
        btn.id = 'itd-private-btn';
        btn.className = 'settings-modal__toggle svelte-1jqzo7p';
        btn.setAttribute('type', 'button');
        
        const circle = document.createElement('div');
        circle.style.cssText = `
            width: 24px; height: 24px; background: #fff; border-radius: 50%; 
            transition: transform 0.2s ease; transform: translateX(0);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        `;
        btn.appendChild(circle);

        const updateUI = (state) => {
            if (state) {
                btn.classList.add('active');
                btn.style.backgroundColor = 'var(--color-primary)';
                circle.style.transform = 'translateX(20px)';
            } else {
                btn.classList.remove('active');
                btn.style.backgroundColor = 'var(--color-border)';
                circle.style.transform = 'translateX(0)';
            }
        };

        btn.onclick = async (e) => {
            e.preventDefault();
            isPrivateStatus = !isPrivateStatus;
            updateUI(isPrivateStatus);
            await updatePrivacyAPI(isPrivateStatus);
        };

        row.appendChild(contentDiv);
        row.appendChild(btn);
        originalRow.after(row);

        (async () => {
            const token = await getAuthToken();
            if (token) {
                try {
                    const res = await fetch('https://xn--d1ah4a.com/api/users/me/privacy', { headers: { 'Authorization': token } });
                    const data = await res.json();
                    isPrivateStatus = !!data.isPrivate;
                    updateUI(isPrivateStatus);
                } catch (e) {}
            }
        })();
    };

    const observer = new MutationObserver(() => {
        if (document.querySelector('.settings-modal__toggle-item')) {
            injectPrivacySlider();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};
