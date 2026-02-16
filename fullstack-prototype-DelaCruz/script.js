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
    const logData = document.getAnimations("loginData");
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

    document.getElementById("profileName").textContent = currentUser.firstname + " " + currentUser.lastname;
    document.getElementById("profileEmail").textContent = currentUser.email;
    document.getElementById("profileRole").textContent = currentUser.isAdmin ? "Admin" : "User";
    window.location.hash = "#/adminMyProfile";
    logData.FormData.remove();
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

    document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
    if (page) page.classList.add("active");

    const adminPages = ["adminMyProfile","adminEmployee","adminAccounts","adminDepartment","adminRequest"];
    if (adminPages.includes(pageId) && (!currentUser || !currentUser.isAdmin)) {
        window.location.hash = "#/welcomeSection";
        return;
    }

    const publicPages = ["welcomeSection", "registerSection", "loginSection", "verifyEmail"];
    if (!currentUser && !publicPages.includes(pageId)) {
        window.location.hash = "#/welcomeSection";
        return;
    }
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


const editProfileBtn = document.querySelector(".editProfile-btn");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileRole = document.getElementById("profileRole");

let profileEditMode = false;

editProfileBtn.addEventListener("click", function () {

    const successBox = document.getElementById("editProfile-Success");
    successBox.style.display = "none";

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

        if (!newName || !newEmail) return;

        const [firstName, ...lastNameParts] = newName.split(" ");
        const lastName = lastNameParts.join(" ");

        profileName.textContent = newName;
        profileEmail.textContent = newEmail;

        currentUser.firstname = firstName;
        currentUser.lastname = lastName;
        currentUser.email = newEmail;

        const index = window.db.accounts.findIndex(u => u === currentUser.email);
        if (index !== -1) {
            window.db.accounts[index] = { ...currentUser, firstname: firstName, lastname: lastName, email: newEmail };
        }

        saveToStorage();
        
        editProfileBtn.textContent = "Edit Profile";
        editProfileBtn.classList.remove("btn-green");
        editProfileBtn.classList.add("btn-outline-primary");
        
        successBox.style.display = "block";
        
        setTimeout(() => {
            successBox.style.display = "none";
        }, 3000);
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

// Show Emploeyee add form
addEmployeeBtn.addEventListener("click", function () {
    employeeForm.classList.remove("d-none");
});

// Hide Emploeyee add form
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



