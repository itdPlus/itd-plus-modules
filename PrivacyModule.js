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
        // Используем переменные сайта для бордера и фона
        row.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--color-border-light, rgba(0,0,0,0.05));
            width: 100%;
            background: transparent;
        `;

        const textPart = document.createElement('div');
        textPart.style.cssText = 'display:flex;flex-direction:column;gap:.25rem;pointer-events:none;';
        
        // Цвет заголовка: var(--color-text), описание: var(--color-text-secondary)
        textPart.innerHTML = `
            <div style="font-size:14px;font-weight:500;color:var(--color-text, #0f1419);line-height:20px;font-family:inherit;">Приватный профиль</div>
            <div style="font-size:12px;color:var(--color-text-secondary, #9ca3af);line-height:1.4;font-family:inherit;">Скрывает ваш профиль от пользователей (Бета тестирование)</div>
        `;

        const btn = document.createElement('button');
        btn.id = 'itd-private-btn';
        // Фон выключенной кнопки берем из системного цвета инпутов/второстепенного фона
        btn.style.cssText = `
            cursor: pointer;
            border: none;
            outline: none;
            width: 48px;
            height: 28px;
            border-radius: 14px;
            padding: 2px;
            transition: background-color 0.2s ease;
            flex-shrink: 0;
            position: relative;
            background-color: var(--color-item-bg, #eff3f4);
            margin: 0;
        `;
        
        const circle = document.createElement('div');
        circle.style.cssText = 'width:24px;height:24px;background:#fff;border-radius:50%;transition:transform 0.2s ease;transform:translateX(0);box-shadow:0 1px 3px rgba(0,0,0,0.2);';
        
        btn.appendChild(circle);

        const updateUI = (state) => {
            // При включении используем основной акцентный цвет сайта
            btn.style.backgroundColor = state ? 'var(--color-primary, #1d9bf0)' : 'var(--color-item-bg, #eff3f4)';
            circle.style.transform = state ? 'translateX(20px)' : 'translateX(0)';
        };

        btn.onclick = async (e) => {
            e.preventDefault();
            isPrivateStatus = !isPrivateStatus;
            updateUI(isPrivateStatus);
            await updatePrivacyAPI(isPrivateStatus);
        };

        row.appendChild(textPart);
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
                } catch (e) { console.error('ITD Privacy Error:', e); }
            }
        })();
    };

    const observer = new MutationObserver(() => {
        const items = document.querySelectorAll('.settings-modal__toggle-item');
        const hasOriginal = Array.from(items).some(el => el.textContent.includes('Закрыть стену'));
        if (hasOriginal) injectPrivacySlider();
    });
    observer.observe(document.body, { childList: true, subtree: true });
};
