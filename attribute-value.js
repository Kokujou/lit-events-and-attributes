const ts = require('typescript');
const htmlService = require('vscode-html-languageservice');

class AttributeValue {
    /** @type {ts.Type} */ type;
    /** @type {string} */ valueText;
    /** @type {htmlService.Node} */ parentNode;
}

module.exports = { AttributeValue };
