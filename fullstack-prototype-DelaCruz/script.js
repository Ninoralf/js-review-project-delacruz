const API_BASE_URL = "http://localhost:3000/api";
const AUTH_TOKEN_KEY = "auth_token";
const PENDING_EMAIL_KEY = "pending_verification_email";
const PUBLIC_PAGES = ["welcomeSection", "registerSection", "loginSection", "verifyEmail"];
const AUTH_PAGES = ["adminMyProfile", "adminRequest"];
const ADMIN_PAGES = ["adminEmployee", "adminAccounts", "adminDepartment"];

let currentUser = null;
let editingAccountEmail = null;
let editingDepartmentName = null;
let profileEditMode = false;
let editingEmployeeId = null;
let requestModal = null;

window.db = {
    accounts: [],
    departments: [],
    requests: [],
    employees: []
};

initializeApplication();

async function initializeApplication() {
    bindGlobalEvents();
    bindAuthEvents();
    bindProfileEvents();
    bindAccountEvents();
    bindRequestEvents();
    bindEmployeeEvents();
    bindDepartmentEvents();
    await restoreSession();
    handleRouting();
}

function bindGlobalEvents() {
    window.addEventListener("hashchange", handleRouting);
    window.addEventListener("load", handleRouting);
    document.addEventListener("click", handleDocumentClick);
}

function bindAuthEvents() {
    const simulateVerificationBtn = document.getElementById("simulateVerificationBtn");
    if (simulateVerificationBtn) {
        simulateVerificationBtn.addEventListener("click", verifyPendingAccount);
    }
}

function bindProfileEvents() {
    const editProfileBtn = document.querySelector(".editProfile-btn");
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", handleEditProfile);
    }
}

function bindAccountEvents() {
    const addAccountBtn = document.getElementById("addAccountBtn");
    const cancelAccountBtn = document.getElementById("cancelAccount");
    const accountFormModal = document.getElementById("accountFormModal");
    const accountForm = document.getElementById("accountForm");

    if (addAccountBtn) {
        addAccountBtn.addEventListener("click", openAccountModalForCreate);
    }

    if (cancelAccountBtn) {
        cancelAccountBtn.addEventListener("click", closeAccountModal);
    }

    if (accountFormModal) {
        accountFormModal.addEventListener("click", event => {
            if (event.target === accountFormModal) {
                closeAccountModal();
            }
        });
    }

    if (accountForm) {
        accountForm.addEventListener("submit", submitAccountForm);
    }
}

function bindRequestEvents() {
    const modalElement = document.getElementById("newRequestModal");
    requestModal = modalElement && window.bootstrap ? new bootstrap.Modal(modalElement) : null;

    const newRequestBtnHeader = document.getElementById("newRequestBtnHeader");
    const createOneBtn = document.getElementById("createOneBtn");
    const addItemBtn = document.getElementById("addItemBtn");
    const submitRequestBtn = document.getElementById("submitRequestBtn");

    if (newRequestBtnHeader) {
        newRequestBtnHeader.addEventListener("click", openRequestModal);
    }

    if (createOneBtn) {
        createOneBtn.addEventListener("click", openRequestModal);
    }

    if (addItemBtn) {
        addItemBtn.addEventListener("click", () => {
            const itemsWrapper = document.getElementById("itemsWrapper");
            if (itemsWrapper) {
                itemsWrapper.appendChild(createRequestItemRow());
            }
        });
    }

    if (submitRequestBtn) {
        submitRequestBtn.addEventListener("click", submitRequest);
    }
}

function bindEmployeeEvents() {
    const addEmployeeBtn = document.getElementById("addEmployeeBtn");
    const cancelEmployeeBtn = document.getElementById("cancelEmployee");
    const employeeFormModal = document.getElementById("employeeFormModal");
    const employeeForm = document.getElementById("employeeForm");

    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener("click", openEmployeeModalForCreate);
    }

    if (cancelEmployeeBtn) {
        cancelEmployeeBtn.addEventListener("click", closeEmployeeModal);
    }

    if (employeeFormModal) {
        employeeFormModal.addEventListener("click", event => {
            if (event.target === employeeFormModal) {
                closeEmployeeModal();
            }
        });
    }

    if (employeeForm) {
        employeeForm.addEventListener("submit", submitEmployeeForm);
    }
}

