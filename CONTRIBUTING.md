# Contributing to JEMIMA

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```
   git clone https://github.com/your-username/jemima.git
   cd jemima
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Copy the environment file:
   ```
   cp .env.example .env.local
   ```
5. Start the dev server:
   ```
   npm run dev
   ```

This starts the Vite dev server (port 3000) and Express content server (port 3001).

## Branching

- Create a branch from `main` for your work:
  ```
  git checkout -b feature/your-feature-name
  ```
- Use descriptive branch names: `fix/schedule-conflict`, `feat/theme-export`, etc.

## Code Style

- TypeScript — strict types, no `any` unless necessary
- Tailwind CSS — use utility classes, avoid custom CSS when possible
- No comments unless asked — code should be self-documenting
- Components in `src/components/`, pages in `src/pages/`, utilities in `src/lib/`

## Linting

Before submitting, run:
```
npm run lint
```

This runs `tsc --noEmit` to check for type errors.

## Pull Requests

1. Keep PRs focused — one feature or fix per PR
2. Write a clear PR title and description
3. Reference any related issues
4. Make sure `npm run lint` passes
5. Make sure `npm run build` succeeds

## Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Include browser/OS information
- Screenshots help for UI issues

## License

By contributing, you agree that your contributions will be licensed under the Business Source License 1.1.
