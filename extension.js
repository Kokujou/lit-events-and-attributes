const { createCompletionProvider } = require('./providers/completion-provider.js');
const { analyzeComponents } = require('./analyze.js');
const minimatch = require('minimatch');
const { workspace, Uri, languages } = require('vscode');
const { flushErrors } = require('./errors.js');
const { readFileSync } = require('fs');
const { createProgram, createCompilerHost } = require('typescript');
const { createDefinitionProvider } = require('./providers/definition-provider.js');
const { createHoverProvider } = require('./providers/hover-provider.js');
const { createImplementationProvider } = require('./providers/implementation-provider.js');
const { createTypeDefinitionProvider } = require('./providers/type-definition-provider.js');
const { validateDocument } = require('./validate.js');
const { createHighlightProvider } = require('./providers/highlight-provider.js');

/**
 * @param {string[]} absoluteFilePaths
 * @returns
 */
async function createProgramFromWorkspace(absoluteFilePaths) {
    var host = createCompilerHost({ allowJs: true });
    host.readFile = (name) => readFileSync(name).toString();
    host.writeFile = () => {};
    return createProgram(absoluteFilePaths, { allowJs: true }, host);
}

async function getFilesFromWorkspace() {
    var rootFolder = workspace.workspaceFolders[0].uri.fsPath;
    var jsConfig = JSON.parse(readFileSync(rootFolder + '\\jsconfig.json', 'utf8'));
    /** @type {Uri[]} */ var includedFiles = [];
    for (var pattern of jsConfig.include) includedFiles = includedFiles.concat(await workspace.findFiles(pattern));
    for (var excludePattern of jsConfig.exclude)
        includedFiles = includedFiles.filter((x) => !minimatch(x.fsPath, excludePattern));
    return includedFiles.map((x) => x.fsPath);
}

async function activate() {
    var diag = languages.createDiagnosticCollection('lit-events-and-attributes');
    try {
        var includedFilePaths = await getFilesFromWorkspace();
        var program = await createProgramFromWorkspace(includedFilePaths);

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

        for (var file of includedFilePaths) {
            var vscDocument = await workspace.openTextDocument(file);
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
