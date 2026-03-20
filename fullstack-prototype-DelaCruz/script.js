const STORAGE_KEY = "ipt_demo_v1";
const PUBLIC_PAGES = ["welcomeSection", "registerSection", "loginSection", "verifyEmail"];
const AUTH_PAGES = ["adminMyProfile", "adminRequest"];
const ADMIN_PAGES = ["adminEmployee", "adminAccounts", "adminDepartment"];

let currentUser = null;
let editingAccountEmail = null;
let editingDepartmentName = null;
let profileEditMode = false;
let editingEmployeeIndex = null;

let requestModal = null;

initializeApplication();

function initializeApplication() {
    loadFromStorage();
    restoreSession();
    bindGlobalEvents();
    bindAuthEvents();
    bindProfileEvents();
    bindAccountEvents();
    bindRequestEvents();
    bindEmployeeEvents();
    bindDepartmentEvents();
    handleRouting();
}

function loadFromStorage() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (!data || !Array.isArray(data.accounts)) {
            throw new Error("missing data");
        }

        window.db = {
            accounts: data.accounts,
            departments: Array.isArray(data.departments) ? data.departments : [],
            requests: Array.isArray(data.requests) ? data.requests : [],
            employees: Array.isArray(data.employees) ? data.employees : []
        };
    } catch (error) {
        window.db = {
            accounts: [
                {
                    firstname: "Admin",
                    lastname: "User",
                    email: "admin@example.com",
                    password: "Password123!",
                    verified: true,
                    isAdmin: true
                },
                {
                    firstname: "Ninoralf",
                    lastname: "Dela Cruz",
                    email: "admin",
                    password: "admin",
                    verified: true,
                    isAdmin: true
                }
            ],
            departments: [
                { name: "Engineering", description: "Software team" },
                { name: "HR", description: "Human Resources" }
            ],
            requests: [],
            employees: []
        };
        saveToStorage();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

function restoreSession() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
        setAuthState(false);
        return;
    }

    const user = window.db.accounts.find(account => account.email === token);
    if (!user) {
        localStorage.removeItem("auth_token");
        setAuthState(false);
        return;
    }

    setAuthState(true, user);
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

function login() {
    const userEmail = document.getElementById("loginEmail").value;
    const userPassword = document.getElementById("loginPassword").value;
    const errorMessage = document.getElementById("loginFailed");

    errorMessage.style.display = "none";

    const user = window.db.accounts.find(
        account => account.email === userEmail && account.password === userPassword
    );

    if (!user) {
        errorMessage.textContent = "Invalid email or password.";
        errorMessage.style.display = "block";
        setTimeout(() => {
            errorMessage.style.display = "none";
        }, 3000);
        return;
    }

    if (!user.verified) {
        errorMessage.textContent = "Account not verified yet";
        errorMessage.style.display = "block";
        localStorage.setItem("unverified_email", user.email);
        window.location.hash = "#/verifyEmail";
        return;
    }

    localStorage.setItem("auth_token", user.email);
    setAuthState(true, user);
    document.getElementById("loginData").reset();
    window.location.hash = "#/adminMyProfile";
    handleRouting();
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    window.location.hash = "#/welcomeSection";
}

function signUpbtn() {
    const firstname = document.getElementById("firstNameInput");
    const lastname = document.getElementById("lastNameInput");
    const email = document.getElementById("emailInput");
    const password = document.getElementById("passwordInput");
    const displayLabel = document.getElementById("emailOut");
    const registerFailed = document.getElementById("registerFailed");

    const userExists = window.db.accounts.some(user => user.email === email.value);

    if (password.value.length < 6) {
        registerFailed.innerHTML = "<strong>Password too short!</strong> Please enter at least 6 characters.";
        registerFailed.style.display = "block";
        return;
    }

    if (userExists) {
        registerFailed.innerHTML = "<strong>Email already exists!</strong> Please try another...";
        registerFailed.style.display = "block";
        cancelSignup();
        return;
    }

    registerFailed.style.display = "none";

    window.db.accounts.push({
        firstname: firstname.value,
        lastname: lastname.value,
        email: email.value,
        password: password.value,
        verified: false,
        isAdmin: false
    });

    saveToStorage();
    localStorage.setItem("unverified_email", email.value);
    document.getElementById("registerForm").reset();
    displayLabel.textContent = email.value;
    window.location.hash = "#/verifyEmail";
}

function cancelSignup() {
    document.getElementById("registerForm").reset();
}

