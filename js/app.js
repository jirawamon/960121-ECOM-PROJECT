(function (window, document) {
  "use strict";

  const showAddedState = (button) => {
    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = "Added";

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 900);
  };

  const handleProductClick = (event) => {
    const button = event.target.closest(".add-button");

    if (!button) {
      return;
    }

    const product = window.productService.findCardProduct(button);

    if (!product) {
      return;
    }

    window.cartService.addItem(product);
    showAddedState(button);
  };

  const setupSignupForm = () => {
    const signup = document.querySelector(".signup");

    if (!signup) {
      return;
    }

    signup.addEventListener("submit", (event) => {
      event.preventDefault();
      const button = signup.querySelector("button");

      if (button) {
        button.textContent = "Joined";
      }
    });
  };

  const setupHeaderVisibility = () => {
    const siteHeader = document.querySelector(".site-header");
    let lastScrollY = window.scrollY;

    if (!siteHeader) {
      return;
    }

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      if (isScrollingDown && currentScrollY > 80) {
        siteHeader.classList.add("is-hidden");
      } else {
        siteHeader.classList.remove("is-hidden");
      }

      lastScrollY = Math.max(currentScrollY, 0);
    };

    window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
  };

  const init = async () => {
    await window.productService.loadProducts();
    window.cartService.updateBagCount();
    document.addEventListener("click", handleProductClick);
    setupSignupForm();
    setupHeaderVisibility();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
