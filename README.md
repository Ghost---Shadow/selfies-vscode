# SELFIES Language Extension for VS Code

Language support for SELFIES (SELF-referencIng Embedded Strings) - a declarative DSL for composing molecules using SELFIES notation.

## Features

- **Syntax Highlighting** - Full syntax highlighting for SELFIES DSL files
  - Comments, keywords, identifiers, atoms, bonds, branches, and rings
  - Color-coded for easy reading

- **Real-time Diagnostics** - Instant feedback on syntax and semantic errors
  - Undefined references
  - Circular dependencies
  - Syntax errors
  - Import resolution

- **Live Preview** - Visual feedback as you type
  - 2D molecular structure rendering
  - Molecular weight calculation
  - Molecular formula
  - SMILES output

- **Import Support** - Multi-file projects with three import syntaxes
  - `import "./file.selfies"` (simple)
  - `import * from "./file.selfies"` (wildcard)
  - `import [name1, name2] from "./file.selfies"` (selective)

## Usage

1. Create a file with `.selfies` extension
2. Define molecules using the SELFIES DSL syntax
3. The preview panel opens automatically (or use `Ctrl+Shift+P` → "SELFIES: Show Molecular Structure")
4. Move your cursor to any definition to see its structure

## Syntax Examples

```selfies
# Simple definitions
[methyl] = [C]
[ethyl] = [C][C]
[propyl] = [C][C][C]

# Composition
[hydroxyl] = [O]
[ethanol] = [ethyl][hydroxyl]

# More complex molecules
[carbonyl] = [C][=O]
[carboxyl] = [carbonyl][O]
[acetic_acid] = [methyl][carboxyl]

# Rings
[benzene] = [C][=C][C][=C][C][=C][Ring1][=Branch1]
[toluene] = [methyl][benzene]
```

## Commands

- `SELFIES: Show Molecular Structure` - Open the preview panel
- `SELFIES: Toggle Preview Panel` - Toggle the preview panel on/off

## Settings

- `selfies.previewOnCursorMove` (default: `true`) - Update preview when cursor moves to a different line
- `selfies.autoOpenPreview` (default: `true`) - Automatically open preview panel when opening .selfies files
- `selfies.renderingEngine` (default: `smiles-drawer`) - Molecule rendering engine

## Language Semantics

1. **No forward references** - A name must be defined before it is used
2. **No recursion** - A definition cannot reference itself, directly or indirectly
3. **Single assignment** - A name cannot be redefined
4. **Case sensitive** - `[Methyl]` and `[methyl]` are distinct

## Requirements

This extension depends on the `selfies-js` package for all parsing and chemistry logic.

## Installation

### From VSIX

1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X`)
4. Click the `...` menu → "Install from VSIX..."
5. Select the downloaded `.vsix` file

### From Source

1. Clone the repository
2. Run `npm install` in the extension directory
3. Press `F5` to launch the extension in debug mode

## Development

```bash
# Install dependencies
npm install

# Watch for changes
npm run watch

# Package the extension
npm run package
```

## License

MIT
