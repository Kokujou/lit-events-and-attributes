/**
 * @param {import('typescript').SourceFile} sourceFile
 */
function getNodesRecurse(sourceFile) {
    var recurseChildren = [...sourceFile.getChildren()];
    for (var child of recurseChildren) {
        recurseChildren.push(...child.getChildren(sourceFile));
    }
    return recurseChildren;
}

/**
 * @param {import('typescript').SourceFile} sourceFile
 * @param { (node: import('typescript').Node) => boolean } matches
 */
function findNodeRecurse(sourceFile, matches) {
    var recurseChildren = [...sourceFile.getChildren()];
    for (var child of recurseChildren) {
        if (matches(child)) return child;

        recurseChildren.push(...child.getChildren(sourceFile));
    }
}

module.exports = { getNodesRecurse, findNodeRecurse };