function bindDepartmentEvents() {
    const addDepartmentBtn = document.getElementById("addDepartmentBtn");
    const cancelDepartmentBtn = document.getElementById("cancelDepartment");
    const departmentModal = document.getElementById("departmentFormModal");
    const departmentForm = document.getElementById("departmentForm");

    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener("click", openDepartmentModalForCreate);
    }

    if (cancelDepartmentBtn) {
        cancelDepartmentBtn.addEventListener("click", closeDepartmentModal);
    }

    if (departmentModal) {
        departmentModal.addEventListener("click", event => {
            if (event.target === departmentModal) {
                closeDepartmentModal();
            }
        });
    }

    if (departmentForm) {
        departmentForm.addEventListener("submit", submitDepartmentForm);
    }
}

async function restoreSession() {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        setAuthState(false);
        return;
    }

    try {
        const response = await apiFetch("/profile");
        setAuthState(true, mapApiUserToUiUser(response.user));
        await refreshAppData();
    } catch (error) {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        setAuthState(false);
    }
}

function handleRouting() {
    const hash = window.location.hash || "#/welcomeSection";
    const pageId = hash.slice(2);
    const page = document.getElementById(pageId);

    if (ADMIN_PAGES.includes(pageId) && (!currentUser || !currentUser.isAdmin)) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    if (AUTH_PAGES.includes(pageId) && !currentUser) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    if (!pageId || (!page && !PUBLIC_PAGES.includes(pageId) && !AUTH_PAGES.includes(pageId) && !ADMIN_PAGES.includes(pageId))) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    document.querySelectorAll(".page").forEach(section => section.classList.remove("active"));
    if (page) {
        page.classList.add("active");
    }

    if (pageId === "adminMyProfile") {
        renderProfile();
    }

    if (pageId === "adminAccounts") {
        renderAccountsList();
    }

    if (pageId === "adminRequest") {
        renderRequests();
    }

    if (pageId === "adminEmployee") {
        renderEmployees();
    }

    if (pageId === "adminDepartment") {
        renderDepartments();
    }
}

async function login() {
    const username = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const errorMessage = document.getElementById("loginFailed");

    errorMessage.style.display = "none";

    try {
        const response = await apiFetch("/login", {
            method: "POST",
            body: JSON.stringify({ username, password })
        }, false);

        sessionStorage.setItem(AUTH_TOKEN_KEY, response.token);
        setAuthState(true, mapApiUserToUiUser(response.user));
        document.getElementById("loginData").reset();
        await refreshAppData();
        window.location.hash = "#/adminMyProfile";
        handleRouting();
    } catch (error) {
        errorMessage.textContent = error.message || "Invalid email or password.";
        errorMessage.style.display = "block";
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 3000);
    }
}

function logout() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    editingAccountEmail = null;
    editingDepartmentName = null;
    editingEmployeeId = null;
    profileEditMode = false;
    window.db = {
        accounts: [],
        departments: [],
        requests: [],
        employees: []
    };
    setAuthState(false);
    window.location.hash = "#/welcomeSection";
}

async function signUpbtn() {
    const firstname = document.getElementById("firstNameInput");
    const lastname = document.getElementById("lastNameInput");
    const email = document.getElementById("emailInput");
    const password = document.getElementById("passwordInput");
    const displayLabel = document.getElementById("emailOut");
    const registerFailed = document.getElementById("registerFailed");

    if (password.value.length < 6) {
        registerFailed.innerHTML = "<strong>Password too short!</strong> Please enter at least 6 characters.";
        registerFailed.style.display = "block";
        return;
    }

    registerFailed.style.display = "none";

    try {
        await apiFetch("/register", {
            method: "POST",
            body: JSON.stringify({
                firstname: firstname.value.trim(),
                lastname: lastname.value.trim(),
                email: email.value.trim(),
                password: password.value
            })
        }, false);

        sessionStorage.setItem(PENDING_EMAIL_KEY, email.value.trim().toLowerCase());
        document.getElementById("registerForm").reset();
        displayLabel.textContent = email.value.trim();
        window.location.hash = "#/verifyEmail";
    } catch (error) {
        registerFailed.innerHTML = `<strong>Registration failed!</strong> ${escapeHtml(error.message)}`;
        registerFailed.style.display = "block";
    }
}

function cancelSignup() {
    document.getElementById("registerForm").reset();
}

