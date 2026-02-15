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



