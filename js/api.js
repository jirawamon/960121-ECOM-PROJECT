(function (window) {
  "use strict";

  const API_BASE_URL = "";
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

  const request = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