async function verifyPendingAccount() {
    const email = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (!email) {
        return;
    }

    try {
        await apiFetch("/verify-email", {
            method: "POST",
            body: JSON.stringify({ email })
        }, false);
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
        window.location.hash = "#/loginSection";
    } catch (error) {
        alert(error.message || "Unable to verify account.");
    }
}

function setAuthState(isAuthenticated, user = null) {
    currentUser = isAuthenticated ? user : null;
    document.body.classList.toggle("authenticated", isAuthenticated);
    document.body.classList.toggle("not-authenticated", !isAuthenticated);
    document.body.classList.toggle("is-admin", Boolean(isAuthenticated && user?.isAdmin));

    const userMenuLabel = document.getElementById("currentUserMenuLabel");
    if (userMenuLabel) {
        userMenuLabel.textContent = isAuthenticated && user
            ? `${user.firstname || user.email}${user.isAdmin ? " (Admin)" : ""}`
            : "Account";
    }
}

async function refreshAppData() {
    if (!currentUser) {
        return;
    }

    const requestsPromise = apiFetch("/requests");
    const departmentsPromise = apiFetch("/departments");

    if (currentUser.isAdmin) {
        const [accountsResponse, employeesResponse, departmentsResponse, requestsResponse] = await Promise.all([
            apiFetch("/accounts"),
            apiFetch("/employees"),
            departmentsPromise,
            requestsPromise
        ]);

        window.db.accounts = accountsResponse.accounts;
        window.db.employees = employeesResponse.employees;
        window.db.departments = departmentsResponse.departments;
        window.db.requests = requestsResponse.requests;
        return;
    }

    const [departmentsResponse, requestsResponse] = await Promise.all([
        departmentsPromise,
        requestsPromise
    ]);

    window.db.accounts = [];
    window.db.employees = [];
    window.db.departments = departmentsResponse.departments;
    window.db.requests = requestsResponse.requests;
}

async function handleEditProfile() {
    const editProfileBtn = document.querySelector(".editProfile-btn");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const successBox = document.getElementById("editProfile-Success");

    if (!editProfileBtn || !profileName || !profileEmail || !currentUser) {
        return;
    }

    successBox.style.display = "none";

    if (!profileEditMode) {
        profileName.innerHTML = `<input type="text" class="form-control form-control-sm" id="editName" value="${escapeHtml(`${currentUser.firstname} ${currentUser.lastname}`.trim())}">`;
        profileEmail.innerHTML = `<input type="email" class="form-control form-control-sm" id="editEmail" value="${escapeHtml(currentUser.email)}">`;
        editProfileBtn.textContent = "Save";
        editProfileBtn.classList.remove("btn-outline-primary");
        editProfileBtn.classList.add("btn-green");
        profileEditMode = true;
        return;
    }

    const newName = document.getElementById("editName").value.trim();
    const newEmail = document.getElementById("editEmail").value.trim().toLowerCase();

    if (!newName || !newEmail) {
        return;
    }

    const [firstname, ...lastnameParts] = newName.split(" ");
    const lastname = lastnameParts.join(" ") || "-";

    try {
        const response = await apiFetch("/profile", {
            method: "PUT",
            body: JSON.stringify({
                firstname,
                lastname,
                email: newEmail
            })
        });

        currentUser = mapApiUserToUiUser(response.user);
        renderProfile();
        editProfileBtn.textContent = "Edit Profile";
        editProfileBtn.classList.remove("btn-green");
        editProfileBtn.classList.add("btn-outline-primary");
        successBox.style.display = "block";
        setTimeout(() => {
            successBox.style.display = "none";
        }, 3000);
        profileEditMode = false;
        setAuthState(true, currentUser);
        await refreshAppData();
    } catch (error) {
        alert(error.message || "Unable to update profile.");
    }
}

