let currentUser = null;

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");
}

const users = [
    {firstname: "Ninoralf", lastname: "Dela Cruz", email: "ninz@gmail.com", password: "yes", isAdmin: true },
    {firstname: "Admin", lastname: "Admin", email: "admin", password: "admin", isAdmin: true } 
];

const employee = [
    {id: "1005", firstname: "ching", lastname: "ching", position: "Manager", department: "Hakdog"}
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

    errorMessage.style.display = "none"; 

    currentUser = user;

    document.getElementById("profileName").textContent = currentUser.firstname + " " + currentUser.lastname;
    document.getElementById("profileEmail").textContent = currentUser.email;
    document.getElementById("profileRole").textContent = currentUser.isAdmin ? "Admin" : "User";

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

function signUpbtn() {
    const firstname = document.getElementById("firstNameInput");
    const lastname = document.getElementById("lastNameInput");
    const email = document.getElementById("emailInput");
    const password = document.getElementById("passwordInput");
    const displayLabel = document.getElementById("emailOut");

    const userExists = users.some(user => user.email === email.value);
    
    if (userExists) {   
        document.getElementById("regiterFailed").style.display = "block";
        cancelSignup();
        return;
    }

    document.getElementById("regiterFailed").style.display = "none";

     users.push({
        firstname: firstname.value,
        lastname: lastname.value,
        email: email.value,
        password: password.value,
        isAdmin: false   
    });
    showPage("verifyEmail");
    displayLabel.textContent = email.value;
    document.getElementById("registerForm").reset();
}

function cancelSignup(){
    document.getElementById("registerForm").reset();
}

document.getElementById("goToLogin").addEventListener("click", function (e) {
    e.preventDefault();   
    showPage("loginSection");
});

const editProfileBtn = document.querySelector(".editProfile-btn");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");

let profileEditMode = false;

editProfileBtn.addEventListener("click", function () {

    if (!profileEditMode) {
        profileName.innerHTML = `<input type="text" class="form-control form-control-sm" id="editName" value="${profileName.textContent}">`;
        profileEmail.innerHTML = `<input type="email" class="form-control form-control-sm" id="editEmail" value="${profileEmail.textContent}">`;

        editProfileBtn.textContent = "Save";
        editProfileBtn.classList.remove("btn-outline-primary");
        editProfileBtn.classList.add("btn-green");

        profileEditMode = true;

    } else {
        const newName = document.getElementById("editName").value.trim();
        const newEmail = document.getElementById("editEmail").value.trim();

        const [firstName, ...lastNameParts] = newName.split(" ");
        const lastName = lastNameParts.join(" ");

        profileName.textContent = newName;
        profileEmail.textContent = newEmail;

        currentUser.firstname = firstName;
        currentUser.lastname = lastName;
        currentUser.email = newEmail;

        const index = users.findIndex(u => u === currentUser);
        if (index !== -1) {
            users[index] = currentUser;
        }

        editProfileBtn.textContent = "Edit Profile";
        editProfileBtn.classList.remove("btn-green");
        editProfileBtn.classList.add("btn-outline-primary");

        profileEditMode = false;

        // butang dri success update "profile update successfully"

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



