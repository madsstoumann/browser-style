// Import the GuiPanel component using the alias from the importmap
import '@browser.style/gui-panel';

// Initialize gui-app component if needed
class GuiApp extends HTMLElement {
  constructor() {
    super();
    this.init();
  }

  init() {
    // Initialize your GUI app
    console.log('GUI App initialized');
    
    // You can access the panels if needed
    const startPanel = this.querySelector('gui-panel[dock="start"]');
    const endPanel = this.querySelector('gui-panel[dock="end"]');
  }
}

// Register the gui-app custom element
customElements.define('gui-app', GuiApp);
