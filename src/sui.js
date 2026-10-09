/**
 * SUI.css - Ultra Pro Max Interactive Engine v2.1.0
 * Architecture: Zero-Dependency Pure Vanilla JavaScript
 * Author: Suman M. (SUI.css Core Team)
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : root || {});
    g.SUI = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this), (function () {
  'use strict';

  /* ==========================================================================
     GLOBAL CONFIGURATION & CONSTANTS
     ========================================================================== */
  const SUI_CONFIG = {
    themeKey: 'sui-theme',
    toastContainerId: 'sui-toast-container',
    scrollOffset: 80,
    animationThreshold: 0.15
  };

  /* ==========================================================================
     1. UTILITY HELPER METHODS
     ========================================================================== */
  const Utils = {
    isTouchDevice() {
      return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    },
    escapeHTML(str) {
      return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    },
    createElement(tag, classes = [], attributes = {}) {
      const el = document.createElement(tag);
      if (Array.isArray(classes)) classes.forEach(c => c && el.classList.add(c));
      else if (typeof classes === 'string') el.className = classes;
      for (const [key, val] of Object.entries(attributes)) {
        el.setAttribute(key, val);
      }
      return el;
    },
    triggerReflow(element) {
      if (element) void element.offsetWidth;
    }
  };

  /* ==========================================================================
     2. THEME ENGINE (OKLCH Reactive Engine)
     ========================================================================== */
  const ThemeEngine = {
    init() {
      const stored = localStorage.getItem(SUI_CONFIG.themeKey);
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = stored || (systemPrefersDark ? 'dark' : 'dark');
      
      this.set(initialTheme, false);

      const storedHue = localStorage.getItem('sui-brand-hue');
      if (storedHue) {
        this.setBrandHue(storedHue, false);
      }

      // System Preference Listener
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem(SUI_CONFIG.themeKey)) {
          this.set(e.matches ? 'dark' : 'light', false);
        }
      });
    },
    get() {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    },
    set(theme, store = true) {
      document.documentElement.setAttribute('data-theme', theme);
      if (store) localStorage.setItem(SUI_CONFIG.themeKey, theme);
      
      // Sync any theme toggle icons / buttons
      document.querySelectorAll('.sui-theme-toggle, [data-sui-toggle-theme]').forEach(btn => {
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
      });

      window.dispatchEvent(new CustomEvent('sui:theme-change', { detail: { theme } }));
    },
    toggle() {
      const next = this.get() === 'dark' ? 'light' : 'dark';
      this.set(next, true);
      return next;
    },
    setBrandHue(hue, store = true) {
      document.documentElement.style.setProperty('--sui-brand-hue', String(hue));
      document.documentElement.style.setProperty('--sui-hue-brand', String(hue));
      if (store) localStorage.setItem('sui-brand-hue', String(hue));
      window.dispatchEvent(new CustomEvent('sui:brand-hue-change', { detail: { hue } }));
    },
    getBrandHue() {
      return getComputedStyle(document.documentElement).getPropertyValue('--sui-brand-hue').trim() || '255';
    }
  };

  /* ==========================================================================
     3. TOAST NOTIFICATION ENGINE (Typed Status Variants)
     ========================================================================== */
  const Toast = {
    getContainer() {
      let container = document.getElementById(SUI_CONFIG.toastContainerId);
      if (!container) {
        container = Utils.createElement('div', ['sui-toast-container'], {
          id: SUI_CONFIG.toastContainerId,
          style: 'position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.75rem; max-width: 420px; width: calc(100% - 3rem); pointer-events: none;'
        });
        document.body.appendChild(container);
      }
      return container;
    },
    show({ title = '', message = '', type = 'info', duration = 4000, dismissible = true }) {
      const container = this.getContainer();
      const toast = Utils.createElement('div', ['sui-toast', 'sui-animate-spring-up', `sui-toast-${type}`], {
        style: 'pointer-events: auto; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;'
      });

      const icons = {
        success: '✓',
        danger: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      const leftWrap = document.createElement('div');
      leftWrap.style.display = 'flex';
      leftWrap.style.gap = '0.75rem';
      leftWrap.style.alignItems = 'flex-start';

      const iconBadge = Utils.createElement('div', ['sui-toast-badge'], {
        style: 'font-weight: bold; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; background: var(--sui-surface-hover);'
      });
      iconBadge.textContent = icons[type] || 'ℹ';
      leftWrap.appendChild(iconBadge);

      const content = document.createElement('div');
      if (title) {
        const strong = Utils.createElement('strong', ['sui-block', 'sui-text-sm'], { style: 'margin-bottom: 0.2rem; color: var(--sui-text);' });
        strong.textContent = title;
        content.appendChild(strong);
      }
      if (message) {
        const text = Utils.createElement('p', ['sui-text-xs', 'sui-text-muted'], { style: 'margin: 0; line-height: 1.4;' });
        text.textContent = message;
        content.appendChild(text);
      }
      leftWrap.appendChild(content);
      toast.appendChild(leftWrap);

      if (dismissible) {
        const closeBtn = Utils.createElement('button', ['sui-btn-icon'], {
          style: 'background: transparent; border: none; cursor: pointer; color: var(--sui-text-muted); padding: 0.25rem; font-size: 1.25rem; line-height: 1;',
          'aria-label': 'Close Notification'
        });
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.dismiss(toast));
        toast.appendChild(closeBtn);
      }

      container.appendChild(toast);

      if (duration > 0) {
        let timer = setTimeout(() => this.dismiss(toast), duration);
        toast.addEventListener('mouseenter', () => clearTimeout(timer));
        toast.addEventListener('mouseleave', () => {
          timer = setTimeout(() => this.dismiss(toast), duration / 2);
        });
      }

      return toast;
    },
    dismiss(toast) {
      if (!toast) return;
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }
  };

  /* ==========================================================================
     4. MODAL & DIALOG ENGINE WITH ROBUST ACCESSIBLE FOCUS TRAP
     ========================================================================== */
  const Modal = {
    activeModal: null,
    previousActiveElement: null,

    getFocusableElements(container) {
      if (!container) return [];
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
    },

    open(targetId) {
      const modal = document.getElementById(targetId);
      if (!modal) return;

      this.previousActiveElement = document.activeElement;
      this.activeModal = modal;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const focusable = this.getFocusableElements(modal);
      const autoFocusTarget = modal.querySelector('[autofocus]') || (focusable.length > 0 ? focusable[0] : null);
      if (autoFocusTarget) {
        autoFocusTarget.focus();
      }

      window.dispatchEvent(new CustomEvent('sui:modal-open', { detail: { id: targetId, element: modal } }));
    },

    close(modalElement) {
      const target = modalElement || this.activeModal;
      if (!target) return;

      target.classList.remove('active');
      target.setAttribute('aria-hidden', 'true');

      // Only unlock body overflow if no other modals or drawers are open
      const remainingOpen = document.querySelectorAll('.sui-dialog-overlay.active, .mobile-drawer.is-open, .docs-sidebar.is-open');
      if (remainingOpen.length === 0) {
        document.body.style.overflow = '';
      }

      if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
        this.previousActiveElement.focus();
      }
      this.activeModal = null;
      window.dispatchEvent(new CustomEvent('sui:modal-close', { detail: { element: target } }));
    },

    closeAll() {
      document.querySelectorAll('.sui-dialog-overlay.active').forEach(m => this.close(m));
    },

    handleKeydown(e) {
      if (!this.activeModal) return;

      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close(this.activeModal);
        return;
      }

      // Robust Focus Trap (Tab & Shift+Tab)
      if (e.key === 'Tab') {
        const focusable = this.getFocusableElements(this.activeModal);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !this.activeModal.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !this.activeModal.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }
  };

  /* ==========================================================================
     5. DROPDOWNS & POPOVERS (WITH OUTSIDE CLICK & ESCAPE HANDLERS)
     ========================================================================== */
  const FloatingEngine = {
    closeAll() {
      document.querySelectorAll('.sui-dropdown.is-open, .sui-dropdown-menu.is-open, .sui-popover.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.setAttribute('aria-expanded', 'false');
      });
    },

    handleDropdownKeydown(e) {
      const activeDropdown = document.querySelector('.sui-dropdown.is-open, .sui-dropdown-menu.is-open');
      if (!activeDropdown) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeAll();
        return;
      }

      // Keyboard arrow navigation through dropdown items
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = Array.from(activeDropdown.querySelectorAll('.sui-dropdown-item:not([disabled])'));
        if (items.length === 0) return;

        e.preventDefault();
        const currentIndex = items.indexOf(document.activeElement);
        let nextIndex;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        }

        items[nextIndex].focus();
      }
    }
  };

  /* ==========================================================================
     6. COUNT-UP / STAT METRICS ANIMATION ENGINE
     ========================================================================== */
  const CounterEngine = {
    animate(element, target, duration = 1500) {
      if (!element || element.dataset.suiCounted === 'true') return;
      element.dataset.suiCounted = 'true';

      const originalText = element.textContent.trim();
      const prefix = originalText.match(/^[^\d]+/)?.[0] || '';
      const suffix = originalText.match(/[^\d]+$/)?.[0] || '';
      const isDecimal = String(target).includes('.');
      const decimals = isDecimal ? String(target).split('.')[1].length : 0;

      const startTime = performance.now();

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out expo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = (target * easeProgress).toFixed(decimals);

        // Format with thousands commas
        const parts = currentVal.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        element.textContent = prefix + parts.join('.') + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = originalText;
        }
      };

      requestAnimationFrame(update);
    },

    init() {
      if (!('IntersectionObserver' in window)) return;

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const rawVal = el.getAttribute('data-sui-count') || el.textContent.replace(/[^\d.]/g, '');
            const num = parseFloat(rawVal);
            if (!isNaN(num) && num > 0) {
              this.animate(el, num);
            }
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.2 });

      document.querySelectorAll('[data-sui-count], .sui-stat-value').forEach(el => observer.observe(el));
    }
  };

  /* ==========================================================================
     7. SCROLL-TO-TOP & SCROLL PROGRESS ENGINE
     ========================================================================== */
  const ScrollEngine = {
    scrollToTop(smooth = true) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    },

    init() {
      // Toggle back-to-top buttons
      window.addEventListener('scroll', () => {
        const scrolled = window.scrollY > 300;
        document.querySelectorAll('[data-sui-scroll-top], .sui-back-to-top').forEach(btn => {
          if (scrolled) btn.classList.add('is-visible');
          else btn.classList.remove('is-visible');
        });
      }, { passive: true });

      // Intersection Observer for Scroll Reveals
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              entry.target.style.animationPlayState = 'running';
              obs.unobserve(entry.target);
            }
          });
        }, {
          threshold: SUI_CONFIG.animationThreshold,
          rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('.reveal-on-scroll, [class*="sui-animate-"]:not(.sui-floating-nav)').forEach(el => {
          if (!el.classList.contains('is-visible')) {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
          }
        });
      }
    }
  };

  /* ==========================================================================
     8. DISMISSIBLE ALERTS ENGINE
     ========================================================================== */
  const AlertEngine = {
    dismiss(alertEl) {
      if (!alertEl) return;
      alertEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
      alertEl.style.overflow = 'hidden';
      alertEl.style.opacity = '0';
      alertEl.style.transform = 'translateY(-6px)';
      alertEl.style.maxHeight = `${alertEl.offsetHeight}px`;

      requestAnimationFrame(() => {
        alertEl.style.maxHeight = '0px';
        alertEl.style.paddingTop = '0px';
        alertEl.style.paddingBottom = '0px';
        alertEl.style.marginTop = '0px';
        alertEl.style.marginBottom = '0px';
      });

      setTimeout(() => {
        if (alertEl.parentNode) alertEl.parentNode.removeChild(alertEl);
      }, 300);
    }
  };

  /* ==========================================================================
     9. MOBILE DRAWERS & DOCS SIDEBAR ENGINE
     ========================================================================== */
  const MobileDrawerEngine = {
    openDrawer(drawer, overlay) {
      if (drawer) drawer.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    },

    closeDrawer(drawer, overlay) {
      if (drawer) drawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    },

    toggleDrawer(drawer, overlay) {
      if (!drawer) return;
      if (drawer.classList.contains('is-open')) {
        this.closeDrawer(drawer, overlay);
      } else {
        this.openDrawer(drawer, overlay);
      }
    },

    closeAll() {
      const mobileDrawer = document.getElementById('mobileDrawer');
      if (mobileDrawer) mobileDrawer.classList.remove('is-open');

      const docsSidebar = document.getElementById('docsSidebar');
      const docsOverlay = document.getElementById('docsSidebarOverlay');
      if (docsSidebar) docsSidebar.classList.remove('is-open');
      if (docsOverlay) docsOverlay.classList.remove('is-open');

      const docsMenuBtn = document.getElementById('docsMenuBtn');
      if (docsMenuBtn) docsMenuBtn.setAttribute('aria-expanded', 'false');

      const globalDrawer = document.getElementById('globalMobileDrawer');
      if (globalDrawer) globalDrawer.classList.remove('is-open');

      document.body.style.overflow = '';
    }
  };

  /* ==========================================================================
     10. FORM UTILITIES (OTP Auto-Advance, Password Revealer & Auto-Resize)
     ========================================================================== */
  const FormUtilities = {
    init() {
      // OTP 6-Digit Auto-Focusing
      document.querySelectorAll('.sui-otp-group').forEach(group => {
        const inputs = Array.from(group.querySelectorAll('input'));
        inputs.forEach((input, index) => {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
              inputs[index - 1].focus();
              inputs[index - 1].value = '';
            }
          });

          input.addEventListener('input', () => {
            if (input.value.length === 1 && index < inputs.length - 1) {
              inputs[index + 1].focus();
            }
          });

          input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (!pasteData) return;
            const digits = pasteData.replace(/\D/g, '').split('');
            digits.forEach((digit, i) => {
              if (inputs[i]) {
                inputs[i].value = digit;
                if (inputs[i + 1]) inputs[i + 1].focus();
              }
            });
          });
        });
      });

      // Auto-resizing Textareas
      document.querySelectorAll('textarea.sui-auto-resize').forEach(textarea => {
        textarea.addEventListener('input', () => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        });
      });
    }
  };

  /* ==========================================================================
     11. DATA TABLE INTERACTION ENGINE (Instant Filter, Sort, Row Selection)
     ========================================================================== */
  const TableEngine = {
    init() {
      // 1. Instant Client-Side Table Filter/Search
      document.querySelectorAll('input[data-sui-table-filter]').forEach(input => {
        const targetSelector = input.getAttribute('data-sui-table-filter');
        const table = document.querySelector(targetSelector);
        if (!table) return;

        input.addEventListener('input', () => {
          const query = input.value.toLowerCase().trim();
          const rows = table.querySelectorAll('tbody tr');
          let matchCount = 0;

          rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = !query || text.includes(query);
            row.style.display = matches ? '' : 'none';
            if (matches) matchCount++;
          });

          window.dispatchEvent(new CustomEvent('sui:table-filter', {
            detail: { table, query, matchCount }
          }));
        });
      });

      // 2. Interactive Column Sorting
      document.querySelectorAll('table.sui-table th[data-sui-sort]').forEach(th => {
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';
        if (!th.querySelector('.sui-sort-icon')) {
          const icon = document.createElement('span');
          icon.className = 'sui-sort-icon';
          icon.style.marginLeft = '0.4rem';
          icon.style.opacity = '0.4';
          icon.style.fontSize = '0.75em';
          icon.textContent = '⇅';
          th.appendChild(icon);
        }

        th.addEventListener('click', () => {
          const table = th.closest('table');
          const tbody = table ? table.querySelector('tbody') : null;
          if (!tbody) return;

          const rows = Array.from(tbody.querySelectorAll('tr'));
          const colIndex = Array.from(th.parentNode.children).indexOf(th);
          const currentOrder = th.getAttribute('data-sui-order') || 'none';
          const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

          th.parentNode.querySelectorAll('th[data-sui-sort]').forEach(sibling => {
            sibling.removeAttribute('data-sui-order');
            const sibIcon = sibling.querySelector('.sui-sort-icon');
            if (sibIcon) {
              sibIcon.textContent = '⇅';
              sibIcon.style.opacity = '0.4';
            }
          });

          th.setAttribute('data-sui-order', newOrder);
          const icon = th.querySelector('.sui-sort-icon');
          if (icon) {
            icon.textContent = newOrder === 'asc' ? '▲' : '▼';
            icon.style.opacity = '1';
          }

          rows.sort((a, b) => {
            const aCell = a.children[colIndex]?.textContent.trim() || '';
            const bCell = b.children[colIndex]?.textContent.trim() || '';
            const aNum = parseFloat(aCell.replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(bCell.replace(/[^0-9.-]/g, ''));

            if (!isNaN(aNum) && !isNaN(bNum)) {
              return newOrder === 'asc' ? aNum - bNum : bNum - aNum;
            }
            return newOrder === 'asc'
              ? aCell.localeCompare(bCell)
              : bCell.localeCompare(aCell);
          });

          rows.forEach(r => tbody.appendChild(r));
          window.dispatchEvent(new CustomEvent('sui:table-sort', {
            detail: { table, column: colIndex, order: newOrder }
          }));
        });
      });

      // 3. Select All Checkbox Handler
      document.querySelectorAll('input[data-sui-select-all]').forEach(masterCheckbox => {
        const tableSelector = masterCheckbox.getAttribute('data-sui-select-all');
        const table = document.querySelector(tableSelector);
        if (!table) return;

        masterCheckbox.addEventListener('change', () => {
          const isChecked = masterCheckbox.checked;
          table.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => {
            cb.checked = isChecked;
            const tr = cb.closest('tr');
            if (tr) tr.classList.toggle('sui-row-selected', isChecked);
          });
        });

        table.addEventListener('change', (e) => {
          if (e.target.matches('tbody input[type="checkbox"]')) {
            const tr = e.target.closest('tr');
            if (tr) tr.classList.toggle('sui-row-selected', e.target.checked);

            const allCbs = Array.from(table.querySelectorAll('tbody input[type="checkbox"]'));
            const checkedCount = allCbs.filter(cb => cb.checked).length;
            masterCheckbox.checked = checkedCount === allCbs.length && allCbs.length > 0;
            masterCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCbs.length;
          }
        });
      });
    }
  };

  /* ==========================================================================
     12. DYNAMIC TOOLTIP ENGINE (Multi-Directional & Viewport Collision Detection)
     ========================================================================== */
  const TooltipEngine = {
    activeEl: null,
    tipEl: null,

    show(target) {
      if (!target) return;
      const text = target.getAttribute('data-tooltip') || target.getAttribute('title');
      if (!text) return;

      if (target.getAttribute('title')) {
        target.setAttribute('data-tooltip-title', target.getAttribute('title'));
        target.removeAttribute('title');
      }

      this.hide();

      const tip = document.createElement('div');
      tip.className = 'sui-dynamic-tooltip sui-animate-spring-up';
      tip.style.position = 'fixed';
      tip.style.zIndex = '99999';
      tip.style.pointerEvents = 'none';
      tip.style.background = 'oklch(20% 0.02 260 / 0.96)';
      tip.style.color = '#ffffff';
      tip.style.padding = '0.35rem 0.75rem';
      tip.style.fontSize = '0.75rem';
      tip.style.fontWeight = '500';
      tip.style.borderRadius = 'var(--sui-radius-md, 6px)';
      tip.style.boxShadow = '0 8px 20px -2px oklch(0% 0 0 / 0.35)';
      tip.style.border = '1px solid oklch(100% 0 0 / 0.15)';
      tip.style.whiteSpace = 'nowrap';
      tip.style.backdropFilter = 'blur(8px)';
      tip.style.webkitBackdropFilter = 'blur(8px)';
      tip.textContent = text;
      document.body.appendChild(tip);

      const pos = target.getAttribute('data-tooltip-pos') || 'top';
      const rect = target.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();

      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      let top = rect.top - tipRect.height - 8;

      if (pos === 'bottom') {
        top = rect.bottom + 8;
      } else if (pos === 'left') {
        left = rect.left - tipRect.width - 8;
        top = rect.top + rect.height / 2 - tipRect.height / 2;
      } else if (pos === 'right') {
        left = rect.right + 8;
        top = rect.top + rect.height / 2 - tipRect.height / 2;
      }

      left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));

      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;

      this.activeEl = target;
      this.tipEl = tip;
    },

    hide() {
      if (this.tipEl) {
        this.tipEl.remove();
        this.tipEl = null;
      }
      if (this.activeEl && this.activeEl.getAttribute('data-tooltip-title')) {
        this.activeEl.setAttribute('title', this.activeEl.getAttribute('data-tooltip-title'));
        this.activeEl.removeAttribute('data-tooltip-title');
      }
      this.activeEl = null;
    }
  };

  /* ==========================================================================
     13. CONFETTI CELEBRATION ENGINE (Physics Micro-Particles)
     ========================================================================== */
  const ConfettiEngine = {
    trigger(options = {}) {
      const count = options.count || 42;
      const x = options.x !== undefined ? options.x : window.innerWidth / 2;
      const y = options.y !== undefined ? options.y : window.innerHeight / 2;
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '100vw';
      container.style.height = '100vh';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '99999';
      container.style.overflow = 'hidden';
      document.body.appendChild(container);

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 6;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 260 + 90;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 140;
        const rotSpeed = (Math.random() - 0.5) * 720;
        const isCircle = Math.random() > 0.5;

        particle.style.position = 'absolute';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${isCircle ? size : size * 1.6}px`;
        particle.style.backgroundColor = color;
        particle.style.borderRadius = isCircle ? '50%' : '2px';
        particle.style.transform = 'translate(-50%, -50%)';
        particle.style.opacity = '1';
        container.appendChild(particle);

        const startTime = performance.now();
        const duration = Math.random() * 600 + 900;

        const animateParticle = (now) => {
          const elapsed = (now - startTime) / 1000;
          const progress = (now - startTime) / duration;

          if (progress >= 1) {
            particle.remove();
            return;
          }

          const currentX = vx * elapsed;
          const currentY = vy * elapsed + 0.5 * 520 * elapsed * elapsed;
          const currentRot = rotSpeed * elapsed;
          const opacity = 1 - Math.pow(progress, 2);

          particle.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px)) rotate(${currentRot}deg)`;
          particle.style.opacity = String(opacity);

          requestAnimationFrame(animateParticle);
        };

        requestAnimationFrame(animateParticle);
      }

      setTimeout(() => container.remove(), 1800);
    }
  };

  /* ==========================================================================
     14. SCROLL-SPY & SMOOTH ANCHOR NAVIGATION ENGINE
     ========================================================================== */
  const ScrollSpyEngine = {
    init() {
      // Smooth Anchor Navigation for [data-sui-scroll-to]
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-sui-scroll-to]');
        if (trigger) {
          e.preventDefault();
          const targetSelector = trigger.getAttribute('data-sui-scroll-to');
          const target = document.querySelector(targetSelector);
          if (target) {
            const offset = parseInt(trigger.getAttribute('data-sui-offset') || SUI_CONFIG.scrollOffset, 10);
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }
      });

      // Active TOC / Nav Link Highlighting via IntersectionObserver
      if ('IntersectionObserver' in window) {
        const trackedHeaders = document.querySelectorAll('main h2[id], main h3[id], section[id]');
        if (trackedHeaders.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('id');
              if (id) {
                document.querySelectorAll(`a[href="#${id}"]`).forEach(link => {
                  const navParent = link.closest('.docs-sidebar, .nav-desktop-menu, .sui-toc');
                  if (navParent) {
                    navParent.querySelectorAll(`a[href^="#"]`).forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                  }
                });
              }
            }
          });
        }, {
          rootMargin: '-80px 0px -70% 0px'
        });

        trackedHeaders.forEach(h => observer.observe(h));
      }
    }
  };

  /* ==========================================================================
     15. NATIVE SYNTAX HIGHLIGHTER (Zero Dependency, Robust Tag-Scoped Engine)
     ========================================================================== */
  const SyntaxHighlighter = {
    highlight(text) {
      if (text === null || text === undefined || text === '') return '';
      const unescaped = String(text)
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      return unescaped.replace(
        /(<!--[\s\S]*?-->)|(<(\/?[a-zA-Z0-9\-]+)((?:[^>'"]|"[^"]*"|'[^']*')*?)(\/?>))|([^<]+)|(<)/g,
        function(match, comment, tag, tagName, tagAttrs, tagClose, plainText, loneLeft) {
          if (comment) {
            const c = (comment || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return '<span class="sui-hl-comment">' + c + '</span>';
          }
          if (tag) {
            const name = tagName || '';
            const isClosing = name.startsWith('/');
            const pureName = isClosing ? name.slice(1) : name;
            let out = '&lt;' + (isClosing ? '/' : '') + '<span class="sui-hl-tag">' + (pureName || '') + '</span>';

            if (tagAttrs && tagAttrs.trim()) {
              const highlightedAttrs = tagAttrs.replace(
                /(\s+)([a-zA-Z\-:]+)(?:(\s*=\s*)(".*?"|'.*?'|[^\s>]+))?/g,
                function(m, sp, aName, eq, aVal) {
                  let attrStr = (sp || ' ') + '<span class="sui-hl-attr">' + (aName || '') + '</span>';
                  if (eq) {
                    let valEscaped = (aVal || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    attrStr += eq + '<span class="sui-hl-string">' + valEscaped + '</span>';
                  }
                  return attrStr;
                }
              );
              out += highlightedAttrs;
            }

            out += (tagClose === '/>' || tagClose === ' /&gt;') ? ' /&gt;' : '&gt;';
            return out;
          }
          if (plainText) {
            return (plainText || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }
          if (loneLeft) {
            return '&lt;';
          }
          return match || '';
        }
      ) || '';
    },
    highlightAll() {
      if (typeof document === 'undefined') return;
      document.querySelectorAll('pre code:not(.sui-highlighted), .language-html:not([contenteditable="true"])').forEach(block => {
        if (block.classList.contains('sui-highlighted')) return;
        
        // If code block already has manually formatted spans, just mark as highlighted
        if (block.querySelector('.sui-hl-tag, .sui-hl-attr, .token, .hljs-tag')) {
          block.classList.add('sui-highlighted');
          return;
        }

        let code = block.innerHTML;
        const isHTML = code.includes('&lt;') || code.includes('<') || block.classList.contains('language-html');

        if (!isHTML) {
          code = code
            .replace(/(\/\*[\s\S]*?\*\/)/g, '§COMMENT§$1§END§')
            .replace(/([a-zA-Z0-9\-\.\:]+)(?=\s*\{)/g, '§SELECTOR§$1§END§')
            .replace(/(--[a-zA-Z0-9\-]+|[a-zA-Z\-]+)(?=\s*:)/g, '§PROP§$1§END§')
            .replace(/(oklch|clamp|var|calc)(?=\()/g, '§FUNC§$1§END§')
            .replace(/(:?\s*)([0-9\.]+[a-zA-Z%]*|#[0-9a-fA-F]+)(?=[;\s}])/g, '$1§VAL§$2§END§');

          block.innerHTML = code
            .replace(/§COMMENT§/g, '<span class="token comment">')
            .replace(/§SELECTOR§/g, '<span class="token selector">')
            .replace(/§PROP§/g, '<span class="token property">')
            .replace(/§FUNC§/g, '<span class="token function">')
            .replace(/§VAL§/g, '<span class="token value">')
            .replace(/§END§/g, '</span>');
        } else {
          block.innerHTML = this.highlight(block.textContent || block.innerText);
        }

        block.classList.add('sui-highlighted');
      });
    }
  };

  /* ==========================================================================
     16. LIVE PLAYGROUND ENGINE
     Real-time HTML code editor overlay, syntax highlighting sync, reset, and safe clipboard copy.
     ========================================================================== */
  const PlaygroundEngine = {
    init(editorId = 'playEditor', previewId = 'playPreview', highlightId = 'highlightLayer') {
      if (typeof document === 'undefined') return;
      const editor = document.getElementById(editorId);
      if (editor) {
        editor.addEventListener('input', () => this.update(editorId, previewId, highlightId));
        editor.addEventListener('scroll', () => this.syncScroll(editorId, highlightId));
        this.update(editorId, previewId, highlightId);
      }
    },
    update(editorId = 'playEditor', previewId = 'playPreview', highlightId = 'highlightLayer') {
      if (typeof document === 'undefined') return;
      const editor = document.getElementById(editorId);
      const preview = document.getElementById(previewId);
      const highlight = document.getElementById(highlightId);
      if (!editor) return;
      const rawCode = editor.value || '';
      if (preview) {
        preview.innerHTML = rawCode;
      }
      if (highlight) {
        let colored = SyntaxHighlighter.highlight(rawCode) || '';
        if (rawCode.endsWith('\n')) colored += ' ';
        highlight.innerHTML = colored;
      }
    },
    syncScroll(editorId = 'playEditor', highlightId = 'highlightLayer') {
      if (typeof document === 'undefined') return;
      const editor = document.getElementById(editorId);
      const highlight = document.getElementById(highlightId);
      if (editor && highlight) {
        highlight.scrollTop = editor.scrollTop;
        highlight.scrollLeft = editor.scrollLeft;
      }
    },
    reset(editorId = 'playEditor', previewId = 'playPreview', highlightId = 'highlightLayer', defaultCode) {
      if (typeof document === 'undefined') return;
      const editor = document.getElementById(editorId);
      if (editor) {
        editor.value = defaultCode || `<article class="sui-card sui-hover-lift">\n  <h3 class="sui-mb-2">Hello SUI</h3>\n  <p class="sui-text-muted sui-mb-4">Edit this code to see live changes.</p>\n  <button class="sui-btn sui-btn-primary">Test Button</button>\n</article>`;
        this.update(editorId, previewId, highlightId);
      }
    },
    async copy(editorId = 'playEditor') {
      if (typeof document === 'undefined') return false;
      const editor = document.getElementById(editorId);
      if (!editor) return false;
      const text = editor.value || '';
      if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {}
      }
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (err) {
        return false;
      }
    }
  };

  /* ==========================================================================
     12. CONSOLIDATED GLOBAL EVENT DISPATCHER
     Centralizes all click, pointer, touch, and keyboard events for peak performance.
     ========================================================================== */
  function bindGlobalEvents() {
    
    // ------------------------------------------------------------------------
    // CONSOLIDATED CLICK DISPATCHER
    // ------------------------------------------------------------------------
    document.addEventListener('click', async (e) => {
      
      // 1. Theme Toggle
      const themeToggle = e.target.closest('.sui-theme-toggle, [data-sui-toggle-theme]');
      if (themeToggle) {
        e.preventDefault();
        ThemeEngine.toggle();
        return;
      }

      // 2. Modal Open Trigger
      const modalOpenTrigger = e.target.closest('[data-sui-modal-target]');
      if (modalOpenTrigger) {
        e.preventDefault();
        const targetId = modalOpenTrigger.getAttribute('data-sui-modal-target');
        Modal.open(targetId);
        return;
      }

      // 3. Modal Close Trigger
      const modalCloseTrigger = e.target.closest('[data-sui-modal-close], .sui-dialog-close');
      if (modalCloseTrigger) {
        e.preventDefault();
        const modal = modalCloseTrigger.closest('.sui-dialog-overlay');
        Modal.close(modal);
        return;
      }

      // 4. Modal Backdrop Click
      if (e.target.classList.contains('sui-dialog-overlay')) {
        Modal.close(e.target);
        return;
      }

      // 5. Dismissible Alerts
      const alertDismissBtn = e.target.closest('[data-sui-dismiss="alert"], .sui-alert-close');
      if (alertDismissBtn) {
        e.preventDefault();
        AlertEngine.dismiss(alertDismissBtn.closest('.sui-alert'));
        return;
      }

      // 6. Dropdown Toggle Trigger
      const dropdownTrigger = e.target.closest('[data-sui-dropdown-trigger]');
      if (dropdownTrigger) {
        e.preventDefault();
        const targetId = dropdownTrigger.getAttribute('data-sui-dropdown-trigger');
        const dropdown = document.getElementById(targetId) || dropdownTrigger.closest('.sui-dropdown');
        if (dropdown) {
          const isOpen = dropdown.classList.contains('is-open');
          FloatingEngine.closeAll();
          if (!isOpen) {
            dropdown.classList.add('is-open');
            dropdown.setAttribute('aria-expanded', 'true');
          }
        }
        return;
      }

      // 7. Popover Toggle Trigger
      const popoverTrigger = e.target.closest('[data-sui-popover-trigger]');
      if (popoverTrigger) {
        e.preventDefault();
        const popover = popoverTrigger.closest('.sui-popover');
        if (popover) {
          popover.classList.toggle('is-open');
        }
        return;
      }

      // 8. Outside Click Handler for Dropdowns & Popovers
      const clickedInsideDropdown = e.target.closest('.sui-dropdown, .sui-dropdown-menu');
      const clickedInsidePopover = e.target.closest('.sui-popover');
      if (!clickedInsideDropdown && !clickedInsidePopover) {
        FloatingEngine.closeAll();
      }

      // 9. Accordion Headers
      const accordionHeader = e.target.closest('.sui-accordion-header, [data-sui-accordion-trigger]');
      if (accordionHeader) {
        const item = accordionHeader.closest('.sui-accordion-item');
        const parent = accordionHeader.closest('.sui-accordion');
        const content = item ? item.querySelector('.sui-accordion-content') : null;
        if (item && content) {
          const isOpen = item.classList.contains('is-open');
          if (parent && !parent.hasAttribute('data-sui-multi')) {
            parent.querySelectorAll('.sui-accordion-item.is-open').forEach(sibling => {
              if (sibling !== item) {
                sibling.classList.remove('is-open');
                const c = sibling.querySelector('.sui-accordion-content');
                if (c) c.style.maxHeight = null;
              }
            });
          }
          if (isOpen) {
            item.classList.remove('is-open');
            content.style.maxHeight = null;
          } else {
            item.classList.add('is-open');
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        }
        return;
      }

      // 10. Tabs & Segmented Controls
      const tabBtn = e.target.closest('.tab-btn, .sui-tab');
      if (tabBtn) {
        const container = tabBtn.closest('.showcase-block, .sui-tabs-container, .showcase-tabs, .sui-card, .sui-tabs, .sui-tabs-pills, .sui-tabs-segmented, .sui-tabs-vertical');
        if (container) {
          container.querySelectorAll('.tab-btn, .sui-tab').forEach(b => b.classList.remove('active'));
          tabBtn.classList.add('active');
          const targetId = tabBtn.getAttribute('data-target');
          if (targetId) {
            const parent = container.parentElement || document;
            parent.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById(targetId);
            if (panel) panel.classList.add('active');
          }
          window.dispatchEvent(new CustomEvent('sui:tab-change', { detail: { button: tabBtn, targetId } }));
        }
        return;
      }

      // 11. One-Click Copy to Clipboard
      const copyBtn = e.target.closest('[data-sui-copy], .btn-copy-code');
      if (copyBtn) {
        let textToCopy = copyBtn.getAttribute('data-sui-copy');
        if (!textToCopy) {
          const container = copyBtn.closest('.code-reveal-panel, .u-card, .demo-section, article');
          const codeEl = container ? container.querySelector('code, pre') : null;
          if (codeEl) textToCopy = codeEl.textContent;
        }
        if (textToCopy) {
          try {
            await navigator.clipboard.writeText(textToCopy.trim());
            const orig = copyBtn.textContent;
            copyBtn.textContent = '✓ Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = orig;
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('[SUI.css] Copy failed:', err);
          }
        }
        return;
      }

      // 12. Password Eye Revealer
      const eyeBtn = e.target.closest('[data-sui-toggle-password]');
      if (eyeBtn) {
        const input = eyeBtn.parentElement?.querySelector('input');
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
          eyeBtn.classList.toggle('is-visible', input.type === 'text');
        }
        return;
      }

      // 13. Scroll-to-Top Button
      const scrollTopBtn = e.target.closest('[data-sui-scroll-top], .sui-back-to-top');
      if (scrollTopBtn) {
        e.preventDefault();
        ScrollEngine.scrollToTop(true);
        return;
      }

      // 14. Mobile Drawers & Overlays
      const closeDrawerBtn = e.target.closest(
        '.js-drawer-close, #closeDocsBtnReal, .js-docs-close, #globalCloseBtn, #globalCloseBackdrop, #docsSidebarOverlay, .drawer-backdrop, [data-sui-close-drawer]'
      );
      if (closeDrawerBtn) {
        MobileDrawerEngine.closeAll();
        return;
      }

      if (e.target.closest('#mobileMenuBtn')) {
        MobileDrawerEngine.openDrawer(document.getElementById('mobileDrawer'));
        return;
      }
      if (e.target.closest('#docsMenuBtn')) {
        const sidebar = document.getElementById('docsSidebar');
        const overlay = document.getElementById('docsSidebarOverlay');
        MobileDrawerEngine.toggleDrawer(sidebar, overlay);
        return;
      }
      if (e.target.closest('#globalMenuBtn')) {
        MobileDrawerEngine.openDrawer(document.getElementById('globalMobileDrawer'));
        return;
      }

      // 15. Replay Buttons for Animations Showcase
      const replayBtn = e.target.closest('.btn-replay');
      if (replayBtn) {
        const card = replayBtn.closest('.sui-card, .u-card, article');
        const target = card ? card.querySelector('.js-anim-target') : null;
        if (target) {
          const animClass = target.getAttribute('data-anim');
          if (animClass) {
            target.classList.remove(animClass);
            Utils.triggerReflow(target);
            target.classList.add(animClass);
          }
        }
        return;
      }

      // 16. Confetti Particle Trigger
      const confettiTrigger = e.target.closest('[data-sui-confetti]');
      if (confettiTrigger) {
        ConfettiEngine.trigger({ x: e.clientX, y: e.clientY });
      }

    });

    // ------------------------------------------------------------------------
    // DYNAMIC ACCESSIBLE TOOLTIP EVENT LISTENERS
    // ------------------------------------------------------------------------
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) TooltipEngine.show(target);
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) TooltipEngine.hide();
    }, { passive: true });

    document.addEventListener('focusin', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) TooltipEngine.show(target);
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) TooltipEngine.hide();
    });

    // ------------------------------------------------------------------------
    // CONSOLIDATED KEYBOARD DISPATCHER
    // ------------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
      // 1. Modals (Escape & Accessible Focus Trap)
      if (Modal.activeModal) {
        Modal.handleKeydown(e);
        return;
      }

      // 2. Dropdowns & Menus (Escape & Arrow Keys)
      FloatingEngine.handleDropdownKeydown(e);

      // 3. Escape closes Mobile Drawers
      if (e.key === 'Escape') {
        MobileDrawerEngine.closeAll();
      }

      // 4. Tab Key Arrow Navigation
      if (document.activeElement && document.activeElement.classList.contains('sui-tab')) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const container = document.activeElement.closest('.sui-tabs, .sui-tabs-pills, .sui-tabs-segmented');
          if (container) {
            const tabs = Array.from(container.querySelectorAll('.sui-tab'));
            const curIdx = tabs.indexOf(document.activeElement);
            if (curIdx >= 0) {
              e.preventDefault();
              const nextIdx = e.key === 'ArrowRight'
                ? (curIdx + 1) % tabs.length
                : (curIdx - 1 + tabs.length) % tabs.length;
              tabs[nextIdx].focus();
              tabs[nextIdx].click();
            }
          }
        }
      }

      // 5. Global Command Palette / Search Shortcuts (Cmd/Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const shortcutTrigger = document.querySelector('[data-sui-shortcut="ctrl+k"], [data-sui-shortcut="cmd+k"]');
        if (shortcutTrigger) {
          e.preventDefault();
          shortcutTrigger.click();
        }
        window.dispatchEvent(new CustomEvent('sui:shortcut:command-k'));
      }
    });

    // ------------------------------------------------------------------------
    // HARDWARE ACCELERATED RIPPLE EFFECT
    // ------------------------------------------------------------------------
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('.sui-btn, .sui-ripple');
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('sui-ripple-wave');
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.transform = 'scale(0)';
      circle.style.animation = 'sui-ripple-anim 0.6s linear';
      circle.style.backgroundColor = 'oklch(100% 0 0 / 0.3)';
      circle.style.pointerEvents = 'none';

      target.style.position = target.style.position === 'relative' ? target.style.position : 'relative';
      target.style.overflow = 'hidden';

      const existing = target.querySelector('.sui-ripple-wave');
      if (existing) existing.remove();

      target.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });

    // ------------------------------------------------------------------------
    // MAGNETIC GLOW EFFECT FOR BENTO ITEMS
    // ------------------------------------------------------------------------
    document.querySelectorAll('.bento-item').forEach(item => {
      item.addEventListener('mousemove', e => {
        const rect = item.getBoundingClientRect();
        item.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        item.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    });

  }

  /* ==========================================================================
     GLOBAL INITIALIZATION LIFECYCLE
     ========================================================================== */
  function initialize() {
    ThemeEngine.init();
    FormUtilities.init();
    ScrollEngine.init();
    CounterEngine.init();
    TableEngine.init();
    ScrollSpyEngine.init();
    PlaygroundEngine.init();
    SyntaxHighlighter.highlightAll();
    bindGlobalEvents();

    console.log('%c🚀 SUI.css v2.1.0 Interactive Engine active.', 'color: #3b82f6; font-weight: bold;');
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  }

  // Global highlight helper and playground helper
  const rootScope = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
  rootScope.suiHighlightElement = function(el) {
    if (el) el.innerHTML = SyntaxHighlighter.highlight(el.innerText || el.textContent || '');
  };
  rootScope.suiPlayground = PlaygroundEngine;

  /* ==========================================================================
     EXPORT PUBLIC GLOBAL API (window.SUI)
     ========================================================================== */
  return {
    version: '2.1.0',
    theme: ThemeEngine,
    modal: Modal,
    toast: Toast,
    dropdown: FloatingEngine,
    alert: AlertEngine,
    drawer: MobileDrawerEngine,
    counter: CounterEngine,
    scroll: ScrollEngine,
    scrollSpy: ScrollSpyEngine,
    table: TableEngine,
    tooltip: TooltipEngine,
    confetti: ConfettiEngine,
    playground: PlaygroundEngine,
    highlight: function(text) {
      return SyntaxHighlighter.highlight(text);
    },
    highlightAll: function() {
      return SyntaxHighlighter.highlightAll();
    },
    highlightElement: function(el) {
      if (el) el.innerHTML = SyntaxHighlighter.highlight(el.innerText || el.textContent || '');
    }
  };

}));
