function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");
}

const users = [
    {email: "ninz@gmail.com", password: "yes", isAdmin: true },
    {email: "admin", password: "admin", isAdmin: true } 
];

function login() {
    const userEmail = document.getElementById("loginEmail").value;
    const userPassword = document.getElementById("loginPassword").value;
    const errorMessage = document.getElementById("loginFailed");

    const user = users.find(u => u.email === userEmail);

    if (!user || user.password !== userPassword) {
        errorMessage.style.display = "block";
        // errorMessage.textContent = "Invalid email or password!";
        return;
    }
    
    document.body.classList.remove("not-authenticated");
    document.body.classList.add("authenticated");
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("adminMyProfile").classList.add("active");
}

function logout() {
    document.body.classList.remove("authenticated");
    document.body.classList.add("not-authenticated");

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById("welcomeSection").classList.add("active");
}

document.getElementById("adminProfileLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("adminMyProfile");    
});

document.getElementById("adminEmployeeLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("adminEmployee");    
});

document.getElementById("adminAccountsLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("adminAccounts");    
});

document.getElementById("adminDepartmentLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("adminDepartment");    
});

document.getElementById("adminRequestLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("adminRequest");    
});




document.getElementById("registerLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("registerSection");    
});

document.getElementById("loginLink").addEventListener("click", function (e) {
    e.preventDefault();
    showPage("loginSection");
});

document.getElementById("signUpbtn").addEventListener("click", function (e) {
    const emailInput = document.getElementById("emailInput");
    const displayLabel = document.getElementById("emailOut");
    e.preventDefault();
    showPage("verifyEmail");
    displayLabel.textContent = emailInput.value;
});

document.getElementById("goToLogin").addEventListener("click", function (e) {
    e.preventDefault();   
    showPage("loginSection");
});

// this is for edit profile button yey
const editProfileBtn = document.querySelector(".editProfile-btn");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");

let profileEditMode = false;

editProfileBtn.addEventListener("click", function () {

    // ENTER EDIT MODE
    if (!profileEditMode) {

        profileName.innerHTML = `<input type="text" class="form-control form-control-sm" id="editName" value="${profileName.textContent}">`;
        profileEmail.innerHTML = `<input type="email" class="form-control form-control-sm" id="editEmail" value="${profileEmail.textContent}">`;

        editProfileBtn.textContent = "Save";
        editProfileBtn.classList.remove("btn-outline-primary");
        editProfileBtn.classList.add("btn-success");

        profileEditMode = true;
    }
    // SAVE MODE
    else {

        const newName = document.getElementById("editName").value;
        const newEmail = document.getElementById("editEmail").value;

        profileName.textContent = newName;
        profileEmail.textContent = newEmail;

        editProfileBtn.textContent = "Edit Profile";
        editProfileBtn.classList.remove("btn-success");
        editProfileBtn.classList.add("btn-outline-primary");

        profileEditMode = false;
    }
});

// this is for EMPLOYEE CRUD yey
const addEmployeeBtn = document.getElementById("addEmployeeBtn");
const employeeForm = document.getElementById("employeeForm");
const cancelEmployee = document.getElementById("cancelEmployee");
const employeeTableBody = document.getElementById("employeeTableBody");
const noEmployeesRow = document.getElementById("noEmployeesRow");
let editMode = false;
let rowBeingEdited = null;

// Show form
addEmployeeBtn.addEventListener("click", function () {
    employeeForm.classList.remove("d-none");
});

// Hide form
cancelEmployee.addEventListener("click", function () {
    employeeForm.classList.add("d-none");
    employeeForm.reset();
});

// Handle form submit
employeeForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = document.getElementById("employeeId").value;
    const email = document.getElementById("employeeEmail").value;
    const position = document.getElementById("employeePosition").value;
    const dept = document.getElementById("employeeDept").value;

    // EDIT MODE
    if (editMode && rowBeingEdited) {
        rowBeingEdited.children[0].textContent = id;
        rowBeingEdited.children[1].textContent = email;
        rowBeingEdited.children[2].textContent = position;
        rowBeingEdited.children[3].textContent = dept;

        editMode = false;
        rowBeingEdited = null;
    } 
    // ADD MODE
    else {
        const noEmployeesRow = document.getElementById("noEmployeesRow");
        if (noEmployeesRow) noEmployeesRow.remove();

        const newRow = document.createElement("tr");

        newRow.innerHTML = `
            <td>${id}</td>
            <td>${email}</td>
            <td>${position}</td>
            <td>${dept}</td>
            <td>
                <button class="btn btn-sm btn-blue edit-btn">Edit</button>
                <button class="btn btn-sm btn-red delete-btn">Delete</button>
            </td>
        `;

        employeeTableBody.appendChild(newRow);
    }

    employeeForm.classList.add("d-none");
    employeeForm.reset();
});


employeeTableBody.addEventListener("click", function (e) {

    // DELETE
    if (e.target.classList.contains("delete-btn")) {
        e.target.closest("tr").remove();

        if (employeeTableBody.children.length === 0) {
            const emptyRow = document.createElement("tr");
            emptyRow.id = "noEmployeesRow";
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center">No employees.</td>
            `;
            employeeTableBody.appendChild(emptyRow);
        }
    }

    // EDIT
    if (e.target.classList.contains("edit-btn")) {
        rowBeingEdited = e.target.closest("tr");

        document.getElementById("employeeId").value = rowBeingEdited.children[0].textContent;
        document.getElementById("employeeEmail").value = rowBeingEdited.children[1].textContent;
        document.getElementById("employeePosition").value = rowBeingEdited.children[2].textContent;
        document.getElementById("employeeDept").value = rowBeingEdited.children[3].textContent;

        editMode = true;
        employeeForm.classList.remove("d-none");
    }
});