function renderProfile() {
    if (!currentUser) {
        return;
    }

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileRole = document.getElementById("profileRole");

    if (profileName) {
        profileName.textContent = `${currentUser.firstname} ${currentUser.lastname}`.trim();
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
    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    if (window.db.accounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No Accounts</td>
            </tr>
        `;
        return;
    }

    window.db.accounts.forEach(account => {
        const row = document.createElement("tr");
        const verifiedBadge = account.verified
            ? `<span class="text-success">&#10005;</span>`
            : `<span class="text-muted">-</span>`;

        row.innerHTML = `
            <td>${escapeHtml(`${account.firstname} ${account.lastname}`)}</td>
            <td>${escapeHtml(account.email)}</td>
            <td>${account.isAdmin ? "Admin" : "User"}</td>
            <td class="text-center">${verifiedBadge}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm edit-account" data-email="${escapeHtml(account.email)}">Edit</button>
                <button class="btn btn-outline-warning btn-sm reset-account" data-email="${escapeHtml(account.email)}">Reset Password</button>
                <button class="btn btn-outline-danger btn-sm delete-account" data-email="${escapeHtml(account.email)}">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function openAccountModalForCreate() {
    editingAccountEmail = null;
    clearAccountForm();
    const accountFormModal = document.getElementById("accountFormModal");
    if (accountFormModal) {
        accountFormModal.classList.remove("d-none");
    }
}

function closeAccountModal() {
    const accountFormModal = document.getElementById("accountFormModal");
    if (accountFormModal) {
        accountFormModal.classList.add("d-none");
    }
    editingAccountEmail = null;
    clearAccountForm();
}

function clearAccountForm() {
    const accountForm = document.getElementById("accountForm");
    const accountRole = document.getElementById("accountRole");
    const isVerified = document.getElementById("isVerified");

    if (accountForm) {
        accountForm.reset();
    }

    if (accountRole) {
        accountRole.value = "User";
    }

    if (isVerified) {
        isVerified.checked = false;
    }
}

async function submitAccountForm(event) {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("accountEmail").value.trim().toLowerCase();
    const password = document.getElementById("accountPassword").value.trim();
    const role = document.getElementById("accountRole").value.trim();
    const verified = document.getElementById("isVerified").checked;
    const isAdmin = role.toLowerCase() === "admin";

    if (!firstName || !lastName || !email || !password) {
        alert("All fields are required.");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    try {
        if (editingAccountEmail) {
            await apiFetch(`/accounts/${encodeURIComponent(editingAccountEmail)}`, {
                method: "PUT",
                body: JSON.stringify({
                    firstname: firstName,
                    lastname: lastName,
                    email,
                    password,
                    isAdmin,
                    verified
                })
            });
        } else {
            await apiFetch("/accounts", {
                method: "POST",
                body: JSON.stringify({
                    firstname: firstName,
                    lastname: lastName,
                    email,
                    password,
                    isAdmin,
                    verified
                })
            });
        }

        await refreshAppData();

        if (currentUser && currentUser.email === editingAccountEmail) {
            const refreshedCurrentUser = window.db.accounts.find(account => account.email === email);
            if (refreshedCurrentUser) {
                currentUser = { ...refreshedCurrentUser };
                setAuthState(true, currentUser);
            }
        }

        renderAccountsList();
        closeAccountModal();
    } catch (error) {
        alert(error.message || "Unable to save account.");
    }
}

function openAccountModalForEdit(email) {
    const account = window.db.accounts.find(user => user.email === email);
    if (!account) {
        return;
    }

    editingAccountEmail = email;
    document.getElementById("firstName").value = account.firstname;
    document.getElementById("lastName").value = account.lastname;
    document.getElementById("accountEmail").value = account.email;
    document.getElementById("accountPassword").value = "";
    document.getElementById("accountRole").value = account.isAdmin ? "Admin" : "User";
    document.getElementById("isVerified").checked = account.verified;
    document.getElementById("accountFormModal").classList.remove("d-none");
}

function createRequestItemRow(name = "", qty = 1) {
    const row = document.createElement("div");
    row.classList.add("item-row", "d-flex", "mb-2", "align-items-center");
    row.innerHTML = `
        <input type="text" class="form-control me-2 item-name" placeholder="Item name" value="${escapeHtml(name)}">
        <input type="number" class="form-control me-2 item-qty" placeholder="Quantity" min="1" value="${qty}">
        <button type="button" class="btn btn-danger btn-sm remove-item">&times;</button>
    `;
    return row;
}

function clearRequestModal() {
    const requestType = document.getElementById("requestType");
    const itemsWrapper = document.getElementById("itemsWrapper");

    if (requestType) {
        requestType.value = "Equipment";
    }

    if (itemsWrapper) {
        itemsWrapper.innerHTML = "";
        itemsWrapper.appendChild(createRequestItemRow());
    }
}

function openRequestModal() {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    clearRequestModal();
    requestModal?.show();
}

async function submitRequest() {
    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const type = document.getElementById("requestType")?.value || "Equipment";
    const itemsWrapper = document.getElementById("itemsWrapper");
    const itemRows = itemsWrapper ? Array.from(itemsWrapper.querySelectorAll(".item-row")) : [];

    const items = itemRows
        .map(row => {
            const name = row.querySelector(".item-name")?.value?.trim();
            const qty = Number.parseInt(row.querySelector(".item-qty")?.value, 10);
            if (!name || !qty || qty < 1) {
                return null;
            }
            return { name, qty };
        })
        .filter(Boolean);

    if (items.length === 0) {
        alert("Please add at least one valid item.");
        return;
    }

    try {
        await apiFetch("/requests", {
            method: "POST",
            body: JSON.stringify({ type, items })
        });
        await refreshAppData();
        requestModal?.hide();
        renderRequests();
    } catch (error) {
        alert(error.message || "Unable to submit request.");
    }
}

function renderRequests() {
    if (!currentUser) {
        return;
    }

    const requestsTableWrapper = document.getElementById("requestsTableWrapper");
    const requestsTableBody = document.querySelector("#requestsTable tbody");
    const emptyRequestsState = document.getElementById("emptyRequestsState");

    if (!requestsTableWrapper || !requestsTableBody || !emptyRequestsState) {
        return;
    }

    if (window.db.requests.length === 0) {
        emptyRequestsState.style.display = "block";
        requestsTableWrapper.style.display = "none";
        return;
    }

    emptyRequestsState.style.display = "none";
    requestsTableWrapper.style.display = "block";
    requestsTableBody.innerHTML = "";

    window.db.requests.forEach(request => {
        const row = document.createElement("tr");
        const itemsText = (request.items || [])
            .map(item => `${item.name} (${item.qty})`)
            .join(", ");

        const statusClass = {
            Pending: "bg-warning text-dark",
            Approved: "bg-success text-white",
            Rejected: "bg-danger text-white"
        }[request.status] || "bg-secondary text-white";

        const actionsHtml = currentUser.isAdmin
            ? `
                <button class="btn btn-sm btn-success" data-req-action="approve" data-req-id="${request.id}">Approve</button>
                <button class="btn btn-sm btn-danger" data-req-action="reject" data-req-id="${request.id}">Reject</button>
                <button class="btn btn-sm btn-outline-secondary" data-req-action="delete" data-req-id="${request.id}">Delete</button>
            `
            : "";

        row.innerHTML = `
            <td>${new Date(request.date).toLocaleDateString()}</td>
            <td>${escapeHtml(request.type)}</td>
            <td>${escapeHtml(itemsText)}</td>
            <td><span class="badge ${statusClass}">${escapeHtml(request.status)}</span></td>
            <td>${actionsHtml}</td>
        `;

        requestsTableBody.appendChild(row);
    });
}

function openEmployeeModalForCreate() {
    editingEmployeeId = null;
    clearEmployeeForm();
    const employeeFormModal = document.getElementById("employeeFormModal");
    if (employeeFormModal) {
        employeeFormModal.classList.remove("d-none");
    }
}

function closeEmployeeModal() {
    const employeeFormModal = document.getElementById("employeeFormModal");
    if (employeeFormModal) {
        employeeFormModal.classList.add("d-none");
    }
    editingEmployeeId = null;
    clearEmployeeForm();
}

function clearEmployeeForm() {
    const employeeForm = document.getElementById("employeeForm");
    const employeeDeptInput = document.getElementById("employeeDept");

    if (employeeForm) {
        employeeForm.reset();
    }

    if (employeeDeptInput) {
        employeeDeptInput.value = "Engineering";
    }
}

async function submitEmployeeForm(event) {
    event.preventDefault();

    const employee = {
        id: document.getElementById("employeeId").value.trim(),
        email: document.getElementById("employeeEmail").value.trim().toLowerCase(),
        position: document.getElementById("employeePosition").value.trim(),
        department: document.getElementById("employeeDept").value.trim(),
        hireDate: document.getElementById("employeeHireDate").value
    };

    if (!employee.id || !employee.email || !employee.position || !employee.department) {
        alert("Please fill out all required fields.");
        return;
    }

    try {
        if (editingEmployeeId) {
            await apiFetch(`/employees/${encodeURIComponent(editingEmployeeId)}`, {
                method: "PUT",
                body: JSON.stringify(employee)
            });
        } else {
            await apiFetch("/employees", {
                method: "POST",
                body: JSON.stringify(employee)
            });
        }

        await refreshAppData();
        renderEmployees();
        closeEmployeeModal();
    } catch (error) {
        alert(error.message || "Unable to save employee.");
    }
}

function renderEmployees() {
    const employeeTableBody = document.getElementById("employeeTableBody");
    const noEmployeesRow = document.getElementById("noEmployeesRow");

    if (!employeeTableBody || !noEmployeesRow) {
        return;
    }

    employeeTableBody.innerHTML = "";

    if (window.db.employees.length === 0) {
        employeeTableBody.appendChild(noEmployeesRow);
        return;
    }

    window.db.employees.forEach(employee => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(employee.id)}</td>
            <td>${escapeHtml(employee.email)}</td>
            <td>${escapeHtml(employee.position)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>
                <button class="btn btn-sm btn-green edit-employee" data-id="${escapeHtml(employee.id)}">Edit</button>
                <button class="btn btn-sm btn-red delete-employee" data-id="${escapeHtml(employee.id)}">Delete</button>
            </td>
        `;
        employeeTableBody.appendChild(row);
    });
}

