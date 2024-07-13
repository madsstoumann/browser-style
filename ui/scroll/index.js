class UIScroll extends HTMLElement {
  constructor() {
    super();
    this.index = 0;
    this.inlineSize = 0;
    this.itemsPerPage = 1;
    this.pages = 1;
    this.intervalId = null;
    this.isPlaying = false;
    this.config = {};
    this.items = [];
    this.dots = null;
    this.nav = null;
    this.next = null;
    this.prev = null;
    this.play = null;
    this.tabs = [];
  }

  connectedCallback() {
    this.initScroll();
  }

  initScroll() {
    const scroll = this;
    this.config = {
      scrollActive: '--active',
      scrollAutoPlay: 0,
      scrollAutoPlaying: '--playing',
      scrollBehavior: 'smooth',
      scrollHidden: '--hidden',
      scrollInfinite: false,
      scrollNav: 'ui-scroll-nav',
      scrollNavCallback: null,
      scrollNext: '--icon',
      scrollNextInner: `<ui-icon type="chevron right"></ui-icon>`,
      scrollPrev: '--icon',
      scrollPrevInner: `<ui-icon type="chevron left"></ui-icon>`,
      scrollPlay: '--icon',
      scrollPlayInner: `<ui-icon type="play-pause"></ui-icon>`,
      scrollResizeThreshold: 75,
      scrollTabs: ''
    };

    this.items = [...this.querySelectorAll('& >*')]
    if (!this.items.length || !this.config.scrollNav) return;

    [this.dots, this.nav, this.next, this.prev, this.play] = this.createScrollNav(scroll, this.config);
    this.callback = this.config.scrollNavCallback ? (typeof window[this.config.scrollNavCallback] === 'function' ? window[this.config.scrollNavCallback] : () => true) : () => true;
    this.tabs = this.config.scrollTabs && scroll.closest(this.config.scrollTabs)?.querySelectorAll('[role=tab]') || [];

    this.isPlaying = this.config.scrollAutoPlay;
    this.updateData();

    /* Event Listeners */
    this.dots.addEventListener('click', (event) => {
      const index = parseInt(event.target.dataset.index, 10);
      if (index > -1) this.scrollToPage(index);
    });

    this.next.addEventListener('click', () => {
      this.index++;
      if (this.index >= this.pages) this.index = 0;
      if (this.callback()) this.scrollToPage(this.index);
    });

    this.prev.addEventListener('click', () => {
      this.index--;
      if (this.index < 0) this.index = this.pages - 1;
      this.scrollToPage(this.index);
    });

    this.play.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.handleAutoPlay();
    });

    this.tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => {
        event.preventDefault();
        const index = this.items.findIndex(panel => panel.id === tab.getAttribute('aria-controls'));
        if (index > -1) this.scrollToPage(index);
      });
    });

    /* Observers / Init */
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.index = Math.floor(this.items.findIndex(item => item === entry.target) / this.itemsPerPage);
          this.updateUI(this.index);
        }
        entry.target.classList.toggle(this.config.scrollActive, entry.isIntersecting);
        entry.target.inert = !entry.isIntersecting;
      });
    });
    this.items.forEach(item => intersectionObserver.observe(item));

    const resizeObserver = new ResizeObserver((entries) => {
      const entryInlineSize = Math.floor(entries[0].contentBoxSize[0].inlineSize);
      if (Math.abs(entryInlineSize - this.inlineSize) > parseInt(this.config.scrollResizeThreshold, 10)) {
        this.updateData();
        this.scrollToPage(0);
      }
    });
    resizeObserver.observe(scroll);

    /* Set initial tab from location.hash, using #![ID] */
    if (this.config.scrollTabs && location.hash) {
      const id = location.hash.replace('#!', '');
      const tabIndex = this.items.findIndex(item => item.getAttribute('id') === id);
      if (tabIndex > -1) this.index = tabIndex;
    }

    /* Auto Play */
    if (this.config.scrollAutoPlay) {
      this.nav.style.setProperty('--duration', `${this.config.scrollAutoPlay}ms`);
      const autoPlayObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleAutoPlay();
          } else {
            clearInterval(this.intervalId);
            this.nav.style.setProperty('--playstate', 'paused');
            this.nav.classList.remove(this.config.scrollAutoPlaying);
          }
        });
      }, { threshold: 0.85 });
      autoPlayObserver.observe(scroll);
    }
    this.scrollToPage(this.index, 'auto', false);
		// console.log(this.items)
  }

  handleAutoPlay() {
    if (this.isPlaying) {
      this.intervalId = setInterval(() => {
        this.index++;
        if (this.index >= this.pages) {
          this.scrollToPage(0, 'instant');
          this.index = 0;
        } else {
          this.scrollToPage(this.index);
        }
      }, parseInt(this.config.scrollAutoPlay, 10));
      this.nav.style.setProperty('--playstate', 'running');
      this.nav.classList.add(this.config.scrollAutoPlaying);
    } else {
      clearInterval(this.intervalId);
      this.nav.style.setProperty('--playstate', 'paused');
      this.nav.classList.remove(this.config.scrollAutoPlaying);
    }
  }

  createScrollNav(scroll, config) {
    const nav = scroll.nextElementSibling || document.createElement('nav');
    const dots = nav.querySelector('ol') || document.createElement('ol');
    const next = nav.querySelector('[data-action=next]') || document.createElement('button');
    const prev = nav.querySelector('[data-action=prev]') || document.createElement('button');
    const play = nav.querySelector('[data-action=play]') || document.createElement('button');
    if (!nav.children.length) {
      next.classList.add(config.scrollNext);
      next.innerHTML = config.scrollNextInner;
      next.type = 'button';
      next.dataset.action = 'next';
      prev.classList.add(config.scrollPrev);
      prev.innerHTML = config.scrollPrevInner;
      prev.type = 'button';
      prev.dataset.action = 'prev';
      play.classList.add(config.scrollPlay);
      play.innerHTML = config.scrollPlayInner;
      play.type = 'button';
      play.dataset.action = 'play';
      play.hidden = !config.scrollAutoPlay;
      config.scrollNav.split(' ').forEach(className => nav.classList.add(className));
      nav.append(play, prev, dots, next);
      scroll.after(nav);
    }
    return [dots, nav, next, prev, play];
  }

  scrollToPage(index, behavior = this.config.scrollBehavior, scrollIntoView = true) {
    if (scrollIntoView) {
      this.items[index * this.itemsPerPage].scrollIntoView({
        behavior,
        block: 'nearest',
        inline: 'start'
      });
    }
    this.updateUI(index);
  }

  updateData() {
    this.index = 0;
    this.inlineSize = this.offsetWidth;
    this.itemsPerPage = Math.floor(this.inlineSize / this.items[0].offsetWidth) || 1;
    this.pages = Math.ceil(this.items.length / this.itemsPerPage);
    this.dots.innerHTML = Array.from({ length: this.pages }).map((_, index) => `<li data-index="${index}"></li>`).join('');
    this.items.forEach((item, index) => {
      item.style.scrollSnapAlign = index % this.itemsPerPage === 0 ? 'start' : 'none';
    });
    this.nav.classList.toggle(this.config.scrollHidden, this.pages === 1); /* Hide scroll navigation if only one page */
  }

  updateUI(index) {
    if (!this.config.scrollInfinite) {
      this.prev.disabled = (index === 0);
      this.next.disabled = (index === this.pages - 1);
    }
    Array.from(this.dots.children).forEach((dot, current) => dot.ariaSelected = index === current);
    if (this.tabs.length) {
      this.tabs.forEach((tab, current) => {
        tab.ariaSelected = index === current;
        if (index === current) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    }
  }
}

customElements.define('ui-scroll', UIScroll);
