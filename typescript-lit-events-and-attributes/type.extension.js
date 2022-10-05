const ts = require('typescript');
const TypeScriptExtensions = require('./typescript.extension.js');

function findNodeWithText(text, nodes, sourceFile) {
    var startIndex = text.indexOf('${');
    var searchString = text.slice(startIndex + '${'.length);
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

    return nodes.find((node) => node.getText(sourceFile) == searchString);
}

/**
 * @param {string} attributeValue
 * @param {ts.Node[]} nodes
 * @param {ts.SourceFile} sourceFile
 * @param {ts.TypeChecker} checker
 */
function getAttributeType(attributeValue, nodes, sourceFile, checker) {
    if (!attributeValue) throw Error();

    var associatedNode = findNodeWithText(attributeValue, nodes, sourceFile);
    return checker.getTypeAtLocation(associatedNode);
}

/**
 * @param {ts.Program} program
 * @param {ts.TypeChecker} checker
 * @param {ts.Node} node
 */
function getNodeType(program, checker, node) {
    var sourceFile = program.getSourceFile(node.getSourceFile().fileName);
    var recurseChildren = TypeScriptExtensions.getNodesRecurse(sourceFile);
    var typeNode = recurseChildren.find((x) => x.getText() == node.getText()).getLastToken(sourceFile);
    return checker.getTypeAtLocation(typeNode).symbol;
}

module.exports = { findNodeWithText, getAttributeType, getNodeType };