function openEmployeeModalForEdit(employeeId) {
    const employee = window.db.employees.find(item => item.id === employeeId);
    if (!employee) {
        return;
    }

    editingEmployeeId = employee.id;
    document.getElementById("employeeId").value = employee.id;
    document.getElementById("employeeEmail").value = employee.email;
    document.getElementById("employeePosition").value = employee.position;
    document.getElementById("employeeDept").value = employee.department;
    document.getElementById("employeeHireDate").value = employee.hireDate;
    document.getElementById("employeeFormModal").classList.remove("d-none");
}

function openDepartmentModalForCreate() {
    editingDepartmentName = null;
    const departmentForm = document.getElementById("departmentForm");
    const departmentModal = document.getElementById("departmentFormModal");

    if (departmentForm) {
        departmentForm.reset();
    }

    if (departmentModal) {
        departmentModal.classList.remove("d-none");
    }
}

function closeDepartmentModal() {
    const departmentModal = document.getElementById("departmentFormModal");
    if (departmentModal) {
        departmentModal.classList.add("d-none");
    }
}

async function submitDepartmentForm(event) {
    event.preventDefault();

    const name = document.getElementById("deptName").value.trim();
    const description = document.getElementById("deptDescription").value.trim();

    if (!name) {
        alert("Department name required!");
        return;
    }

    try {
        if (editingDepartmentName) {
            await apiFetch(`/departments/${encodeURIComponent(editingDepartmentName)}`, {
                method: "PUT",
                body: JSON.stringify({ name, description })
            });
        } else {
            await apiFetch("/departments", {
                method: "POST",
                body: JSON.stringify({ name, description })
            });
        }

        await refreshAppData();
        renderDepartments();
        editingDepartmentName = null;
        document.getElementById("departmentForm").reset();
        closeDepartmentModal();
    } catch (error) {
        alert(error.message || "Unable to save department.");
    }
}

