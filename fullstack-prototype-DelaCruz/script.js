
document.getElementById("registerLink").addEventListener("click", function (e) {
    e.preventDefault();

    const register = document.getElementById("registerSection");

    if (register.style.display === "none") {
        register.style.display = "flex"; 
    } else {
        register.style.display = "none"; e
    }
});

