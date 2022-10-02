const { ScriptElementKind } = require('typescript');
const { CompletionItemKind } = require('vscode');

/**
 * @param {ScriptElementKind} kind
 */
function convertKind(kind) {
    switch (kind) {
        case ScriptElementKind.primitiveType:
        case ScriptElementKind.keyword:
            return CompletionItemKind.Keyword;

        case ScriptElementKind.constElement:
        case ScriptElementKind.letElement:
        case ScriptElementKind.variableElement:
        case ScriptElementKind.localVariableElement:
        case ScriptElementKind.alias:
        case ScriptElementKind.parameterElement:
            return CompletionItemKind.Variable;

        case ScriptElementKind.memberVariableElement:
        case ScriptElementKind.memberGetAccessorElement:
        case ScriptElementKind.memberSetAccessorElement:
            return CompletionItemKind.Field;

        case ScriptElementKind.functionElement:
        case ScriptElementKind.localFunctionElement:
            return CompletionItemKind.Function;

        case ScriptElementKind.memberFunctionElement:
        case ScriptElementKind.constructSignatureElement:
        case ScriptElementKind.callSignatureElement:
        case ScriptElementKind.indexSignatureElement:
            return CompletionItemKind.Method;

        case ScriptElementKind.enumElement:
            return CompletionItemKind.Enum;

        case ScriptElementKind.enumMemberElement:
            return CompletionItemKind.EnumMember;

        case ScriptElementKind.moduleElement:
        case ScriptElementKind.externalModuleName:
            return CompletionItemKind.Module;

        case ScriptElementKind.classElement:
        case ScriptElementKind.typeElement:
            return CompletionItemKind.Class;

        case ScriptElementKind.interfaceElement:
            return CompletionItemKind.Interface;

        case ScriptElementKind.warning:
            return CompletionItemKind.Text;

        case ScriptElementKind.scriptElement:
            return CompletionItemKind.File;

        case ScriptElementKind.directory:
            return CompletionItemKind.Folder;

        case ScriptElementKind.string:
            return CompletionItemKind.Constant;

        default:
            return CompletionItemKind.Property;
    }
}

module.exports = { convertKind };
