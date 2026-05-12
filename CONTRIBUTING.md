# Contributing to FakeIt

Thank you for your interest in contributing to FakeIt! Whether you're fixing a bug, adding a feature, or writing documentation, we appreciate your help.

## Project Structure

FakeIt is a monorepo consisting of:
- `client/`: A Vite + React frontend.
- `server/`: An Express + Socket.io Node.js backend.

## Setting Up Locally

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd imposter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development servers:**
   ```bash
   # Terminal 1: Start the backend
   npm run dev --workspace server

   # Terminal 2: Start the frontend
   npm run dev --workspace client
   ```

4. **Access the application:**
   The frontend runs on `http://localhost:5173` and automatically connects to the backend on `http://localhost:3001`.

## Code Style & Testing

- **Linting:** We enforce basic linting. Ensure your code is clean and readable.
- **Testing:** The backend uses Vitest. Before submitting a PR, ensure all tests pass:
  ```bash
  npm run test --workspace server
  ```
- **Documentation:** If you add a new API endpoint or Socket event, please document it in `API.md`.

## Submitting Pull Requests

1. Fork the repository and create your branch from `main`.
2. Write clear, descriptive commit messages.
3. If you've added new features, include relevant tests.
4. Open a pull request and describe the changes and the motivation behind them.

Happy coding!