function renderDepartments() {
    const departmentTableBody = document.getElementById("departmentTableBody");
    if (!departmentTableBody) {
        return;
    }

    departmentTableBody.innerHTML = "";

    if (window.db.departments.length === 0) {
        departmentTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">No Department</td>
            </tr>
        `;
        return;
    }

    window.db.departments.forEach(department => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(department.name)}</td>
            <td>${escapeHtml(department.description)}</td>
            <td>
                <button class="btn btn-outline-primary btn-sm me-1 edit-dept" data-name="${escapeHtml(department.name)}">Edit</button>
                <button class="btn btn-outline-danger btn-sm delete-dept" data-name="${escapeHtml(department.name)}">Delete</button>
            </td>
        `;
        departmentTableBody.appendChild(row);
    });
}

function openDepartmentModalForEdit(name) {
    const department = window.db.departments.find(item => item.name === name);
    if (!department) {
        return;
    }

    editingDepartmentName = name;
    document.getElementById("deptName").value = department.name;
    document.getElementById("deptDescription").value = department.description;
    document.getElementById("departmentFormModal").classList.remove("d-none");
}

function handleDocumentClick(event) {
    const target = event.target;

    if (target.classList.contains("delete-account")) {
        handleDeleteAccount(target.dataset.email);
        return;
    }

    if (target.classList.contains("reset-account")) {
        handleResetAccountPassword(target.dataset.email);
        return;
    }

    if (target.classList.contains("edit-account")) {
        openAccountModalForEdit(target.dataset.email);
        return;
    }

    if (target.classList.contains("remove-item")) {
        target.closest(".item-row")?.remove();
        return;
    }

    if (target.classList.contains("edit-employee")) {
        openEmployeeModalForEdit(target.dataset.id);
        return;
    }

    if (target.classList.contains("delete-employee")) {
        handleDeleteEmployee(target.dataset.id);
        return;
    }

    if (target.classList.contains("edit-dept")) {
        openDepartmentModalForEdit(target.dataset.name);
        return;
    }

    if (target.classList.contains("delete-dept")) {
        handleDeleteDepartment(target.dataset.name);
        return;
    }

    const requestActionButton = target.closest("button[data-req-action][data-req-id]");
    if (requestActionButton) {
        handleRequestAction(requestActionButton.dataset.reqAction, requestActionButton.dataset.reqId);
    }
}

