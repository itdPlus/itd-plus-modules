(function() {
    'use strict';

    let lastViewedUserId = null;

    const getBlacklist = () => JSON.parse(localStorage.getItem('itd_blacklist') || '[]');
    const saveBlacklist = (list) => localStorage.setItem('itd_blacklist', JSON.stringify([...new Set(list)]));

    const interceptFetch = () => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const url = args[0].toString();
            const response = await originalFetch(...args);

            if (url.includes('/api/users/') && !url.includes('/banner')) {
                const clone = response.clone();
                clone.json().then(data => {
                    if (data.id) lastViewedUserId = data.id;
                }).catch(() => {});
            }

            if (url.includes('/api/posts')) {
                const blacklist = getBlacklist();
                if (blacklist.length > 0) {
                    try {
                        const clone = response.clone();
                        const root = await clone.json();
                        let posts = root.posts || root.data?.posts;

                        if (posts && Array.isArray(posts)) {
                            const filtered = posts.filter(post => {
                                const authorId = post.authorId || post.author?.id;
                                return !blacklist.includes(authorId);
                            });

                            if (root.posts) root.posts = filtered;
                            else if (root.data?.posts) root.data.posts = filtered;

                            return new Response(JSON.stringify(root), {
                                status: response.status,
                                headers: response.headers
                            });
                        }
                    } catch (e) {}
                }
            }
            return response;
        };
    };

    const injectStyles = () => {
        if (document.getElementById('itd-blacklist-css')) return;
        const s = document.createElement('style');
        s.id = 'itd-blacklist-css';
        s.innerHTML = `
            .itd-wrap { position: relative; display: inline-flex; vertical-align: middle; }
            .itd-m {
                position: absolute; right: 0; top: 42px; background: #fff; border-radius: 18px;
                border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                padding: 5px 0; min-width: 190px; z-index: 10000; display: none; flex-direction: column;
            }
            .itd-m.active { display: flex; }
            .itd-i {
                display: flex; align-items: center; gap: 12px; padding: 12px 18px;
                border: none; background: none; width: 100%; cursor: pointer;
                font-family: inherit; font-size: 14px; color: #111; text-align: left;
            }
            .itd-i:hover { background: #f5f5f5; }
            .itd-i.red { color: #ff4d4d; }
        `;
        document.head.appendChild(s);
    };

    const setupMenu = (btn) => {
        if (btn.dataset.itd) return;
        btn.dataset.itd = "1";
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>`;

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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
                    Пожаловаться
                </button>
                <button class="itd-i red" id="itd-b">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    ${blocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
            `;

            menu.querySelector('#itd-r').onclick = (e) => {
                e.stopPropagation();
                menu.classList.remove('active');
                btn.dataset.pass = "1";
                btn.click();
                setTimeout(() => delete btn.dataset.pass, 100);
            };

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
        document.addEventListener('click', () => menu.classList.remove('active'));
    };

    window.initBlacklistModule = function() {
        interceptFetch();
        injectStyles();
        const obs = new MutationObserver(() => {
            const b = document.querySelector('.profile-report-btn');
            if (b) setupMenu(b);

            const list = getBlacklist();
            if (list.length > 0) {
                document.querySelectorAll('.post-container').forEach(p => {
                    if (list.some(id => p.innerHTML.includes(id))) p.remove();
                });
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    };

})();
