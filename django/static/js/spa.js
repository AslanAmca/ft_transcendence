function downloadJSON(data) {
	// Blob nesnesi oluşturuyoruz.
	const blob = new Blob([JSON.stringify(data, null, 4)], { type: 'application/json' });

	// Blob nesnesi üzerinden bir download linki oluşturuyoruz.
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${data.username}_data.json`; // İndirilecek dosyanın adı

	// Bu linki DOM'a ekleyip click olayını tetikleyip dosyayı indiriyoruz.
	document.body.appendChild(a);
	a.click();

	// Link ile işimiz bittiği için DOM'dan kaldırıyoruz.
	a.remove();
	window.URL.revokeObjectURL(url); // URL'yi temizle
}

function getCSRF() {
	const csrfElement = document.querySelector('[name=csrfmiddlewaretoken]');

	const csrfToken = csrfElement ? csrfElement.value : null;

	return csrfToken;
}

function acceptCookiePolicy() {
	document.cookie = "cookiepolicy=true; path=/; SameSite=Lax; secure; max-age=" + 60 * 60 * 24 * 365;
}

function showCookiePolicyModal() {
	const cookieModalElement = document.getElementById("cookiePolicyModal");
	if (!cookieModalElement)
		return;

	const modalOptions = {
		backdrop: "static",
		keyboard: false,
		focus: true
	};

	const cookieModal = new bootstrap.Modal(cookieModalElement, modalOptions);
	cookieModal.show();
}

function showPrivacyPolicyModal() {
	const privacyPolicyButton = document.getElementById("privacyPolicy");
	if (!privacyPolicyButton)
		return;

	privacyPolicyButton.addEventListener("click", () => {
		const privacyPolicyModalElement = document.getElementById("privacyPolicyModal");
		if (!privacyPolicyModalElement)
			return;

		const privacyPolicyModal = new bootstrap.Modal(privacyPolicyModalElement);
		privacyPolicyModal.show();
	})
}

function removeAttributes(element) {
	const attributes = Array.from(element.attributes);

	// id ve class hariç tüm özellikleri sil
	attributes.forEach(attr => {
		if (attr.name !== 'id' && attr.name !== 'class')
			element.removeAttribute(attr.name);
	});
}

function showFormErrors(errors) {
	for (const [field, messages] of Object.entries(errors)) {
		const fieldElement = document.querySelector(`[name=${field}]`);
		if (fieldElement) {
			fieldElement.classList.add('is-invalid');

			messages.forEach(message => {
				const errorDiv = document.createElement('div');
				errorDiv.className = 'invalid-feedback d-block';
				errorDiv.innerText = message;
				fieldElement.parentNode.appendChild(errorDiv);
			});
		}
	}
}

function clearFormErrors() {
	const errorMessages = document.querySelectorAll('.invalid-feedback');
	errorMessages.forEach(errorMessage => errorMessage.remove());

	const invalidFields = document.querySelectorAll('.is-invalid');
	invalidFields.forEach(field => field.classList.remove('is-invalid'));
}

function showAlert(element, message, type) {
	const alertDiv = document.createElement('div');
	alertDiv.className = `alert alert-${type} alert-dismissible fade show fw-semibold d-flex align-items-center`;
	alertDiv.role = 'alert';

	// ikonu belirlemek için bir değişken kullanıyoruz
	let iconClass;
	switch (type) {
		case 'success':
			iconClass = 'bi-check-circle-fill';
			break;
		case 'danger':
			iconClass = 'bi-exclamation-circle-fill';
			break;
		case 'info':
			iconClass = 'bi-info-circle-fill';
			break;
		default:
			iconClass = '';
	}

	alertDiv.innerHTML = `
        <i class="bi ${iconClass}"></i>
        <span class="ms-2">${message}</span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

	element.insertAdjacentElement('beforebegin', alertDiv);
}