async function handleDeleteAccount(emailToDelete) {
    const feedback = document.getElementById("failedMSG");

    try {
        if (!confirm("Are you sure you want to delete this account?")) {
            return;
        }

        await apiFetch(`/accounts/${encodeURIComponent(emailToDelete)}`, {
            method: "DELETE"
        });
        await refreshAppData();
        renderAccountsList();
    } catch (error) {
        if (feedback) {
            feedback.textContent = error.message || "Unable to delete account.";
            feedback.style.display = "block";
            setTimeout(() => {
                feedback.style.display = "none";
            }, 2000);
        }
    }
}

async function handleResetAccountPassword(email) {
    const feedback = document.getElementById("failedMSG");
    const newPassword = prompt("Enter new password (min 6 characters):");

    if (!newPassword || newPassword.length < 6) {
        if (feedback) {
            feedback.textContent = "Password must be at least 6 characters!";
            feedback.style.display = "block";
            setTimeout(() => {
                feedback.style.display = "none";
            }, 2000);
        }
        return;
    }

    try {
        await apiFetch(`/accounts/${encodeURIComponent(email)}/password`, {
            method: "PATCH",
            body: JSON.stringify({ password: newPassword })
        });

        if (feedback) {
            feedback.textContent = "Password reset successfully";
            feedback.style.display = "block";
            setTimeout(() => {
                feedback.style.display = "none";
            }, 2000);
        }
    } catch (error) {
        if (feedback) {
            feedback.textContent = error.message || "Unable to reset password.";
            feedback.style.display = "block";
            setTimeout(() => {
                feedback.style.display = "none";
            }, 2000);
        }
    }
}

async function handleRequestAction(action, requestId) {
    if (!currentUser?.isAdmin) {
        return;
    }

    try {
        if (action === "approve") {
            await apiFetch(`/requests/${requestId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: "Approved" })
            });
        }

        if (action === "reject") {
            await apiFetch(`/requests/${requestId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: "Rejected" })
            });
        }

        if (action === "delete") {
            if (!confirm("Delete this request?")) {
                return;
            }
            await apiFetch(`/requests/${requestId}`, {
                method: "DELETE"
            });
        }

        await refreshAppData();
        renderRequests();
    } catch (error) {
        alert(error.message || "Unable to update request.");
    }
}

async function handleDeleteEmployee(employeeId) {
    if (!confirm(`Are you sure you want to delete employee ${employeeId}?`)) {
        return;
    }

    try {
        await apiFetch(`/employees/${encodeURIComponent(employeeId)}`, {
            method: "DELETE"
        });
        await refreshAppData();
        renderEmployees();
    } catch (error) {
        alert(error.message || "Unable to delete employee.");
    }
}

async function handleDeleteDepartment(name) {
    if (!confirm("Delete this department?")) {
        return;
    }

    try {
        await apiFetch(`/departments/${encodeURIComponent(name)}`, {
            method: "DELETE"
        });
        await refreshAppData();
        renderDepartments();
    } catch (error) {
        alert(error.message || "Unable to delete department.");
    }
}

async function apiFetch(path, options = {}, requiresAuth = true) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (requiresAuth && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data;
}

function mapApiUserToUiUser(user) {
    return {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        username: user.username,
        verified: user.verified,
        isAdmin: user.role === "admin"
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
