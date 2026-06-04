(function (window, document) {
  "use strict";

  const regions = [
    ["TH", "+66", "Thailand"],
    ["US", "+1", "United States"],
    ["CA", "+1", "Canada"],
    ["GB", "+44", "United Kingdom"],
    ["AU", "+61", "Australia"],
    ["JP", "+81", "Japan"],
    ["KR", "+82", "South Korea"],
    ["CN", "+86", "China"],
    ["SG", "+65", "Singapore"],
    ["MY", "+60", "Malaysia"],
  ];

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  let currentUser = null;

  const formatMemberId = (id) => `MF${String(id || 0).padStart(6, "0")}`;
  const getDigits = (value) => String(value || "").replace(/\D/g, "");
  const formatPhone = (value) => {
    const digits = getDigits(value).slice(0, 10);
    const parts = [];

    if (digits.slice(0, 3)) parts.push(digits.slice(0, 3));
    if (digits.slice(3, 6)) parts.push(digits.slice(3, 6));
    if (digits.slice(6, 10)) parts.push(digits.slice(6, 10));

    return parts.join("-");
  };
  const toIsoBirthday = (year, month, day) => {
    if (!year || !month || !day) {
      return "";
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const setText = (selector, value) => {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  };

  const setStatus = (selector, message, type = "") => {
    const element = document.querySelector(selector);

    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.toggle("is-success", type === "success");
    element.classList.toggle("is-error", type === "error");
  };

  const normalizeAddress = (address) => ({
    id: address.address_id || address.addressId || address.id,
    addressLine: address.address_line || address.addressLine || "",
    city: address.city || "",
    province: address.province || "",
    postalCode: address.postal_code || address.postalCode || "",
    phone: address.phone || "",
  });

  const populateRegionOptions = () => {
    const select = document.querySelector("[data-phone-region]");

    if (!select) {
      return;
    }

    select.innerHTML = regions
      .map(([iso, dialCode, name]) => `<option value="${iso}">${dialCode} ${name}</option>`)
      .join("");
  };

  const updateBirthdayDays = () => {
    const year = Number(document.querySelector("[data-birthday-year]")?.value) || 2016;
    const month = Number(document.querySelector("[data-birthday-month]")?.value) || 1;
    const daySelect = document.querySelector("[data-birthday-day]");
    const selectedDay = Number(daySelect?.value) || 0;

    if (!daySelect) {
      return;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    daySelect.innerHTML = '<option value="">Date</option>';

    for (let day = 1; day <= daysInMonth; day += 1) {
      daySelect.insertAdjacentHTML("beforeend", `<option value="${day}">${String(day).padStart(2, "0")}</option>`);
    }

    if (selectedDay && selectedDay <= daysInMonth) {
      daySelect.value = String(selectedDay);
    }
  };

  const populateBirthdayOptions = () => {
    const yearSelect = document.querySelector("[data-birthday-year]");
    const monthSelect = document.querySelector("[data-birthday-month]");

    if (!yearSelect || !monthSelect) {
      return;
    }

    yearSelect.innerHTML = '<option value="">Year</option>';
    for (let year = 2016; year >= 1900; year -= 1) {
      yearSelect.insertAdjacentHTML("beforeend", `<option value="${year}">${year}</option>`);
    }

    monthSelect.innerHTML = '<option value="">Month</option>';
    for (let month = 1; month <= 12; month += 1) {
      monthSelect.insertAdjacentHTML("beforeend", `<option value="${month}">${String(month).padStart(2, "0")}</option>`);
    }

    updateBirthdayDays();
  };

  const fillBirthday = (birthday = "") => {
    const [year, month, day] = String(birthday || "").slice(0, 10).split("-");
    const yearSelect = document.querySelector("[data-birthday-year]");
    const monthSelect = document.querySelector("[data-birthday-month]");
    const daySelect = document.querySelector("[data-birthday-day]");

    if (yearSelect) yearSelect.value = year || "";
    if (monthSelect) monthSelect.value = month ? String(Number(month)) : "";
    updateBirthdayDays();
    if (daySelect) daySelect.value = day ? String(Number(day)) : "";
  };

  const fillProfileForm = (user) => {
    const form = document.querySelector("[data-profile-form]");

    if (!form) {
      return;
    }

    form.elements.firstName.value = user.firstName || "";
    form.elements.lastName.value = user.lastName || "";
    form.elements.email.value = user.email || "";
    form.elements.phoneRegion.value = user.phoneRegion || "TH";
    form.elements.phoneNumber.value = formatPhone(user.phoneNumber || "");
    fillBirthday(user.birthday || "");
  };

  const fillAddressForm = () => {
    const form = document.querySelector("[data-address-form]");

    if (!form || !currentUser) {
      return;
    }

    form.elements.phone.value = formatPhone(currentUser.phoneNumber || "");
  };

  const renderAddresses = (addresses = []) => {
    const list = document.querySelector("[data-account-addresses]");

    if (!list) {
      return;
    }

    if (!addresses.length) {
      list.innerHTML = "<p>No saved addresses yet.</p>";
      return;
    }

    list.innerHTML = addresses.map((address) => {
      const normalized = normalizeAddress(address);
      const parts = [
        normalized.addressLine,
        normalized.city,
        normalized.province,
        normalized.postalCode,
        normalized.phone ? `Phone: ${normalized.phone}` : "",
      ].filter(Boolean);

      return `
        <article>
          <h3>${normalized.id ? `Address #${normalized.id}` : "Saved address"}</h3>
          <p>${escapeHtml(parts.join(", "))}</p>
        </article>
      `;
    }).join("");
  };

  const renderOrders = (orders = []) => {
    const list = document.querySelector("[data-account-orders]");

    if (!list) {
      return;
    }

    if (!orders.length) {
      list.innerHTML = '<p class="account-muted">No recent orders yet. Items you purchase will appear here.</p>';
      return;
    }

    list.innerHTML = orders.map((order) => `
      <article>
        <h3>Order #${escapeHtml(order.checkout_id || order.checkoutId)}</h3>
        <dl>
          <div><dt>Status</dt><dd>${escapeHtml(order.status || "pending")}</dd></div>
          <div><dt>Total</dt><dd>${currency.format(Number(order.total_price ?? order.totalPrice) || 0)}</dd></div>
          <div><dt>Payment</dt><dd>${escapeHtml(order.payment_type || order.paymentType || "Not provided")}</dd></div>
          <div><dt>Date</dt><dd>${escapeHtml(String(order.created_at || order.createdAt || "").slice(0, 10))}</dd></div>
        </dl>
      </article>
    `).join("");
  };

  const renderSavedItems = async () => {
    const list = document.querySelector("[data-saved-items]");

    if (!list) {
      return;
    }

    if (!currentUser?.id || !window.api?.getUserSavedItems) {
      list.innerHTML = '<p class="account-muted">Save pieces while browsing and return to them here.</p>';
      return;
    }

    let items = [];

    try {
      const savedItems = await window.api.getUserSavedItems(currentUser.id);
      items = Array.isArray(savedItems) ? savedItems : [];
    } catch (error) {
      list.innerHTML = '<p class="account-muted">Saved items could not be loaded right now.</p>';
      return;
    }

    if (!items.length) {
      list.innerHTML = '<p class="account-muted">Save pieces while browsing and return to them here.</p>';
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="account-saved-item">
        <img src="${escapeHtml(item.image || "")}" alt="${escapeHtml(item.name || "Saved item")}">
        <div>
          <h3>${escapeHtml(item.name || "Saved item")}</h3>
          <p>${escapeHtml(item.variant || "Favorite item")}</p>
          <strong>${currency.format(Number(item.price) || 0)}</strong>
        </div>
      </article>
    `).join("");
  };

  const refreshAddresses = async () => {
    if (!currentUser?.id) {
      renderAddresses([]);
      return;
    }

    try {
      const addresses = await window.api.getUserAddresses(currentUser.id);
      renderAddresses(Array.isArray(addresses) ? addresses : []);
    } catch (error) {
      renderAddresses([]);
      setStatus("[data-address-status]", error.message || "Unable to load addresses.", "error");
    }
  };

  const refreshOrders = async () => {
    if (!currentUser?.id) {
      renderOrders([]);
      return;
    }

    try {
      const orders = await window.api.getUserOrders(currentUser.id);
      renderOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      renderOrders([]);
    }
  };

  const renderSignedOut = async () => {
    setText("[data-account-greeting]", "Sign in");
    setText("[data-account-member]", "MF000000");
    renderAddresses([]);
    renderOrders([]);
    await renderSavedItems();

    const content = document.querySelector(".account-page-content");

    if (content && !document.querySelector(".account-signin-required")) {
      content.insertAdjacentHTML("afterbegin", `
        <section class="account-signin-required">
          <h2>Please sign in to view your account.</h2>
          <p>Your profile, rewards, and saved addresses appear here after signing in.</p>
          <a href="index.html">Sign in or create account</a>
        </section>
      `);
    }
  };

  const renderUser = async (user, { refreshRelated = true } = {}) => {
    const firstName = user.firstName || "Member";

    currentUser = user;
    setText("[data-account-greeting]", `Hi, ${firstName}`);
    setText("[data-account-member]", formatMemberId(user.id));
    fillProfileForm(user);
    fillAddressForm();

    if (refreshRelated) {
      await Promise.all([refreshAddresses(), refreshOrders()]);
    }

    await renderSavedItems();
  };

  const submitProfile = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setStatus("[data-profile-status]", "Please sign in first.", "error");
      return;
    }

    const form = event.currentTarget;
    const birthday = toIsoBirthday(
      form.elements.birthdayYear.value,
      form.elements.birthdayMonth.value,
      form.elements.birthdayDay.value
    );

    setStatus("[data-profile-status]", "Saving...");

    try {
      const response = await window.api.updateUserProfile(currentUser.id, {
        firstName: form.elements.firstName.value.trim(),
        lastName: form.elements.lastName.value.trim(),
        email: form.elements.email.value.trim(),
        phoneRegion: form.elements.phoneRegion.value,
        phoneNumber: getDigits(form.elements.phoneNumber.value),
        birthday,
      });

      currentUser = response.user;
      window.api.setAuthSession({ user: currentUser, token: window.api.getAuthToken() });
      await renderUser(currentUser, { refreshRelated: false });
      setStatus("[data-profile-status]", "Saved.", "success");
    } catch (error) {
      setStatus("[data-profile-status]", error.message || "Could not save profile.", "error");
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setStatus("[data-password-status]", "Please sign in first.", "error");
      return;
    }

    const form = event.currentTarget;
    setStatus("[data-password-status]", "Updating password...");

    try {
      await window.api.updateUserPassword(currentUser.id, {
        currentPassword: form.elements.currentPassword.value,
        newPassword: form.elements.newPassword.value,
      });
      form.reset();
      setStatus("[data-password-status]", "Password updated.", "success");
    } catch (error) {
      setStatus("[data-password-status]", error.message || "Could not update password.", "error");
    }
  };

  const submitAddress = async (event) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setStatus("[data-address-status]", "Please sign in first.", "error");
      return;
    }

    const form = event.currentTarget;
    setStatus("[data-address-status]", "Saving address...");

    try {
      await window.api.createUserAddress({
        userId: currentUser.id,
        addressLine: form.elements.addressLine.value.trim(),
        city: form.elements.city.value.trim(),
        province: form.elements.province.value.trim(),
        postalCode: form.elements.postalCode.value.trim(),
        phone: form.elements.phone.value.trim(),
      });
      form.reset();
      fillAddressForm();
      await refreshAddresses();
      setStatus("[data-address-status]", "Address saved. Checkout will use your newest saved address.", "success");
    } catch (error) {
      setStatus("[data-address-status]", error.message || "Could not save address.", "error");
    }
  };

  const setupEvents = () => {
    document.querySelector("[data-profile-form]")?.addEventListener("submit", submitProfile);
    document.querySelector("[data-password-form]")?.addEventListener("submit", submitPassword);
    document.querySelector("[data-address-form]")?.addEventListener("submit", submitAddress);
    document.querySelector("[data-birthday-year]")?.addEventListener("change", updateBirthdayDays);
    document.querySelector("[data-birthday-month]")?.addEventListener("change", updateBirthdayDays);
    document.querySelector('[name="phoneNumber"]')?.addEventListener("input", (event) => {
      event.target.value = formatPhone(event.target.value);
    });
  };

  const init = async () => {
    populateRegionOptions();
    populateBirthdayOptions();
    setupEvents();

    const savedUser = window.authService.getCurrentUser();

    if (!window.authService.isLoggedIn() || !savedUser) {
      await renderSignedOut();
      return;
    }

    try {
      const profile = await window.api.getUserProfile(savedUser.id);
      window.api.setAuthSession({ user: profile, token: window.api.getAuthToken() });
      await renderUser(profile);
    } catch (error) {
      await renderUser(savedUser);
    }
  };

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-account-signout]")) {
      return;
    }

    event.preventDefault();
    window.authService.logout();
    window.location.href = "index.html";
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
