import React, { useEffect, useRef } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';

const FieldEditor = () => {
  const sdk = useSDK();
  const containerRef = useRef(null);
  const cspManagerRef = useRef(null);

  useEffect(() => {
    // Auto-resize the iframe
    sdk.window.startAutoResizer();

    // Load the component script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/csp-manager/index.js';

    script.onload = () => {
      // Create the web component after script loads
      const cspManager = document.createElement('csp-manager');
      cspManager.setAttribute('evaluate', '');

      // Add to DOM
      if (containerRef.current) {
        containerRef.current.appendChild(cspManager);
        cspManagerRef.current = cspManager;
      }

      // Wait for component to be ready
      const initializeComponent = async () => {
        if (cspManager.ready) {
          await cspManager.ready;
        }

        // Load initial value from Contentful
        const currentValue = sdk.field.getValue();
        if (currentValue && typeof currentValue === 'object') {
          cspManager.policy = currentValue;
        }

        // Listen for changes
        const handleCspChange = (event) => {
          const { policy, evaluations } = event.detail;

          // Save to Contentful
          sdk.field.setValue(policy);

          // Handle security validation
          if (evaluations) {
            const highSeverityIssues = Object.entries(evaluations)
              .filter(([_, evaluation]) => evaluation.severity === 'high');

            if (highSeverityIssues.length > 0) {
              const totalFindings = highSeverityIssues.reduce(
                (sum, [_, evaluation]) => sum + evaluation.findings.length,
                0
              );

              sdk.field.setInvalid(
                `${totalFindings} high-severity security issue(s) detected`
              );
            } else {
              sdk.field.removeInvalid();
            }
          }
        };

        cspManager.addEventListener('csp-change', handleCspChange);
      };

      initializeComponent();
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (containerRef.current && cspManagerRef.current) {
        containerRef.current.removeChild(cspManagerRef.current);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [sdk]);

  return <div ref={containerRef} style={{ padding: '16px' }}></div>;
};

export default FieldEditor;
