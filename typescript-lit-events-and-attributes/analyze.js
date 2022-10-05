const ts = require('typescript');
const { getLanguageService } = require('vscode-html-languageservice');
const { analyzeText } = require('web-component-analyzer');
const { getAttributeType, getNodeType } = require('./type.extension.js');

/**
 * @param {string[]} paths
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @returns
 */
function analyzeComponents(paths, program, checker) {
    return Object.fromEntries(
        analyzeText(
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
 * @param {import('vscode-html-languageservice').TextDocument} document
 */
function analyzeHTMLDocument(document) {
    var languageService = getLanguageService();
    var htmlDocument = languageService.parseHTMLDocument(document);
    var nodes = [...htmlDocument.roots];
    for (var node of nodes) {
        if (!node.children) continue;
        nodes.push(...node.children);
    }
    return nodes.filter((x) => x.attributes && Object.values(x.attributes).length > 0);
}

/**
 *
 * @param {import('vscode-html-languageservice').Node[]} htmlNodes
 * @param {ts.Node[]} tsNodes
 * @param {ts.SourceFile} scriptFile
 * @param {ts.TypeChecker} typeChecker
 * @param { '.' | '@' } prefix
 */
function analyzeAttributeCollection(htmlNodes, tsNodes, scriptFile, typeChecker, prefix) {
    /** @type {{parent: string, attributes: [string, import('./attribute-value').AttributeValue][]}[]} */
    var attributeCollections = [];
    for (var node of htmlNodes) {
        var complexAttributes = Object.entries(node.attributes || {}).filter((x) => x[0]?.startsWith(prefix) && x[1]);
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

module.exports = { analyzeAttributeCollection, analyzeComponents, analyzeHTMLDocument };
