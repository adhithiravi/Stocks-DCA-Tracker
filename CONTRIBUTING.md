# Contributing to DCA Dashboard

Thanks for your interest in contributing.

## Getting Started

1. Fork the repository and clone your fork.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

## Development Workflow

- Create a focused feature/fix branch from `main`.
- Keep pull requests small and reviewable.
- Prefer clear commit messages that explain why the change is needed.

## Before Opening a Pull Request

Run these checks locally:

```bash
npm run typecheck
npm run build
```

If your change affects behavior, include a short test plan in the PR description.

## Pull Request Guidelines

- Describe the problem and your solution.
- Include screenshots/GIFs for UI changes.
- Link related issues (if any).
- Keep unrelated refactors out of the same PR.

## Reporting Issues

When opening a bug report, include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Environment details (OS, Node version, browser)

## Code of Conduct

By participating in this project, you agree to follow the guidelines in
`CODE_OF_CONDUCT.md`.
