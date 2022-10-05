const { getLanguageServiceHostFromProgram } = require('../custom-language-service-host.js');
const { createLanguageService } = require('typescript');
const { Range, MarkdownString } = require('vscode');
const { inferJsDocForEventAtOffset } = require('../parser.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('vscode').HoverProvider}
 */
function createHoverProvider(program) {
    return {
        provideHover: (document, position) => {
            try {
                var offset = document.offsetAt(position);
                var oldText = document.getText();
                var newText = inferJsDocForEventAtOffset(document, offset);
                if (!newText) return null;
                var textLengthAdded = newText.length - oldText.length;
                var languageService = createLanguageService(
                    getLanguageServiceHostFromProgram(program, Object.fromEntries([[document.fileName, newText]]))
                );

                var quickInfo = languageService.getQuickInfoAtPosition(document.fileName, offset + textLengthAdded);
                if (!quickInfo) return null;
                var startPosition = document.positionAt(quickInfo.textSpan.start);
                var endPosition = document.positionAt(quickInfo.textSpan.start + quickInfo.textSpan.length);
                return {
                    range: new Range(startPosition, endPosition),
                    contents: [
                        new MarkdownString(
                            '```typescript\n' + quickInfo.displayParts.map((x) => x.text).join('') + '\n```\n'
                        ),
                        new MarkdownString(quickInfo.documentation + (quickInfo.tags ? '\n\n' + quickInfo.tags : '')),
                    ],
                };
            } catch (err) {
                console.error(err);
            }
        },
    };
}

module.exports = { createHoverProvider };
