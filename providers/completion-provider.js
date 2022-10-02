const { getLanguageServiceHostFromProgram } = require('../custom-language-service-host.js');
const { createLanguageService } = require('typescript');
const { CompletionItemKind, CompletionItem } = require('vscode');
const { convertKind } = require('../convert-kind.js');
const { inferJsDocForEventAtOffset } = require('../parser.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('vscode').CompletionItemProvider<import('vscode').CompletionItem>}
 */
function createCompletionProvider(program) {
    return {
        provideCompletionItems: (document, position) => {
            try {
                var offset = document.offsetAt(position);
                var oldText = document.getText();
                var newText = inferJsDocForEventAtOffset(document, offset);
                var textLengthAdded = newText.length - oldText.length;
                var languageService = createLanguageService(
                    getLanguageServiceHostFromProgram(program, Object.fromEntries([[document.fileName, newText]]))
                );

                return languageService
                    .getCompletionsAtPosition(document.fileName, offset + textLengthAdded, {})
                    .entries.map((x) => new CompletionItem(x.name, convertKind(x.kind)))
                    .filter((x) => x.kind == CompletionItemKind.Method || x.kind == CompletionItemKind.Field);
            } catch (err) {
                console.error(err);
            }
        },

        resolveCompletionItem: (item, token) => {
            console.log(item);
            return item;
        },
    };
}

module.exports = { createCompletionProvider };