function verifyPendingAccount() {
    const email = localStorage.getItem("unverified_email");
    const account = window.db.accounts.find(user => user.email === email);

    if (!account) {
        return;
    }

    account.verified = true;
    saveToStorage();
    localStorage.removeItem("unverified_email");
    window.location.hash = "#/loginSection";
}

function setAuthState(isAuthenticated, user = null) {
    currentUser = isAuthenticated ? user : null;
    document.body.classList.toggle("authenticated", isAuthenticated);
    document.body.classList.toggle("not-authenticated", !isAuthenticated);
    document.body.classList.toggle("is-admin", Boolean(isAuthenticated && user?.isAdmin));
}

function handleEditProfile() {
    const editProfileBtn = document.querySelector(".editProfile-btn");
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const successBox = document.getElementById("editProfile-Success");

    if (!editProfileBtn || !profileName || !profileEmail || !currentUser) {
        return;
    }

    successBox.style.display = "none";

    if (!profileEditMode) {
        profileName.innerHTML = `<input type="text" class="form-control form-control-sm" id="editName" value="${escapeHtml(`${currentUser.firstname} ${currentUser.lastname}`)}">`;
        profileEmail.innerHTML = `<input type="email" class="form-control form-control-sm" id="editEmail" value="${escapeHtml(currentUser.email)}">`;

        editProfileBtn.textContent = "Save";
        editProfileBtn.classList.remove("btn-outline-primary");
        editProfileBtn.classList.add("btn-green");
        profileEditMode = true;
        return;
    }

    const newName = document.getElementById("editName").value.trim();
    const newEmail = document.getElementById("editEmail").value.trim();

    if (!newName || !newEmail) {
        return;
    }

    const [firstName, ...lastNameParts] = newName.split(" ");
    const lastName = lastNameParts.join(" ");
    const oldEmail = currentUser.email;
    const duplicateUser = window.db.accounts.find(
        account => account.email === newEmail && account.email !== oldEmail
    );

    if (duplicateUser) {
        alert("Email already exists.");
        return;
    }

    currentUser.firstname = firstName;
    currentUser.lastname = lastName;
    currentUser.email = newEmail;

    const index = window.db.accounts.findIndex(account => account.email === oldEmail);
    if (index !== -1) {
        window.db.accounts[index] = { ...currentUser };
    }

    saveToStorage();
    localStorage.setItem("auth_token", newEmail);

    profileName.textContent = newName;
    profileEmail.textContent = newEmail;
    editProfileBtn.textContent = "Edit Profile";
    editProfileBtn.classList.remove("btn-green");
    editProfileBtn.classList.add("btn-outline-primary");

    successBox.style.display = "block";
    setTimeout(() => {
        successBox.style.display = "none";
    }, 3000);

    profileEditMode = false;
}

