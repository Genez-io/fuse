import ts from "typescript";
import * as fs from "fs";

function extractImports(sourceFile: ts.SourceFile): string[] {
    const imports: string[] = [];

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                imports.push(node.moduleSpecifier.text);
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
}

export function getUsedNodeModules(tsFilePath: string): string[] {
  console.log('tsFilePath', tsFilePath);
    const content = fs.readFileSync(tsFilePath, "utf-8");
    const sourceFile = ts.createSourceFile(
        tsFilePath,
        content,
        ts.ScriptTarget.ES2015,
        true
    );

    const imports = extractImports(sourceFile);
    console.log('imports', imports);

    // get unique imports
    const uniqueImports = [...new Set(imports)];

    return uniqueImports;
}
