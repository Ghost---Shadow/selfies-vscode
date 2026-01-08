# SELFIES Language Extension for VS Code

<p align="center">
  <img src="https://raw.githubusercontent.com/Ghost---Shadow/selfies-vscode/main/illustration.png" alt="SELFIES Extension Screenshot" width="800"/>
</p>

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
  - 2D molecular structure rendering with white background
  - Molecular weight calculation
  - Molecular formula
  - SMILES output
  - **Download as SVG** - Export molecular structures as vector graphics
  - **Download as PNG** - Export molecular structures as raster images

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

## Citation

If you use SELFIES in your research, please cite the original paper:

```bibtex
@article{krenn2020self,
  title={Self-referencing embedded strings (SELFIES): A 100% robust molecular string representation},
  author={Krenn, Mario and H{\"a}se, Florian and Nigam, AkshatKumar and Friederich, Pascal and Aspuru-Guzik, Al{\'a}n},
  journal={Machine Learning: Science and Technology},
  volume={1},
  number={4},
  pages={045024},
  year={2020},
  publisher={IOP Publishing}
}
```

**Paper**: Krenn, M., Häse, F., Nigam, A., Friederich, P., & Aspuru-Guzik, A. (2020). Self-referencing embedded strings (SELFIES): A 100% robust molecular string representation. *Machine Learning: Science and Technology*, 1(4), 045024.

**DOI**: https://doi.org/10.1088/2632-2153/aba947

## Acknowledgments

This extension is built on top of:
- [SELFIES](https://github.com/aspuru-guzik-group/selfies) - Original Python implementation by the Aspuru-Guzik group
- [selfies-js](https://github.com/Ghost---Shadow/selfies-js) - Pure JavaScript implementation
- [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) - Molecular structure rendering
- [RDKit](https://www.rdkit.org/) - Chemistry toolkit

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests at https://github.com/Ghost---Shadow/selfies-vscode

## License

MIT - Copyright (c) 2026 Souradeep Nanda
