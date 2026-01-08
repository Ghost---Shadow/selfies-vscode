# Changelog

All notable changes to the SELFIES Language Extension will be documented in this file.

## [0.1.0] - 2026-01-08

### Added
- Initial release
- Syntax highlighting for `.selfies` files
- Real-time diagnostics for syntax and semantic errors
- Live preview panel with molecular structure visualization
- Molecular weight and formula calculation
- Import support (simple, wildcard, and selective imports)
- Auto-completion for brackets
- Configuration settings for preview behavior
- Commands for showing and toggling preview panel

### Features
- Integration with `selfies-js` for parsing and chemistry logic
- 2D structure rendering using smiles-drawer with white background
- Cursor tracking for real-time updates
- Support for comments and multi-file projects
- Export functionality:
  - Download molecular structures as SVG (vector format)
  - Download molecular structures as PNG (raster format with white background)
- Enhanced syntax highlighting:
  - Chemical elements colored consistently (with or without bond modifiers)
  - Variable references colored distinctly from elements
  - Special tokens (Ring, Branch) highlighted as keywords

---

For more information, visit the [GitHub repository](https://github.com/Ghost---Shadow/selfies-vscode).