function clearAlerts() {
	const existingAlerts = document.querySelectorAll('.alert');
	existingAlerts.forEach(alert => alert.remove());
}

function signUp() {
	const signupForm = document.getElementById("signupForm");
	if (!signupForm)
		return;

	signupForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const request = new Request(signupForm.action, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new FormData(signupForm)
		})

		try {
			const response = await fetch(request);
			const data = await response.json();

			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			if (data.success)
				await loadPage(new Request("/signin/"), true, false)
			else if (data.form_errors)
				showFormErrors(data.form_errors)
			else
				showAlert(signupForm, data.message, "danger")

		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function signInEcole() {
	const ecoleButton = document.getElementById("ecoleButton");
	if (!ecoleButton)
		return;

	ecoleButton.addEventListener("click", async () => {
		try {
			const response = await fetch(new Request("/oauth/login/"));
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			const data = await response.json();
			window.location.href = data.redirect_url;
		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function signIn() {
	const signinForm = document.getElementById("signinForm");
	if (!signinForm)
		return;

	signinForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		let url = signinForm.action;
		const nextParam = new URLSearchParams(location.search).get('next');
		if (nextParam)
			url += `?next=${nextParam}`;

		const request = new Request(url, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new URLSearchParams(new FormData(signinForm))
		})

		try {
			const response = await fetch(request);
			const data = await response.json();

			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			if (data.success)
				await loadPage(new Request(data.redirect_url), false, true);
			else if (data.form_errors)
				showFormErrors(data.form_errors)
			else
				showAlert(signinForm, data.message, "danger")
		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function signOut() {
	const signOutButton = document.getElementById("signOutButton");
	if (!signOutButton)
		return;

	signOutButton.addEventListener("click", async () => {
		const request = new Request("/signout/");
		await loadPage(request, true, false);
	})
}

function updateProfile() {
	const profileForm = document.getElementById("profileForm");
	if (!profileForm)
		return;

	profileForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const request = new Request(profileForm.action, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new FormData(profileForm)
		})

		try {
			const response = await fetch(request);
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			const data = await response.json();
			if (data.success) {
				const alertType = data.type ? data.type : "success";
				showAlert(profileForm, data.message, alertType);

				// Yeni avatar URL'sini güncelle
				if (data.new_avatar_url) {
					// Hem formdaki hem de navbardaki avatar img elementlerini seçip güncelle
					const avatarImgElements = document.querySelectorAll(".avatar, .avatar-big");
					avatarImgElements.forEach(img => {
						img.src = data.new_avatar_url;
					});
				}

				// İstek başarılı olduğuna göre formdaki resim alanını temizle
				const avatarInput = document.querySelector("input[type='file'][name='avatar']");
				if (avatarInput) {
					avatarInput.value = "";
				}

			} else if (data.form_errors)
				showFormErrors(data.form_errors)
			else
				showAlert(profileForm, data.message, "danger")

		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function changePassword() {
	const changePasswordForm = document.getElementById("changePasswordForm");
	if (!changePasswordForm)
		return;

	changePasswordForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const request = new Request(changePasswordForm.action, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new URLSearchParams(new FormData(changePasswordForm))
		})

		try {
			const response = await fetch(request);
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			const data = await response.json();
			if (data.success) {
				showAlert(changePasswordForm, data.message, "success");
				changePasswordForm.reset();
			} else if (data.form_errors)
				showFormErrors(data.form_errors)
			else
				showAlert(changePasswordForm, data.message, "danger")

		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function downloadAccountData() {
	const downloadAccountDataButton = document.getElementById("downloadAccountDataButton");
	if (!downloadAccountDataButton)
		return;

	downloadAccountDataButton.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to download your account data?"))
			return;

		try {
			const response = await fetch(new Request("/download-account/"));
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			const data = await response.json();
			downloadJSON(data);

		} catch {
			alert("An unexpected error occurred.");
		}
	});
}

function deleteAccount() {
	const deleteAccountButton = document.getElementById("deleteAccountButton");
	const accountDataElement = document.getElementById("accountDataElement");

	if (!deleteAccountButton || !accountDataElement)
		return;

	deleteAccountButton.addEventListener("click", async () => {
		if (!confirm("Are you sure you want to delete your account?"))
			return;

		const request = new Request("/delete-account/", {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			}
		})

		try {
			const response = await fetch(request);
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			const data = await response.json();
			if (data.success)
				await loadPage(new Request("/signin/"), true, false);
			else
				showAlert(accountDataElement, data.message, "danger")

		} catch {
			alert("An unexpected error occurred.");
		}
	});
}

function getGameHistory() {
	const historyForm = document.getElementById("historyForm");
	if (!historyForm)
		return;

	historyForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const request = new Request(historyForm.action, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new URLSearchParams(new FormData(historyForm))
		})

		try {
			const response = await fetch(request);
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			// Yeni aramada eski veriler kalmasın diye tablo içeriğini temizle
			const tbody = document.querySelector('table tbody');
			tbody.innerHTML = '';

			const data = await response.json();
			if (data.success) {
				for (const history of data.history) {

					const statusClass = history.status === 'Win' ? 'text-bg-success' : 'text-bg-danger';

					const newRow = document.createElement('tr');
					newRow.innerHTML = `
                        <td>${history.user_name}</td>
                        <td>${history.user_display_name}</td>
                        <td>${history.rival_display_name}</td>
                        <td class="${statusClass}">${history.status}</td>
                        <td>${history.datetime}</td>
                    `;

					// Tablo'ya ekle.
					tbody.appendChild(newRow);
				}

				// İstek başarılı olduğuna göre forda ki alanları temizle
				historyForm.reset();

			} else if (data.form_errors) {
				showFormErrors(data.form_errors)
			} else {
				// Genel hataları alert olarak göster
				showAlert(historyForm, data.message, "danger")
			}
		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

function sendFriendRequest() {
	const sendFriendRequestForm = document.getElementById("sendFriendRequestForm");
	if (!sendFriendRequestForm)
		return;

	sendFriendRequestForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const request = new Request(sendFriendRequestForm.action, {
			method: "POST",
			mode: "same-origin",
			headers: {
				'X-CSRFToken': getCSRF()
			},
			body: new URLSearchParams(new FormData(sendFriendRequestForm))
		})

		try {
			const response = await fetch(request);
			if (!response.ok) {
				alert("An unexpected error occurred.");
				return;
			}

			// Yeni hataları göstermeden önce eski hataları temizle.
			clearAlerts();
			clearFormErrors();

			const data = await response.json();
			if (data.success) {
				const newRow = document.createElement('tr');
				newRow.id = `friendship-${data.friend.friendship_id}`;
				newRow.innerHTML = `
                        <td>${data.friend.username}</td>
                        <td>${data.friend.display_name}</td>
                        <td>${data.friend.first_name}</td>
                        <td>${data.friend.last_name}</td>
                        <td>
                            <i class="bi bi-trash-fill cursor-pointer text-danger" onclick="deleteFriendRequest('${data.friend.friendship_id}')"></i>
                        </td>
                    `;

				// İlk sıraya eklemek için insertBefore kullanabiliriz
				const tbody = document.querySelector('table tbody');
				const firstRow = tbody.querySelector('tr:first-child');
				if (firstRow)
					tbody.insertBefore(newRow, firstRow);
				else
					tbody.appendChild(newRow);

				// İstek başarılı olduğuna göre forda ki alanları temizle
				sendFriendRequestForm.reset();

			} else if (data.form_errors) {
				showFormErrors(data.form_errors)
			} else {
				// Genel hataları alert olarak göster
				showAlert(sendFriendRequestForm, data.message, "danger")

				// Eğer id geldiyse ve tabloda varsa tablodan silinmeli, görsel olarak daha iyi olur.
				if (data.friendship_id) {
					const row = document.getElementById(`friendship-${data.friendship_id}`);
					if (row) row.remove();
				}
			}

		} catch {
			alert("An unexpected error occurred.");
		}
	})
}

async function deleteFriend(friendship_id) {
	if (!confirm("Are you sure you want to delete this friend?"))
		return;

	const request = new Request("/friend-delete/", {
		method: 'POST',
		mode: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRF()
		},
		body: JSON.stringify({ friendship_id: friendship_id })
	})

	try {
		const response = await fetch(request);
		if (!response.ok) {
			alert("An unexpected error occurred.");
			return;
		}

		const data = await response.json();
		if (data.success) {
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		} else {
			alert(data.message);
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		}
	} catch {
		alert("An unexpected error occurred.");
	}
}

async function acceptFriendRequest(friendship_id) {
	if (!confirm("Are you sure you want to accept this friend request?"))
		return;

	const request = new Request("/friend-request-accept/", {
		method: 'POST',
		mode: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRF()
		},
		body: JSON.stringify({ friendship_id: friendship_id })
	})

	try {
		const response = await fetch(request);
		if (!response.ok) {
			alert("An unexpected error occurred.");
			return;
		}

		const data = await response.json();
		if (data.success) {
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		} else {
			alert(data.message);
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		}
	} catch {
		alert("An unexpected error occurred.");
	}
}

async function rejectFriendRequest(friendship_id) {
	if (!confirm("Are you sure you want to reject this friend request?"))
		return;

	const request = new Request("/friend-request-reject/", {
		method: 'POST',
		mode: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRF()
		},
		body: JSON.stringify({ friendship_id: friendship_id })
	})

	try {
		const response = await fetch(request);
		if (!response.ok) {
			alert("An unexpected error occurred.");
			return;
		}

		const data = await response.json();
		if (data.success) {
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		} else {
			alert(data.message);
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		}
	} catch {
		alert("An unexpected error occurred.");
	}
}

async function deleteFriendRequest(friendship_id) {
	if (!confirm("Are you sure you want to delete this friend request?")) return;

	const request = new Request("/friend-request-delete/", {
		method: 'POST',
		mode: 'same-origin',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': getCSRF()
		},
		body: JSON.stringify({ friendship_id: friendship_id })
	})

	try {
		const response = await fetch(request);
		if (!response.ok) {
			alert("An unexpected error occurred.");
			return;
		}

		const data = await response.json();
		if (data.success) {
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		} else {
			alert(data.message);
			const row = document.getElementById(`friendship-${friendship_id}`);
			if (row) row.remove();
		}
	} catch {
		alert("An unexpected error occurred.");
	}
}

function listenLinks() {
	const links = document.querySelectorAll("a:not(.dropdown-toggle)");

	for (const link of links) {
		link.addEventListener("click", async (event) => {
			event.preventDefault();
			const request = new Request(event.currentTarget.href);
			await loadPage(request, true, false);
		})
	}
}

async function loadPage(request, pushState = false, replaceState = false) {
	try {
		const response = await fetch(request);
		if (!response.ok) {
			alert("An unexpected error occurred.");
			return;
		}

		const html = await response.text();
		document.open();
		document.write(html);
		document.close();

		if (pushState)
			history.pushState(null, "", response.url);
		else if (replaceState)
			history.replaceState(null, "", response.url);
	} catch {
		alert("An unexpected error occurred.");
	}
}

window.addEventListener('popstate', async () => {
	const request = new Request(location.href);
	await loadPage(request, false, true);
});

document.addEventListener("DOMContentLoaded", () => {
	showCookiePolicyModal();
	showPrivacyPolicyModal();
	signUp();
	signInEcole();
	signIn();
	signOut();
	updateProfile();
	changePassword();
	downloadAccountData();
	deleteAccount();
	sendFriendRequest();
	getGameHistory();
	listenLinks();
});