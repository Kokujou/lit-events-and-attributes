const { getLanguageServiceHostFromProgram } = require('../custom-language-service-host.js');
const { createLanguageService } = require('typescript');
const { Range, DocumentHighlight, DocumentHighlightKind } = require('vscode');
const { inferJsDocForEventAtOffset } = require('../parser.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('vscode').DocumentHighlightProvider}
 */
function createHighlightProvider(program) {
    return {
        provideDocumentHighlights: (document, position) => {
            try {
                var offset = document.offsetAt(position);
                var oldText = document.getText();
                var newText = inferJsDocForEventAtOffset(document, offset);
                var textLengthAdded = newText.length - oldText.length;
                var languageService = createLanguageService(
                    getLanguageServiceHostFromProgram(program, Object.fromEntries([[document.fileName, newText]]))
                );

                var fileHighlights = languageService
                    .getDocumentHighlights(document.fileName, offset + textLengthAdded, [])
                    .filter((x) => x.fileName == document.fileName)
                    .flatMap((x) => x.highlightSpans)
                    .filter((x) => x.fileName == document.fileName);

                return fileHighlights.map((x) => {
                    return new DocumentHighlight(
                        new Range(
                            document.positionAt(x.textSpan.start),
                            document.positionAt(x.textSpan.start + x.textSpan.length)
                        ),
                        DocumentHighlightKind.Text
                    );
                });
            } catch (err) {
                console.error(err);
            }
        },
    };
}

module.exports = { createHighlightProvider };
