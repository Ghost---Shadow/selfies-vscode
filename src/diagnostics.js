'use strict';

import * as vscode from 'vscode';
import { parse, loadWithImports } from 'selfies-js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Create a diagnostics provider for SELFIES files
 * @returns {vscode.Disposable}
 */
function createDiagnosticsProvider() {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('selfies');

    // Update diagnostics when document changes
    const updateDiagnostics = (document) => {
        if (document.languageId !== 'selfies') {
            return;
        }

        const text = document.getText();
        const uri = document.uri;
        const diagnostics = [];

        try {
            // Parse the document with imports support
            const result = loadWithImports(text, uri.fsPath);

            // Convert selfies-js errors to VS Code diagnostics
            if (result.errors && result.errors.length > 0) {
                for (const error of result.errors) {
                    // Parser uses 1-based line/column numbers, VS Code uses 0-based
                    const line = error.line !== undefined ? error.line - 1 : 0;
                    const column = error.column !== undefined ? error.column - 1 : 0;
                    const endColumn = error.endColumn !== undefined ? error.endColumn - 1 : column + 1;

                    const range = new vscode.Range(
                        new vscode.Position(line, column),
                        new vscode.Position(line, endColumn)
                    );

                    const severity = getSeverity(error.type || error.severity);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        error.message,
                        severity
                    );

                    diagnostic.source = 'selfies';

                    // Add error code if available
                    if (error.code) {
                        diagnostic.code = error.code;
                    }

                    diagnostics.push(diagnostic);
                }
            }

            // Add warnings for chemical validity issues
            if (result.warnings && result.warnings.length > 0) {
                for (const warning of result.warnings) {
                    // Parser uses 1-based line/column numbers, VS Code uses 0-based
                    const line = warning.line !== undefined ? warning.line - 1 : 0;
                    const column = warning.column !== undefined ? warning.column - 1 : 0;
                    const endColumn = warning.endColumn !== undefined ? warning.endColumn - 1 : column + 1;

                    const range = new vscode.Range(
                        new vscode.Position(line, column),
                        new vscode.Position(line, endColumn)
                    );

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        warning.message,
                        vscode.DiagnosticSeverity.Warning
                    );

                    diagnostic.source = 'selfies';
                    diagnostics.push(diagnostic);
                }
            }

        } catch (err) {
            // If parsing fails completely, show a general error
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 1),
                `Failed to parse SELFIES file: ${err.message}`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'selfies';
            diagnostics.push(diagnostic);
        }

        diagnosticCollection.set(uri, diagnostics);
    };

    // Map error types to VS Code severity levels
    const getSeverity = (type) => {
        switch (type) {
            case 'error':
            case 'syntax':
            case 'undefined':
            case 'circular':
            case 'redefinition':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
            case 'chemistry':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            case 'hint':
                return vscode.DiagnosticSeverity.Hint;
            default:
                return vscode.DiagnosticSeverity.Error;
        }
    };

    // Listen for document changes
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        updateDiagnostics(event.document);
    });

    // Listen for document open
    const documentOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
        updateDiagnostics(document);
    });

    // Listen for document close
    const documentCloseListener = vscode.workspace.onDidCloseTextDocument((document) => {
        diagnosticCollection.delete(document.uri);
    });

    // Update all currently open documents
    vscode.workspace.textDocuments.forEach(updateDiagnostics);

    return {
        dispose: () => {
            diagnosticCollection.dispose();
            documentChangeListener.dispose();
            documentOpenListener.dispose();
            documentCloseListener.dispose();
        }
    };
}

export { createDiagnosticsProvider };
