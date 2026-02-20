let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';
loadFromStorage();
let editingAccountEmail = null;

const token = localStorage.getItem("auth_token");
if (token) {
    currentUser = window.db.accounts.find(u => u.email === token);
    if (currentUser) setAuthState(true, currentUser);
}

window.addEventListener("hashchange", handleRouting);
window.addEventListener("load", handleRouting); 
function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data || !data.accounts || !data.departments) throw "missing data";

        window.db = data;
    } catch (err) {
        window.db = {
            accounts: [
                { firstname: "Admin", lastname: "User", email: "admin@example.com", password: "Password123!", verified: true, isAdmin: true },
                { firstname: "Ninoralf", lastname: "Dela Cruz", email: "admin", password: "admin", verified: true, isAdmin: true }
            ],
            departments: [
                { name: "Engineering", description: "Software team" },
                { name: "HR", description: "Human Resources" }
            ]
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
    handleRouting();
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
    const adminPages = ["adminEmployee","adminAccounts","adminDepartment"];
    const publicPages = ["welcomeSection", "registerSection", "loginSection", "verifyEmail","adminRequest", "adminMyProfile"];

    if (adminPages.includes(pageId) && (!currentUser || !currentUser.isAdmin)) {
        window.location.hash = "#/welcomeSection";
        return;
    }
    
    if (!currentUser && !publicPages.includes(pageId)) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    if (page) page.classList.add("active");

    if (pageId === "adminMyProfile") renderProfile();

    if (pageId === "adminAccounts") renderAccountsList();

    if (pageId === "adminRequest") renderRequests();

    if(pageId === "adminEmployee") renderEmployees();

    if(pageId === "adminDepartment") renderDepartments();

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
        localStorage.setItem("auth_token", newEmail);
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
                <button class="btn btn-outline-warning btn-sm reset-account" data-email="${account.email}">Reset Password</button>
                <button class="btn btn-outline-danger btn-sm delete-account" data-email="${account.email}">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

document.getElementById("addAccountBtn").addEventListener("click", () => {
    editingAccountEmail = null;
    document.getElementById("accountForm").reset();
    document.getElementById("accountRole").value = "User";
    document.getElementById("isVerified").checked = false;
    document.getElementById("accountFormModal").classList.remove("d-none");
});


document.addEventListener("click", function (e) {

    const deleteFailed = document.getElementById("failedMSG");

    if (e.target.classList.contains("delete-account")) {

        const emailToDelete = e.target.dataset.email;

        if (currentUser && currentUser.email === emailToDelete) {
            deleteFailed.textContent = "You cannot delete your own account!";
            deleteFailed.style.display = "block";
            setTimeout(() => {
                deleteFailed.style.display = "none";
            }, 2000);
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
            deleteFailed.textContent = "Password must be atleast 6 characters!";
            deleteFailed.style.display = "block";
            setTimeout(() => {
                deleteFailed.style.display = "none";
            }, 2000);
            return;
        }

        account.password = newPassword;

        saveToStorage();
        deleteFailed.textContent = "Password Reset Successfully";
        deleteFailed.style.display = "block";
        setTimeout(() => {
            deleteFailed.style.display = "none";
        }, 2000);
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

document.addEventListener("DOMContentLoaded", () => {
    const addAccountBtn = document.getElementById("addAccountBtn"); // the button that opens the modal
    const cancelAccountBtn = document.getElementById("cancelAccount");
    const accountFormModal = document.getElementById("accountFormModal");
    const accountForm = document.getElementById("accountForm");

    addAccountBtn.addEventListener("click", () => {
        clearAccountForm();
        accountFormModal.classList.remove("d-none");
    });

    cancelAccountBtn.addEventListener("click", () => {
        accountFormModal.classList.add("d-none");
        clearAccountForm();
    });

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

    if (editingAccountEmail) {

        const account = window.db.accounts.find(acc => acc.email === editingAccountEmail);
        if (!account) return;

        account.firstname = firstName;
        account.lastname = lastName;
        account.email = email;
        account.password = password;
        account.isAdmin = isAdmin;
        account.verified = verified;

        if (currentUser.email === editingAccountEmail) {
            currentUser = account;
            localStorage.setItem("auth_token", account.email);
        }
    } else {
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
    // Don't block wiring if not logged in yet; just safely no-op later.
    // (currentUser can be set after login without reload in your app)
    window.db.requests = window.db.requests || [];

    const newRequestBtnHeader = document.getElementById("newRequestBtnHeader");
    const createOneBtn = document.getElementById("createOneBtn");
    const modalEl = document.getElementById("newRequestModal");
    const newRequestModal = modalEl ? new bootstrap.Modal(modalEl) : null;

    const itemsWrapper = document.getElementById("itemsWrapper");
    const addItemBtn = document.getElementById("addItemBtn");
    const submitRequestBtn = document.getElementById("submitRequestBtn");

    const requestsTableWrapper = document.getElementById("requestsTableWrapper");
    const requestsTableBody = document.querySelector("#requestsTable tbody");
    const emptyRequestsState = document.getElementById("emptyRequestsState");

    if (!itemsWrapper || !addItemBtn || !submitRequestBtn || !requestsTableWrapper || !requestsTableBody || !emptyRequestsState) {
        return; // request UI not present on this page
    }

    // ---------- Modal helpers ----------
    function createItemRow(name = "", qty = 1) {
        const div = document.createElement("div");
        div.classList.add("item-row", "d-flex", "mb-2", "align-items-center");
        div.innerHTML = `
            <input type="text" class="form-control me-2 item-name" placeholder="Item name" value="${escapeHtml(name)}">
            <input type="number" class="form-control me-2 item-qty" placeholder="Quantity" min="1" value="${qty}">
            <button type="button" class="btn btn-danger btn-sm remove-item">×</button>
        `;
        div.querySelector(".remove-item").addEventListener("click", () => div.remove());
        return div;
    }

    function clearModal() {
        const typeEl = document.getElementById("requestType");
        if (typeEl) typeEl.value = "Equipment";
        itemsWrapper.innerHTML = "";
        itemsWrapper.appendChild(createItemRow());
    }

    function openModal() {
        if (!currentUser) {
            alert("Please login first.");
            return;
        }
        clearModal();
        newRequestModal?.show();
    }

    newRequestBtnHeader?.addEventListener("click", openModal);
    createOneBtn?.addEventListener("click", openModal);

    addItemBtn.addEventListener("click", () => {
        itemsWrapper.appendChild(createItemRow());
    });

    // ---------- Create request ----------
    submitRequestBtn.addEventListener("click", () => {
        if (!currentUser) {
            alert("Please login first.");
            return;
        }

        const type = document.getElementById("requestType")?.value || "Equipment";
        const itemRows = Array.from(itemsWrapper.querySelectorAll(".item-row"));

        const items = itemRows
            .map(row => {
                const name = row.querySelector(".item-name")?.value?.trim();
                const qty = parseInt(row.querySelector(".item-qty")?.value, 10);
                if (!name || !qty || qty < 1) return null;
                return { name, qty };
            })
            .filter(Boolean);

        if (items.length === 0) {
            alert("Please add at least one valid item.");
            return;
        }

        const newRequest = {
            id: (crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`),
            type,
            items,
            status: "Pending",
            date: new Date().toISOString(),
            employeeEmail: currentUser.email
        };

        window.db.requests.push(newRequest);
        saveToStorage();

        newRequestModal?.hide();
        renderRequests();
    });

    // ---------- Admin actions (Approve/Reject/Delete) ----------
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-req-action][data-req-id]");
        if (!btn) return;

        if (!currentUser?.isAdmin) return; // only admin can use actions

        const id = btn.dataset.reqId;
        const action = btn.dataset.reqAction;

        const req = window.db.requests.find(r => r.id === id);
        if (!req) return;

        if (action === "approve") req.status = "Approved";
        if (action === "reject") req.status = "Rejected";
        if (action === "delete") {
            if (!confirm("Delete this request?")) return;
            window.db.requests = window.db.requests.filter(r => r.id !== id);
        }

        saveToStorage();
        renderRequests();
    });

    // Helper to prevent HTML injection in table and modal fields
    function escapeHtml(str) {
        return String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // NOTE: do NOT call renderRequests() here unless your currentUser is already set at load time.
    // Your routing can call renderRequests() when entering the request page.
});

function renderRequests() {
    if (!currentUser) return;

    window.db.requests = window.db.requests || [];

    // grab DOM elements INSIDE the function (so it's not relying on closure vars)
    const requestsTableWrapper = document.getElementById("requestsTableWrapper");
    const requestsTableBody = document.querySelector("#requestsTable tbody");
    const emptyRequestsState = document.getElementById("emptyRequestsState");

    if (!requestsTableWrapper || !requestsTableBody || !emptyRequestsState) return;

    const escapeHtml = (str) =>
        String(str ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    const visibleRequests = currentUser.isAdmin
        ? window.db.requests
        : window.db.requests.filter(r => r.employeeEmail === currentUser.email);

    if (visibleRequests.length === 0) {
        emptyRequestsState.style.display = "block";
        requestsTableWrapper.style.display = "none";
        return;
    }

    emptyRequestsState.style.display = "none";
    requestsTableWrapper.style.display = "block";
    requestsTableBody.innerHTML = "";

    visibleRequests.forEach(r => {
        const itemsText = (r.items || []).map(i => `${i.name} (${i.qty})`).join(", ");
        const statusClass = {
            Pending: "bg-warning text-dark",
            Approved: "bg-success text-white",
            Rejected: "bg-danger text-white"
        }[r.status] || "bg-secondary text-white";

        const actionsHtml = currentUser.isAdmin
            ? `
                <button class="btn btn-sm btn-success" data-req-action="approve" data-req-id="${r.id}">Approve</button>
                <button class="btn btn-sm btn-danger" data-req-action="reject" data-req-id="${r.id}">Reject</button>
                <button class="btn btn-sm btn-outline-secondary" data-req-action="delete" data-req-id="${r.id}">Delete</button>
              `
            : "";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td>${escapeHtml(r.type)}</td>
            <td>${escapeHtml(itemsText)}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(r.status)}</span></td>
            <td>${actionsHtml}</td>
        `;
        requestsTableBody.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    
    const addEmployeeBtn = document.getElementById("addEmployeeBtn");
    const employeeFormModal = document.getElementById("employeeFormModal");
    const cancelEmployeeBtn = document.getElementById("cancelEmployee");
    const employeeTableBody = document.getElementById("employeeTableBody");
    const noEmployeesRow = document.getElementById("noEmployeesRow");

    const employeeIdInput = document.getElementById("employeeId");
    const employeeEmailInput = document.getElementById("employeeEmail");
    const employeePositionInput = document.getElementById("employeePosition");
    const employeeDeptInput = document.getElementById("employeeDept");
    const employeeHireDateInput = document.getElementById("employeeHireDate");

    window.db.employees = window.db.employees || [];

    let editingIndex = null; 

    addEmployeeBtn.addEventListener("click", () => {
        clearForm();
        employeeFormModal.classList.remove("d-none");
        editingIndex = null;
    });

    cancelEmployeeBtn.addEventListener("click", () => {
        employeeFormModal.classList.add("d-none");
        clearForm();
    });

    employeeFormModal.addEventListener("click", (e) => {
        if (e.target === employeeFormModal) {
            employeeFormModal.classList.add("d-none");
            clearForm();
        }
    });


    const employeeForm = document.getElementById("employeeForm");
    employeeForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const newEmployee = {
            id: employeeIdInput.value.trim(),
            email: employeeEmailInput.value.trim(),
            position: employeePositionInput.value.trim(),
            department: employeeDeptInput.value.trim(),
            hireDate: employeeHireDateInput.value
        };

        if (!newEmployee.id || !newEmployee.email || !newEmployee.position || !newEmployee.department) {
            alert("Please fill out all required fields.");
            return;
        }

        if (editingIndex !== null) {
            window.db.employees[editingIndex] = newEmployee;
        } else {
            window.db.employees.push(newEmployee);
        }

        saveToStorage();
        renderEmployees();
        employeeFormModal.classList.add("d-none");
        clearForm();
    });

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

            row.querySelector(".edit-employee").addEventListener("click", () => {
                populateForm(emp);
                employeeFormModal.classList.remove("d-none");
                editingIndex = index;
            });

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

    function clearForm() {
        employeeIdInput.value = "";
        employeeEmailInput.value = "";
        employeePositionInput.value = "";
        employeeDeptInput.value = "Engineering";
        employeeHireDateInput.value = "";
    }

    function populateForm(emp) {
        employeeIdInput.value = emp.id;
        employeeEmailInput.value = emp.email;
        employeePositionInput.value = emp.position;
        employeeDeptInput.value = emp.department;
        employeeHireDateInput.value = emp.hireDate;
    }

    renderEmployees();
});


if (!window.db.departments) {
    window.db.departments = [];
}

let editingDepartmentName = null;

const addDepartmentBtn = document.getElementById("addDepartmentBtn");
const departmentModal = document.getElementById("departmentFormModal");
const departmentForm = document.getElementById("departmentForm");
const departmentTableBody = document.getElementById("departmentTableBody");
const cancelDepartmentBtn = document.getElementById("cancelDepartment");

addDepartmentBtn.addEventListener("click", () => {
    editingDepartmentName = null;
    departmentForm.reset();
    departmentModal.classList.remove("d-none");
});

cancelDepartmentBtn.addEventListener("click", () => {
    departmentModal.classList.add("d-none");
});

departmentModal.addEventListener("click", (e) => {
    if (e.target === departmentModal) {
        departmentModal.classList.add("d-none");
    }
});

// Save Department
departmentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("deptName").value.trim();
    const description = document.getElementById("deptDescription").value.trim();

    if (!name) {
        alert("Department name required!");
        return;
    }

    if (editingDepartmentName) {
        const dept = window.db.departments.find(d => d.name === editingDepartmentName);
        if (!dept) return;   

        dept.name = name;
        dept.description = description;
    } else {    
        window.db.departments.push({ name, description });
    }

    departmentModal.classList.add("d-none");
    renderDepartments();

    editingDepartmentName = null;
    departmentForm.reset();
});

function renderDepartments() {
    departmentTableBody.innerHTML = "";

    if (window.db.departments.length === 0) {
        departmentTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No Department</td>
            </tr>
        `;
        return;
    }

    window.db.departments.forEach(dept => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1 edit-dept" data-name="${dept.name}">Edit</button>
                <button class="btn btn-outline-danger btn-sm delete-dept" data-name="${dept.name}">Delete</button>
            </td>
        `;

        departmentTableBody.appendChild(row);
    });
}

document.addEventListener("click", (e) => {

    // EDIT
    if (e.target.classList.contains("edit-dept")) {
        const name = e.target.dataset.name;
        const dept = window.db.departments.find(d => d.name === name);
        if (!dept) return;
        editingDepartmentName = name;

        document.getElementById("deptName").value = dept.name;
        document.getElementById("deptDescription").value = dept.description;

        departmentModal.classList.remove("d-none");
    }

    // DELETE
    if (e.target.classList.contains("delete-dept")) {
        const name = e.target.dataset.name;

        if (confirm("Delete this department?")) {
            window.db.departments =
                window.db.departments.filter(d => d.name !== name);

            renderDepartments();
        }
    }
});
