const vscode = require('vscode');
const { parse, resolve, decode, getMolecularWeight, getFormula } = require('selfies-js');
const path = require('path');
const fs = require('fs');

/**
 * Tracks the current cursor position and provides information about the current line
 */
class LineTracker {
    constructor() {
        this._onDidChangeCurrentLine = new vscode.EventEmitter();
        this.onDidChangeCurrentLine = this._onDidChangeCurrentLine.event;

        this._currentLine = null;
        this._currentDocument = null;
        this._parseResult = null;

        // Listen for cursor position changes
        this._selectionChangeListener = vscode.window.onDidChangeTextEditorSelection((event) => {
            this._handleSelectionChange(event);
        });

        // Listen for document changes
        this._documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this._currentDocument && event.document.uri.toString() === this._currentDocument.uri.toString()) {
                this._handleDocumentChange(event.document);
            }
        });

        // Listen for active editor changes
        this._editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.languageId === 'selfies') {
                this._currentDocument = editor.document;
                this._handleSelectionChange({ textEditor: editor, selections: editor.selections });
            }
        });

        // Initialize with current editor
        if (vscode.window.activeTextEditor?.document.languageId === 'selfies') {
            this._currentDocument = vscode.window.activeTextEditor.document;
            this._handleSelectionChange({
                textEditor: vscode.window.activeTextEditor,
                selections: vscode.window.activeTextEditor.selections
            });
        }
    }

    /**
     * Handle cursor position changes
     */
    _handleSelectionChange(event) {
        const editor = event.textEditor;
        if (!editor || editor.document.languageId !== 'selfies') {
            return;
        }

        const position = event.selections[0].active;
        const lineNumber = position.line;

        if (this._currentLine !== lineNumber || this._currentDocument !== editor.document) {
            this._currentLine = lineNumber;
            this._currentDocument = editor.document;
            this._updateLineInfo();
        }
    }

    /**
     * Handle document changes
     */
    _handleDocumentChange(document) {
        if (document.languageId !== 'selfies') {
            return;
        }

        // Reparse the document
        this._parseResult = null;
        this._updateLineInfo();
    }

    /**
     * Update information about the current line
     */
    _updateLineInfo() {
        if (!this._currentDocument || this._currentLine === null) {
            return;
        }

        try {
            // Parse the document if not already parsed
            if (!this._parseResult) {
                const text = this._currentDocument.getText();
                this._parseResult = parse(text, {
                    filePath: this._currentDocument.uri.fsPath,
                    resolveImports: true,
                    importResolver: (importPath, currentFile) => {
                        try {
                            const basePath = path.dirname(currentFile);
                            const fullPath = path.resolve(basePath, importPath);
                            if (fs.existsSync(fullPath)) {
                                return fs.readFileSync(fullPath, 'utf-8');
                            }
                            return null;
                        } catch (err) {
                            return null;
                        }
                    }
                });
            }

            const lineText = this._currentDocument.lineAt(this._currentLine).text.trim();

            // Skip empty lines and comments
            if (!lineText || lineText.startsWith('#')) {
                this._onDidChangeCurrentLine.fire(null);
                return;
            }

            // Find the definition on this line
            const definitions = this._parseResult.definitions || [];
            const definition = definitions.find(def => def.line === this._currentLine);

            if (!definition) {
                this._onDidChangeCurrentLine.fire(null);
                return;
            }

            // Resolve the definition to get the full SELFIES string
            const resolved = resolve(definition.name, this._parseResult.symbolTable);

            if (!resolved || !resolved.selfies) {
                this._onDidChangeCurrentLine.fire({
                    line: this._currentLine,
                    name: definition.name,
                    expression: definition.expression,
                    error: 'Could not resolve definition'
                });
                return;
            }

            // Decode to SMILES
            let smiles = null;
            let error = null;
            try {
                smiles = decode(resolved.selfies);
            } catch (err) {
                error = err.message;
            }

            // Get molecular properties
            let molecularWeight = null;
            let formula = null;

            if (smiles) {
                try {
                    molecularWeight = getMolecularWeight(resolved.selfies);
                    formula = getFormula(resolved.selfies);
                } catch (err) {
                    // Properties might not be available
                }
            }

            const lineInfo = {
                line: this._currentLine,
                name: definition.name,
                expression: definition.expression,
                selfies: resolved.selfies,
                smiles: smiles,
                molecularWeight: molecularWeight,
                formula: formula,
                error: error
            };

            this._onDidChangeCurrentLine.fire(lineInfo);

        } catch (err) {
            // Error handling
            this._onDidChangeCurrentLine.fire({
                line: this._currentLine,
                error: err.message
            });
        }
    }

    /**
     * Get information about the current line
     */
    getCurrentLineInfo() {
        // Trigger update and return cached result
        this._updateLineInfo();
        return null; // The event will fire with the actual data
    }

    dispose() {
        this._selectionChangeListener.dispose();
        this._documentChangeListener.dispose();
        this._editorChangeListener.dispose();
        this._onDidChangeCurrentLine.dispose();
    }
}

module.exports = {
    LineTracker
};
