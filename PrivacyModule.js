window.initPrivacyModule = function() {
    'use strict';

    let isPrivateStatus = false;
    let lastRegDate = null;
    let cachedToken = null;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = args[0].toString();

        if (args[1] && args[1].headers) {
            const auth = args[1].headers['Authorization'] || args[1].headers['authorization'];
            if (auth) cachedToken = auth;
        }

        if (url.includes('/api/')) {
            const clone = response.clone();
            clone.json().then(data => {
                const date = data.createdAt || 
                             (data.author && data.author.createdAt) || 
                             (data.originalPost && data.originalPost.author && data.originalPost.author.createdAt);
                if (date) {
                    lastRegDate = date;
                    injectRegDate();
                }
                if (data.isPrivate !== undefined) {
                    isPrivateStatus = data.isPrivate;
                    const btn = document.getElementById('itd-private-btn');
                    if (btn) updatePrivacyUI(btn, isPrivateStatus);
                }
            }).catch(() => {});
        }
        return response;
    };

    const getAuthToken = async () => {
        if (cachedToken) return cachedToken;
        const local = localStorage.getItem('token');
        return local ? `Bearer ${local}` : null;
    };

    const formatRegDate = (iso) => {
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} в ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const injectRegDate = () => {
        if (!lastRegDate) return;
        const items = document.querySelectorAll('.profile-meta__item.svelte-p40znu');
        items.forEach(item => {
            if ((item.innerText || "").includes('Регистрация:') && item.dataset.itdDone !== lastRegDate) {
                const svgIcon = item.querySelector('svg');
                const formatted = formatRegDate(lastRegDate);
                item.innerHTML = ''; 
                if (svgIcon) item.appendChild(svgIcon.cloneNode(true));
                const textSpan = document.createElement('span');
                textSpan.innerText = ` Регистрация: ${formatted}`;
                item.appendChild(textSpan);
                item.dataset.itdDone = lastRegDate;
            }
        });
    };

    const updatePrivacyUI = (btn, state) => {
        const circle = btn.querySelector('div');
        if (state) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
            if (circle) circle.style.transform = 'translateX(20px)';
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
            if (circle) circle.style.transform = 'translateX(0)';
        }
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
        btn.style.cssText = 'appearance: none; -webkit-appearance: none; opacity: 1; position: relative;';
        
        const circle = document.createElement('div');
        circle.style.cssText = 'width: 24px; height: 24px; background: var(--color-card); border-radius: 50%; transition: transform 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); pointer-events: none;';
        btn.appendChild(circle);

        updatePrivacyUI(btn, isPrivateStatus);

        btn.onclick = async () => {
            isPrivateStatus = !isPrivateStatus;
            updatePrivacyUI(btn, isPrivateStatus);
            const token = await getAuthToken();
            if (token) {
                fetch('https://xn--d1ah4a.com/api/users/me/privacy', {
                    method: 'PUT',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPrivate: isPrivateStatus })
                });
            }
        };

        row.appendChild(contentDiv);
        row.appendChild(btn);
        originalRow.after(row);
    };

    const observer = new MutationObserver(() => {
        const hasMeta = document.querySelector('.profile-meta__item');
        const hasSettings = document.querySelector('.settings-modal__toggle-item');
        if (hasMeta) injectRegDate();
        if (hasSettings) injectPrivacySlider();
    });

    observer.observe(document.body, { childList: true, subtree: true });
};
