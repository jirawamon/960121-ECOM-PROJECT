(function (window, document) {
  "use strict";

  const STORAGE_KEY = "shopping_cart";

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const createInitialState = () => ({
    items: [],
  });

  const normalizeCart = (value) => {
    if (!value || !Array.isArray(value.items)) {
      return createInitialState();
    }

    return {
      items: value.items
        .filter((item) => item && item.id)
        .map((item) => ({
          ...item,
          quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 1,
        })),
    };
  };

  const loadCart = () => {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      return savedCart ? normalizeCart(JSON.parse(savedCart)) : createInitialState();
    } catch (error) {
      return createInitialState();
    }
  };

  const saveCart = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(window.cartState));
  };

  const getItemCount = () =>
    window.cartState.items.reduce((total, item) => total + Number(item.quantity || 0), 0);

  const updateBagCount = () => {
    const bagCounts = document.querySelectorAll("#bag-count, [data-bag-count]");
    const count = String(getItemCount());

    bagCounts.forEach((bagCount) => {
      bagCount.textContent = count;
    });
  };

  const formatMoney = (value) => currency.format(Number(value) || 0);

  const getSubtotal = () =>
    window.cartState.items.reduce(
      (total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );

  const isSignedIn = () => Boolean(
    window.authService?.isLoggedIn?.() || window.api?.getAuthToken?.()
  );

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  let toastTimer;

  const showToast = (message, emoji = "🛒") => {
    let toast = document.querySelector("#cart-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "cart-toast";
      toast.id = "cart-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML = `
        <span class="cart-toast-emoji" aria-hidden="true"></span>
        <span class="cart-toast-message"></span>
      `;
      document.body.appendChild(toast);
    }

    toast.querySelector(".cart-toast-emoji").textContent = emoji;
    toast.querySelector(".cart-toast-message").textContent = message;
    toast.classList.remove("is-visible");
    window.clearTimeout(toastTimer);

    window.requestAnimationFrame(() => {
      toast.classList.add("is-visible");
    });

    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2400);
  };

  const requestAccountBeforeAdd = () => {
    showToast("Please sign in or create an account before adding to bag.", "!");

    if (document.querySelector(".account-drawer")) {
      document.querySelector("[data-account-open]")?.click();
      return false;
    }

    return false;
  };

  const ensureRemoveDialog = () => {
    let dialog = document.querySelector("#cart-remove-dialog");

    if (dialog) {
      return dialog;
    }

    dialog = document.createElement("div");
    dialog.className = "cart-remove-dialog";
    dialog.id = "cart-remove-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "cart-remove-title");
    dialog.setAttribute("aria-hidden", "true");
    dialog.innerHTML = `
      <button class="cart-remove-dialog-backdrop" type="button" data-cart-confirm="cancel" aria-label="Cancel item removal"></button>
      <div class="cart-remove-dialog-panel" tabindex="-1">
        <h2 id="cart-remove-title">Remove item?</h2>
        <p id="cart-remove-message">This item will be removed from your bag.</p>
        <div class="cart-remove-dialog-actions">
          <button class="cart-remove-cancel" type="button" data-cart-confirm="cancel">Keep Item</button>
          <button class="cart-remove-confirm" type="button" data-cart-confirm="confirm">Remove Item</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    return dialog;
  };

  const confirmRemove = (item) =>
    new Promise((resolve) => {
      const dialog = ensureRemoveDialog();
      const panel = dialog.querySelector(".cart-remove-dialog-panel");
      const message = dialog.querySelector("#cart-remove-message");
      const previousFocus = document.activeElement;

      if (message) {
        message.textContent = item && item.name
          ? `${item.name} will be removed from your bag.`
          : "This item will be removed from your bag.";
      }

      const close = (isConfirmed) => {
        dialog.classList.remove("is-open");
        dialog.setAttribute("aria-hidden", "true");
        document.body.classList.remove("cart-remove-dialog-open");
        dialog.removeEventListener("click", handleClick);
        window.removeEventListener("keydown", handleKeydown);

        if (previousFocus && typeof previousFocus.focus === "function") {
          previousFocus.focus();
        }

        resolve(isConfirmed);
      };

      const handleClick = (event) => {
        const action = event.target.closest("[data-cart-confirm]");

        if (!action) {
          return;
        }

        event.preventDefault();
        close(action.dataset.cartConfirm === "confirm");
      };

      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          close(false);
        }
      };

      dialog.addEventListener("click", handleClick);
      window.addEventListener("keydown", handleKeydown);
      document.body.classList.add("cart-remove-dialog-open");
      dialog.classList.add("is-open");
      dialog.setAttribute("aria-hidden", "false");
      panel?.focus();
    });

  const renderBagDrawer = () => {
    const itemsContainer = document.querySelector("#bag-drawer-items");
    const emptyState = document.querySelector("#bag-drawer-empty");
    const subtotal = document.querySelector("#bag-drawer-subtotal");
    const titleCount = document.querySelector("#bag-drawer-count");

    if (!itemsContainer) {
      return;
    }

    const count = getItemCount();
    const items = window.cartState.items;

    if (titleCount) {
      titleCount.textContent = `(${count} ${count === 1 ? "item" : "items"})`;
    }

    if (subtotal) {
      subtotal.textContent = formatMoney(getSubtotal());
    }

    if (emptyState) {
      emptyState.hidden = items.length > 0;
    }

    itemsContainer.innerHTML = items.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const lineTotal = price * quantity;

      return `
        <article class="bag-drawer-item" data-cart-id="${escapeHtml(item.id)}">
          <img src="${escapeHtml(item.image || "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=360&q=85")}" alt="${escapeHtml(item.name)}">
          <div>
            <div class="bag-drawer-item-heading">
              <h3>${escapeHtml(item.name)}</h3>
              <strong>${formatMoney(lineTotal)}</strong>
            </div>
            <p>${escapeHtml(item.variant || "Core / Regular")}</p>
            <div class="bag-drawer-controls" aria-label="Quantity for ${escapeHtml(item.name)}">
              <button type="button" data-cart-quantity="decrease" aria-label="Decrease quantity">-</button>
              <span>${quantity}</span>
              <button type="button" data-cart-quantity="increase" aria-label="Increase quantity">+</button>
              <button type="button" data-cart-remove>Remove</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  };

  const openBagDrawer = () => {
    const drawer = document.querySelector("#bag-drawer");

    if (!drawer) {
      return;
    }

    renderBagDrawer();
    document.body.classList.add("bag-drawer-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.focus();
  };

  const closeBagDrawer = () => {
    const drawer = document.querySelector("#bag-drawer");

    document.body.classList.remove("bag-drawer-open");

    if (drawer) {
      drawer.setAttribute("aria-hidden", "true");
    }
  };

  const updateItemQuantity = (id, direction) => {
    const item = window.cartState.items.find((cartItem) => cartItem.id === id);

    if (!item) {
      return;
    }

    if (direction === "decrease" && Number(item.quantity || 1) <= 1) {
      requestRemoveItem(id);
      return;
    }

    item.quantity = direction === "increase"
      ? Number(item.quantity || 1) + 1
      : Math.max(Number(item.quantity || 1) - 1, 1);

    saveCart();
    updateBagCount();
    renderBagDrawer();
  };

  const requestRemoveItem = async (id) => {
    const item = window.cartState.items.find((cartItem) => cartItem.id === id);

    if (!item) {
      return;
    }

    if (await confirmRemove(item)) {
      removeItem(id);
    }
  };

  const removeItem = (id) => {
    const removedItem = window.cartState.items.find((item) => item.id === id);

    window.cartState.items = window.cartState.items.filter((item) => item.id !== id);
    saveCart();
    updateBagCount();
    renderBagDrawer();

    if (removedItem) {
      showToast(`${removedItem.name} removed from bag.`, "🗑️");
    }
  };

  const addItem = (product) => {
    if (!product || !product.id) {
      return false;
    }

    if (!isSignedIn()) {
      return requestAccountBeforeAdd();
    }

    const existingItem = window.cartState.items.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      window.cartState.items.push({
        ...product,
        quantity: 1,
      });
    }

    saveCart();
    updateBagCount();
    renderBagDrawer();
    showToast(`${product.name} added to bag.`, "✅");
    return true;
  };

  const requireAccountBeforeAdd = () => isSignedIn() || requestAccountBeforeAdd();

  const clearCart = () => {
    window.cartState.items = [];
    saveCart();
    updateBagCount();
    renderBagDrawer();
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-bag-open]")) {
      event.preventDefault();
      openBagDrawer();
      return;
    }

    if (event.target.closest("[data-bag-close]")) {
      event.preventDefault();
      closeBagDrawer();
      return;
    }

    if (event.target.closest("[data-bag-checkout]")) {
      event.preventDefault();
      window.location.href = "checkout.html";
      return;
    }

    const drawerItem = event.target.closest(".bag-drawer-item");

    if (!drawerItem) {
      return;
    }

    const quantityButton = event.target.closest("[data-cart-quantity]");

    if (quantityButton) {
      updateItemQuantity(drawerItem.dataset.cartId, quantityButton.dataset.cartQuantity);
      return;
    }

    if (event.target.closest("[data-cart-remove]")) {
      requestRemoveItem(drawerItem.dataset.cartId);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("bag-drawer-open")) {
      closeBagDrawer();
    }
  });

  window.cartState = loadCart();

  window.cartService = {
    addItem,
    clearCart,
    closeBagDrawer,
    getItemCount,
    getSubtotal,
    isSignedIn,
    loadCart,
    openBagDrawer,
    removeItem,
    renderBagDrawer,
    requireAccountBeforeAdd,
    requestRemoveItem,
    saveCart,
    showToast,
    updateItemQuantity,
    updateBagCount,
  };

  window.cartConfirm = {
    confirmRemove,
  };

  updateBagCount();
})(window, document);
