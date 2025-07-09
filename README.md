# ML Prediction Explanation Interface

## Overview

This project is an interactive web app that lets users upload any tabular dataset (CSV), select a target column, and instantly receive:

- A trained machine learning model on their dataset
- Detailed visual explanations of how the model makes predictions
- Insights into the most influential features behind each prediction
- A clean, modular codebase following modern software engineering practices

## Project Purpose (or) Why This Matters

Most ML applications are a black box. This project focuses on **explainability**, helping users understand not just *what* the model predicted, but *why*.

- Uses SHAP (SHapley Additive exPlanations) to break down feature importance
- Supports both global explanations (what matters overall) and local explanations (why a specific row was predicted)
- Provides key model performance metrics for trustworthiness
- Built with FastAPI, scikit-learn, and SHAP — modular and extensible

## Features

- Upload your own CSV dataset
- Select a target variable
- Train a model
- View feature importance and prediction explanations
- Ready for expansion into model download, LLM summaries, and MLOps integrations (Future work)

## Project Structure

```bash
ml-prediction-explainer/
├── ml-xai-logic/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── routes/              # API endpoints
│   │   ├── ml_core/             # ML training & SHAP logic
│   │   ├── core/                # App config
│   │   ├── utils/               # I/O helpers
│   │   └── schemas/             # Request/response formats
│   ├── tests/                   # Test suite
│   │   ├── end_to_end_test.py   # run routine for all features --> dump response
│   ├── notebooks/               # Experiments & development
│   └── requirements.txt         # Dependencies
├── ml-xai-frontend/
│   ├── index.html               # Main HTML file for the frontend
│   ├── package.json             # Project dependencies and scripts
│   ├── package-lock.json        # Locked dependency versions
│   ├── vite.config.js           # Vite configuration for development and build
│   ├── eslint.config.js         # ESLint configuration for code quality
│   ├── src                      # contains all the components, hooks for frontend
│   └── README.md                # Frontend project documentation
└── README.md                    # Root project documentation
```

## Commit Message Convention

To maintain a clear and organized commit history, this project follows the **Conventional Commits** specification. Commit messages are structured as:

```
<type>(<scope>): <description>
```

- **Types**:

  - `feat`: New features (e.g., adding an API endpoint or SHAP visualization).
  - `fix`: Bug fixes (e.g., correcting model training errors).
  - `refactor`: Code improvements without functional changes.
  - `docs`: Documentation updates (e.g., README or code comments).
  - `test`: Adding or modifying tests.
  - `chore`: Maintenance tasks (e.g., updating dependencies).
  - `style`: Code style or formatting changes.
  - `perf`: Performance improvements.
  - `build`: Build system or dependency updates.
  - `ci`: Continuous integration changes.
  - `init`: Initial setup of new modules or project structure.

- **Scopes**:

  - `api`: FastAPI-related code (e.g., `app/main.py`, `app/routes`).
  - `ml`: Machine learning logic (e.g., model training in `app/ml_core`).
  - `shap`: SHAP explanation logic (e.g., feature importance in `app/ml_core`).
  - `utils`: Helper functions or I/O (e.g., `app/utils`).
  - `config`: Application configuration (e.g., `app/core`).
  - `data`: Data handling or storage (e.g., `data/`).
  - `docs`: Documentation (e.g., `README.md`).
  - `notebooks`: Experimental code in `notebooks/`.
  - `build`: Build or dependency changes (e.g., `requirements.txt`).
  - `ci`: CI/CD pipeline updates.

- **Examples**:

  - `feat(api): add endpoint for uploading CSV datasets`
  - `fix(ml): handle missing values in model training`
  - `refactor(shap): simplify SHAP value aggregation logic`
  - `docs(docs): update README with installation instructions`
