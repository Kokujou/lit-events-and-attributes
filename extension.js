// The module 'vscode' contains the VS Code extensibility API

const ts = require('typescript');
const vscode = require('vscode');
const fs = require('fs');
const componentAnalyzer = require('web-component-analyzer');
const htmlService = require('vscode-html-languageservice');
const errors = require('./errors');
const AttributeValue = require('./attribute-value').AttributeValue;

/**
 * @param {string[]} absoluteFilePaths
 * @returns
 */
async function createProgramFromWorkspace(absoluteFilePaths) {
    var host = ts.createCompilerHost({ allowJs: true });
    host.readFile = (name) => fs.readFileSync(name).toString();
    host.writeFile = () => {};
    return ts.createProgram(absoluteFilePaths, { allowJs: true }, host);
}

async function getFilesFromWorkspace() {
    var rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    var jsconfig = JSON.parse(fs.readFileSync(rootFolder + '\\jsconfig.json', 'utf8'));
    var includedFiles = await vscode.workspace.findFiles(jsconfig.include, jsconfig.exclude);
    return includedFiles.map((x) => x.fsPath);
}

/**
 * @param {string[]} paths
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns
 */
function analyzeComponents(paths, program, checker) {
    return Object.fromEntries(
        componentAnalyzer
            .analyzeText(
                paths.map((x) => ({
                    fileName: x,
                }))
            )
            .results.filter((x) => x.componentDefinitions?.length > 0)
            .flatMap((x) => x.componentDefinitions)
            .map((x) => [x.tagName, getNodeType(program, checker, Array.from(x.identifierNodes)[0])])
    );
}

/**
 * @param {vscode.TextDocument} document
 */
function analyzeHTMLDocument(document) {
    var languageService = htmlService.getLanguageService();
    var htmlDocument = languageService.parseHTMLDocument(
        Object.assign(Object.assign({}, document), { uri: document.uri.toString() })
    );
    var nodes = [...htmlDocument.roots];
    for (var node of nodes) {
        if (!node.children) continue;
        nodes.push(...node.children);
    }
    return nodes;
}

/**
 *
 * @param {htmlService.Node[]} htmlNodes
 * @param {ts.Node[]} tsNodes
 * @param {ts.SourceFile} scriptFile
 * @param {ts.TypeChecker} typeChecker
 * @param { '.' | '@' } prefix
 */
function analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, typeChecker, prefix) {
    /** @type {{parent: string, attributes: [string, AttributeValue][]}[]} */ var attributeCollections = [];
    for (var node of htmlNodes) {
        var complexAttributes = Object.entries(node.attributes || {}).filter((x) => x[0]?.startsWith(prefix));
        if (complexAttributes.length > 0)
            attributeCollections.push({
                parent: node.tag,
                attributes: complexAttributes.map((x) => [
                    x[0],
                    {
                        type: getAttributeType(x[1], tsNodes, scriptFile, typeChecker),
                        valueText: x[1],
                        parentNode: node,
                    },
                ]),
            });
    }
    return attributeCollections;
}

/**
 * @param {vscode.TextDocument} document
 * @param {Object.<string, ts.Symbol>} componentTypeDict
 * @param {string} componentName
 * @param {[string, AttributeValue]} attribute
 * @param {ts.TypeChecker} checker
 */
function validateAttribute(document, componentTypeDict, componentName, attribute, checker) {
    var componentProperty = componentTypeDict[componentName].members.get(attribute[0].slice('.'.length));

    if (!componentProperty?.parent) {
        errors.undefinedAttributeError(document, attribute);
        return;
    }

    /** @type {ts.Type} */ var propertyType = checker.getTypeOfSymbol(componentProperty);
    var propertyTypeName = checker.typeToString(propertyType);
    var attributeTypeName = checker.typeToString(attribute[1].type);
    if (attributeTypeName != propertyTypeName) {
        errors.attributeTypeMismatch(document, attribute, propertyTypeName, attributeTypeName);
        return;
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    var diag = vscode.languages.createDiagnosticCollection('lit-events-and-attributes');
    try {
        console.log('registering change event');

        vscode.workspace.onDidChangeTextDocument(async (e) => {
            diag.clear();
            var includedFilePaths = await getFilesFromWorkspace();
            var program = await createProgramFromWorkspace(includedFilePaths);
            var checker = program.getTypeChecker();
            var componentTypes = analyzeComponents(includedFilePaths, program, checker);

            var htmlNodes = analyzeHTMLDocument(e.document);
            var scriptFile = program.getSourceFile(e.document.fileName);
            var tsNodes = getNodesRecurse(scriptFile);

            var attributeCollections = analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, checker, '.');
            var eventCollections = analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, checker, '@');

            for (var attributeCollection of attributeCollections) {
                for (var attribute of attributeCollection.attributes) {
                    validateAttribute(e.document, componentTypes, attributeCollection.parent, attribute, checker);
                }
            }

            diag.set(e.document.uri, errors.flush());
        });
    } catch (e) {
        console.error(e);
    }
}

/** @param {ts.SourceFile} sourceFile  */
function getNodesRecurse(sourceFile) {
    var recurseChildren = [...sourceFile.getChildren()];
    for (var child of recurseChildren) {
        recurseChildren.push(...child.getChildren(sourceFile));
    }
    return recurseChildren;
}

/**
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @param {ts.Node} node
 */
function getNodeType(program, checker, node) {
    var sourceFile = program.getSourceFile(node.getSourceFile().fileName);
    var recurseChildren = getNodesRecurse(sourceFile);
    var typeNode = recurseChildren.find((x) => x.getText() == node.getText()).getLastToken(sourceFile);
    return checker.getTypeAtLocation(typeNode).symbol;
}

/**
 *
 * @param {string} value
 * @param {ts.Node[]} nodes
 * @param {ts.SourceFile} sourceFile
 * @param {ts.TypeChecker} checker
 */
function getAttributeType(value, nodes, sourceFile, checker) {
    var startIndex = value.indexOf('${');
    var searchString = value.slice(startIndex + '${'.length);
    var openings = 1;
    var endIndex = 0;
    for (var i = 0; i < searchString.length; i++) {
        var char = searchString[i];
        if (char == '{') openings++;
        else if (char == '}') openings--;
        if (openings == 0) {
            endIndex = i;
            break;
        }
    }
    searchString = searchString.slice(0, endIndex);

    var associatedNode = nodes.find((node) => node.getText(sourceFile) == searchString);

    return checker.getTypeAtLocation(associatedNode);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
