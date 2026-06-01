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
    window.cartService.openBagDrawer();
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

  const setupBagNavigation = () => {
    const bagButton = document.querySelector(".bag-button");

    if (!bagButton) {
      return;
    }

    bagButton.addEventListener("click", () => {
      window.location.href = "checkout.html";
    });
  };

  const setupAccountDrawer = () => {
    const drawer = document.querySelector(".account-drawer");

    if (!drawer) {
      return;
    }

    const openTriggers = document.querySelectorAll("[data-account-open]");
    const closeTriggers = document.querySelectorAll("[data-account-close]");
    const tabButtons = drawer.querySelectorAll("[data-account-tab]");
    const panels = drawer.querySelectorAll("[data-account-panel]");
    const forms = drawer.querySelectorAll("[data-auth-form]");

    const setActiveTab = (tabName) => {
      tabButtons.forEach((button) => {
        const isActive = button.dataset.accountTab === tabName;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.accountPanel === tabName;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    };

    const openDrawer = (event) => {
      if (event) {
        event.preventDefault();
      }

      document.body.classList.add("account-drawer-open");
      drawer.setAttribute("aria-hidden", "false");
      document.querySelector(".site-header")?.classList.remove("is-hidden");
      drawer.focus();
    };

    const closeDrawer = () => {
      document.body.classList.remove("account-drawer-open");
      drawer.setAttribute("aria-hidden", "true");
    };

    openTriggers.forEach((trigger) => {
      trigger.addEventListener("click", openDrawer);
    });

    closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closeDrawer);
    });

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.accountTab);
      });
    });

    forms.forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const status = form.querySelector(".account-status");
        const submitButton = form.querySelector(".account-submit");
        const successMessage = form.dataset.authForm === "signin"
          ? "Welcome back. You are signed in."
          : "Account created. Welcome to Monoform Rewards.";

        if (submitButton) {
          submitButton.textContent = form.dataset.authForm === "signin" ? "Signed in" : "Account created";
        }

        if (status) {
          status.textContent = successMessage;
          status.classList.remove("is-error");
          status.classList.add("is-success");
        }
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("account-drawer-open")) {
        closeDrawer();
      }
    });
  };

  const init = async () => {
    setupAccountDrawer();
    setupBagNavigation();
    document.addEventListener("click", handleProductClick);
    await window.productService.loadProducts();
    window.cartService.updateBagCount();
    setupSignupForm();
    setupHeaderVisibility();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
