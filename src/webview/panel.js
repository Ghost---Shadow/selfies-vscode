'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateSVG } from '../rdkitRenderer';

/**
 * Manages the webview panel for molecular structure visualization
 */
class PreviewPanel {
    constructor(extensionUri) {
        this._extensionUri = extensionUri;
        this._panel = null;
        this._disposables = [];

        this._create();
    }

    /**
     * Create the webview panel
     */
    _create() {
        this._panel = vscode.window.createWebviewPanel(
            'selfiesPreview',
            'SELFIES Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this._extensionUri, 'resources')
                ]
            }
        );

        this._panel.webview.html = this._getHtmlContent();

        // Handle panel disposal
        this._panel.onDidDispose(() => {
            this.dispose();
        }, null, this._disposables);

        // Handle messages from webview
        this._panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        break;
                    case 'info':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'saveSVG':
                        await this._saveSVG(message.svgData, message.fileName);
                        break;
                    case 'savePNG':
                        await this._savePNG(message.pngData, message.fileName);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    /**
     * Update the preview with new molecule data
     */
    async update(lineInfo) {
        if (!this._panel) {
            return;
        }

        // Generate SVG using RDKit if we have SMILES
        if (lineInfo && lineInfo.smiles && !lineInfo.error) {
            try {
                const svg = await generateSVG(lineInfo.smiles, {
                    width: 500,
                    height: 300,
                    addStereoAnnotation: true
                });
                lineInfo.svg = svg;
            } catch (err) {
                console.error('RDKit rendering failed:', err);
                lineInfo.rdkitError = err.message;
            }
        }

        this._panel.webview.postMessage({
            command: 'update',
            data: lineInfo
        });
    }

    /**
     * Reveal the panel
     */
    reveal() {
        if (this._panel) {
            this._panel.reveal(vscode.ViewColumn.Beside);
        }
    }

    /**
     * Register a disposal callback
     */
    onDidDispose(callback) {
        return this._panel.onDidDispose(callback);
    }

    /**
     * Dispose the panel
     */
    dispose() {
        if (this._panel) {
            this._panel.dispose();
        }

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Get the HTML content for the webview
     */
    _getHtmlContent() {
        const rendererPath = path.join(
            this._extensionUri.fsPath,
            'resources',
            'renderer.html'
        );

        const html = fs.readFileSync(rendererPath, 'utf-8');
        return html;
    }

    /**
     * Save SVG file
     */
    async _saveSVG(svgData, fileName) {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: {
                    'SVG Files': ['svg']
                }
            });

            if (uri) {
                await vscode.workspace.fs.writeFile(uri, Buffer.from(svgData, 'utf-8'));
                vscode.window.showInformationMessage(`SVG saved to ${uri.fsPath}`);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to save SVG: ${err.message}`);
        }
    }

    /**
     * Save PNG file
     */
    async _savePNG(pngData, fileName) {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(fileName),
                filters: {
                    'PNG Files': ['png']
                }
            });

            if (uri) {
                // Convert data URL to buffer
                const base64Data = pngData.replace(/^data:image\/png;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                await vscode.workspace.fs.writeFile(uri, buffer);
                vscode.window.showInformationMessage(`PNG saved to ${uri.fsPath}`);
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Failed to save PNG: ${err.message}`);
        }
    }
}

export { PreviewPanel };
