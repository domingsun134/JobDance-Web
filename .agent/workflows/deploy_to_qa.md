---
description: Deploy changes to QA environment on Vercel
---

This workflow describes how to push your local changes to the `qa` branch, which triggers a Vercel Preview Deployment.

1.  **Ensure you are on the `qa` branch**:
    ```bash
    git checkout qa
    ```

2.  **Stage and Commit your changes**:
    ```bash
    git add .
    git commit -m "feat: description of your changes"
    ```

3.  **Push to Remote**:
    ```bash
    git push origin qa
    ```

4.  **Verify on Vercel**:
    -   Go to your Vercel Dashboard.
    -   You will see a new **Preview Deployment** building for the `qa` branch.
    -   Once finished, Vercel provides a unique URL (e.g., `jobdance-git-qa-yourname.vercel.app`) to test your changes.

5.  **Promote to Production (Main)**:
    -   Once QA is verified, create a Pull Request (PR) from `qa` to `main` on GitHub.
    -   Merge the PR.
    -   Vercel will automatically build and deploy the `main` branch to Production.
