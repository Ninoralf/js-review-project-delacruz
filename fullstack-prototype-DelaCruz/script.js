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

    const user = window.db.accounts.find(u => u.email === userEmail && u.password === userPassword);

    if (!user) {
        errorMessage.style.display = "block";
        setTimeout(() => {    
            errorMessage.style.display = "none"; 
        }, 3000);
        return;
    }

    if (!user.verified) {
        errorMessage.classList.remove("d-none");
        errorMessage.textContent = "Account not verified yet";
        localStorage.setItem("unverified_email", user.email);
        window.location.hash = "#/verifyEmail";
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

    if (pageId === "adminRequest") renderRequests();
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

document.getElementById("addAccountBtn").addEventListener("click", () => {
    editingAccountEmail = null;
    document.getElementById("accountForm").reset();
    document.getElementById("accountRole").value = "User";
    document.getElementById("isVerified").checked = false;
    document.getElementById("accountFormModal").classList.remove("d-none");
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

        document.getElementById("accountFormModal").classList.remove("d-none");
    }

});

accountForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const firstname = document.getElementById("firstName").value.trim();
    const lastname = document.getElementById("lastName").value.trim();
    const email = document.getElementById("accountEmail").value.trim();
    const password = document.getElementById("accountPassword").value.trim();
    const role = document.getElementById("accountRole").value;
    const verified = document.getElementById("isVerified").checked;

    if (!firstname || !lastname || !email || !password) {
        alert("Please fill out all required fields.");
        return;
    }

    if (editingAccountEmail) {
        // EDIT EXISTING ACCOUNT
        const account = window.db.accounts.find(acc => acc.email === editingAccountEmail);
        if (!account) return;

        account.firstname = firstname;
        account.lastname = lastname;
        account.email = email;
        account.password = password;
        account.isAdmin = role.toLowerCase() === "admin";
        account.verified = verified;

        editingAccountEmail = null;
    } else {
        // ADD NEW ACCOUNT
        const exists = window.db.accounts.some(acc => acc.email === email);
        if (exists) {
            alert("An account with this email already exists.");
            return;
        }

        window.db.accounts.push({
            firstname,
            lastname,
            email,
            password,
            isAdmin: role.toLowerCase() === "admin",
            verified
        });
    }

    saveToStorage();
    renderAccountsList();

    // CLOSE MODAL
    accountFormModal.classList.add("d-none");
    accountForm.reset();
    document.getElementById("accountRole").value = "User";
    document.getElementById("isVerified").checked = false;
});

