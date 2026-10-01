(function () {
    const DISMISSED_KEY = 'unimatch_notice_dismissed';
    const MESSAGE = 'Данные о поступлении носят ознакомительный характер — проверяйте требования на сайтах вузов.';
    const CLOSE_LABEL = 'Закрыть предупреждение';

    function removeBanner() {
        document.getElementById('unimatch-warning')?.remove();
    }

    function showBanner() {
        try {
            if (localStorage.getItem(DISMISSED_KEY) === 'true') return;
        } catch (error) {
            console.error('UniMatch warning preference could not be read:', error);
        }

        const banner = document.createElement('aside');
        banner.id = 'unimatch-warning';
        banner.className = 'flex items-center justify-center gap-3 bg-amber-400 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:text-sm';
        banner.setAttribute('role', 'note');

        const message = document.createElement('span');
        message.className = 'flex-1';
        message.innerHTML = '<i class="fa-solid fa-circle-info mr-1" aria-hidden="true"></i>';
        message.append(document.createTextNode(MESSAGE));

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-950 transition hover:bg-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-900';
        closeButton.setAttribute('aria-label', CLOSE_LABEL);
        closeButton.title = CLOSE_LABEL;
        closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
        closeButton.addEventListener('click', function () {
            try {
                localStorage.setItem(DISMISSED_KEY, 'true');
            } catch (error) {
                console.error('UniMatch warning preference could not be saved:', error);
            }
            removeBanner();
        });

        banner.append(message, closeButton);
        document.body.prepend(banner);
    }

    showBanner();
    window.addEventListener('storage', function (event) {
        if (event.key === DISMISSED_KEY && event.newValue === 'true') removeBanner();
    });
})();
