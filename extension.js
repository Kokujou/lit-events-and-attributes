const { createCompletionProvider } = require('./providers/completion-provider.js');
const { analyzeComponents } = require('./analyze.js');
const minimatch = require('minimatch');
const { workspace, Uri, languages } = require('vscode');
const { flushErrors, writeTypescriptDiagnostics } = require('./errors.js');
const { readFileSync } = require('fs');
const { createProgram, createCompilerHost, convertCompilerOptionsFromJson } = require('typescript');
const { createDefinitionProvider } = require('./providers/definition-provider.js');
const { createHoverProvider } = require('./providers/hover-provider.js');
const { createImplementationProvider } = require('./providers/implementation-provider.js');
const { createTypeDefinitionProvider } = require('./providers/type-definition-provider.js');
const { validateDocument } = require('./validate.js');
const { createHighlightProvider } = require('./providers/highlight-provider.js');
const ts = require('typescript');

/**
 * @param {string[]} absoluteFilePaths
 * @param {import('typescript').CompilerOptions} compilerOptions
 * @returns
 */
async function createProgramFromWorkspace(absoluteFilePaths, compilerOptions) {
    var host = createCompilerHost(compilerOptions);
    host.readFile = (name) => readFileSync(name).toString();
    host.writeFile = () => {};
    return createProgram(absoluteFilePaths, compilerOptions, host);
}

async function activate() {
    var diag = languages.createDiagnosticCollection('lit-events-and-attributes');
    try {
        var rootFolder = workspace.workspaceFolders[0].uri.fsPath;
        var jsConfig = JSON.parse(readFileSync(rootFolder + '\\jsconfig.json', 'utf8'));
        /** @type {Uri[]} */ var includedFiles = [];
        for (var pattern of jsConfig.include) includedFiles = includedFiles.concat(await workspace.findFiles(pattern));
        for (var excludePattern of jsConfig.exclude)
            includedFiles = includedFiles.filter((x) => !minimatch(x.fsPath, excludePattern));
        var includedFilePaths = includedFiles.map((x) => x.fsPath);
        var program = await createProgramFromWorkspace(
            includedFilePaths,
            convertCompilerOptionsFromJson(jsConfig, rootFolder, 'jsconfig.json').options
        );

        languages.registerCompletionItemProvider('javascript', createCompletionProvider(program), '.');
        languages.registerDefinitionProvider('javascript', createDefinitionProvider(program));
        languages.registerTypeDefinitionProvider('javascript', createTypeDefinitionProvider(program));
        languages.registerHoverProvider('javascript', createHoverProvider(program));
        languages.registerImplementationProvider('javascript', createImplementationProvider(program));
        languages.registerDocumentHighlightProvider('javascript', createHighlightProvider(program));

        var checker = program.getTypeChecker();
        var componentTypes = analyzeComponents(includedFilePaths, program, checker);

        workspace.onDidChangeTextDocument((e) => {
            diag.set(e.document.uri, []);
            validateDocument(e.document, program, componentTypes);
            diag.set(e.document.uri, flushErrors());
        });

        for (var filePath of includedFilePaths) {
            var vscDocument = await workspace.openTextDocument(filePath);
            diag.set(vscDocument.uri, []);
            validateDocument(vscDocument, program, componentTypes);
            diag.set(vscDocument.uri, flushErrors());
        }
    } catch (e) {
        console.error(e);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
