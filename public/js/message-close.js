document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".msg-close-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const messageBox = btn.closest(".alert-dismissible-custom");
            if (messageBox) {
                messageBox.style.display = "none";
            }
        });
    });
});
