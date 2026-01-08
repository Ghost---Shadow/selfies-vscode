const vscode = require('vscode');
const { createDiagnosticsProvider } = require('./diagnostics');
const { LineTracker } = require('./lineTracker');
const { PreviewPanel } = require('./webview/panel');

/**
 * Activate the SELFIES extension
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('SELFIES extension is now active');

    // Create diagnostics provider
    const diagnosticsProvider = createDiagnosticsProvider();
    context.subscriptions.push(diagnosticsProvider);

    // Create line tracker for cursor position
    const lineTracker = new LineTracker();
    context.subscriptions.push(lineTracker);

    // Create preview panel manager
    let previewPanel = null;

    // Register command to show molecular structure
    const showMoleculeCommand = vscode.commands.registerCommand(
        'selfies.showMolecule',
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.document.languageId !== 'selfies') {
                vscode.window.showErrorMessage('Please open a .selfies file first');
                return;
            }

            if (!previewPanel) {
                previewPanel = new PreviewPanel(context.extensionUri);
                previewPanel.onDidDispose(() => {
                    previewPanel = null;
                });
            }

            previewPanel.reveal();

            // Update with current line
            const lineInfo = lineTracker.getCurrentLineInfo();
            if (lineInfo) {
                previewPanel.update(lineInfo);
            }
        }
    );

    // Register command to toggle preview
    const togglePreviewCommand = vscode.commands.registerCommand(
        'selfies.togglePreview',
        () => {
            if (previewPanel) {
                previewPanel.dispose();
                previewPanel = null;
            } else {
                vscode.commands.executeCommand('selfies.showMolecule');
            }
        }
    );

    // Auto-open preview if enabled in settings
    const autoOpenPreview = () => {
        const config = vscode.workspace.getConfiguration('selfies');
        if (config.get('autoOpenPreview', true)) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'selfies') {
                // Only auto-open if panel doesn't exist
                if (!previewPanel) {
                    vscode.commands.executeCommand('selfies.showMolecule');
                }
            }
        }
    };

    // Listen for active editor changes
    const editorChangeListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && editor.document.languageId === 'selfies') {
            autoOpenPreview();
        }
    });

    // Listen for cursor position changes
    const cursorChangeListener = lineTracker.onDidChangeCurrentLine((lineInfo) => {
        const config = vscode.workspace.getConfiguration('selfies');
        if (config.get('previewOnCursorMove', true) && previewPanel) {
            previewPanel.update(lineInfo);
        }
    });

    // Auto-open preview for currently active editor
    autoOpenPreview();

    context.subscriptions.push(
        showMoleculeCommand,
        togglePreviewCommand,
        editorChangeListener,
        cursorChangeListener
    );
}

/**
 * Deactivate the extension
 */
function deactivate() {
    // Cleanup is handled by dispose methods
}

module.exports = {
    activate,
    deactivate
};
