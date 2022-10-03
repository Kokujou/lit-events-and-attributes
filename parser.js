const { analyzeHTMLDocument } = require('./analyze.js');
const { nativeEventMap } = require('./native-events.js');
const { escapeRegExp } = require('./utils.js');

/**
 * @param {import('vscode').TextDocument} document
 * @param {number} offset
 */
function inferJsDocForEventAtOffset(document, offset) {
    var htmlNodes = analyzeHTMLDocument(document);
    var documentText = document.getText();
    var targetNode = htmlNodes.find((x) => x.start < offset && x.startTagEnd > offset);
    if (!targetNode) return null;
    var targetNodeString = documentText.slice(targetNode.start, targetNode.startTagEnd);

    var attributeRange = null;
    var foundAttribute = null;
    for (var attribute of Object.entries(targetNode.attributes)) {
        var match = targetNodeString.match(
            escapeRegExp(attribute[0] || '') + '[ ]*=[ ]*' + escapeRegExp(attribute[1] || '')
        );
        if ((match?.length || 0) <= 0) continue;

        var attributeStart = targetNode.start + match.index;
        var attributeEnd = targetNode.start + match.index + match[0].length;
        if (attributeStart < offset && offset < attributeEnd) {
            if (attribute[0][0] == '@') {
                foundAttribute = attribute;
                attributeRange = [attributeStart, attributeEnd];
            }
            break;
        }
    }

    if (!attributeRange) return documentText;
    if (!attribute[1].startsWith('"${')) return documentText;
    if (!attribute[1].includes('=>')) return documentText;

    var eventTypeName = nativeEventMap[foundAttribute[0].slice('@'.length)];
    if (!eventTypeName) {
        eventTypeName = 'CustomEvent<any>';
    }

    var jsDocComment = `/** @type {(e:${eventTypeName})=>void} */`;
    var newAttributeValue = '"${' + jsDocComment + attribute[1].slice('"${'.length);
    var newText = documentText.replace(
        new RegExp(escapeRegExp(attribute[0]) + '[ ]*=[ ]*' + escapeRegExp(attribute[1])),
        `${attribute[0]}=${newAttributeValue}`
    );
    return newText;
}

module.exports = { inferJsDocForEventAtOffset };
