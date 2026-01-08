const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

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
                    vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')
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
            message => {
                switch (message.command) {
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        break;
                    case 'info':
                        vscode.window.showInformationMessage(message.text);
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
    update(lineInfo) {
        if (!this._panel) {
            return;
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
            'src',
            'webview',
            'renderer.html'
        );

        const html = fs.readFileSync(rendererPath, 'utf-8');
        return html;
    }
}

module.exports = {
    PreviewPanel
};
