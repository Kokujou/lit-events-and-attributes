const { info } = require('console');
const { readFileSync } = require('fs');
const { createLanguageService } = require('typescript');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { analyzeHTMLDocument } = require('./analyze.js');
const { getLanguageServiceHostFromProgram } = require('./custom-language-service-host.js');
const { nativeEventMap } = require('./native-events.js');
const { inferJsDocForEventAtOffset } = require('./parser.js');
const { escapeRegExp } = require('./utils.js');

/**
 * @param {[string,string]} attribute
 */
function isEventAttribute(attribute) {
    return attribute[0].startsWith('@') && attribute[1].startsWith('"${') && attribute[1].includes('=>');
}

/**
 * @param {string} fileName
 * @returns
 */
function readTransformedFile(fileName) {
    var oldText = readFileSync(fileName, 'utf8');
    return readTransformedText(oldText);
}

/**
 * @param {string} oldText
 */
function readTransformedText(oldText) {
    if (!oldText.includes('html`')) return oldText;
    var document = TextDocument.create('test.js', 'javascript', 1, oldText);
    var htmlNodes = analyzeHTMLDocument(document);
    if (!htmlNodes) return oldText;

    var newText = '';
    var lastIndex = 0;
    var sortedNodes = htmlNodes.sort((a, b) => (a.parent.start < b.parent.start ? 1 : -1));
    for (var node of sortedNodes) {
        var relevantAttributes = Object.entries(node.attributes).filter((x) => isEventAttribute(x));
        if (!relevantAttributes || relevantAttributes.length <= 0) continue;
        newText += oldText.slice(0, node.start);
        var nodeText = oldText.slice(node.start, node.startTagEnd);
        for (var attribute of relevantAttributes) {
            var eventTypeName = nativeEventMap[attribute[0].slice('@'.length)];
            if (!eventTypeName) {
                eventTypeName = 'CustomEvent<any>';
            }
            var jsDocComment = `/** @type {(e:${eventTypeName})=>void} */`;

            var newAttributeValue = '"${' + jsDocComment + attribute[1].slice('"${'.length);
            nodeText = nodeText.replace(
                new RegExp(escapeRegExp(attribute[0]) + '[ ]*=[ ]*' + escapeRegExp(attribute[1])),
                `${attribute[0]}=${newAttributeValue}`
            );
        }

        newText += nodeText;
        lastIndex = node.startTagEnd;
    }

    return newText;
}

function getLanguageServiceTransformedAt(fileName, position, program) {
    var oldText = readFileSync(fileName).toString();
    var document = TextDocument.create('test.js', 'javascript', 1, oldText);
    var newText = inferJsDocForEventAtOffset(document, position);
    if (!newText) throw Error('no changes');

    var textLengthAdded = newText.length - oldText.length;
    return {
        service: createLanguageService(
            getLanguageServiceHostFromProgram(program, Object.fromEntries([[fileName, newText]]))
        ),
        newOffset: position + textLengthAdded,
    };
}

function getTransformedLanguageService(fileName, program) {
    var newText = readTransformedFile(fileName);
    if (!newText) throw Error('no changes');

    return createLanguageService(getLanguageServiceHostFromProgram(program, Object.fromEntries([[fileName, newText]])));
}

/**
 * @param { { typescript: typeof import('typescript/lib/tsserverlibrary') }} modules
 * @returns
 */
function init(modules) {
    const ts = modules.typescript;

    /**
     * @param {ts.server.PluginCreateInfo} info
     */
    function create(info) {
        info.project.projectService.logger.info("I'm getting set up now! Check the log for this message.");
        /** @type {ts.LanguageService} */ const proxy = Object.create(null);
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            proxy[k] = (...args) => x.apply(info.languageService, args);
        }
        info.project.projectService.logger.info('fluffy entering quick info');
        proxy.getQuickInfoAtPosition = (fileName, position) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getQuickInfoAtPosition(fileName, result.newOffset);
            } catch (err) {
                return info.languageService.getQuickInfoAtPosition(fileName, position);
            }
        };
        proxy.getReferencesAtPosition = (fileName, position) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getReferencesAtPosition(fileName, result.newOffset);
            } catch (err) {
                return info.languageService.getReferencesAtPosition(fileName, position);
            }
        };
        proxy.getDefinitionAtPosition = (fileName, position) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getDefinitionAtPosition(fileName, result.newOffset);
            } catch (err) {
                return info.languageService.getDefinitionAtPosition(fileName, position);
            }
        };
        proxy.getTypeDefinitionAtPosition = (fileName, position) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getTypeDefinitionAtPosition(fileName, result.newOffset);
            } catch (err) {
                return info.languageService.getTypeDefinitionAtPosition(fileName, position);
            }
        };
        proxy.getCompletionsAtPosition = (fileName, position, options) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getCompletionsAtPosition(fileName, result.newOffset, options);
            } catch (err) {
                return info.languageService.getCompletionsAtPosition(fileName, position, options);
            }
        };
        proxy.getImplementationAtPosition = (fileName, position) => {
            try {
                var result = getLanguageServiceTransformedAt(fileName, position, proxy.getProgram());
                return result.service.getImplementationAtPosition(fileName, result.newOffset);
            } catch (err) {
                return info.languageService.getImplementationAtPosition(fileName, position);
            }
        };

        /**
         * next approach: get all diagnostics, check the offset they're started,
         * check if a replacement can be done and ignore it if yes.
         */

        return proxy;
    }

    return { create };
}

module.exports = init;
