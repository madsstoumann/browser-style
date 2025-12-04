import { createRoot } from 'react-dom/client';
import { init } from '@contentful/app-sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import FieldEditor from './FieldEditor';

const root = createRoot(document.getElementById('root'));

// Always render the FieldEditor component
init((sdk) => {
  root.render(
    <SDKProvider sdk={sdk}>
      <GlobalStyles />
      <FieldEditor />
    </SDKProvider>
  );
}).catch(() => {
  // If SDK init fails (not in Contentful), just render the component directly
  root.render(
    <>
      <GlobalStyles />
      <div id="preview"></div>
    </>
  );

  const script = document.createElement('script');
  script.type = 'module';
  script.src = '/csp-manager/index.js';
  script.onload = () => {
    const preview = document.getElementById('preview');
    const cspManager = document.createElement('csp-manager');
    cspManager.setAttribute('evaluate', '');
    preview.appendChild(cspManager);
  };
  document.head.appendChild(script);
});
