import { apiFetch } from "/js/api.js";

async function showUserStatus() {
    try {
        const data = await apiFetch("/v1/auth/me");
        if (data && data.user) {
            const header = document.querySelector('header') || document.body;
            const statusDiv = document.createElement('div');
            statusDiv.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.9);
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        font-size: 12px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #e2e8f0;
      `;

            const role = data.user.is_admin ? '<span style="color: #6366f1; font-weight: 600;">(Admin)</span>' : '';

            statusDiv.innerHTML = `
        <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
        <div>
          <div style="font-weight: 500;">${data.user.name}</div>
          <div style="color: #64748b; font-size: 10px;">${data.user.email} ${role}</div>
        </div>
        <button onclick="logout()" style="border: none; background: none; color: #ef4444; cursor: pointer; margin-left: 8px;" title="Logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      `;

            document.body.appendChild(statusDiv);
        }
    } catch (err) {
        console.log("Not logged in");
    }
}

async function logout() {
    try {
        await fetch("/v1/auth/logout", { method: "POST" });
        window.location.href = "/v1/auth/login";
    } catch (err) {
        console.error("Logout failed", err);
    }
}

window.logout = logout;
showUserStatus();
