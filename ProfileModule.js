window.initRegistrationDateModule = function() {
    'use strict';

    let lastData = null;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        const url = args[0].toString();

        if (url.includes('/api/')) {
            const clone = response.clone();
            clone.json().then(data => {
                const date = data.createdAt || 
                             (data.author && data.author.createdAt) || 
                             (data.originalPost && data.originalPost.author && data.originalPost.author.createdAt);

                if (date) {
                    lastData = date;
                    injectDate();
                }
            }).catch(() => {});
        }
        return response;
    };

    const formatRegDate = (iso) => {
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${month}.${year} в ${hours}:${minutes}`;
    };

    const injectDate = () => {
        if (!lastData) return;

        const items = document.querySelectorAll('.profile-meta__item.svelte-p40znu');
        
        items.forEach(item => {
            const content = item.innerText || "";
            if (content.includes('Регистрация:') && item.dataset.itdDone !== lastData) {
                const svgIcon = item.querySelector('svg');
                const formattedDate = formatRegDate(lastData);
                
                item.innerHTML = ''; 
                if (svgIcon) item.appendChild(svgIcon.cloneNode(true));
                
                const textSpan = document.createElement('span');
                textSpan.innerText = ` Регистрация: ${formattedDate}`;
                item.appendChild(textSpan);
                
                item.dataset.itdDone = lastData;
            }
        });
    };

    const observer = new MutationObserver(() => {
        if (lastData) injectDate();
    });

    observer.observe(document.body, { childList: true, subtree: true });
};
