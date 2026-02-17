let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
loadFromStorage();

const token = localStorage.getItem("auth_token");
if (token) {
    currentUser = window.db.accounts.find(u => u.email === token);
    if (currentUser) setAuthState(true, currentUser);
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting); // handle initial load

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data || !data.accounts || !data.departments) throw "missing data";

        window.db = data;
    } catch (err) {
        // If missing or corrupt, seed default data
        window.db = {
            accounts: [
                { firstname: "Admin", lastname: "User", email: "admin@example.com", password: "Password123!", verified: true, isAdmin: true },
                { firstname: "Ninoralf", lastname: "Dela Cruz", email: "admin", password: "admin", verified: true, isAdmin: true }
            ],
            departments: ["Engineering", "HR"]
        };
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function login() {
    const userEmail = document.getElementById("loginEmail").value;
    const userPassword = document.getElementById("loginPassword").value;
    const errorMessage = document.getElementById("loginFailed");
    errorMessage.style.display = "none";

    // const user = users.find(u => u.email === userEmail); //old
    const user = window.db.accounts.find(u => u.email === userEmail && u.password === userPassword && u.verified);

    if (!user) {
        errorMessage.style.display = "block";
        setTimeout(() => {    
            errorMessage.style.display = "none"; 
        }, 3000);
        return;
    }

    localStorage.setItem("auth_token", user.email);
    setAuthState(true, user);
    currentUser = user;
    document.getElementById("loginData").reset();
    window.location.hash = "#/adminMyProfile";
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    currentUser = null;
    window.location.hash = "#/welcomeSection";
}

function handleRouting() {
    const hash = window.location.hash || "#/welcomeSection";
    const pageId = hash.slice(2);  
    const page = document.getElementById(pageId);
    const adminPages = ["adminMyProfile","adminEmployee","adminAccounts","adminDepartment","adminRequest"];
    const publicPages = ["welcomeSection", "registerSection", "loginSection", "verifyEmail"];

    if (adminPages.includes(pageId) && (!currentUser || !currentUser.isAdmin)) {
        window.location.hash = "#/welcomeSection";
        return;
    }
    
    if (!currentUser && !publicPages.includes(pageId)) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    if (page) page.classList.add("active");

    if (pageId === "adminMyProfile") renderProfile();

    if (pageId === "adminAccounts") renderAccountsList();


}

function signUpbtn() {
    const firstname = document.getElementById("firstNameInput");
    const lastname = document.getElementById("lastNameInput");
    const email = document.getElementById("emailInput");
    const password = document.getElementById("passwordInput");
    const displayLabel = document.getElementById("emailOut");

    const userExists = window.db.accounts.some(user => user.email === email.value);
    
    if (password.value.length < 6) {
        document.getElementById("registerFailed").innerHTML = "<strong>Password too short!</strong> Please enter at least 6 characters.";
        document.getElementById("registerFailed").style.display = "block";
        return;
    }

    if (userExists) {   
        document.getElementById("registerFailed").innerHTML = "<strong>Email already exists!</strong> Please try another...";
        document.getElementById("registerFailed").style.display = "block";
        cancelSignup();
        return;
    }

    document.getElementById("registerFailed").style.display = "none";

    window.db.accounts.push({ 
        firstname: firstname.value, 
        lastname: lastname.value, 
        email: email.value, 
        password: password.value,
        verified: false
    });
    saveToStorage();
    localStorage.setItem("unverified_email", email.value);
    document.getElementById("registerForm").reset();

    displayLabel.textContent = email.value;

    window.location.hash = "#/verifyEmail";
}

function cancelSignup(){
    document.getElementById("registerForm").reset();
}

document.getElementById("simulateVerificationBtn").addEventListener("click", function() {
    const email = localStorage.getItem("unverified_email");
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem("unverified_email");
        window.location.hash = "#/loginSection";
    }
});

function setAuthState(isAuth, user = null) {
    currentUser = isAuth ? user : null;
    document.body.classList.toggle("authenticated", isAuth);
    document.body.classList.toggle("not-authenticated", !isAuth);
    document.body.classList.toggle("is-admin", isAuth && user?.isAdmin);
}

document.addEventListener("click", function (e) {
    if (e.target.classList.contains("editProfile-btn")) {
        handleEditProfile();
    }
});

let profileEditMode = false;

