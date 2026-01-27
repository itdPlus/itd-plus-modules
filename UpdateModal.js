export default function initUpdateModal() {
    const MODAL_STYLES = `
        .itd-modal-root {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            z-index: 999999; opacity: 0; transition: opacity 0.5s ease;
            pointer-events: none;
        }
        .itd-modal-root.active {
            opacity: 1;
            pointer-events: auto;
        }
        .itd-backdrop {
            position: absolute; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
        }
        .itd-card {
            position: relative; background: var(--color-card, #1a1a1a); color: white;
            width: 100%; max-width: 648px; border-radius: 16px;
            padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            z-index: 10; display: flex; flex-direction: column;
        }
        .itd-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px;
        }
        .itd-title { margin: 0; font-size: 22px; font-weight: bold; }
        .itd-close {
            background: none; border: none; color: #888; cursor: pointer;
            padding: 8px; border-radius: 50%; display: flex;
            transition: 0.3s; opacity: 0; pointer-events: none;
        }
        .itd-close.visible { opacity: 1; pointer-events: auto; }
        .itd-close:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .itd-body { text-align: left; line-height: 1.6; }
        .itd-text { font-size: 16px; margin-bottom: 20px; color: #ccc; }
        .itd-link { color: #58a6ff; text-decoration: none; word-break: break-all; }
        .itd-link:hover { text-decoration: underline; }
        .itd-gallery { width: 100%; border-radius: 12px; overflow: hidden; margin-top: 15px; }
        .itd-img { width: 100%; height: auto; display: block; background: #333; min-height: 100px; }
    `;

    const CONFIG = {
        version: "1.2.0",
        storageKey: "itd_update_modal_shown_version",
        modalDelay: 10000,
        closeBtnDelay: 3000,
    };

    window.itdReset = function() {
        localStorage.removeItem(CONFIG.storageKey);
        console.log("%c [ITD] Сброшено. Обновите страницу. ", "color: #bada55; font-weight: bold;");
    };

    if (localStorage.getItem(CONFIG.storageKey) === CONFIG.version) return;

    const styleTag = document.createElement('style');
    styleTag.innerHTML = MODAL_STYLES;
    document.head.appendChild(styleTag);

    function start() {
        const root = document.createElement('div');
        root.className = 'itd-modal-root';
        root.innerHTML = `
            <div class="itd-backdrop"></div>
            <div class="itd-card">
                <div class="itd-header">
                    <h2 class="itd-title">Важное уведомление!</h2>
                    <button class="itd-close" id="itd-close-btn">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="itd-body">
                    <div class="itd-text">
                        Чтобы не потерять доступ к расширению, настоятельно рекомендуется подписаться на телеграм-канал разработчика!
                        <br><br>
                        <a href="https://t.me/itdStatus" class="itd-link" target="_blank">https://t.me/itdStatus</a>
                        <br>
                        <a href="https://t.me/itdStatus" class="itd-link" target="_blank">https://t.me/itdStatus</a>
                        <br>
                        <a href="https://t.me/itdStatus" class="itd-link" target="_blank">https://t.me/itdStatus</a>
                    </div>
                    <div class="itd-gallery">
                        <img class="itd-img" src="https://943701f000610900cbe86b72234e451d.bckt.ru/images/18a34630-f0cb-4db3-a2aa-cd8727817357.png" alt="Notification">
                    </div>
                </div>
            </div>
        `;

        const showModal = () => {
            document.body.appendChild(root);
            setTimeout(() => { root.classList.add('active'); }, 50);
            document.body.style.overflow = 'hidden';

            setTimeout(() => {
                const btn = document.getElementById('itd-close-btn');
                if (btn) btn.classList.add('visible');
            }, CONFIG.closeBtnDelay);
        };

        const closeModal = () => {
            root.classList.remove('active');
            setTimeout(() => {
                root.remove();
                document.body.style.overflow = '';
                localStorage.setItem(CONFIG.storageKey, CONFIG.version);
            }, 500);
        };

        setTimeout(showModal, CONFIG.modalDelay);
        root.querySelector('#itd-close-btn').addEventListener('click', closeModal);
    }

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
}
