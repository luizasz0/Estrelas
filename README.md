<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Stellar Forge

A cosmic crafting game. Start with basic elements like Hydrogen and Gravity to forge stars, nebulas, and black holes through scientifically-inspired recipes.

This is a standalone web application built with React and Vite.

## Run Locally

**Prerequisites:** [Node.js](https://nodejs.org/) (v18 or higher recommended)

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5500`.

## Deployment to GitHub Pages

This project is configured for easy deployment to GitHub Pages.

1.  **Update `vite.config.ts` (if needed):**
    If your GitHub repository is not named `stellar-forge`, you will need to update the `base` property in `vite.config.ts` to match your repository name (e.g., `base: '/your-repo-name/'`).

2.  **Deploy:**
    Run the deploy script:
    ```bash
    npm run deploy
    ```
    This command will build the application and push the contents of the `dist` folder to a `gh-pages` branch on your repository.

3.  **Configure GitHub Pages:**
    In your repository settings on GitHub, go to the "Pages" section and set the source to the `gh-pages` branch. Your site will be live shortly at `https://<your-username>.github.io/stellar-forge/`.
