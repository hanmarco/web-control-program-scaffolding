# Contributing Guide

Thank you for your interest in contributing to the IC Evaluation Board Application!

## Development Setup

### Prerequisites

- Node.js 20 or higher
- Rust 1.70 or higher
- Platform-specific dependencies:
  - **Linux**: `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `libwebkit2gtk-4.1-dev`
  - **Windows**: Visual Studio Build Tools

### Setup Steps

1. Fork and clone the repository
```bash
git clone https://github.com/your-username/web-control-program-scaffolding.git
cd web-control-program-scaffolding
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run tauri:dev
```

## Project Structure

```
├── src/
│   ├── components/custom/  # Reusable register components
│   ├── views/              # Page components
│   ├── stores/             # Pinia stores
│   ├── interfaces/         # Communication interfaces
│   ├── types/              # TypeScript types
│   └── router/             # Vue Router config
├── src-tauri/              # Rust backend
├── public/                 # Static assets
└── docs/                   # Documentation
```

## Code Style

### TypeScript/Vue
- Use TypeScript for all new code
- Follow Vue 3 Composition API patterns
- Use Pinia for state management
- Prefer functional components

### Naming Conventions
- Components: PascalCase (e.g., `ByteType.vue`)
- Files: PascalCase for components, camelCase for utilities
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

### Code Formatting
- Use 2 spaces for indentation
- Add trailing commas
- Use single quotes for strings
- Max line length: 100 characters

## Making Changes

### Adding a New Register Type

1. Create component in `src/components/custom/YourType.vue`
2. Add type definition in `src/types/RegisterTypes.ts`
3. Update `getComponentForType()` in views
4. Add example to sample register map
5. Update documentation

### Adding a Communication Protocol

1. Create new class implementing `CommunicationInterface`
2. Add to protocol options in `SettingsView.vue`
3. Update documentation
4. Add tests

### Modifying Stores

1. Update store in `src/stores/`
2. Ensure backward compatibility
3. Update dependent components
4. Add tests

## Testing

### Manual Testing
1. Test with mock communication
2. Test all register types
3. Test connection/disconnection
4. Test error scenarios

### Future: Automated Testing
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
```

## Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting)
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Build process or auxiliary tool changes

### Examples
```
feat(slider): add support for logarithmic scale

Implement logarithmic scale option for slider components
to better handle wide value ranges.

Closes #123
```

```
fix(communication): handle timeout errors properly

Add proper error handling for communication timeouts
to prevent application freezing.
```

## Pull Request Process

1. Create a feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
3. Test thoroughly
4. Commit with clear messages
5. Push to your fork
6. Create a Pull Request

### PR Checklist
- [ ] Code follows project style
- [ ] Tests pass (when available)
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] PR description explains changes

## Adding Documentation

- API changes: Update code comments and type definitions
- Features: Update README.md and docs/USAGE.md
- Architecture: Update docs/ARCHITECTURE.md
- Examples: Add to public/sample-register-map.json

## Communication

- Open an issue for bugs or feature requests
- Discuss major changes before implementing
- Ask questions in discussions
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or discussion if you have any questions!
