// Popup logic

const API_BASE_URL = "http://localhost:3000"; // Change this for production

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("job-form");
    const saveBtn = document.getElementById("save-btn");
    const messageDiv = document.getElementById("message");
    const authSection = document.getElementById("auth-section");
    const mainSection = document.getElementById("main-section");
    const loginBtn = document.getElementById("login-btn");

    // Fill URL automatically
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
        document.getElementById("url").value = tab.url;

        // Try to guess company/position logic could go here later
        // For now, basic URL parsing or empty
    }

    // Check Auth (Simple check via an API call that requires auth)
    // Since we have host permissions for localhost, we can try to fetch the profile
    // Cookies will be sent automatically by the browser if we configured permissions right

    async function checkAuth() {
        try {
            // We can try to hit our new jobs API just to check auth
            // or a lightweight user endpoint
            const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                // Note: 'api/auth/me' might not exist, usually we check if we can get user data
                // Let's assume we can try to GET jobs. If 401, not logged in.
                method: "GET"
            });

            // Actually, let's use the jobs endpoint we made:
            const jobsRes = await fetch(`${API_BASE_URL}/api/jobs`, {
                method: "GET"
            });

            if (jobsRes.status === 401) {
                showAuthError();
            } else {
                showMainInterface();
            }
        } catch (err) {
            console.error("Auth check failed", err);
            // Could be network error or server down
            messageDiv.textContent = "Could not connect to JobDance server.";
            messageDiv.className = "status-msg error";
        }
    }

    function showAuthError() {
        authSection.classList.remove("hidden");
        mainSection.classList.add("hidden");
    }

    function showMainInterface() {
        authSection.classList.add("hidden");
        mainSection.classList.remove("hidden");
    }

    checkAuth();

    loginBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: `${API_BASE_URL}/auth/login` });
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        messageDiv.textContent = "Saving...";
        messageDiv.className = "status-msg";
        saveBtn.disabled = true;

        const data = {
            company_name: document.getElementById("company").value,
            position_title: document.getElementById("position").value,
            job_url: document.getElementById("url").value,
            status: document.getElementById("status").value,
            notes: document.getElementById("notes").value
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/jobs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                messageDiv.textContent = "Job saved successfully!";
                messageDiv.className = "status-msg success";
                setTimeout(() => window.close(), 1500);
            } else {
                const errData = await res.json();
                messageDiv.textContent = errData.error || "Failed to save.";
                messageDiv.className = "status-msg error";
                saveBtn.disabled = false;
            }
        } catch (err) {
            console.error("Save failed", err);
            messageDiv.textContent = "Network error.";
            messageDiv.className = "status-msg error";
            saveBtn.disabled = false;
        }
    });
});
