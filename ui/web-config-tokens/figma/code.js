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

function convertToFigmaValue(w3cValue, figmaType) {
  if (figmaType === 'COLOR' && typeof w3cValue === 'string' && w3cValue.startsWith('#')) {
    // Convert hex color to Figma RGB format
    var hex = w3cValue.replace('#', '');
    var r, g, b, a = 1;

    if (hex.length === 6) {
      r = parseInt(hex.substr(0, 2), 16) / 255;
      g = parseInt(hex.substr(2, 2), 16) / 255;
      b = parseInt(hex.substr(4, 2), 16) / 255;
    } else if (hex.length === 8) {
      r = parseInt(hex.substr(0, 2), 16) / 255;
      g = parseInt(hex.substr(2, 2), 16) / 255;
      b = parseInt(hex.substr(4, 2), 16) / 255;
      a = parseInt(hex.substr(6, 2), 16) / 255;
    } else {
      throw new Error('Invalid hex color format: ' + w3cValue);
    }

    return { r: r, g: g, b: b, a: a };
  }

  // For other types, return as-is
  return w3cValue;
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
  } else if (msg.type === 'import-w3c-tokens') {
    await importW3CTokens(msg.data);
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
            $extensions: {
              figma: {
                variableId: variable.id,
                collectionId: variable.variableCollectionId
              }
            }
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
          $extensions: {
            mode: {},
            figma: {
              variableId: variable.id,
              collectionId: variable.variableCollectionId
            }
          }
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

async function importW3CTokens(w3cData) {
  console.log('Starting W3C Token Import...');

  try {
    var currentVariables = await getAllVariables();
    if (!currentVariables) {
      console.error('Could not fetch current variables');
      figma.notify('Error: Could not fetch current variables', { error: true });
      return;
    }

    var variablesById = new Map(currentVariables.variables.map(function (v) { return [v.id, v]; }));
    var collectionsById = new Map(currentVariables.collections.map(function (c) { return [c.id, c]; }));
    var changedTokens = [];

    function compareTokens(tokenObj, path) {
      if (tokenObj && tokenObj.$extensions && tokenObj.$extensions.figma) {
        var figmaExt = tokenObj.$extensions.figma;
        var variableId = figmaExt.variableId;
        var collectionId = figmaExt.collectionId;

        if (variableId && collectionId) {
          var currentVariable = variablesById.get(variableId);
          var currentCollection = collectionsById.get(collectionId);

          if (currentVariable && currentCollection) {
            var importedValue = tokenObj.$value;

            // Extract theme name from path to find the correct mode
            var pathParts = path.split('.');
            var themeName = pathParts[1]; // themes.default_theme.color.gray.50 -> default_theme

            // Find the mode that matches this theme
            var targetMode = currentCollection.modes.find(function(mode) {
              var modeName = mode.name.replace(/\s+/g, '_').toLowerCase();
              return modeName === themeName;
            });

            if (targetMode) {
              var currentValue = currentVariable.valuesByMode[targetMode.modeId];

              // Format current value for comparison
              var formattedCurrentValue = formatRawValue(currentValue, currentVariable.type);

              // Debug logging for first few comparisons
              if (changedTokens.length < 3) {
                console.log('DEBUG - Comparing token at path: ' + path);
                console.log('  Theme name:', themeName);
                console.log('  Target mode:', targetMode.name);
                console.log('  Current raw value:', currentValue);
                console.log('  Formatted current:', formattedCurrentValue);
                console.log('  Imported value:', importedValue);
                console.log('  Types match:', typeof formattedCurrentValue === typeof importedValue);
                console.log('  Values equal:', formattedCurrentValue === importedValue);
              }

              if (formattedCurrentValue !== importedValue) {
                // Convert imported value back to Figma format
                var figmaValue = convertToFigmaValue(importedValue, currentVariable.type);

                try {
                  // Get the actual variable object from Figma
                  var figmaVariable = figma.variables.getVariableById(variableId);
                  if (figmaVariable) {
                    // Use the correct Figma API method
                    figmaVariable.setValueForMode(targetMode.modeId, figmaValue);
                  } else {
                    throw new Error('Variable not found: ' + variableId);
                  }

                  changedTokens.push({
                    path: path,
                    variableId: variableId,
                    variableName: currentVariable.name,
                    collectionName: currentCollection.name,
                    currentValue: formattedCurrentValue,
                    importedValue: importedValue,
                    type: currentVariable.type,
                    status: 'updated'
                  });
                } catch (error) {
                  console.error('Failed to update variable:', currentVariable.name, error);
                  changedTokens.push({
                    path: path,
                    variableId: variableId,
                    variableName: currentVariable.name,
                    collectionName: currentCollection.name,
                    currentValue: formattedCurrentValue,
                    importedValue: importedValue,
                    type: currentVariable.type,
                    status: 'error',
                    error: error.message
                  });
                }
              }
            } else {
              console.warn('Could not find matching mode for theme:', themeName);
            }
          }
        }
      }

      // Recursively check nested objects
      for (var key in tokenObj) {
        if (tokenObj.hasOwnProperty(key) && key !== '$value' && key !== '$type' && key !== '$extensions' && key !== '$description') {
          if (typeof tokenObj[key] === 'object' && tokenObj[key] !== null) {
            compareTokens(tokenObj[key], path ? path + '.' + key : key);
          }
        }
      }
    }

    // Only check themes (primitives)
    if (w3cData.themes) {
      for (var themeName in w3cData.themes) {
        compareTokens(w3cData.themes[themeName], 'themes.' + themeName);
      }
    }

    // Log results
    if (changedTokens.length === 0) {
      console.log('✅ No changes detected. All tokens match current values.');
      figma.notify('No changes detected in imported tokens', { timeout: 2000 });
    } else {
      var updatedCount = changedTokens.filter(function(token) { return token.status === 'updated'; }).length;
      var errorCount = changedTokens.filter(function(token) { return token.status === 'error'; }).length;

      console.log('🔄 Processing ' + changedTokens.length + ' changed token(s):');
      changedTokens.forEach(function(token) {
        if (token.status === 'updated') {
          console.log('✅ Updated: ' + token.path);
          console.log('  Variable: ' + token.variableName + ' (' + token.collectionName + ')');
          console.log('  From: ' + token.currentValue);
          console.log('  To:   ' + token.importedValue);
        } else if (token.status === 'error') {
          console.log('❌ Failed: ' + token.path);
          console.log('  Variable: ' + token.variableName + ' (' + token.collectionName + ')');
          console.log('  Error: ' + token.error);
        }
        console.log('---');
      });

      var message = updatedCount + ' variable(s) updated';
      if (errorCount > 0) {
        message += ', ' + errorCount + ' failed';
      }
      message += '. Check console for details.';

      figma.notify(message, { timeout: 4000 });
    }

  } catch (error) {
    console.error('Import error:', error);
    figma.notify('Import failed. Check console for details.', { error: true });
  }
}

