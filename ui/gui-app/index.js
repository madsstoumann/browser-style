// Import the GuiPanel component using the alias from the importmap
import '@browser.style/gui-panel';

// Initialize gui-app component if needed
class GuiApp extends HTMLElement {
  constructor() {
    super();
    this.init();
    this.resizeObserver = null;
  }

  init() {
    // Initialize your GUI app
    console.log('GUI App initialized');
    
    // You can access the panels if needed
    const startPanel = this.querySelector('gui-panel[dock="start"]');
    const endPanel = this.querySelector('gui-panel[dock="end"]');
    
    // Add ResizeObserver to handle responsive behavior
    const MOBILE_WIDTH = 600; // Threshold for mobile view
    
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        
        if (width < MOBILE_WIDTH) {
          // Mobile view: set panels to popover and position offscreen
          if (startPanel) {
            startPanel.setAttribute('popover', 'manual');
            startPanel.style.setProperty('--gui-panel-x', '-100vw');
          }
          
          if (endPanel) {
            endPanel.setAttribute('popover', 'manual');
						endPanel.showPopover();
            endPanel.style.setProperty('--gui-panel-x', '100vw');
          }
        } else {
          // Desktop view: remove popover attribute and reset position
          if (startPanel) {
            startPanel.removeAttribute('popover');
            startPanel.style.removeProperty('--gui-panel-x');
          }
          
          if (endPanel) {
            endPanel.removeAttribute('popover');
            endPanel.style.removeProperty('--gui-panel-x');
          }
        }
      }
    });
    
    // Start observing this component
    // this.resizeObserver.observe(this);
  }
  
  disconnectedCallback() {
    // Clean up the observer when component is removed
    // if (this.resizeObserver) {
    //   this.resizeObserver.disconnect();
    // }
  }
}

// Register the gui-app custom element
customElements.define('gui-app', GuiApp);
