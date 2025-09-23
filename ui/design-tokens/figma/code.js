// Show the plugin UI
console.log('Plugin starting...');
figma.showUI(__html__, { width: 400, height: 600 });
console.log('UI shown, waiting for messages...');

// Function to get all variables from the current file
async function getAllVariables() {
  try {
    // Get all local variables in the current file
    const localVariables = await figma.variables.getLocalVariablesAsync();

    // Get all local variable collections
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();

    const variablesData = {
      collections: [],
      variables: []
    };

    // Process collections
    for (const collection of localCollections) {
      variablesData.collections.push({
        id: collection.id,
        name: collection.name,
        modes: collection.modes,
        defaultModeId: collection.defaultModeId,
        remote: collection.remote,
        hiddenFromPublishing: collection.hiddenFromPublishing
      });
    }

    // Process variables
    for (const variable of localVariables) {
      const variableData = {
        id: variable.id,
        name: variable.name,
        description: variable.description,
        type: variable.resolvedType,
        scopes: variable.scopes,
        codeSyntax: variable.codeSyntax,
        hiddenFromPublishing: variable.hiddenFromPublishing,
        valuesByMode: {},
        remote: variable.remote,
        variableCollectionId: variable.variableCollectionId
      };

      // Get values for each mode
      for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
        variableData.valuesByMode[modeId] = value;
      }

      variablesData.variables.push(variableData);
    }

    return variablesData;
  } catch (error) {
    console.error('Error getting variables:', error);
    return { error: error.message };
  }
}

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  console.log('Plugin received message:', msg);

  if (msg.type === 'ui-ready') {
    console.log('UI is ready, sending initial variables...');
    const variables = await getAllVariables();
    figma.ui.postMessage({ type: 'variables-data', data: variables });
  } else if (msg.type === 'get-variables') {
    console.log('Getting variables...');
    const variables = await getAllVariables();
    console.log('Sending variables to UI:', variables);
    figma.ui.postMessage({ type: 'variables-data', data: variables });
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};