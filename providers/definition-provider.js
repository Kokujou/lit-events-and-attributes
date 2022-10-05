const { getLanguageServiceHostFromProgram } = require('../custom-language-service-host.js');
const { createLanguageService } = require('typescript');
const { Uri, Range, Position } = require('vscode');
const { inferJsDocForEventAtOffset } = require('../parser.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('vscode').DefinitionProvider}
 */
function createDefinitionProvider(program) {
    return {
        provideDefinition: (document, position) => {
            try {
                var offset = document.offsetAt(position);
                var oldText = document.getText();
                var newText = inferJsDocForEventAtOffset(document, offset);
                if (!newText) return null;
                var textLengthAdded = newText.length - oldText.length;
                var languageService = createLanguageService(
                    getLanguageServiceHostFromProgram(program, Object.fromEntries([[document.fileName, newText]]))
                );

                return languageService.getDefinitionAtPosition(document.fileName, offset + textLengthAdded).map((x) => {
                    var source = program.getSourceFile(x.fileName);
                    var startPosition = source.getLineAndCharacterOfPosition(x.textSpan.start);
                    var endPosition = source.getLineAndCharacterOfPosition(x.textSpan.start + x.textSpan.length);
                    /** @type {import('vscode').Definition} */ var definition = {
                        uri: Uri.parse(x.fileName),
                        range: new Range(
                            new Position(startPosition.line, startPosition.character),
                            new Position(endPosition.line, endPosition.character)
                        ),
                    };
                    return definition;
                });
            } catch (err) {
                console.error(err);
            }
        },
    };
}

module.exports = { createDefinitionProvider };
