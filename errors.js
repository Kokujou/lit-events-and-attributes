const vscode = require('vscode');
const AttributeValue = require('./attribute-value').AttributeValue;
const Utils = require('./utils');

/**
 * @typedef {Object} CreateDiagnosticOptions
 * @property {vscode.TextDocument} document
 * @property {string} message
 * @property {vscode.DiagnosticSeverity} severity
 * @property {number} start
 * @property {number} end
 * @property {RegExp} [search]
 * @property {number} [code]
 */

/** @type {vscode.Diagnostic[]} */ var errors = [];

/**
 * @param {CreateDiagnosticOptions} options
 */
function writeError(options) {
    try {
        var start = options.start;
        var end = options.end;
        if (options.search) {
            var match = options.document.getText().slice(options.start, options.end).match(options.search);
            start = match.index + options.start;
            end = start + match[0].length;
        }
        var range = new vscode.Range(options.document.positionAt(start), options.document.positionAt(end));
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
 *
 * @param {import('vscode').TextDocument} document
 * @param {import('typescript').Diagnostic[]} diags
 */
function writeTypescriptDiagnostics(document, diags) {
    for (var diag of diags)
        writeError({
            document: document,
            message: diag.messageText.toString(),
            start: diag.start,
            end: diag.start + diag.length,
            severity: vscode.DiagnosticSeverity.Error,
            code: diag.code,
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
    writeTypescriptDiagnostics,
};