function renderProfile() {
    if (!currentUser) {
        return;
    }

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

function submitAccountForm(event) {
    event.preventDefault();

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
        const account = window.db.accounts.find(user => user.email === editingAccountEmail);
        if (!account) {
            return;
        }

        const duplicateUser = window.db.accounts.find(
            user => user.email === email && user.email !== editingAccountEmail
        );
        if (duplicateUser) {
            alert("Email already exists.");
            return;
        }

        account.firstname = firstName;
        account.lastname = lastName;
        account.email = email;
        account.password = password;
        account.isAdmin = isAdmin;
        account.verified = verified;

        if (currentUser && currentUser.email === editingAccountEmail) {
            setAuthState(true, account);
            localStorage.setItem("auth_token", account.email);
        }
    } else {
        const exists = window.db.accounts.some(user => user.email === email);
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
    closeAccountModal();
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
    document.getElementById("accountPassword").value = account.password;
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

function submitRequest() {
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

    window.db.requests.push({
        id: crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type,
        items,
        status: "Pending",
        date: new Date().toISOString(),
        employeeEmail: currentUser.email
    });

    saveToStorage();
    requestModal?.hide();
    renderRequests();
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

    const visibleRequests = currentUser.isAdmin
        ? window.db.requests
        : window.db.requests.filter(request => request.employeeEmail === currentUser.email);

    if (visibleRequests.length === 0) {
        emptyRequestsState.style.display = "block";
        requestsTableWrapper.style.display = "none";
        return;
    }

    emptyRequestsState.style.display = "none";
    requestsTableWrapper.style.display = "block";
    requestsTableBody.innerHTML = "";

    visibleRequests.forEach(request => {
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
    editingEmployeeIndex = null;
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
    editingEmployeeIndex = null;
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

function submitEmployeeForm(event) {
    event.preventDefault();

    const employee = {
        id: document.getElementById("employeeId").value.trim(),
        email: document.getElementById("employeeEmail").value.trim(),
        position: document.getElementById("employeePosition").value.trim(),
        department: document.getElementById("employeeDept").value.trim(),
        hireDate: document.getElementById("employeeHireDate").value
    };

    if (!employee.id || !employee.email || !employee.position || !employee.department) {
        alert("Please fill out all required fields.");
        return;
    }

    if (editingEmployeeIndex !== null) {
        window.db.employees[editingEmployeeIndex] = employee;
    } else {
        window.db.employees.push(employee);
    }

    saveToStorage();
    renderEmployees();
    closeEmployeeModal();
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

    window.db.employees.forEach((employee, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(employee.id)}</td>
            <td>${escapeHtml(employee.email)}</td>
            <td>${escapeHtml(employee.position)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>
                <button class="btn btn-sm btn-green edit-employee" data-index="${index}">Edit</button>
                <button class="btn btn-sm btn-red delete-employee" data-index="${index}">Delete</button>
            </td>
        `;
        employeeTableBody.appendChild(row);
    });
}

function openEmployeeModalForEdit(index) {
    const employee = window.db.employees[index];
    if (!employee) {
        return;
    }

    editingEmployeeIndex = index;
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

function submitDepartmentForm(event) {
    event.preventDefault();

    const name = document.getElementById("deptName").value.trim();
    const description = document.getElementById("deptDescription").value.trim();

    if (!name) {
        alert("Department name required!");
        return;
    }

    if (editingDepartmentName) {
        const department = window.db.departments.find(item => item.name === editingDepartmentName);
        if (!department) {
            return;
        }

        department.name = name;
        department.description = description;
    } else {
        const exists = window.db.departments.some(item => item.name === name);
        if (exists) {
            alert("Department already exists.");
            return;
        }

        window.db.departments.push({ name, description });
    }

    saveToStorage();
    renderDepartments();
    editingDepartmentName = null;
    document.getElementById("departmentForm").reset();
    closeDepartmentModal();
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
        openEmployeeModalForEdit(Number.parseInt(target.dataset.index, 10));
        return;
    }

    if (target.classList.contains("delete-employee")) {
        handleDeleteEmployee(Number.parseInt(target.dataset.index, 10));
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

function handleDeleteAccount(emailToDelete) {
    const feedback = document.getElementById("failedMSG");

    if (currentUser && currentUser.email === emailToDelete) {
        if (feedback) {
            feedback.textContent = "You cannot delete your own account!";
            feedback.style.display = "block";
            setTimeout(() => {
                feedback.style.display = "none";
            }, 2000);
        }
        return;
    }

    if (!confirm("Are you sure you want to delete this account?")) {
        return;
    }

    window.db.accounts = window.db.accounts.filter(account => account.email !== emailToDelete);
    saveToStorage();
    renderAccountsList();
}

function handleResetAccountPassword(email) {
    const feedback = document.getElementById("failedMSG");
    const account = window.db.accounts.find(user => user.email === email);

    if (!account) {
        return;
    }

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

    account.password = newPassword;
    saveToStorage();

    if (feedback) {
        feedback.textContent = "Password reset successfully";
        feedback.style.display = "block";
        setTimeout(() => {
            feedback.style.display = "none";
        }, 2000);
    }
}

function handleRequestAction(action, requestId) {
    if (!currentUser?.isAdmin) {
        return;
    }

    const request = window.db.requests.find(item => item.id === requestId);
    if (!request) {
        return;
    }

    if (action === "approve") {
        request.status = "Approved";
    }

    if (action === "reject") {
        request.status = "Rejected";
    }

    if (action === "delete") {
        if (!confirm("Delete this request?")) {
            return;
        }
        window.db.requests = window.db.requests.filter(item => item.id !== requestId);
    }

    saveToStorage();
    renderRequests();
}

function handleDeleteEmployee(index) {
    const employee = window.db.employees[index];
    if (!employee) {
        return;
    }

    if (!confirm(`Are you sure you want to delete employee ${employee.email}?`)) {
        return;
    }

    window.db.employees.splice(index, 1);
    saveToStorage();
    renderEmployees();
}

function handleDeleteDepartment(name) {
    if (!confirm("Delete this department?")) {
        return;
    }

    window.db.departments = window.db.departments.filter(department => department.name !== name);
    saveToStorage();
    renderDepartments();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
