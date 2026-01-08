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

        // Check if renderer.html exists, otherwise use inline HTML
        if (fs.existsSync(rendererPath)) {
            let html = fs.readFileSync(rendererPath, 'utf-8');

            // Get webview URI for local resources
            const scriptUri = this._panel.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'renderer.html')
            );

            return html;
        }

        // Fallback inline HTML
        return this._getInlineHtml();
    }

    /**
     * Get inline HTML for the webview
     */
    _getInlineHtml() {
        const nonce = this._getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}' https://unpkg.com; connect-src https:;">
    <title>SELFIES Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .definition-name {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .expression {
            font-family: 'Courier New', monospace;
            color: var(--vscode-textPreformat-foreground);
            margin-top: 5px;
        }
        .structure-container {
            margin: 20px 0;
            padding: 20px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #structure {
            width: 100%;
            max-width: 600px;
        }
        .properties {
            margin-top: 20px;
        }
        .property {
            margin: 10px 0;
            padding: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .property-label {
            font-weight: bold;
            color: var(--vscode-symbolIcon-variableForeground);
        }
        .property-value {
            margin-left: 10px;
            font-family: 'Courier New', monospace;
        }
        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            border-radius: 4px;
            margin: 10px 0;
        }
        .placeholder {
            color: var(--vscode-descriptionForeground);
            text-align: center;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div id="content">
            <div class="placeholder">
                Move your cursor to a definition to see the molecular structure
            </div>
        </div>
    </div>

    <script nonce="${nonce}" src="https://unpkg.com/smiles-drawer@2.0.1/dist/smiles-drawer.min.js"></script>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let smilesDrawer;

        // Initialize smiles-drawer when available
        window.addEventListener('load', () => {
            if (typeof SmilesDrawer !== 'undefined') {
                smilesDrawer = new SmilesDrawer.SvgDrawer({
                    width: 500,
                    height: 300,
                    bondThickness: 2,
                    fontSizeLarge: 14,
                    fontSizeSmall: 10
                });
            }
        });

        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;

            if (message.command === 'update') {
                updateView(message.data);
            }
        });

        function updateView(lineInfo) {
            const content = document.getElementById('content');

            if (!lineInfo || lineInfo.error) {
                content.innerHTML = \`
                    <div class="error">
                        \${lineInfo?.error || 'No definition found on current line'}
                    </div>
                \`;
                return;
            }

            const { name, expression, selfies, smiles, molecularWeight, formula } = lineInfo;

            let html = \`
                <div class="header">
                    <div class="definition-name">\${name}</div>
                    <div class="expression">\${expression}</div>
                </div>
            \`;

            if (smiles) {
                html += \`
                    <div class="structure-container">
                        <canvas id="structure"></canvas>
                    </div>
                \`;
            } else {
                html += \`
                    <div class="error">
                        Invalid SELFIES: Could not convert to SMILES
                    </div>
                \`;
            }

            html += '<div class="properties">';

            if (selfies) {
                html += \`
                    <div class="property">
                        <span class="property-label">SELFIES:</span>
                        <span class="property-value">\${selfies}</span>
                    </div>
                \`;
            }

            if (smiles) {
                html += \`
                    <div class="property">
                        <span class="property-label">SMILES:</span>
                        <span class="property-value">\${smiles}</span>
                    </div>
                \`;
            }

            if (formula) {
                html += \`
                    <div class="property">
                        <span class="property-label">Formula:</span>
                        <span class="property-value">\${formula}</span>
                    </div>
                \`;
            }

            if (molecularWeight !== null && molecularWeight !== undefined) {
                html += \`
                    <div class="property">
                        <span class="property-label">Molecular Weight:</span>
                        <span class="property-value">\${molecularWeight.toFixed(2)} g/mol</span>
                    </div>
                \`;
            }

            html += '</div>';

            content.innerHTML = html;

            // Draw the structure
            if (smiles && smilesDrawer) {
                try {
                    SmilesDrawer.parse(smiles, function(tree) {
                        smilesDrawer.draw(tree, 'structure', 'light', false);
                    }, function(err) {
                        console.error('Error parsing SMILES:', err);
                        vscode.postMessage({
                            command: 'error',
                            text: 'Error drawing molecular structure: ' + err
                        });
                    });
                } catch (err) {
                    console.error('Error drawing structure:', err);
                }
            }
        }
    </script>
</body>
</html>`;
    }

    /**
     * Generate a nonce for CSP
     */
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}

module.exports = {
    PreviewPanel
};
