const vscode = require('vscode');
const AttributeValue = require('./attribute-value').AttributeValue;
const Utils = require('./utils');

/**
 * @typedef {Object} CreateDiagnosticOptions
 * @property {vscode.TextDocument} document
 * @property {string} message
 * @property {vscode.DiagnosticSeverity} severity
 * @property {RegExp} search
 * @property {number} start
 * @property {number} end
 * @property {string} [code]
 */

/** @type {vscode.Diagnostic[]} */ var errors = [];

/**
 * @param {CreateDiagnosticOptions} options
 */
function writeError(options) {
    try {
        var match = options.document.getText().slice(options.start, options.end).match(options.search);
        var start = match.index + options.start;

        var range = new vscode.Range(
            options.document.positionAt(start),
            options.document.positionAt(start + match[0].length)
        );
        errors.push({
            message: options.message,
            range: range,
            severity: vscode.DiagnosticSeverity.Error,
            code: options.code,
        });
    } catch {
        throw new Error('search text not found');
    }
}
/**
 *
 * @param {vscode.TextDocument} document
 * @param {[string, any]} attribute
 */
function undefinedAttributeError(document, attribute) {
    writeError({
        message: `the attribute '${attribute[0]}' is not defined, using '.attribute' data binding will be ignored`,
        search: new RegExp(Utils.escapeRegExp(attribute[0])),
        start: attribute[1].parentNode.start,
        end: attribute[1].parentNode.startTagEnd,
        severity: vscode.DiagnosticSeverity.Warning,
        document: document,
    });
}

/**
 * @param {vscode.TextDocument} document
 * @param {[string, AttributeValue]} attribute
 * @param {string} requestedType
 * @param {string} providedType
 */
function attributeTypeMismatch(document, attribute, requestedType, providedType) {
    writeError({
        message: `the attribute ${attribute[0]} expects a value of type ${requestedType} but was provided with type ${providedType}.`,
        search: new RegExp(Utils.escapeRegExp(attribute[0]) + '[ ]*=[ ]*' + Utils.escapeRegExp(attribute[1].valueText)),
        start: attribute[1].parentNode.start,
        end: attribute[1].parentNode.startTagEnd,
        document: document,
        severity: vscode.DiagnosticSeverity.Error,
    });
}

function flushErrors() {
    if (errors.length == 0) return;
    var result = [...errors];
    errors = [];
    return result;
}

module.exports = {
    undefinedAttributeError,
    attributeTypeMismatch,
    flushErrors,
};
