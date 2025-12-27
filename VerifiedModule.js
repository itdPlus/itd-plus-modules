window.initVerifiedModule = function() {
    'use strict';

    const DB_URL = 'https://itdplusdb-default-rtdb.europe-west1.firebasedatabase.app/presence/';
    let usersCache = {};
    let myData = null;

    const style = document.createElement('style');
    style.innerHTML = `
        .itd-status-badge { display: inline-flex !important; align-items: center; padding: 2px 8px; border-radius: 8px; font-size: 11px; margin-left: 8px; height: 18px; white-space: nowrap; vertical-align: middle; font-weight: 500; transition: all 0.2s; }
        .itd-status-online { background-color: rgba(0, 186, 124, 0.15); color: #00BA7C; }
        .itd-status-offline { background-color: var(--color-border-light); color: var(--color-text-secondary); opacity: 0.8; }
        .itd-verified-wrapper { display: inline-flex !important; align-items: center; vertical-align: middle; flex-shrink: 0; }
        .itd-verified-wrapper svg { display: block; }
        .itd-v-profile svg { width: 20px !important; height: 20px !important; }
        .itd-v-post svg { width: 16px !important; height: 16px !important; }
        .itd-v-list svg { width: 14px !important; height: 14px !important; }
    `;
    document.head.appendChild(style);

    const getSvg = (cls) => `
        <span class="itd-verified-wrapper ${cls}">
            <svg viewBox="0 0 26 26" fill="none">
                <path d="M10.9273 1.33446C11.9818 -0.481205 14.5796 -0.434983 15.5705 1.41752L16.4754 3.10968C16.7303 3.59282 17.1279 3.98562 17.6141 4.23454C18.1003 4.48347 18.6515 4.5764 19.1924 4.50068L21.0681 4.2313C23.1206 3.93663 24.7052 6.0318 23.8992 7.97385L23.1618 9.7498C22.9501 10.2589 22.8965 10.8198 23.0079 11.3598C23.1193 11.8997 23.3906 12.3937 23.7865 12.7774L25.1631 14.1012C26.6696 15.55 26.0471 18.1167 24.0508 18.6859L22.2272 19.2066C21.1554 19.5128 20.3827 20.4632 20.2895 21.5914L20.1306 23.511C19.9558 25.6127 17.5956 26.7177 15.9128 25.4856L14.3745 24.3604C13.9356 24.0378 13.4074 23.8594 12.8628 23.8497C12.3182 23.84 11.784 23.9995 11.3339 24.3062L9.75877 25.3765C8.03483 26.548 5.71361 25.3599 5.61105 23.2532L5.51788 21.3292C5.46299 20.1982 4.72344 19.221 3.66322 18.8772L1.85838 18.2922C-0.116895 17.6516 -0.650617 15.0646 0.905049 13.67L2.32566 12.3967C2.73471 12.027 3.02293 11.5426 3.15278 11.0067C3.28263 10.4708 3.24809 9.90828 3.05366 9.3923L2.37838 7.59252C1.63955 5.6223 3.29561 3.58418 5.33733 3.9518L7.20211 4.28763C7.73982 4.38263 8.29375 4.30938 8.78828 4.07788C9.28282 3.84638 9.69387 3.46791 9.96533 2.99413L10.9273 1.33446Z" fill="#00BA7C"/><path d="M17.3333 10.833L11.5555 16.6108L8.66663 13.7219" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>`;

    const formatTimeAgo = (t) => {
        const d = Math.floor((Date.now() - t) / 1000);
        if (d < 15) return "В сети";
        if (d < 60) return "Был(а) только что";
        if (d < 3600) return `Был(а) ${Math.floor(d/60)} мин. назад`;
        if (d < 86400) return `Был(а) ${Math.floor(d/3600)} ч. назад`;
        return "Не в сети давно";
    };

    const updateCloudData = (id, u) => {
        if (!id) return;
        fetch(`${DB_URL}${id}.json`, {
            method: 'PATCH',
            body: JSON.stringify({
                username: u.username,
                displayName: u.displayName || u.username,
                last_seen: Date.now()
            })
        }).catch(() => {});
    };

    const getVerifiedId = (text) => {
        if (!text || Object.keys(usersCache).length === 0) return null;
        const s = text.replace('@', '').trim().toLowerCase();
        for (const [id, u] of Object.entries(usersCache)) {
            if (u.username?.toLowerCase() === s || u.displayName?.toLowerCase() === s) return id;
        }
        return null;
    };

    const inject = () => {
        const targets = document.querySelectorAll('.post-author, .post-modal__author, .item-author, .toast__text');
        targets.forEach(el => {
            if (el.querySelector('.itd-verified-wrapper') || el.nextElementSibling?.classList.contains('itd-verified-wrapper')) return;
            let text = el.textContent.trim();
            if (el.classList.contains('toast__text')) text = text.split(' ')[0];
            if (getVerifiedId(text)) {
                let cls = el.classList.contains('item-author') ? 'itd-v-list' : 'itd-v-post';
                const p = (el.tagName === 'A' || el.classList.contains('post-modal__author')) ? 'afterend' : 'beforeend';
                el.insertAdjacentHTML(p, getSvg(cls));
            }
        });

        const nameRow = document.querySelector('.profile-bio__name-row.svelte-p40znu');
        if (nameRow) {
            const h1 = nameRow.querySelector('h1');
            if (h1 && !nameRow.querySelector('.itd-v-profile')) {
                if (getVerifiedId(h1.textContent.trim())) h1.insertAdjacentHTML('afterend', getSvg('itd-v-profile'));
            }
        }

        const userEl = document.querySelector('.profile-bio__username');
        if (userEl) {
            const nick = userEl.textContent.split('•')[0].replace('@', '').trim();
            const id = getVerifiedId(nick);
            const badge = userEl.querySelector('.itd-status-badge');
            if (id && usersCache[id]) {
                const txt = formatTimeAgo(usersCache[id].last_seen);
                const on = txt === "В сети";
                if (!badge) {
                    userEl.insertAdjacentHTML('beforeend', `<span class="itd-status-badge ${on ? 'itd-status-online' : 'itd-status-offline'}">${txt}</span>`);
                } else {
                    badge.textContent = txt;
                    badge.className = `itd-status-badge ${on ? 'itd-status-online' : 'itd-status-offline'}`;
                }
            }
        }
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const url = args[0]?.toString() || "";
        const options = args[1] || {};

        if (url.includes('/api/users/me') && options.method === 'PUT') {
            try {
                const payload = JSON.parse(options.body);
                if (myData?.id) updateCloudData(myData.id, payload);
            } catch (e) {}
        }

        const res = await originalFetch(...args);
        if (url.includes('/api/profile') || url.includes('/api/users/me')) {
            res.clone().json().then(d => {
                const u = d.user || d;
                if (u?.id) {
                    if (url.includes('me') || (myData && u.id === myData.id)) {
                        myData = { id: u.id, username: u.username, displayName: u.displayName };
                    }
                    updateCloudData(u.id, u);
                }
            }).catch(() => {});
        }
        return res;
    };

    const sync = () => fetch(`${DB_URL}.json?t=${Date.now()}`).then(r => r.json()).then(d => { usersCache = d || {}; inject(); }).catch(() => {});
    setInterval(sync, 15000);
    sync();

    const observer = new MutationObserver(inject);
    observer.observe(document.body, { childList: true, subtree: true });
};
