(function (window) {
  "use strict";

  const RAILWAY_API_BASE_URL = "https://thekorachan-website-production.up.railway.app";
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
  const isRailwayHost = window.location.hostname.includes("up.railway.app");
  const API_BASE_URL = isLocalHost || isRailwayHost ? "" : RAILWAY_API_BASE_URL;
  const AUTH_TOKEN_KEY = "auth_token";
  const AUTH_USER_KEY = "auth_user";

  const getAuthToken = () => window.localStorage.getItem(AUTH_TOKEN_KEY);

  const getAuthUser = () => {
    try {
      const savedUser = window.localStorage.getItem(AUTH_USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  };

  const setAuthSession = (session = {}) => {
    if (session.token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    }

    if (session.user) {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
    }
  };

  const clearAuthSession = () => {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  };

  const mapUserAddressPayload = (address = {}) => ({
    user_id: address.userId,
    address_line: address.addressLine,
    city: address.city,
    province: address.province,
    postal_code: address.postalCode,
    phone: address.phone,
  });

  const mapUserCartPayload = (cart = {}) => ({
    user_id: cart.userId,
    status: cart.status,
    created_at: cart.createdAt,
  });

  const mapUserCartItemPayload = (item = {}) => ({
    cart_id: item.cartId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  });

  const mapUserCheckoutPayload = (checkout = {}) => ({
    user_id: checkout.userId,
    cart_id: checkout.cartId,
    address_id: checkout.addressId,
    total_price: checkout.totalPrice,
    payment_type: checkout.paymentType,
    status: checkout.status,
    created_at: checkout.createdAt,
  });

  const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

  const request = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(getApiUrl(endpoint), {
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data && data.message ? data.message : "API request failed";
      throw new Error(message);
    }

    return data;
  };

  window.api = {
    getAuthToken,
    getAuthUser,
    getApiUrl,
    setAuthSession,
    clearAuthSession,

    getProducts() {
      return request("/api/products");
    },

    register(userDetails) {
      return request("/api/register", {
        method: "POST",
        body: JSON.stringify(userDetails),
      });
    },

    login(credentials) {
      return request("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },

    getUserProfile(userId) {
      return request(`/api/users/${encodeURIComponent(userId)}`);
    },

    updateUserProfile(userId, profile) {
      return request(`/api/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
    },

    updateUserPassword(userId, passwordDetails) {
      return request(`/api/users/${encodeURIComponent(userId)}/password`, {
        method: "PATCH",
        body: JSON.stringify(passwordDetails),
      });
    },

    getUserOrders(userId) {
      return request(`/api/users/${encodeURIComponent(userId)}/orders`);
    },

    getUserSavedItems(userId) {
      return request(`/api/users/${encodeURIComponent(userId)}/saved-items`);
    },

    saveUserItem(userId, item) {
      return request(`/api/users/${encodeURIComponent(userId)}/saved-items`, {
        method: "POST",
        body: JSON.stringify(item),
      });
    },

    removeUserSavedItem(userId, savedItemId) {
      return request(`/api/users/${encodeURIComponent(userId)}/saved-items/${encodeURIComponent(savedItemId)}`, {
        method: "DELETE",
      });
    },

    getUserAddresses(userId) {
      return request(`/api/user-addresses?user_id=${encodeURIComponent(userId)}`);
    },

    createUserAddress(address) {
      return request("/api/user-addresses", {
        method: "POST",
        body: JSON.stringify(mapUserAddressPayload(address)),
      });
    },

    createUserCart(cart) {
      return request("/api/user-carts", {
        method: "POST",
        body: JSON.stringify(mapUserCartPayload(cart)),
      });
    },

    createUserCartItem(item) {
      return request("/api/user-cart-items", {
        method: "POST",
        body: JSON.stringify(mapUserCartItemPayload(item)),
      });
    },

    createUserCheckout(checkout) {
      return request("/api/user-checkouts", {
        method: "POST",
        body: JSON.stringify(mapUserCheckoutPayload(checkout)),
      });
    },

    checkout(payload) {
      return request("/api/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
})(window);
