(function() {
    'use strict';

    let lastViewedUserId = null;

    const getBlacklist = () => JSON.parse(localStorage.getItem('itd_blacklist') || '[]');
    const saveBlacklist = (list) => localStorage.setItem('itd_blacklist', JSON.stringify([...new Set(list)]));

    const getHashBlacklist = () => JSON.parse(localStorage.getItem('itd_blacklist_hashtags') || '[]');
    const saveHashBlacklist = (list) => localStorage.setItem('itd_blacklist_hashtags', JSON.stringify(list));

    const interceptFetch = () => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0].toString();
            const response = await originalFetch(...args);

            if (url.includes('/api/users/') && !url.includes('/banner')) {
                const clone = response.clone();
                clone.json().then(data => { if (data.id) lastViewedUserId = data.id; }).catch(() => {});
            }

            if (url.includes('/api/hashtags/trending')) {
                const hashBlacklist = getHashBlacklist();
                if (hashBlacklist.length > 0) {
                    try {
                        const clone = response.clone();
                        const root = await clone.json();
                        if (root.data && Array.isArray(root.data.hashtags)) {
                            const blockedNames = hashBlacklist.map(h => h.name.replace('#', '').toLowerCase());
                            root.data.hashtags = root.data.hashtags.filter(h => !blockedNames.includes(h.name.toLowerCase()));
                            return new Response(JSON.stringify(root), { status: response.status, headers: response.headers });
                        }
                    } catch (e) {}
                }
            }

            if (url.includes('/api/posts')) {
                const userBlacklist = getBlacklist();
                const hashBlacklist = getHashBlacklist();

                if (userBlacklist.length > 0 || hashBlacklist.length > 0) {
                    try {
                        const clone = response.clone();
                        const root = await clone.json();
                        let posts = root.posts || root.data?.posts;

                        if (posts && Array.isArray(posts)) {
                            const filtered = posts.filter(post => {
                                const authorId = post.authorId || post.author?.id;
                                if (userBlacklist.includes(authorId)) return false;

                                if (post.content && hashBlacklist.length > 0) {
                                    const contentLower = post.content.toLowerCase();
                                    if (hashBlacklist.some(h => contentLower.includes(h.name.toLowerCase()))) return false;
                                }
                                return true;
                            });

                            if (root.posts) root.posts = filtered;
                            else if (root.data?.posts) root.data.posts = filtered;

                            return new Response(JSON.stringify(root), { status: response.status, headers: response.headers });
                        }
                    } catch (e) {}
                }
            }
            return response;
        };
    };

    const injectHashtagButton = () => {
        if (!location.href.includes('/hashtag/')) return;

        const infoBlock = document.querySelector('.hashtag-info.svelte-75az0a');
        if (infoBlock && !document.getElementById('itd-hash-block-btn')) {
            const hashtagNameRaw = decodeURIComponent(location.pathname.split('/').pop());
            const hashtagName = hashtagNameRaw.startsWith('#') ? hashtagNameRaw : '#' + hashtagNameRaw;
            
            const list = getHashBlacklist();
            const blockedEntry = list.find(h => h.name.toLowerCase() === hashtagName.toLowerCase());

            const btn = document.createElement('button');
            btn.id = 'itd-hash-block-btn';
            btn.className = 'hashtag-block-btn';
            btn.style.marginLeft = '12px';
            btn.innerText = blockedEntry ? 'Показать хештег' : 'Скрыть хештег';

            btn.onclick = async (e) => {
                e.preventDefault();
                let currentList = getHashBlacklist();

                if (blockedEntry) {
                    saveHashBlacklist(currentList.filter(h => h.name.toLowerCase() !== hashtagName.toLowerCase()));
                } else {
                    try {
                        const res = await fetch(`https://xn--d1ah4a.com/api/hashtags/trending?limit=100`);
                        const json = await res.json();
                        const found = json.data.hashtags.find(h => h.name.toLowerCase() === hashtagName.replace('#', '').toLowerCase());
                        
                        currentList.push({
                            id: found ? found.id : "manual-" + Date.now(),
                            name: hashtagName
                        });
                        saveHashBlacklist(currentList);
                    } catch(err) {
                        currentList.push({ id: "err-" + Date.now(), name: hashtagName });
                        saveHashBlacklist(currentList);
                    }
                }
                location.reload();
            };
            infoBlock.after(btn);
        }
    };

    const injectStyles = () => {
        if (document.getElementById('itd-blacklist-css')) return;
        const s = document.createElement('style');
        s.id = 'itd-blacklist-css';
        s.innerHTML = `
            .itd-wrap { position: relative; display: inline-flex; vertical-align: middle; }
            .itd-m { position: absolute; right: 0; top: 42px; background: var(--color-card, #fff); border-radius: 16px; border: 1px solid var(--color-border, rgba(0,0,0,0.1)); box-shadow: 0 4px 24px var(--color-shadow, rgba(0,0,0,0.15)); padding: 4px 0; min-width: 180px; z-index: 10000; display: none; flex-direction: column; overflow: hidden; }
            .itd-m.active { display: flex; }
            .itd-i { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border: none; background: transparent; width: 100%; cursor: pointer; font-family: inherit; font-size: 14px; color: var(--color-text, #111); text-align: left; transition: background 0.2s; }
            .itd-i:hover { background: var(--color-border-light, rgba(0,0,0,0.05)); }
            .itd-i.red { color: #ff4d4f; }
            .itd-i svg { flex-shrink: 0; opacity: 0.8; }
            .hashtag-block-btn { cursor: pointer; border: none; outline: none; font-family: inherit; transition: all .2s ease; background-color: transparent; color: var(--color-text); font-weight: 700; border: 1px solid var(--border-color); border-radius: 9999px; padding: .5rem 1.25rem; font-size: .875rem; }
        `;
        document.head.appendChild(s);
    };

    const setupMenu = (btn) => {
        if (btn.dataset.itd) return;
        btn.dataset.itd = "1";
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>`;

        const wrap = document.createElement('div');
        wrap.className = 'itd-wrap';
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);

        const menu = document.createElement('div');
        menu.className = 'itd-m';
        wrap.appendChild(menu);

        const render = () => {
            const blocked = getBlacklist().includes(lastViewedUserId);
            menu.innerHTML = `
                <button class="itd-i" id="itd-r">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    Пожаловаться
                </button>
                <button class="itd-i red" id="itd-b">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    ${blocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
            `;

            menu.querySelector('#itd-b').onclick = (e) => {
                e.stopPropagation();
                if (!lastViewedUserId) return;
                let list = getBlacklist();
                if (list.includes(lastViewedUserId)) {
                    saveBlacklist(list.filter(id => id !== lastViewedUserId));
                } else {
                    list.push(lastViewedUserId);
                    saveBlacklist(list);
                }
                location.reload();
            };
        };

        btn.addEventListener('click', (e) => {
            if (!btn.dataset.pass) {
                e.preventDefault();
                e.stopPropagation();
                render();
                menu.classList.toggle('active');
            }
        }, true);
        
        document.addEventListener('click', (e) => {
            if (!wrap.contains(e.target)) menu.classList.remove('active');
        });
    };

    window.initBlacklistModule = function() {
        interceptFetch();
        injectStyles();
        
        const obs = new MutationObserver(() => {
            const b = document.querySelector('.profile-report-btn');
            if (b) setupMenu(b);

            injectHashtagButton();

            const userList = getBlacklist();
            const hashList = getHashBlacklist();

            if (userList.length > 0 || hashList.length > 0) {
                document.querySelectorAll('.post-container').forEach(p => {
                    const html = p.innerHTML;
                    const text = p.innerText.toLowerCase();
                    const isBlockedUser = userList.some(id => html.includes(id));
                    const isBlockedHash = hashList.some(h => text.includes(h.name.toLowerCase()));
                    if (isBlockedUser || isBlockedHash) p.remove();
                });

                document.querySelectorAll('.trending-tag, .search-item, .hashtag-link').forEach(el => {
                    const text = el.innerText.toLowerCase();
                    if (hashList.some(h => text.includes(h.name.toLowerCase()))) el.remove();
                });
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    };

})();
