document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".mobile-menu-button");
    const menuIcon = menuButton?.querySelector("img");
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileMenuLinks = document.querySelectorAll(".mobile-menu a");

    if (!menuButton || !menuIcon || !mobileMenu) {
        return;
    }

    const openMenu = () => {
        mobileMenu.classList.add("is-open");
        menuButton.setAttribute("aria-expanded", "true");
        menuIcon.src = "./assets/icons/menu-fechar.svg";
        menuIcon.alt = "Fechar menu";
    };

    const closeMenu = () => {
        mobileMenu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuIcon.src = "./assets/icons/menu-abrir.svg";
        menuIcon.alt = "Abrir menu";
    };

    menuButton.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.contains("is-open");

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    mobileMenuLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
});