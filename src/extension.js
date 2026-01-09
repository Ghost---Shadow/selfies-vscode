'use strict';

import * as vscode from 'vscode';
import { createDiagnosticsProvider } from './diagnostics';
import { LineTracker } from './lineTracker';
import { PreviewPanel } from './webview/panel';
import { initRDKit } from './rdkitRenderer';

/**
 * Activate the SELFIES extension
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
    console.log('SELFIES extension is now active');
    console.log('Initial subscriptions:', context.subscriptions.length);

    // Initialize RDKit asynchronously
    initRDKit().then(() => {
        console.log('✓ RDKit ready for molecule rendering');
    }).catch(err => {
        console.error('Failed to initialize RDKit:', err);
        vscode.window.showWarningMessage('SELFIES: RDKit initialization failed, using fallback renderer');
    });

    // Track subscriptions for debugging
    const originalPush = context.subscriptions.push;
    context.subscriptions.push = function(...items) {
        items.forEach(item => {
            const name = item?.constructor?.name || 'Unknown';
            console.log('→ Adding subscription:', name);
        });
        return originalPush.apply(this, items);
    };

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
            console.log('togglePreview command invoked!');
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

    context.subscriptions.push(showMoleculeCommand);
    context.subscriptions.push(togglePreviewCommand);
    context.subscriptions.push(editorChangeListener);
    context.subscriptions.push(cursorChangeListener);

    // Final summary
    console.log('✓ SELFIES extension activated successfully');
    console.log('✓ Total subscriptions:', context.subscriptions.length);
    console.log('✓ Registered commands: selfies.showMolecule, selfies.togglePreview');

    // Sanity check: Verify commands are registered
    vscode.commands.getCommands(true).then(commands => {
        const selfiesCommands = commands.filter(cmd => cmd.startsWith('selfies.'));
        console.log('=== SANITY CHECK ===');
        console.log('Commands starting with "selfies.":', selfiesCommands);

        if (selfiesCommands.includes('selfies.togglePreview')) {
            console.log('✓ selfies.togglePreview is registered');

            // Try to invoke the command
            console.log('Attempting to invoke selfies.togglePreview...');
            vscode.commands.executeCommand('selfies.togglePreview').then(
                () => console.log('✓ Command executed successfully'),
                (err) => console.error('✗ Command execution failed:', err)
            );
        } else {
            console.error('✗ selfies.togglePreview NOT FOUND in registered commands!');
        }

        if (selfiesCommands.includes('selfies.showMolecule')) {
            console.log('✓ selfies.showMolecule is registered');
        } else {
            console.error('✗ selfies.showMolecule NOT FOUND in registered commands!');
        }
    });
}

/**
 * Deactivate the extension
 */
export function deactivate() {
    // Cleanup is handled by dispose methods
}
