(() => {
    const cards = document.querySelectorAll('.cards .card');
    const modal = document.getElementById('cardModal');
    const modalBody = document.getElementById('cardModalBody');
    const body = document.body;
    let modalOpen = false;

    function scrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    function lockScrollForModal() {
        document.documentElement.classList.add('modal-open');
        body.classList.add('modal-open');
    }

    function unlockScrollForModal() {
        document.documentElement.classList.remove('modal-open');
        body.classList.remove('modal-open');
    }

    function unclampParagraphs(root) {
        root.querySelectorAll('p').forEach(p => {
            p.style.display = 'block';
            p.style.webkitLineClamp = 'unset';
            p.style.webkitBoxOrient = 'unset';
            p.style.overflow = 'visible';
        });
    }

    function openModal(card) {
        modalBody.innerHTML = '';
        const clone = card.cloneNode(true);
        clone.classList.remove('card-clickable');
        unclampParagraphs(clone);
        modalBody.appendChild(clone);
        modal.removeAttribute('hidden');
        modal.classList.add('open');
        lockScrollForModal();
        if (!modalOpen) {
            history.pushState({ modalCard: true }, '');
        }
        modalOpen = true;
    }

    function closeModal() {
        modal.classList.remove('open');
        modal.setAttribute('hidden', '');
        unlockScrollForModal();
        modalOpen = false;
    }

    cards.forEach(card => {
        card.classList.add('card-clickable');
        card.addEventListener('click', () => openModal(card));
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    window.addEventListener('popstate', () => {
        if (modalOpen) {
            modal.classList.remove('open');
            modal.setAttribute('hidden', '');
            unlockScrollForModal();
            modalOpen = false;
        }
    });
})();
