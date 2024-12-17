
fetch('/navbar.html')
.then(res => res.text())
.then(text => {
    let oldelem = document.querySelector("script#replace_with_navbar");
    let newelem = document.createElement("div");
    newelem.innerHTML = text;
    oldelem.parentNode.replaceChild(newelem,oldelem);
});

// Handle logouts - call that api endpoint
function Logout() {
    fetch('/logout', {
        headers: {"Content-Type": "application/json"}
    })
    .then(response => {
        window.location.href = "/index.html";
    })
    .catch(error => {
        console.error(error);
    });
}