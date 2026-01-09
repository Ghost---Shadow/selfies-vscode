'use strict';

import * as vscode from 'vscode';
import { loadWithImports, resolve, decode, getMolecularWeight, getFormula } from 'selfies-js';
import * as path from 'path';
import * as fs from 'fs';

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
                // Check if document changed before updating
                const documentChanged = this._currentDocument !== editor.document;
                if (documentChanged) {
                    this._parseResult = null;
                    this._currentDocument = editor.document;
                }
                // Always update on editor change, even if line number is the same
                const position = editor.selections[0].active;
                this._currentLine = position.line;
                this._updateLineInfo();
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

        if (this._currentLine !== lineNumber) {
            this._currentLine = lineNumber;
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
                this._parseResult = loadWithImports(text, this._currentDocument.uri.fsPath);
            }

            const lineText = this._currentDocument.lineAt(this._currentLine).text.trim();

            // Skip empty lines and comments
            if (!lineText || lineText.startsWith('#')) {
                this._onDidChangeCurrentLine.fire(null);
                return;
            }

            // Find the definition on this line
            // Note: VS Code uses 0-based line numbers, parser uses 1-based
            const definitions = this._parseResult.definitions || new Map();
            const definitionsArray = Array.from(definitions.values());
            const definition = definitionsArray.find(def => def.line === this._currentLine + 1);

            if (!definition) {
                this._onDidChangeCurrentLine.fire(null);
                return;
            }

            // Resolve the definition to get the full SELFIES string
            let selfies = null;
            let smiles = null;
            let error = null;

            try {
                selfies = resolve(this._parseResult, definition.name, { validateValence: false });
            } catch (err) {
                error = err.message;
            }

            if (!selfies) {
                this._onDidChangeCurrentLine.fire({
                    line: this._currentLine,
                    name: definition.name,
                    expression: definition.tokens ? definition.tokens.join('') : '',
                    error: error || 'Could not resolve definition'
                });
                return;
            }

            // Decode to SMILES
            try {
                smiles = decode(selfies);
            } catch (err) {
                error = err.message;
            }

            // Get molecular properties
            let molecularWeight = null;
            let formula = null;

            if (selfies && !error) {
                try {
                    molecularWeight = getMolecularWeight(selfies);
                    formula = getFormula(selfies);
                } catch (err) {
                    // Properties might not be available
                }
            }

            const lineInfo = {
                line: this._currentLine,
                name: definition.name,
                expression: definition.tokens ? definition.tokens.join('') : '',
                selfies: selfies,
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

export { LineTracker };
