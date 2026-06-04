(function (window, document) {
  "use strict";

  const getDisplayName = (user) => {
    if (!user) {
      return "Account";
    }

    return user.firstName || user.email || "Account";
  };

  const updateAccountLinks = () => {
    const isLoggedIn = Boolean(window.authService && window.authService.isLoggedIn());
    const user = isLoggedIn ? window.authService.getCurrentUser() : null;

    document.querySelectorAll(".action-account").forEach((link) => {
      if (!isLoggedIn) {
        link.setAttribute("href", "index.html");
        link.setAttribute("aria-label", "Account");
        link.setAttribute("title", "Account");
        return;
      }

      const label = `Hi, ${getDisplayName(user)}`;
      link.setAttribute("href", "account.html");
      link.setAttribute("aria-label", label);
      link.setAttribute("title", label);
    });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".action-account");

    if (!link || !window.authService || !window.authService.isLoggedIn()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.href = "account.html";
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateAccountLinks);
  } else {
    updateAccountLinks();
  }
})(window, document);
