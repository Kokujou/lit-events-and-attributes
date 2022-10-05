const ts = require('typescript');
const htmlService = require('vscode-html-languageservice');

class AttributeValue {
    /** @type {ts.Type} */ type;
    /** @type {string} */ valueText;
    /** @type {htmlService.Node} */ parentNode;

    /**
     * @param {AttributeValue} attributeValue
     */
    constructor(attributeValue) {
        this.type = attributeValue.type;
        this.valueText = attributeValue.valueText;
        this.parentNode = attributeValue.parentNode;
    }
}

module.exports = { AttributeValue };
