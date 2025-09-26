const styles = new CSSStyleSheet();
styles.replaceSync(`
    ul {
        background-color: white;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        border-radius: 0.5rem;
        padding: 1rem;
    }
    li {
        border-bottom-width: 1px;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
    }
    li:last-child {
        border-bottom-width: 0;
    }
    .default-value, .added-value {
        display: inline-block;
        background-color: #f3f4f6;
        border-radius: 9999px;
        padding: 0.25rem 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        margin: 0.25rem;
    }
    .added-value {
        background-color: #e0e7ff;
    }
    input {
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        padding: 0.5rem;
        margin-right: 0.5rem;
    }
    button {
        background-color: #4f46e5;
        color: white;
        font-weight: 700;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
    }
    button:hover {
        background-color: #4338ca;
    }
    .add-new-value {
        margin-top: 0.5rem;
    }
`);

class CspManager extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [styles];

        this.state = {
            "base-uri": { defaults: ["'self'"], added: [] },
            "block-all-mixed-content": { defaults: [], added: [] },
            "child-src": { defaults: [], added: [] },
            "connect-src": { defaults: ["'self'"], added: [] },
            "default-src": { defaults: ["'self'"], added: [] },
            "font-src": { defaults: ["'self'", "data:"], added: [] },
            "form-action": { defaults: ["'self'"], added: [] },
            "frame-ancestors": { defaults: ["'none'"], added: [] },
            "img-src": { defaults: ["'self'", "data:"], added: [] },
            "manifest-src": { defaults: ["'self'"], added: [] },
            "media-src": { defaults: ["'self'"], added: [] },
            "object-src": { defaults: ["'none'"], added: [] },
            "plugin-types": { defaults: [], added: [] },
            "report-to": { defaults: [], added: [] },
            "report-uri": { defaults: [], added: [] },
            sandbox: { defaults: [], added: [] },
            "script-src": { defaults: ["'self'"], added: [] },
            "style-src": { defaults: ["'self'", "'unsafe-inline'"], added: [] },
            "upgrade-insecure-requests": { defaults: [], added: [] },
        };
    }

    addValue(directive, value) {
        if (this.state[directive] && value) {
            this.state[directive].added.push(value);
            this.render();
        }
    }

    removeValue(directive, index) {
        if (this.state[directive] && this.state[directive].added[index] !== undefined) {
            this.state[directive].added.splice(index, 1);
            this.render();
        }
    }

    editValue(directive, index, newValue) {
        if (this.state[directive] && this.state[directive].added[index] !== undefined) {
            this.state[directive].added[index] = newValue;
            this.render();
        }
    }

    resetDirective(directive) {
        if (this.state[directive]) {
            this.state[directive].added = [];
            this.render();
        }
    }

    generateCspString() {
        return Object.entries(this.state)
            .map(([key, valueObj]) => {
                const allValues = [...valueObj.defaults, ...valueObj.added];
                if (allValues.length === 0) {
                    return '';
                }
                return `${key} ${allValues.join(' ')}`;
            })
            .filter(part => part.trim() !== '')
            .join('; ');
    }

    connectedCallback() {
        this.render();
    }

    attachEventListeners() {
        this.shadowRoot.querySelectorAll('button.add-btn').forEach(button => {
            // Prevent multiple listeners by cloning and replacing the node
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (e) => {
                const directive = e.target.dataset.directive;
                const input = this.shadowRoot.querySelector(`input[data-directive="${directive}"]`);
                if (input && input.value) {
                    this.addValue(directive, input.value);
                    input.value = '';
                }
            });
        });
    }

    render() {
        const cspString = this.generateCspString();
        this.shadowRoot.innerHTML = `
            <ul>
                ${Object.entries(this.state).map(([key, valueObj]) => `
                    <li>
                        <strong>${key}</strong>
                        <div>
                            ${valueObj.defaults.map(v => `<span class="default-value">${v}</span>`).join(' ')}
                            ${valueObj.added.map((v, i) => `<span class="added-value">${v}</span>`).join(' ')}
                        </div>
                        <div class="add-new-value">
                            <input type="text" data-directive="${key}" placeholder="Add new value">
                            <button class="add-btn" data-directive="${key}">+</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
            <pre><code>${cspString}</code></pre>
        `;
        this.attachEventListeners();
    }
}

customElements.define('csp-manager', CspManager);
