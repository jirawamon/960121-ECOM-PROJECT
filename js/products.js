(function (window, document) {
  "use strict";

  const normalizePrice = (priceText) => {
    const amount = Number(String(priceText).replace(/[^0-9.]/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  };

  const slugify = (value) =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getImageUrl = (product) => {
    const image = product.image_url || product.image || "";

    if (!image || image === "xxx") {
      return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85";
    }

    return image;
  };

  const formatPrice = (product) => {
    const price = Number(product.price);

    if (!Number.isFinite(price)) {
      return "";
    }

    return `$${price.toLocaleString("en-US")}`;
  };

  const getProductSearchText = (product) => [
    product.name,
    product.variant,
    product.category,
    product.description,
  ].join(" ").toLowerCase();

  const isDenimProduct = (product) => /denim|jean|chambray|indigo|wash/.test(getProductSearchText(product));
  const colorRules = [
    ["white", /white|ivory/i],
    ["black", /black|charcoal|graphite/i],
    ["blue", /blue|navy|indigo|wash|denim/i],
    ["gray", /grey|gray|heather/i],
    ["green", /olive|green/i],
    ["neutral", /cream|stone|natural|sand|khaki|oat|beige|brown/i],
  ];
  const colorLabels = {
    white: "White",
    black: "Black",
    blue: "Blue",
    gray: "Gray",
    green: "Green",
    neutral: "Neutral",
  };
  const defaultSizes = ["XS", "S", "M", "L", "XL"];
  let loadedProducts = [];

  const getColorKey = (product) => {
    const text = getProductSearchText(product);
    const match = colorRules.find(([, pattern]) => pattern.test(text));

    return match ? match[0] : "neutral";
  };

  const getColorKeys = (product) => {
    const text = getProductSearchText(product);
    const matches = colorRules
      .filter(([, pattern]) => pattern.test(text))
      .map(([key]) => key);

    return matches.length ? matches : ["neutral"];
  };

  const normalizeList = (value, fallback = []) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
      return value.split(/[,/|]+/).map((item) => item.trim()).filter(Boolean);
    }

    return fallback;
  };

  const normalizeProduct = (product, index) => {
    const name = product.name || `Product ${index + 1}`;
    const id = product.id || product.slug || slugify(name) || `product-${index + 1}`;
    const variant = product.variant || product.category || product.description || "";
    const priceText = product.priceText || formatPrice(product);

    return {
      id: String(id),
      name,
      variant,
      price: Number(product.price) || normalizePrice(priceText),
      priceText,
      image: getImageUrl(product),
      category: product.category || "",
      description: product.description || "",
      badge: product.badge || (Number(product.stock) > 0 ? "In Stock" : ""),
      reviews: Number(product.review_count || product.reviews) || 0,
      rating: Number(product.rating) || 4,
      stock: Number(product.stock) || 0,
      colorKey: getColorKey(product),
      colorKeys: getColorKeys(product),
      sizeKeys: normalizeList(product.sizes || product.size, defaultSizes).map((size) => size.toUpperCase()),
      quantity: 1,
    };
  };

  const createProductCard = (product, index) => {
    const normalizedProduct = normalizeProduct(product, index);

    return `
      <article class="product-card" data-product-id="${escapeHtml(normalizedProduct.id)}">
        <div class="product-media">
          <img src="${escapeHtml(normalizedProduct.image)}" alt="${escapeHtml(normalizedProduct.name)}">
        </div>
        <div class="product-info">
          <h3>${escapeHtml(normalizedProduct.name)}</h3>
          <div class="product-meta">
            <span>${escapeHtml(normalizedProduct.variant)}</span>
            <span>${escapeHtml(normalizedProduct.priceText)}</span>
          </div>
          <div class="swatches" aria-label="Available colors">
            <span class="swatch white"></span>
            <span class="swatch"></span>
          </div>
          <button class="add-button" type="button">Add to bag</button>
        </div>
      </article>
    `;
  };

  const getProductFromCard = (card, index) => {
    const title = card.querySelector("h3")?.textContent.trim() || `Product ${index + 1}`;
    const metaItems = Array.from(card.querySelectorAll(".product-meta span")).map((item) =>
      item.textContent.trim()
    );
    const image = card.querySelector("img");
    const id = card.dataset.productId || slugify(title) || `product-${index + 1}`;

    if (!card.dataset.productId) {
      card.dataset.productId = id;
    }

    return {
      id,
      name: title,
      variant: metaItems[0] || "",
      price: normalizePrice(metaItems[1] || ""),
      priceText: metaItems[1] || "",
      image: image ? image.currentSrc || image.src : "",
      colorKey: "white",
      colorKeys: ["white"],
      sizeKeys: defaultSizes,
      quantity: 1,
    };
  };

  const getProductsFromDom = () =>
    Array.from(document.querySelectorAll(".product-card")).map((card, index) =>
      getProductFromCard(card, index)
    );

  const updateProductCount = (products) => {
    const count = document.querySelector("#products-count");

    if (count) {
      count.textContent = `${products.length} items`;
    }
  };

  const findCardProduct = (button) => {
    const card = button.closest(".product-card");

    if (!card) {
      return null;
    }

    const cards = Array.from(document.querySelectorAll(".product-card"));
    const product = getProductFromCard(card, cards.indexOf(card));

    return loadedProducts.find((item) => item.id === product.id) || product;
  };

  const renderProductGrid = (grid, products, emptyMessage) => {
    if (!grid) {
      return false;
    }

    if (!Array.isArray(products) || !products.length) {
      grid.innerHTML = `<p class="home-products-status">${escapeHtml(emptyMessage)}</p>`;
      return false;
    }

    grid.innerHTML = products.map(createProductCard).join("");
    return true;
  };

  const renderProducts = (products) => {
    const grid = document.querySelector("#products-grid");
    const denimGrid = document.querySelector("#denim-products-grid");
    const normalizedProducts = Array.isArray(products)
      ? products.map(normalizeProduct)
      : [];
    const denimProducts = normalizedProducts.filter(isDenimProduct);
    loadedProducts = normalizedProducts;

    if (!grid || !normalizedProducts.length) {
      renderProductGrid(grid, [], "No database products are available right now.");
      renderProductGrid(denimGrid, [], "No denim products are available in the database yet.");
      updateProductCount([]);
      return false;
    }

    renderProductGrid(grid, normalizedProducts, "No database products are available right now.");
    renderProductGrid(denimGrid, denimProducts, "No denim products are available in the database yet.");
    updateProductCount(normalizedProducts);

    return true;
  };

  const loadProducts = async () => {
    if (!window.api || !window.api.getProducts) {
      const domProducts = getProductsFromDom();
      loadedProducts = domProducts;
      updateProductCount(domProducts);
      return domProducts;
    }

    try {
      const products = await window.api.getProducts();

      if (Array.isArray(products) && products.length) {
        renderProducts(products);
        return loadedProducts;
      }
    } catch (error) {
      renderProducts([]);
      return [];
    }

    renderProducts([]);
    return [];
  };

  const createPriceMarkup = (product) => {
    const priceText = product.priceText || `$${Number(product.price || 0).toLocaleString("en-US")}`;
    return `<strong>${escapeHtml(priceText)}</strong>`;
  };

  const createSwatchOptions = (product) => {
    const colors = (product.colorKeys || [product.colorKey || getColorKey(product)])
      .filter(Boolean)
      .filter((name, index, list) => list.indexOf(name) === index)
      .slice(0, 4);

    return colors.map((name) => {
      const label = colorLabels[name] || name;
      return `<button class="detail-swatch-option" type="button" data-detail-option="color" data-option-value="${escapeHtml(label)}" aria-pressed="false"><span class="swatch ${escapeHtml(name)}" aria-hidden="true"></span>${escapeHtml(label)}</button>`;
    }).join("");
  };

  const getSelectedOptions = () => ({
    color: document.querySelector('[data-detail-option="color"].is-selected')?.dataset.optionValue || "",
    size: document.querySelector('[data-detail-option="size"].is-selected')?.dataset.optionValue || "",
  });

  const updateDetailAddState = () => {
    const selected = getSelectedOptions();
    const addButton = document.querySelector("[data-detail-add]");
    const message = document.querySelector("[data-detail-choice-message]");
    const isReady = Boolean(selected.color && selected.size);

    if (addButton) {
      addButton.disabled = !isReady;
    }

    if (message) {
      message.textContent = isReady ? `Selected: ${selected.color} / ${selected.size}` : "Please choose color and size before adding.";
      message.classList.toggle("is-ready", isReady);
    }
  };

  const selectDetailOption = (button) => {
    const optionType = button.dataset.detailOption;
    const group = button.closest(optionType === "color" ? ".detail-swatches" : ".detail-size-list");

    if (!group) {
      return;
    }

    group.querySelectorAll("[data-detail-option]").forEach((option) => {
      const isSelected = option === button;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-pressed", String(isSelected));
    });

    updateDetailAddState();
  };

  const createSelectedProduct = (product) => {
    const selected = getSelectedOptions();
    const variantParts = [selected.color, selected.size].filter(Boolean);
    const optionId = variantParts.map(slugify).filter(Boolean).join("-");

    return {
      ...product,
      id: optionId ? `${product.id}-${optionId}` : product.id,
      baseId: product.id,
      selectedColor: selected.color,
      selectedSize: selected.size,
      variant: variantParts.length ? variantParts.join(" / ") : product.variant,
    };
  };

  const closeProductSelection = () => {
    const drawer = document.querySelector("#product-detail-drawer");
    document.body.classList.remove("product-detail-open");

    if (drawer) {
      drawer.setAttribute("aria-hidden", "true");
    }
  };

  const openProductSelection = (product) => {
    const drawer = document.querySelector("#product-detail-drawer");
    const content = document.querySelector("#product-detail-content");
    const normalizedProduct = normalizeProduct(product || {}, 0);

    if (!drawer || !content || !normalizedProduct.id) {
      return false;
    }

    const sizes = (normalizedProduct.sizeKeys || defaultSizes).map((size) => `<button type="button" data-detail-option="size" data-option-value="${escapeHtml(size)}" aria-pressed="false">${escapeHtml(size)}</button>`).join("");
    const stockText = Number(normalizedProduct.stock) > 0 ? `${Number(normalizedProduct.stock)} in stock` : normalizedProduct.badge || "Available";

    content.innerHTML = `
      <div class="product-detail-media">
        <img src="${escapeHtml(normalizedProduct.image)}" alt="${escapeHtml(normalizedProduct.name)}">
      </div>
      <div class="product-detail-content">
        <div class="product-detail-header">
          <div>
            <p>${escapeHtml(normalizedProduct.category || "Core")}</p>
            <h2 id="product-detail-title">${escapeHtml(normalizedProduct.name)}</h2>
          </div>
          <button class="product-detail-close" type="button" data-detail-close aria-label="Close product details">x</button>
        </div>
        <div class="product-price-line">${createPriceMarkup(normalizedProduct)}</div>
        <p class="product-detail-description">${escapeHtml(normalizedProduct.description || normalizedProduct.variant || "Clean everyday shape with an easy MONOFORM fit.")}</p>
        <div class="product-detail-rating" aria-label="Rating ${Number(normalizedProduct.rating).toFixed(1)} out of 5">
          <span aria-hidden="true">★★★★★</span>
          <strong>${Number(normalizedProduct.rating).toFixed(1).replace(/\.0$/, "")} / 5</strong>
          <small>${Number(normalizedProduct.reviews) || 0} reviews</small>
        </div>
        <section class="product-detail-section" aria-label="Available colors">
          <h3>Color</h3>
          <div class="detail-swatches">${createSwatchOptions(normalizedProduct)}</div>
        </section>
        <section class="product-detail-section" aria-label="Available sizes">
          <h3>Size</h3>
          <div class="detail-size-list">${sizes}</div>
        </section>
        <p class="product-detail-choice-message" data-detail-choice-message>Please choose color and size before adding.</p>
        <div class="product-detail-meta">
          <p><span>Availability</span>${escapeHtml(stockText)}</p>
        </div>
        <button class="product-detail-add" type="button" data-detail-add disabled>Add to bag</button>
      </div>
    `;

    drawer.dataset.product = JSON.stringify(normalizedProduct);
    document.body.classList.add("product-detail-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.focus();
    return true;
  };

  document.addEventListener("click", (event) => {
    const detailOption = event.target.closest("[data-detail-option]");

    if (detailOption) {
      selectDetailOption(detailOption);
      return;
    }

    if (event.target.closest("[data-detail-close]")) {
      closeProductSelection();
      return;
    }

    if (event.target.closest("[data-detail-add]")) {
      const drawer = document.querySelector("#product-detail-drawer");
      const savedProduct = drawer?.dataset.product ? JSON.parse(drawer.dataset.product) : null;

      if (savedProduct && window.cartService.addItem(createSelectedProduct(savedProduct))) {
        closeProductSelection();
        window.cartService.openBagDrawer();
      }
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeProductSelection();
    }
  });

  window.productService = {
    findCardProduct,
    getProductsFromDom,
    loadProducts,
    openProductSelection,
    renderProducts,
  };
})(window, document);
