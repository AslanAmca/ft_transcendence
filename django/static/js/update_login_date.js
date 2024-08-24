function updateUserLoginDate() {
	if (window.updateLastLogin)
		return;

	window.updateLastLogin = setInterval(async () => {
		try {
			const response = await fetch("/update-last-login/");
			const data = await response.json();

			if (!response.ok || !data.authenticated)
				clearUpdateLastLogin();

		} catch {
			clearUpdateLastLogin();
		}
	}, 10000);
}

function clearUpdateLastLogin() {
	if (window.updateLastLogin) {
		clearInterval(window.updateLastLogin);
		window.updateLastLogin = null;
	}
}

document.addEventListener("DOMContentLoaded", () => updateUserLoginDate());

window.addEventListener("online", () => updateUserLoginDate());

window.addEventListener("offline", () => clearUpdateLastLogin());