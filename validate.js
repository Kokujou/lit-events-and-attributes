const { createTextChangeRange, createTextSpan } = require('typescript');
const { analyzeHTMLDocument, analyzeAttributeCollection } = require('./analyze.js');
const { undefinedAttributeError, attributeTypeMismatch, writeTypescriptDiagnostics } = require('./errors.js');
const { getNodesRecurse } = require('./typescript.extension.js');

/**
 * @param {import('vscode').TextDocument} document
 * @param {Object.<string, import('typescript').Symbol>} componentTypeDict
 * @param {string} componentName
 * @param {[string, import('./attribute-value.js').AttributeValue]} attribute
 * @param {import('typescript').TypeChecker} checker
 */
function validateAttribute(document, componentTypeDict, componentName, attribute, checker) {
    if (!componentTypeDict[componentName]) return;
    // @ts-ignore
    var componentProperty = componentTypeDict[componentName].members.get(attribute[0].slice('.'.length));

    // @ts-ignore
    if (!componentProperty?.parent) {
        undefinedAttributeError(document, attribute);
        return;
    }

    // @ts-ignore
    /** @type {Type} */ var propertyType = checker.getTypeOfSymbol(componentProperty);
    var propertyTypeName = checker.typeToString(propertyType);
    var attributeTypeName = checker.typeToString(attribute[1].type);
    if (attributeTypeName != propertyTypeName) {
        attributeTypeMismatch(document, attribute, propertyTypeName, attributeTypeName);
        return;
    }
}

/**
 *
 * @param {import('vscode').TextDocument} document
 * @param {import('typescript').Program} program
 * @param {{[key:string]:import('typescript').Symbol}} componentTypeMap
 */
function validateDocument(document, program, componentTypeMap) {
    var checker = program.getTypeChecker();
    var htmlNodes = analyzeHTMLDocument(document);
    var scriptFile = program.getSourceFile(document.fileName);
    var tsNodes = getNodesRecurse(scriptFile);
    var attributeCollections = analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, checker, '.');
    for (var attributeCollection of attributeCollections) {
        for (var attribute of attributeCollection.attributes) {
            validateAttribute(document, componentTypeMap, attributeCollection.parent, attribute, checker);
        }
    }

    scriptFile.update(
        document.getText(),
        createTextChangeRange(createTextSpan(0, document.getText().length), document.getText().length)
    );

    var diagnostics = program
        .getSyntacticDiagnostics(scriptFile)
        .concat(program.getSemanticDiagnostics(scriptFile))
        .concat(program.getSuggestionDiagnostics(scriptFile));
    writeTypescriptDiagnostics(document, diagnostics);
}

module.exports = { validateAttribute, validateDocument };
