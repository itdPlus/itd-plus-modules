window.initMentionsModule = function() {
    'use strict';

    const injectStyles = () => {
        if (document.getElementById('itd-link-styles')) return;
        const s = document.createElement('style');
        s.id = 'itd-link-styles';
        s.innerHTML = `
            .itd-clickable {
                color: #0095ff !important;
                text-decoration: none !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: opacity 0.1s ease;
            }
            .itd-mention:hover { opacity: 0.8 !important; }
            .itd-url:hover { 
                text-decoration: underline !important;
                opacity: 0.8 !important;
            }
        `;
        document.head.appendChild(s);
    };

    const smartReplace = (node) => {
        const mentionRegex = /(?<![/\w])@([\w\d_]+)/;
        const urlRegex = /((?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|ru|net|org|io|gov|edu|it|me|info|biz|site)(?:\/[^\s]*)?)/;
        const combinedRegex = new RegExp(`${mentionRegex.source}|${urlRegex.source}`, 'g');
        
        const text = node.nodeValue;
        if (!combinedRegex.test(text)) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        combinedRegex.lastIndex = 0;

        while ((match = combinedRegex.exec(text)) !== null) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            
            const matchedText = match[0];
            const isMention = matchedText.startsWith('@');
            const link = document.createElement('a');
            
            if (isMention) {
                const username = match[1];
                link.href = `/${username}`;
                link.className = 'itd-clickable itd-mention';
                link.textContent = matchedText;
                link.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = link.href;
                };
            } else {
                let url = matchedText;
                const fullUrl = /^(https?:\/\/|\/\/)/i.test(url) ? url : `https://${url}`;
                link.href = fullUrl;
                link.className = 'itd-clickable itd-url';
                link.textContent = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }

            fragment.appendChild(link);
            lastIndex = combinedRegex.lastIndex;
        }
        
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
    };

    const processElement = (el) => {
        if (el.hasAttribute('data-itd-parsed')) return;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        let node;
        const nodesToProcess = [];
        while (node = walker.nextNode()) nodesToProcess.push(node);
        nodesToProcess.forEach(smartReplace);
        el.setAttribute('data-itd-parsed', 'true');
    };

    const startObserver = () => {
        const observer = new MutationObserver(() => {
            const selectors = '.post-content, .profile-bio__text, .user-bio, .item-text, .bio-text';
            document.querySelectorAll(selectors).forEach(processElement);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    injectStyles();
    startObserver();
};
