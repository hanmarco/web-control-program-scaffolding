// Vuetify WebKit compatibility fixes for Tauri
// This file contains specific fixes for rendering issues in Tauri's WebView

export const vuetifyWebKitFixes = {
  // Apply fixes after Vuetify is mounted
  applyFixes(): void {
    // Fix for button ripple effects that may cause rendering issues
    this.fixButtonRipples();
    
    // Fix for menu positioning issues
    this.fixMenuPositioning();
    
    // Fix for input field rendering
    this.fixInputFields();
    
    // Fix for card shadows
    this.fixCardShadows();
  },

  fixButtonRipples(): void {
    // Disable ripple effects for better WebKit performance
    const style = document.createElement('style');
    style.textContent = `
      .v-btn .v-ripple__container {
        display: none !important;
      }
      
      .v-btn {
        transition: background-color 0.2s ease, box-shadow 0.2s ease !important;
      }
      
      .v-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12) !important;
      }
    `;
    document.head.appendChild(style);
  },

  fixMenuPositioning(): void {
    // Fix menu positioning issues in WebKit
    const style = document.createElement('style');
    style.textContent = `
      .v-menu .v-overlay__content {
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        will-change: transform !important;
      }
      
      .v-menu .v-list {
        max-height: 300px;
        overflow-y: auto;
      }
    `;
    document.head.appendChild(style);
  },

  fixInputFields(): void {
    // Fix input field rendering issues
    const style = document.createElement('style');
    style.textContent = `
      .v-field__input {
        -webkit-appearance: none !important;
        appearance: none !important;
        -webkit-border-radius: 0 !important;
        border-radius: 4px !important;
      }
      
      .v-text-field .v-field__field {
        border-radius: 4px !important;
      }
      
      .v-select .v-field__field {
        border-radius: 4px !important;
      }
      
      /* Fix for input focus states */
      .v-field--focused .v-field__outline {
        color: #1976D2 !important;
        border-color: #1976D2 !important;
      }
    `;
    document.head.appendChild(style);
  },

  fixCardShadows(): void {
    // Optimize card shadows for better WebKit rendering
    const style = document.createElement('style');
    style.textContent = `
      .v-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        transform: translateZ(0) !important;
        -webkit-transform: translateZ(0) !important;
        border-radius: 8px !important;
      }
      
      .v-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        transform: translateY(-2px) translateZ(0) !important;
      }
    `;
    document.head.appendChild(style);
  },

  // Check for common WebKit rendering issues
  checkCompatibility(): boolean {
    const userAgent = navigator.userAgent;
    const isWebKit = /webkit/i.test(userAgent);
    const isTauri = (window as any).__TAURI__ !== undefined;
    
    console.log('WebKit Compatibility Check:', {
      isWebKit,
      isTauri,
      userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio
    });
    
    return isWebKit && isTauri;
  },

  // Diagnose Vuetify theme state at runtime
  diagnoseTheme(): void {
    try {
      const root = document.documentElement;
      const classes = Array.from(root.classList).filter(Boolean);
      const vars = [
        '--v-theme-primary',
        '--v-theme-background',
        '--v-theme-surface',
        '--v-theme-on-primary',
        '--v-theme-on-surface'
      ];

      const computed = getComputedStyle(root);
      const values: Record<string, string> = {};
      vars.forEach(v => {
        values[v] = computed.getPropertyValue(v) || '(unset)';
      });

      // Detect Vuetify theme classes
      const hasDarkClass = classes.some(c => /dark/i.test(c) || /theme--dark/i.test(c) || /v-theme--dark/i.test(c));
      const hasLightClass = classes.some(c => /light/i.test(c) || /theme--light/i.test(c) || /v-theme--light/i.test(c));

      console.log('Vuetify Theme Diagnosis:', {
        documentClasses: classes,
        hasDarkClass,
        hasLightClass,
        cssVars: values,
        userAgent: navigator.userAgent
      });

      // Also create a hidden element to resolve the computed color for "primary"
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;color:var(--v-theme-primary);';
      el.textContent = 'x';
      document.body.appendChild(el);
      const resolved = getComputedStyle(el).color;
      console.log('Resolved --v-theme-primary color:', resolved);
      document.body.removeChild(el);
    } catch (e) {
      console.error('Error diagnosing Vuetify theme:', e);
    }
  },

  // Monitor for rendering issues
  monitorPerformance(): void {
    // Check for layout shifts
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            console.warn('Layout shift detected:', entry);
          }
        }
      });
      
      try {
        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.log('Layout shift monitoring not supported');
      }
    }
  }
};

// Auto-apply fixes when imported
export default vuetifyWebKitFixes;