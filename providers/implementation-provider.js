const { getLanguageServiceHostFromProgram } = require('../custom-language-service-host.js');
const { createLanguageService } = require('typescript');
const { CompletionItemKind, CompletionItem } = require('vscode');
const { convertKind } = require('../convert-kind.js');
const { inferJsDocForEventAtOffset } = require('../parser.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('vscode').ImplementationProvider}
 */
function createImplementationProvider(program) {
    return {
        provideImplementation: (document, position) => {
            try {
                var offset = document.offsetAt(position);
                var oldText = document.getText();
                var newText = inferJsDocForEventAtOffset(document, offset);
                if (!newText) return [];
                var textLengthAdded = newText.length - oldText.length;
                var languageService = createLanguageService(
                    getLanguageServiceHostFromProgram(program, Object.fromEntries([[document.fileName, newText]]))
                );

                return languageService
                    .getImplementationAtPosition(document.fileName, offset + textLengthAdded)
                    .map((x) => {
                        return {
                            range: x.textSpan,
                            targetRange: x.contextSpan,
                            targetUri: x.fileName,
                            uri: x.originalFileName,
                            targetSelectionRange: x.originalContextSpan,
                            originSelectionRange: x.originalTextSpan,
                        };
                    });
            } catch (err) {
                console.error(err);
            }
        },
    };
}

module.exports = { createImplementationProvider };
