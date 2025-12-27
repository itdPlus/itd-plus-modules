window.initPrivacyModule = function() {
    'use strict';

    let isPrivateStatus = false;
    let cachedToken = null;

    const getAuthToken = async () => {
        if (cachedToken) return cachedToken;
        const local = localStorage.getItem('token');
        if (local) return `Bearer ${local}`;
        return null; 
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

        const originalRow = Array.from(document.querySelectorAll('.settings-modal__toggle-item'))
                                .find(el => el.textContent.includes('Закрыть стену'));

        if (!originalRow) return;

        const row = document.createElement('div');
        row.id = 'itd-private-profile-row';
        row.className = 'settings-modal__toggle-item svelte-1jqzo7p'; 

        const contentDiv = document.createElement('div');
        contentDiv.className = 'settings-modal__toggle-content svelte-1jqzo7p';
        contentDiv.innerHTML = `
            <div style="color: var(--color-text); font-size: 14px; font-weight: 500;">Приватный профиль</div>
            <div style="color: var(--color-text-secondary); font-size: 12px; margin-top: 0.25rem;">Скрывает ваш профиль от пользователей (Бета)</div>
        `;

        const btn = document.createElement('button');
        btn.id = 'itd-private-btn';
        btn.className = 'settings-modal__toggle svelte-1jqzo7p';
        btn.setAttribute('type', 'button');
        
        btn.style.appearance = 'none';
        btn.style.webkitAppearance = 'none';
        btn.style.opacity = '1';
        btn.style.border = 'none';
        btn.style.position = 'relative';

        const circle = document.createElement('div');
        circle.style.cssText = `
            width: 24px; height: 24px; background: #fff; border-radius: 50%; 
            transition: transform 0.2s ease; transform: translateX(0);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2); pointer-events: none;
        `;
        btn.appendChild(circle);

        const updateUI = (state) => {
            if (state) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                circle.style.transform = 'translateX(20px)';
                btn.style.backgroundColor = ''; 
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
                circle.style.transform = 'translateX(0)';
                btn.style.backgroundColor = '';
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
