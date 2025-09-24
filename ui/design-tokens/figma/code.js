// Show the plugin UI
figma.showUI(__html__, { width: 400, height: 600 });

// Function to get all variables from the current file
async function getAllVariables() {
  try {
    const localVariables = await figma.variables.getLocalVariablesAsync();
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();

    const variablesData = {
      collections: localCollections.map(function (c) {
        return { id: c.id, name: c.name, modes: c.modes };
      }),
      variables: localVariables.map(function (v) {
        return {
          id: v.id,
          name: v.name,
          type: v.resolvedType,
          valuesByMode: v.valuesByMode,
          variableCollectionId: v.variableCollectionId,
          scopes: v.scopes || [],
          description: v.description || '',
        };
      }),
    };
    return variablesData;
  } catch (e) {
    console.error("Error in getAllVariables:", e);
    figma.notify("Error fetching variables. Check console.", { error: true });
    return null;
  }
}


function resolveValue(value, figmaType, variablesById, collectionsById, themeContextName) {
  if (typeof value === 'object' && value !== null && value.type === 'VARIABLE_ALIAS') {
    var aliasedVar = variablesById.get(value.id);
    if (aliasedVar) {
      var collection = collectionsById.get(aliasedVar.variableCollectionId);
      if (collection && collection.name.toLowerCase() === 'themes') {
        var themeName = themeContextName.replace(/\s+/g, '_').toLowerCase();
        var path = aliasedVar.name.split('/').map(function (p) { return p.toLowerCase(); }).join('.');
        return '{themes.' + themeName + '.' + path + '}';
      }
    }
    console.warn('Could not resolve alias:', value);
    return '{VariableID:' + value.id + '}';
  }
  return formatRawValue(value, figmaType);
}

function formatRawValue(value, figmaType) {
  if (typeof value === 'object' && value !== null) {
    if (figmaType === 'COLOR' && value.r !== undefined) {
      var r = value.r, g = value.g, b = value.b, a = value.a;
      var toHex = function (c) { return Math.round(c * 255).toString(16).padStart(2, '0'); };
      var hex = '#' + toHex(r) + toHex(g) + toHex(b);
      if (a < 1) {
        hex += toHex(a);
      }
      return hex;
    }
  }
  return value;
}

function mapFigmaTypeToW3C(figmaType) {
  var typeMap = {
    'COLOR': 'color',
    'FLOAT': 'number',
    'STRING': 'string',
    'BOOLEAN': 'boolean'
  };
  return typeMap[figmaType] || 'string';
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'get-variables') {
    var variables = await getAllVariables();
    if (variables) {
      figma.ui.postMessage({ type: 'variables-data', data: variables });
    }
  } else if (msg.type === 'export-w3c-tokens') {
    var w3cTokens = convertToW3C(msg.data);
    figma.ui.postMessage({ type: 'export-ready', data: w3cTokens });
  } else if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

function convertToW3C(figmaData) {
  console.log('Running W3C Conversion - v9');
  var w3cJson = { themes: {}, tokens: {} };
  var variablesById = new Map(figmaData.variables.map(function (v) { return [v.id, v]; }));
  var collectionsById = new Map(figmaData.collections.map(function (c) { return [c.id, c]; }));

  var themesCollection = figmaData.collections.find(function (c) { return c.name.toLowerCase() === 'themes'; });
  var tokensCollection = figmaData.collections.find(function (c) { return c.name.toLowerCase() === 'tokens'; });

  if (!themesCollection || !tokensCollection) {
    console.error("CRITICAL: Could not find 'themes' or 'tokens' collections. Aborting.");
    figma.notify("Error: Could not find 'themes' or 'tokens' collections.", { error: true });
    return {};
  }

  // 1. Process Primitives (Themes)
  var themeVariables = figmaData.variables.filter(function (v) { return v.variableCollectionId === themesCollection.id; });
  themesCollection.modes.forEach(function (mode) {
    var themeName = mode.name.replace(/\s+/g, '_').toLowerCase();
    w3cJson.themes[themeName] = {};

    themeVariables.forEach(function (variable) {
      var value = variable.valuesByMode[mode.modeId];
      if (value === undefined || value === "String value") return;

      var path = variable.name.split('/').map(function (p) { return p.toLowerCase(); });
      var currentLevel = w3cJson.themes[themeName];
      path.forEach(function (p, i) {
        if (i === path.length - 1) {
          var tokenObj = {
            $value: formatRawValue(value, variable.type),
            $type: mapFigmaTypeToW3C(variable.type),
          };
          if (variable.description) {
            tokenObj.$description = variable.description;
          }
          currentLevel[p] = tokenObj;
        } else {
          currentLevel[p] = currentLevel[p] || {};
          currentLevel = currentLevel[p];
        }
      });
    });
  });

  // 2. Process Semantic Tokens
  var tokenVariables = figmaData.variables.filter(function (v) { return v.variableCollectionId === tokensCollection.id; });
  tokenVariables.forEach(function (variable) {
    var path = variable.name.split('/').map(function (p) { return p.toLowerCase(); });
    var currentLevel = w3cJson.tokens;

    path.forEach(function (p, i) {
      if (i === path.length - 1) {
        var tokenData = {
          $type: mapFigmaTypeToW3C(variable.type),
          $extensions: { mode: {} }
        };

        if (variable.description) {
          tokenData.$description = variable.description;
        }

        var firstTokenModeId = (tokensCollection.modes && tokensCollection.modes.length > 0) ? tokensCollection.modes[0].modeId : null;
        var firstThemeName = (themesCollection.modes && themesCollection.modes.length > 0) ? themesCollection.modes[0].name : null;

        if (firstTokenModeId && firstThemeName) {
          var defaultValue = variable.valuesByMode[firstTokenModeId];
          if (defaultValue === "String value") return;
          tokenData.$value = resolveValue(defaultValue, variable.type, variablesById, collectionsById, firstThemeName);
        }

        tokensCollection.modes.forEach(function (tokenMode) {
          var modeName = tokenMode.name.toLowerCase();
          var value = variable.valuesByMode[tokenMode.modeId];
          if (value !== undefined && value !== "String value" && firstThemeName) {
            tokenData.$extensions.mode[modeName] = resolveValue(value, variable.type, variablesById, collectionsById, firstThemeName);
          }
        });


        currentLevel[p] = tokenData;
      } else {
        currentLevel[p] = currentLevel[p] || {};
        currentLevel = currentLevel[p];
      }
    });
  });

  console.log('Conversion complete.');
  return w3cJson;
}

