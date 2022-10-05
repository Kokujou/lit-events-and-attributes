const { existsSync, readFileSync, exists } = require('fs');
const { ScriptSnapshot, sys, getDefaultLibFileName } = require('typescript');
const { TextDocument } = require('vscode-languageserver-textdocument');
const { analyzeHTMLDocument } = require('./analyze.js');
const { nativeEventMap } = require('./native-events.js');
const { escapeRegExp } = require('./utils.js');

/**
 * @param {import('typescript').Program} program
 * @returns {import('typescript').LanguageServiceHost}
 */
function getLanguageServiceHostFromProgram(program, scriptFileMap) {
    return {
        getCompilationSettings: () => program.getCompilerOptions(),
        getScriptFileNames: () => program.getSourceFiles().map((x) => x.fileName),
        getScriptVersion: (fileName) => '1',
        getScriptSnapshot: (fileName) => {
            var overriddenFile = scriptFileMap[fileName] || scriptFileMap[fileName.replaceAll('/', '\\')];
            if (overriddenFile) {
                return ScriptSnapshot.fromString(overriddenFile);
            }

            if (!existsSync(fileName)) {
                var sourceFile = program.getSourceFiles().find((x) => x.fileName.endsWith(fileName));
                return ScriptSnapshot.fromString(sourceFile.text);
            }

            return ScriptSnapshot.fromString(readFileSync(fileName).toString());
        },
        getCurrentDirectory: sys.getCurrentDirectory,
        getDefaultLibFileName: getDefaultLibFileName,
        readFile: (fileName) => {
            var overriddenFile = scriptFileMap[fileName];
            if (overriddenFile) return overriddenFile;
            else return readFileSync(fileName).toString();
        },
        fileExists: (fileName) => {
            return existsSync(fileName);
        },
    };
}

module.exports = { getLanguageServiceHostFromProgram };
