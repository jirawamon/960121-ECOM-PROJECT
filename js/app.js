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

    if (!window.productService?.findCardProduct) {
      return;
    }

    const product = window.productService.findCardProduct(button);

    if (!product) {
      return;
    }

    if (window.productService?.openProductSelection) {
      if (!window.cartService.requireAccountBeforeAdd()) {
        return;
      }

      window.productService.openProductSelection(product);
      return;
    }

    if (window.cartService.addItem(product)) {
      window.cartService.openBagDrawer();
      showAddedState(button);
    }
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

    bagButton.addEventListener("click", (event) => {
      if (bagButton.hasAttribute("data-bag-open")) {
        event.preventDefault();
        window.cartService?.openBagDrawer();
        return;
      }

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
    const accountNavTrigger = document.querySelector("[data-account-open][aria-controls='account-drawer']");
    const defaultAccountLabel = accountNavTrigger
      ? accountNavTrigger.getAttribute("aria-label") || accountNavTrigger.textContent || "Account"
      : "Account";
    const accountTabs = drawer.querySelector(".account-tabs");
    const tabButtons = drawer.querySelectorAll("[data-account-tab]");
    const panels = drawer.querySelectorAll("[data-account-panel]");
    const forms = drawer.querySelectorAll("[data-auth-form]");
    const signedInPanel = document.createElement("section");
    const signedInTitle = document.createElement("h3");
    const signedInMeta = document.createElement("p");
    const profileList = document.createElement("dl");
    const savedAddressTitle = document.createElement("h3");
    const savedAddressEmpty = document.createElement("p");
    const addressList = document.createElement("dl");
    const addressForm = document.createElement("form");
    const addressSubmitButton = document.createElement("button");
    const logoutButton = document.createElement("button");

    signedInPanel.className = "account-panel";
    signedInPanel.hidden = true;
    signedInTitle.textContent = "You are signed in";
    signedInMeta.className = "account-status is-success";
    profileList.className = "account-profile-list";
    savedAddressTitle.textContent = "Saved addresses";
    savedAddressEmpty.className = "account-status";
    savedAddressEmpty.textContent = "No saved addresses saved yet.";
    addressList.className = "account-profile-list";
    addressForm.className = "account-form";
    addressForm.dataset.addressForm = "prepared";
    addressForm.innerHTML = `
      <label>
        <span>Address Line</span>
        <input type="text" name="addressLine" autocomplete="street-address" placeholder=" ">
      </label>
      <div class="account-form-grid">
        <label>
          <span>City</span>
          <input type="text" name="city" autocomplete="address-level2" placeholder=" ">
        </label>
        <label>
          <span>Province</span>
          <input type="text" name="province" autocomplete="address-level1" placeholder=" ">
        </label>
      </div>
      <div class="account-form-grid">
        <label>
          <span>Postal Code</span>
          <input type="text" name="postalCode" autocomplete="postal-code" placeholder=" ">
        </label>
        <label>
          <span>Phone</span>
          <input type="text" name="phone" autocomplete="tel" placeholder=" ">
        </label>
      </div>
      <p class="account-status" aria-live="polite" data-address-status>Ready to save a new address.</p>
    `;
    addressSubmitButton.className = "account-submit";
    addressSubmitButton.type = "submit";
    addressSubmitButton.textContent = "Save address";
    addressForm.append(addressSubmitButton);
    logoutButton.className = "account-submit";
    logoutButton.type = "button";
    logoutButton.textContent = "Log out";
    signedInPanel.append(
      signedInTitle,
      signedInMeta,
      profileList,
      savedAddressTitle,
      savedAddressEmpty,
      addressList,
      addressForm,
      logoutButton
    );
    drawer.querySelector(".account-drawer-body")?.append(signedInPanel);

    const getUserDisplayName = (user) => {
      if (!user) {
        return "";
      }

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      return fullName || user.email || "";
    };

    const getAddressStatus = () => addressForm.querySelector("[data-address-status]");

    const setAddressStatus = (message, type = "") => {
      const status = getAddressStatus();

      if (!status) {
        return;
      }

      status.textContent = message;
      status.classList.toggle("is-success", type === "success");
      status.classList.toggle("is-error", type === "error");
    };

    const normalizeAddress = (address) => ({
      id: address.address_id || address.addressId || address.id,
      addressLine: address.address_line || address.addressLine || "",
      city: address.city || "",
      province: address.province || "",
      postalCode: address.postal_code || address.postalCode || "",
      phone: address.phone || "",
    });

    const renderProfileList = (user) => {
      const rows = [
        ["First name", user?.firstName || "Not provided"],
        ["Last name", user?.lastName || "Not provided"],
        ["Email", user?.email || "Not provided"],
      ];

      profileList.innerHTML = "";

      rows.forEach(([label, value]) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");

        term.textContent = label;
        detail.textContent = value;
        row.append(term, detail);
        profileList.append(row);
      });
    };

    const renderAddressList = (addresses = []) => {
      addressList.innerHTML = "";
      savedAddressEmpty.hidden = addresses.length > 0;

      addresses.map(normalizeAddress).forEach((address, index) => {
        const row = document.createElement("div");
        const term = document.createElement("dt");
        const detail = document.createElement("dd");
        const addressParts = [
          address.addressLine,
          address.city,
          address.province,
          address.postalCode,
          address.phone ? `Phone: ${address.phone}` : "",
        ].filter(Boolean);

        term.textContent = address.id ? `Address #${address.id}` : `Address ${index + 1}`;
        detail.textContent = addressParts.join(", ");
        row.append(term, detail);
        addressList.append(row);
      });
    };

    const loadSavedAddresses = async (user) => {
      if (!user?.id) {
        renderAddressList([]);
        setAddressStatus("Sign in to load saved addresses.");
        return;
      }

      setAddressStatus("Loading saved addresses...");

      try {
        const addresses = await window.api.getUserAddresses(user.id);
        renderAddressList(Array.isArray(addresses) ? addresses : []);
        setAddressStatus("Saved addresses loaded.", "success");
      } catch (error) {
        renderAddressList([]);
        setAddressStatus(error.message || "Failed to load saved addresses.", "error");
      }
    };

    const updateAccountState = () => {
      const user = window.authService.getCurrentUser();
      const isLoggedIn = window.authService.isLoggedIn();
      const displayName = getUserDisplayName(user);
      const accountLabel = isLoggedIn && displayName
        ? `Hi, ${displayName.split(" ")[0]}`
        : defaultAccountLabel;

      if (accountNavTrigger) {
        if (accountNavTrigger.classList.contains("action-account")) {
          accountNavTrigger.setAttribute("aria-label", accountLabel);
          accountNavTrigger.setAttribute("title", accountLabel);
        } else {
          accountNavTrigger.textContent = accountLabel;
        }
      }

      if (accountTabs) {
        accountTabs.hidden = isLoggedIn;
      }

      panels.forEach((panel) => {
        panel.hidden = isLoggedIn ? true : !panel.classList.contains("is-active");
      });

      signedInPanel.hidden = !isLoggedIn;
      signedInMeta.textContent = displayName
        ? `Signed in as ${displayName}.`
        : "Your account session is active.";
      renderProfileList(user);

      if (isLoggedIn) {
        loadSavedAddresses(user);
      } else {
        renderAddressList([]);
        setAddressStatus("Sign in to manage saved addresses.");
      }
    };

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
      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const status = form.querySelector(".account-status");
        const submitButton = form.querySelector(".account-submit");
        const originalText = submitButton ? submitButton.textContent : "";
        const formData = new FormData(form);
        const isSignin = form.dataset.authForm === "signin";

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = isSignin ? "Signing in..." : "Creating account...";
        }

        if (status) {
          status.textContent = "";
          status.classList.remove("is-error");
          status.classList.remove("is-success");
        }

        try {
          if (isSignin) {
            await window.authService.login({
              email: formData.get("email"),
              password: formData.get("password"),
            });
          } else {
            await window.authService.register({
              firstName: formData.get("firstName"),
              lastName: formData.get("lastName"),
              email: formData.get("email"),
              password: formData.get("password"),
            });
          }

          if (submitButton) {
            submitButton.textContent = isSignin ? "Signed in" : "Account created";
          }

          if (status) {
            status.textContent = isSignin
              ? "Welcome back. You are signed in."
              : "Account created. Welcome to Monoform Rewards.";
            status.classList.remove("is-error");
            status.classList.add("is-success");
          }

          updateAccountState();
        } catch (error) {
          if (submitButton) {
            submitButton.textContent = originalText;
          }

          if (status) {
            status.textContent = error.message || "Something went wrong. Please try again.";
            status.classList.remove("is-success");
            status.classList.add("is-error");
          }
        } finally {
          if (submitButton) {
            submitButton.disabled = false;
          }
        }
      });
    });

    logoutButton.addEventListener("click", () => {
      window.authService.logout();
      forms.forEach((form) => form.reset());
      addressForm.reset();
      renderAddressList([]);
      setActiveTab("signin");
      updateAccountState();
    });

    addressForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const user = window.authService.getCurrentUser();

      if (!user?.id) {
        setAddressStatus("Please sign in before saving an address.", "error");
        return;
      }

      const formData = new FormData(addressForm);

      addressSubmitButton.disabled = true;
      addressSubmitButton.textContent = "Saving...";
      setAddressStatus("Saving address...");

      try {
        await window.api.createUserAddress({
          userId: user.id,
          addressLine: formData.get("addressLine"),
          city: formData.get("city"),
          province: formData.get("province"),
          postalCode: formData.get("postalCode"),
          phone: formData.get("phone"),
        });

        addressForm.reset();
        setAddressStatus("Address saved.", "success");
        await loadSavedAddresses(user);
      } catch (error) {
        setAddressStatus(error.message || "Failed to save address.", "error");
      } finally {
        addressSubmitButton.disabled = false;
        addressSubmitButton.textContent = "Save address";
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && document.body.classList.contains("account-drawer-open")) {
        closeDrawer();
      }
    });

    updateAccountState();
  };

  const init = async () => {
    setupAccountDrawer();
    setupBagNavigation();
    document.addEventListener("click", handleProductClick);

    if (window.productService?.loadProducts) {
      await window.productService.loadProducts();
    }

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
