const app = {
    state: {
        currentPage: 'home'
    },

    init: function () {
        this.startIntro();
        this.setupCountdown();
    },

    startIntro: function () {
        const t1 = document.getElementById('intro-text-1');
        const t2 = document.getElementById('intro-text-2');
        const finalContainer = document.getElementById('final-intro-container');
        const btnContainer = document.getElementById('start-btn-container');

        // Sequence
        // 0s: Start
        // 0.5s: 'mee' in
        setTimeout(() => t1.classList.remove('opacity-0'), 500);

        // 1.5s: 'mee' out
        setTimeout(() => t1.classList.add('opacity-0'), 1500);

        // 2.0s: 'mni acv' (small) in
        setTimeout(() => t2.classList.remove('opacity-0'), 2000);

        // 3.0s: 'mni acv' (small) out
        setTimeout(() => t2.classList.add('opacity-0'), 3000);

        // 3.5s: Final Reveal
        setTimeout(() => {
            // Reveal the container
            finalContainer.classList.remove('opacity-0');
            // Move it to natural position (remove the translate offset)
            finalContainer.classList.remove('translate-y-4');

            // Optional: Add a specific drop effect for the button if needed, 
            // but the container move handles the "natural move down" feel for the whole block.
            // Let's add a slight staggered bounce for the button? 
            // The user said "Start ! appears - naturally moves down... simultaneously mni acv appears".
            // So they appear together. Moving the container handles this coherence.
        }, 3500);
    },

    enterSite: function () {
        const splash = document.getElementById('splash-screen');
        splash.style.transform = 'translateY(-100%)';

        document.body.style.overflowY = 'auto'; // Enable scrolling if needed (though we use SPA)

        // Show Navigation
        const nav = document.getElementById('main-nav');
        nav.classList.remove('hidden');
        setTimeout(() => nav.classList.remove('opacity-0'), 500);

        this.navigate('home');
    },

    navigate: function (pageId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(el => {
            el.classList.remove('active');
            el.classList.remove('animate-slide-up');
            el.classList.add('hidden-section'); // Add helper class
        });

        // Show target section
        const target = document.getElementById(pageId);
        if (target) {
            target.classList.remove('hidden-section'); // Remove helper class
            // slight delay to allow display to render
            setTimeout(() => {
                target.classList.add('active');
                target.classList.add('animate-slide-up');
            }, 50);
        }

        this.state.currentPage = pageId;
        window.scrollTo(0, 0);

        // Close mobile menu if open
        document.getElementById('mobile-menu')?.classList.add('hidden');
    },

    toggleMenu: function () {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    },

    openModal: function (imageSrc) {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');

        modalImg.src = imageSrc;
        modal.classList.remove('hidden');
        // Small timeout to allow display:flex to apply before opacity transition
        setTimeout(() => {
            modal.classList.remove('opacity-0');
        }, 10);

        // Prevent scrolling background
        document.body.style.overflow = 'hidden';
    },

    closeModal: function () {
        const modal = document.getElementById('image-modal');

        modal.classList.add('opacity-0');

        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('modal-image').src = '';
            document.body.style.overflow = 'auto';
        }, 300); // Match duration-300
    },

    setupCountdown: function () {
        // Set date to 3 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);

        const timerEl = document.getElementById('countdown');
        if (!timerEl) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Format with leading zeros
            const f = (n) => n < 10 ? '0' + n : n;

            timerEl.innerText = `${f(days)}:${f(hours)}:${f(minutes)}:${f(seconds)}`;

            if (distance < 0) {
                timerEl.innerText = "DROP NOW LIVE";
            }
        };

        setInterval(updateTimer, 1000);
        updateTimer();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    app.init();
});