document.addEventListener("DOMContentLoaded", () => {
    const addAccountBtn = document.getElementById("addAccountBtn"); // the button that opens the modal
    const cancelAccountBtn = document.getElementById("cancelAccount");
    const accountFormModal = document.getElementById("accountFormModal");
    const accountForm = document.getElementById("accountForm");

    // Open modal
    addAccountBtn.addEventListener("click", () => {
        clearAccountForm();
        accountFormModal.classList.remove("d-none");
    });

    // Close modal
    cancelAccountBtn.addEventListener("click", () => {
        accountFormModal.classList.add("d-none");
        clearAccountForm();
    });

    // Click outside to close
    accountFormModal.addEventListener("click", (e) => {
        if (e.target === accountFormModal) {
            accountFormModal.classList.add("d-none");
            clearAccountForm();
        }
    });

    function clearAccountForm() {
        accountForm.reset();
        document.getElementById("accountRole").value = "User";
        document.getElementById("isVerified").checked = false;
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

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) return; 
    let requests = window.db.requests || [];

    // Elements
    const newRequestBtnHeader = document.getElementById("newRequestBtnHeader");
    const createOneBtn = document.getElementById("createOneBtn");
    const newRequestModal = new bootstrap.Modal(document.getElementById("newRequestModal"));
    const itemsWrapper = document.getElementById("itemsWrapper");
    const addItemBtn = document.getElementById("addItemBtn");
    const submitRequestBtn = document.getElementById("submitRequestBtn");
    const requestsTableWrapper = document.getElementById("requestsTableWrapper");
    const requestsTableBody = document.querySelector("#requestsTable tbody");
    const emptyRequestsState = document.getElementById("emptyRequestsState");

    // Open modal buttons
    newRequestBtnHeader.addEventListener("click", () => openModal());
    createOneBtn.addEventListener("click", () => openModal());

    function openModal() {
        clearModal();
        newRequestModal.show();
    }

    // Add new item row
    addItemBtn.addEventListener("click", () => {
        const row = createItemRow();
        itemsWrapper.appendChild(row);
    });

    // Create a new item row element
    function createItemRow(name = "", qty = "") {
        const div = document.createElement("div");
        div.classList.add("item-row", "d-flex", "mb-2", "align-items-center");
        div.innerHTML = `
            <input type="text" class="form-control me-2 item-name" placeholder="Item name" value="${name}">
            <input type="number" class="form-control me-2 item-qty" placeholder="Quantity" min="1" value="${qty}">
            <button type="button" class="btn btn-danger btn-sm remove-item">×</button>
        `;
        div.querySelector(".remove-item").addEventListener("click", () => div.remove());
        return div;
    }

    // Clear modal fields
    function clearModal() {
        document.getElementById("requestType").value = "Equipment";
        itemsWrapper.innerHTML = "";
        itemsWrapper.appendChild(createItemRow());
    }

    // Submit request
    submitRequestBtn.addEventListener("click", () => {
        const type = document.getElementById("requestType").value;
        const itemRows = Array.from(itemsWrapper.querySelectorAll(".item-row"));

        const items = itemRows
            .map(row => {
                const name = row.querySelector(".item-name").value.trim();
                const qty = parseInt(row.querySelector(".item-qty").value);
                if (!name || !qty || qty < 1) return null;
                return { name, qty };
            })
            .filter(Boolean);

        if (items.length === 0) {
            alert("Please add at least one valid item.");
            return;
        }

        const newRequest = {
            type,
            items,
            status: "Pending",
            date: new Date().toISOString(),
            employeeEmail: currentUser.email
        };

        requests.push(newRequest);
        localStorage.setItem("requests", JSON.stringify(requests));
        newRequestModal.hide();
        renderRequests();
    });

    // Render requests table
    function renderRequests() {
        const userRequests = requests.filter(r => r.employeeEmail === currentUser.email);

        if (userRequests.length === 0) {
            emptyRequestsState.style.display = "block";
            requestsTableWrapper.style.display = "none";
            return;
        }

        emptyRequestsState.style.display = "none";
        requestsTableWrapper.style.display = "block";

        requestsTableBody.innerHTML = "";
        userRequests.forEach(r => {
            const itemsText = r.items.map(i => `${i.name} (${i.qty})`).join(", ");
            const statusClass = {
                "Pending": "bg-warning text-dark",
                "Approved": "bg-success text-white",
                "Rejected": "bg-danger text-white"
            }[r.status] || "bg-secondary";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>${r.type}</td>
                <td>${itemsText}</td>
                <td><span class="badge ${statusClass}">${r.status}</span></td>
                <td>
                    <!-- Optional: add edit/delete buttons here -->
                </td>
            `;
            requestsTableBody.appendChild(row);
        });
    }

    // Initial render
    renderRequests();
});

document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const addEmployeeBtn = document.getElementById("addEmployeeBtn");
    const employeeFormModal = document.getElementById("employeeFormModal");
    const cancelEmployeeBtn = document.getElementById("cancelEmployee");
    const employeeTableBody = document.getElementById("employeeTableBody");
    const noEmployeesRow = document.getElementById("noEmployeesRow");

    // Form inputs
    const employeeIdInput = document.getElementById("employeeId");
    const employeeEmailInput = document.getElementById("employeeEmail");
    const employeePositionInput = document.getElementById("employeePosition");
    const employeeDeptInput = document.getElementById("employeeDept");
    const employeeHireDateInput = document.getElementById("employeeHireDate");

    // Initialize employees array in window.db if missing
    window.db.employees = window.db.employees || [];

    let editingIndex = null; // null means adding new employee

    // Show form
    addEmployeeBtn.addEventListener("click", () => {
        clearForm();
        employeeFormModal.classList.remove("d-none");
        editingIndex = null;
    });

    // Cancel button
    cancelEmployeeBtn.addEventListener("click", () => {
        employeeFormModal.classList.add("d-none");
        clearForm();
    });

    // Submit form
    employeeFormModal.addEventListener("submit", (e) => {
        e.preventDefault();

        const newEmployee = {
            id: employeeIdInput.value.trim(),
            email: employeeEmailInput.value.trim(),
            position: employeePositionInput.value.trim(),
            department: employeeDeptInput.value.trim(),
            hireDate: employeeHireDateInput.value
        };

        // Basic validation
        if (!newEmployee.id || !newEmployee.email || !newEmployee.position || !newEmployee.department) {
            alert("Please fill out all required fields.");
            return;
        }

        if (editingIndex !== null) {
            // Update existing employee
            window.db.employees[editingIndex] = newEmployee;
        } else {
            // Add new employee
            window.db.employees.push(newEmployee);
        }

        saveToStorage();
        renderEmployees();
        employeeFormModal.classList.add("d-none");
        clearForm();
    });

    // Render employee table
    function renderEmployees() {
        employeeTableBody.innerHTML = "";

        if (window.db.employees.length === 0) {
            employeeTableBody.appendChild(noEmployeesRow);
            return;
        }

        window.db.employees.forEach((emp, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${emp.id}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${emp.department}</td>
                <td>
                    <button class="btn btn-sm btn-green edit-employee">Edit</button>
                    <button class="btn btn-sm btn-red delete-employee">Delete</button>
                </td>
            `;

            // Edit button
            row.querySelector(".edit-employee").addEventListener("click", () => {
                populateForm(emp);
                employeeFormModal.classList.remove("d-none");
                editingIndex = index;
            });

            // Delete button
            row.querySelector(".delete-employee").addEventListener("click", () => {
                if (confirm(`Are you sure you want to delete employee ${emp.email}?`)) {
                    window.db.employees.splice(index, 1);
                    saveToStorage();
                    renderEmployees();
                }
            });

            employeeTableBody.appendChild(row);
        });
    }

    // Clear form fields
    function clearForm() {
        employeeIdInput.value = "";
        employeeEmailInput.value = "";
        employeePositionInput.value = "";
        employeeDeptInput.value = "Engineering";
        employeeHireDateInput.value = "";
    }

    // Populate form for editing
    function populateForm(emp) {
        employeeIdInput.value = emp.id;
        employeeEmailInput.value = emp.email;
        employeePositionInput.value = emp.position;
        employeeDeptInput.value = emp.department;
        employeeHireDateInput.value = emp.hireDate;
    }

    // Initial render
    renderEmployees();
});
