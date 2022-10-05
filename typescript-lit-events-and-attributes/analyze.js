const { getLanguageService } = require('vscode-html-languageservice');

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
module.exports = { analyzeHTMLDocument };
