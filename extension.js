/**
 * DO REGEX REPLACEMENT FOR ALL EVENT ATTRIBUTES AND USE TS LANGUAGE SERVER AS A PROXY TO INFER UI ELEMENTS
 */

const { createCompletionProvider } = require('./providers/completion-provider.js');
const { analyzeComponents, analyzeHTMLDocument, analyzeAttributeCollection } = require('./analyze.js');
const minimatch = require('minimatch');
const { workspace, Uri, languages } = require('vscode');
const { undefinedAttributeError, attributeTypeMismatch, flushErrors } = require('./errors.js');
const { getNodesRecurse } = require('./typescript.extension.js');
const { readFileSync } = require('fs');
const { createProgram, createCompilerHost } = require('typescript');
const { createDefinitionProvider } = require('./providers/definition-provider.js');
const { createHoverProvider } = require('./providers/hover-provider.js');
const { createImplementationProvider } = require('./providers/implementation-provider.js');
const { createTypeDefinitionProvider } = require('./providers/type-definition-provider.js');

/**
 * @param {string[]} absoluteFilePaths
 * @returns
 */
async function createProgramFromWorkspace(absoluteFilePaths) {
    var host = createCompilerHost({ allowJs: true });
    host.readFile = (name) => readFileSync(name).toString();
    host.writeFile = () => {};
    return createProgram(absoluteFilePaths, { allowJs: true }, host);
}

async function getFilesFromWorkspace() {
    var rootFolder = workspace.workspaceFolders[0].uri.fsPath;
    var jsConfig = JSON.parse(readFileSync(rootFolder + '\\jsconfig.json', 'utf8'));
    /** @type {Uri[]} */ var includedFiles = [];
    for (var pattern of jsConfig.include) includedFiles = includedFiles.concat(await workspace.findFiles(pattern));
    for (var excludePattern of jsConfig.exclude)
        includedFiles = includedFiles.filter((x) => !minimatch(x.fsPath, excludePattern));
    return includedFiles.map((x) => x.fsPath);
}

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

async function activate() {
    var diag = languages.createDiagnosticCollection('lit-events-and-attributes');
    try {
        var includedFilePaths = await getFilesFromWorkspace();
        var program = await createProgramFromWorkspace(includedFilePaths);

        languages.registerCompletionItemProvider('javascript', createCompletionProvider(program), '.');
        languages.registerDefinitionProvider('javascript', createDefinitionProvider(program));
        languages.registerTypeDefinitionProvider('javascript', createTypeDefinitionProvider(program));
        languages.registerHoverProvider('javascript', createHoverProvider(program));
        languages.registerImplementationProvider('javascript', createImplementationProvider(program));

        var checker = program.getTypeChecker();
        var componentTypes = analyzeComponents(includedFilePaths, program, checker);

        workspace.onDidChangeTextDocument((e) => {
            diag.set(e.document.uri, []);
            var htmlNodes = analyzeHTMLDocument(e.document);
            var scriptFile = program.getSourceFile(e.document.fileName);
            var tsNodes = getNodesRecurse(scriptFile);

            var attributeCollections = analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, checker, '.');

            for (var attributeCollection of attributeCollections) {
                for (var attribute of attributeCollection.attributes) {
                    validateAttribute(e.document, componentTypes, attributeCollection.parent, attribute, checker);
                }
            }

            diag.set(e.document.uri, flushErrors());
        });
        for (var file of includedFilePaths) {
            var vscDocument = await workspace.openTextDocument(file);
            var htmlNodes = analyzeHTMLDocument(vscDocument);
            var scriptFile = program.getSourceFile(vscDocument.fileName);
            var tsNodes = getNodesRecurse(scriptFile);
            var attributeCollections = analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, checker, '.');
            for (var attributeCollection of attributeCollections) {
                for (var attribute of attributeCollection.attributes) {
                    validateAttribute(vscDocument, componentTypes, attributeCollection.parent, attribute, checker);
                }
            }
            diag.set(vscDocument.uri, flushErrors());
        }
    } catch (e) {
        console.error(e);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
