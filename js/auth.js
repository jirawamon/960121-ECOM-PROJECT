(function (window) {
  "use strict";

  const saveSessionIfPresent = (result) => {
    if (result && (result.token || result.user)) {
      window.api.setAuthSession(result);
    }

    return result;
  };

  window.authService = {
    async register(details) {
      const result = await window.api.register(details || {});
      return saveSessionIfPresent(result);
    },

    async login(credentials) {
      const result = await window.api.login(credentials || {});
      return saveSessionIfPresent(result);
    },

    logout() {
      window.api.clearAuthSession();
    },

    getCurrentUser() {
      return window.api.getAuthUser();
    },

    isLoggedIn() {
      return Boolean(window.api.getAuthToken());
    },
  };
})(window);
