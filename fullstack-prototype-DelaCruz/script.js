const welcome = document.getElementById("welcomeSection");
const register = document.getElementById("registerSection");
const login = document.getElementById("loginSection");
const verify = document.getElementById("verifyEmail");


// Specific Order of hide and show pages

function clickRegisterPage() {
    if (register.style.display === "none" || register.style.display === "") {
        register.style.display = "block";
        welcome.style.display = "none";
        login.style.display = "none";
        verify.style.display = "none";
    } else {
        register.style.display = "none";
        welcome.style.display = "block";
        login.style.display = "none";
        verify.style.display = "none";
    }
}

function clickLoginPage() {
    if (login.style.display === "none" || login.style.display === "") {
        login.style.display = "block";
        welcome.style.display = "none";
        register.style.display = "none";
        verify.style.display = "none";
    } else {
        login.style.display = "none";
        welcome.style.display = "block";
        register.style.display = "none";
        verify.style.display = "none";
    }
}

function clickSignUp() {
    //butang ug authenticator dri...
    register.style.display = "none";
    welcome.style.display = "none";
    login.style.display = "none";
    verify.style.display = "block";
}

document.getElementById("registerLink").addEventListener("click", function (e) {
    e.preventDefault();
    clickRegisterPage();    
});

document.getElementById("loginLink").addEventListener("click", function (e) {
    e.preventDefault();
    clickLoginPage();
});

document.getElementById("signUpbtn").addEventListener("click", function (e) {
    const emailInput = document.getElementById("emailInput");
    const displayLabel = document.getElementById("emailOut");
    e.preventDefault();
    clickSignUp();
    displayLabel.textContent = emailInput.value;
});

document.getElementById("goToLogin").addEventListener("click", function (e) {
    e.preventDefault
    clickLoginPage();
});