function handleEditProfile() {
    const editProfileBtn = document.querySelector(".editProfile-btn");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const successBox = document.getElementById("editProfile-Success");

    if (!editProfileBtn || !profileName || !profileEmail) return;

    successBox.style.display = "none";

    if (!profileEditMode) {
        profileName.innerHTML =
            `<input type="text" class="form-control form-control-sm" id="editName" value="${profileName.textContent}">`;

        profileEmail.innerHTML =
            `<input type="email" class="form-control form-control-sm" id="editEmail" value="${profileEmail.textContent}">`;

        editProfileBtn.textContent = "Save";
        editProfileBtn.classList.remove("btn-outline-primary");
        editProfileBtn.classList.add("btn-green");

        profileEditMode = true;
    } else {
        const newName = document.getElementById("editName").value.trim();
        const newEmail = document.getElementById("editEmail").value.trim();

        if (!newName || !newEmail) return;

        const [firstName, ...lastNameParts] = newName.split(" ");
        const lastName = lastNameParts.join(" ");

        const oldEmail = currentUser.email;

        currentUser.firstname = firstName;
        currentUser.lastname = lastName;
        currentUser.email = newEmail;

        profileName.textContent = newName;
        profileEmail.textContent = newEmail;

        const index = window.db.accounts.findIndex(u => u.email === oldEmail);
        if (index !== -1) {
            window.db.accounts[index] = { ...currentUser };
        }

        saveToStorage();

        editProfileBtn.textContent = "Edit Profile";
        editProfileBtn.classList.remove("btn-green");
        editProfileBtn.classList.add("btn-outline-primary");

        successBox.style.display = "block";
        setTimeout(() => successBox.style.display = "none", 3000);

        profileEditMode = false;
    }
}

function renderProfile() {
    if (!currentUser) return;

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileRole = document.getElementById("profileRole");

    if (profileName) {
        profileName.textContent = `${currentUser.firstname} ${currentUser.lastname}`;
    }

    if (profileEmail) {
        profileEmail.textContent = currentUser.email;
    }

    if (profileRole) {
        profileRole.textContent = currentUser.isAdmin ? "Admin" : "User";
    }
}

function renderAccountsList() {
    const tbody = document.getElementById("accountTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!window.db.accounts || window.db.accounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No Accounts</td>
            </tr>
        `;
        return;
    }

    window.db.accounts.forEach(account => {
        const tr = document.createElement("tr");

        const fullName = `${account.firstname} ${account.lastname}`;
        const role = account.isAdmin ? "Admin" : "User";
        const verified = account.verified
            ? `<span class="text-success">✅</span>`
            : `<span class="text-muted">—</span>`;

        tr.innerHTML = `
            <td>${fullName}</td>
            <td>${account.email}</td>
            <td>${role}</td>
            <td class="text-center">${verified}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm edit-account" data-email="${account.email}">Edit</button>
                <button class="btn btn-outline-warning btn-sm reset-account" data-email="${account.email}">Reset PW</button>
                <button class="btn btn-outline-danger btn-sm delete-account" data-email="${account.email}">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

let editingAccountEmail = null;

document.getElementById("addAccountBtn").addEventListener("click", function () {
    editingAccountEmail = null;
    document.getElementById("accountForm").reset();
});

document.addEventListener("click", function (e) {

    if (e.target.classList.contains("delete-account")) {

        const emailToDelete = e.target.dataset.email;

        if (currentUser && currentUser.email === emailToDelete) {
            alert("You cannot delete your own account.");
            return;
        }

        const confirmDelete = confirm("Are you sure you want to delete this account?");
        if (!confirmDelete) return;

        window.db.accounts = window.db.accounts.filter(acc => acc.email !== emailToDelete);

        saveToStorage();
        renderAccountsList();
    }

    if (e.target.classList.contains("reset-account")) {

        const email = e.target.dataset.email;
        const account = window.db.accounts.find(acc => acc.email === email);
        if (!account) return;

        const newPassword = prompt("Enter new password (min 6 characters):");

        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        account.password = newPassword;

        saveToStorage();
        alert("Password reset successfully.");
    }

    if (e.target.classList.contains("edit-account")) {

        const email = e.target.dataset.email;
        const account = window.db.accounts.find(acc => acc.email === email);
        if (!account) return;

        editingAccountEmail = email;

        document.getElementById("firstName").value = account.firstname;
        document.getElementById("lastName").value = account.lastname;
        document.getElementById("accountEmail").value = account.email;
        document.getElementById("accountPassword").value = account.password;
        document.getElementById("accountRole").value = account.isAdmin ? "Admin" : "User";
        document.getElementById("isVerified").checked = account.verified;
    }

});

document.getElementById("accountForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("accountEmail").value.trim();
    const password = document.getElementById("accountPassword").value.trim();
    const role = document.getElementById("accountRole").value.trim();
    const verified = document.getElementById("isVerified").checked;

    if (!firstName || !lastName || !email || !password) {
        alert("All fields are required.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    const isAdmin = role.toLowerCase() === "admin";

    // 🟡 EDIT MODE
    if (editingAccountEmail) {

        const account = window.db.accounts.find(acc => acc.email === editingAccountEmail);
        if (!account) return;

        account.firstname = firstName;
        account.lastname = lastName;
        account.email = email;
        account.password = password;
        account.isAdmin = isAdmin;
        account.verified = verified;

        // If editing yourself, update currentUser
        if (currentUser.email === editingAccountEmail) {
            currentUser = account;
            localStorage.setItem("auth_token", account.email);
        }

    } else {
        // 🟢 ADD MODE

        const exists = window.db.accounts.some(acc => acc.email === email);
        if (exists) {
            alert("Email already exists.");
            return;
        }

        window.db.accounts.push({
            firstname: firstName,
            lastname: lastName,
            email,
            password,
            isAdmin,
            verified
        });
    }

    saveToStorage();
    renderAccountsList();

    editingAccountEmail = null;
    document.getElementById("accountForm").reset();
});



