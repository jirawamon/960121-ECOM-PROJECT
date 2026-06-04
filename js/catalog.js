(function (window, document) {
  "use strict";

  const pageSize = 12;
  const images = [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1506629905607-d7e0881763f4?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85",
  ];
  const productSource = [
    ["Varsity Logo Graphic Relaxed Sweater", "White / Cream", 68, 98, "Best Seller", 42],
    ["90s Denim Shorts", "Light wash", 84, 108, "Best Seller", 88],
    ["Classic Trucker Jacket", "Medium wash", 98, 140, "Best Seller", 120],
    ["Monogram Relaxed Tee", "White", 52, 68, "New Arrival", 31],
    ["Baggy Cotton Stretch Pants", "Stone", 74, 99, "", 18],
    ["Linen Cotton Button-Down Shirt", "Natural", 88, 120, "Best Seller", 51],
    ["90s Straight Chino Pants", "Charcoal", 78, 108, "New Arrival", 26],
    ["Cotton Blend Relaxed T-Shirt", "Black", 40, 54, "", 64],
    ["Printed Tech Short", "Navy", 58, 79, "", 29],
    ["Linen Cotton Button-Down Shirt", "Sky blue", 88, 120, "New Arrival", 43],
    ["90s Baggy Chino Shorts", "Khaki", 64, 88, "", 36],
    ["Classic Harrington Jacket", "Black", 118, 158, "Best Seller", 72],
    ["Straight Bright Jeans", "Indigo", 108, 148, "Best Seller", 103],
    ["Premium Terry Relaxed Sweatshirt", "Heather grey", 86, 118, "", 56],
    ["Chambray Pull-On Shirt", "Washed blue", 72, 98, "New Arrival", 22],
    ["Linen Blend Polo Sweater", "Ivory", 94, 130, "", 39],
    ["Relaxed Oxford Shirt", "White", 76, 98, "", 81],
    ["Utility Overshirt", "Olive", 112, 148, "New Arrival", 24],
    ["Core Rib Tank", "White", 34, 48, "", 18],
    ["Straight Twill Trouser", "Black", 92, 128, "Best Seller", 47],
    ["Washed Denim Shirt", "Vintage wash", 86, 118, "", 52],
    ["Lightweight Bomber Jacket", "Sand", 128, 168, "New Arrival", 28],
    ["Cotton Crew Socks Pack", "White / Black", 22, 32, "", 12],
    ["Logo Canvas Tote", "Natural", 48, 68, "", 35],
    ["Relaxed Workwear Shirt", "Graphite", 82, 108, "Best Seller", 65],
    ["Summer Camp Collar Shirt", "White", 78, 104, "New Arrival", 21],
    ["Soft Drawstring Shorts", "Oat", 58, 78, "", 45],
    ["Tapered Utility Pants", "Olive", 98, 128, "", 33],
  ];

  const categoryRules = [
    ["accessories", /tote|bag|sock|eyewear|cap|belt|accessor/i],
    ["underwear", /underwear|brief|boxer|tank/i],
    ["outerwear", /jacket|bomber|harrington|overshirt|trucker/i],
    ["denim", /denim|jean|chambray/i],
    ["bottoms", /pant|trouser|short|chino/i],
    ["tops", /shirt|tee|t-shirt|sweater|sweatshirt|polo|knit/i],
  ];
  const colorRules = [
    ["white", /white|ivory/i],
    ["black", /black|charcoal|graphite/i],
    ["blue", /blue|navy|indigo|wash|denim/i],
    ["gray", /grey|gray|heather/i],
    ["green", /olive|green/i],
    ["neutral", /cream|stone|natural|sand|khaki|oat|beige|brown/i],
  ];
  const sizesByIndex = [
    ["S", "M", "L"],
    ["XS", "S", "M", "L"],
    ["M", "L", "XL"],
    ["S", "M", "L", "XL"],
  ];
  const swatchOptions = ["white", "gray", "stone", "denim", "black"];
  const colorLabels = {
    white: "White",
    black: "Black",
    blue: "Blue",
    denim: "Blue",
    gray: "Gray",
    green: "Green",
    neutral: "Neutral",
    stone: "Neutral",
  };

  const slugify = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const firstMatchingRule = (value, rules, fallback) => {
    const match = rules.find(([, pattern]) => pattern.test(value));
    return match ? match[0] : fallback;
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

  const getProductMeta = (product, index) => {
    const text = [product.name, product.variant, product.category, product.description, product.badge].join(" ");
    const category = slugify(product.category);
    const normalizedCategory = categoryRules.some(([key]) => key === category)
      ? category
      : firstMatchingRule(text, categoryRules, "tops");
    const color = firstMatchingRule(text, colorRules, "neutral");
    const sizes = normalizeList(product.sizes || product.size, sizesByIndex[index % sizesByIndex.length]);
    const badge = slugify(product.badge);
    const collection = badge.includes("new")
      ? "new-arrival"
      : badge.includes("best")
        ? "best-seller"
        : Number(product.comparePrice) > Number(product.price)
          ? "sale"
          : "core";

    return {
      categoryKey: normalizedCategory,
      colorKey: color,
      sizeKeys: sizes.map((size) => size.toUpperCase()),
      collectionKey: collection || "core",
    };
  };

  const fallbackProducts = productSource.map(([name, variant, price, comparePrice, badge, reviews], index) => ({
    id: `catalog-${index + 1}`,
    name,
    variant,
    price,
    comparePrice,
    priceText: `$${price}`,
    badge,
    reviews,
    rating: 4 + (index % 10) / 10,
    image: images[index % images.length],
    colorCount: 1 + (index % 6),
    category: "",
    description: variant,
    index,
    quantity: 1,
  })).map((product, index) => ({ ...product, ...getProductMeta(product, index) }));

  let products = [...fallbackProducts];
  let visibleProducts = [...products];
  let renderedCount = 0;
  let isLoading = false;
  let currentSort = "featured";
  let debounceTimer;
  const filters = {
    keyword: "",
    category: "",
    priceRange: "",
    color: "",
    size: "",
    collection: "",
    minPrice: "",
    maxPrice: "",
  };

  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const formatPrice = (value) => `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
  const formatRating = (value) => (Number(value) || 0).toFixed(1).replace(/\.0$/, "");

  const getProductImage = (product, index) => {
    const image = product.image_url || product.image || "";

    if (!image || image === "xxx") {
      return images[index % images.length];
    }

    return image;
  };

  const normalizeApiProduct = (product, index) => {
    const price = Number(product.price) || 0;
    const comparePrice = Number(product.compare_price || product.comparePrice) || price;

    const normalized = {
      id: String(product.id || `api-product-${index + 1}`),
      name: product.name || `Product ${index + 1}`,
      variant: product.category || product.description || "Core / Regular",
      price,
      comparePrice: Math.max(comparePrice, price),
      priceText: `$${price}`,
      badge: Number(product.stock) > 0 ? product.badge || "In Stock" : "Sold Out",
      reviews: Number(product.review_count || product.reviews) || 0,
      rating: Number(product.rating) || 4,
      image: getProductImage(product, index),
      colorCount: 1 + (index % 6),
      category: product.category || "",
      description: product.description || "",
      stock: Number(product.stock) || 0,
      index,
      quantity: 1,
    };

    return { ...normalized, ...getProductMeta(product, index) };
  };

  const loadProductsFromApi = async () => {
    if (!window.api || !window.api.getProducts) {
      return fallbackProducts;
    }

    try {
      const apiProducts = await window.api.getProducts();

      if (Array.isArray(apiProducts) && apiProducts.length) {
        return apiProducts.map(normalizeApiProduct);
      }
    } catch (error) {
      return fallbackProducts;
    }

    return fallbackProducts;
  };

  const updateCount = () => {
    const label = `${visibleProducts.length.toLocaleString("en-US")} Items`;
    document.querySelector("#products-count").textContent = label;
    document.querySelector("[data-filter-count]").textContent = label;
  };

  const matchesKeyword = (product, keyword) => {
    if (!keyword) {
      return true;
    }

    return [
      product.name,
      product.variant,
      product.category,
      product.description,
      product.categoryKey,
      product.colorKey,
      product.collectionKey,
      ...(product.sizeKeys || []),
    ].some((value) => String(value || "").toLowerCase().includes(keyword));
  };

  const matchesPriceRange = (price, range) => {
    if (!range) return true;
    if (range === "under-50") return price < 50;
    if (range === "50-75") return price >= 50 && price <= 75;
    if (range === "75-100") return price >= 75 && price <= 100;
    if (range === "100-plus") return price >= 100;
    return true;
  };

  const applyFilters = () => {
    const keyword = filters.keyword.trim().toLowerCase();
    const category = filters.category.trim().toLowerCase();
    const color = filters.color.trim().toLowerCase();
    const size = filters.size.trim().toUpperCase();
    const collection = filters.collection.trim().toLowerCase();
    const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);

    visibleProducts = products.filter((product) => {
      const price = Number(product.price) || 0;

      return matchesKeyword(product, keyword)
        && (!category || product.categoryKey === category)
        && matchesPriceRange(price, filters.priceRange)
        && (!color || product.colorKey === color)
        && (!size || product.sizeKeys.includes(size))
        && (!collection || product.collectionKey === collection)
        && (minPrice === null || price >= minPrice)
        && (maxPrice === null || price <= maxPrice);
    });
  };

  const applySort = () => {
    if (currentSort === "newest") visibleProducts.sort((a, b) => b.index - a.index);
    if (currentSort === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
    if (currentSort === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
    if (currentSort === "top-rated") visibleProducts.sort((a, b) => b.rating - a.rating);
  };

  const updateCatalog = () => {
    applyFilters();
    applySort();
    render();
    updateFilterLabels();
  };

  const updateFilterLabels = () => {
    document.querySelectorAll(".filter-pills label").forEach((label) => {
      const field = label.querySelector("[data-catalog-filter]");
      label.classList.toggle("has-value", Boolean(field && field.value));
    });
  };

  const debounce = (callback, delay = 300) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, delay);
  };

  const getProductColors = (product, index) => {
    const primary = product.colorKey === "blue"
      ? "denim"
      : product.colorKey === "neutral"
        ? "stone"
        : product.colorKey;
    const maxColors = Math.min(5, Number(product.colorCount) || 2 + (index % 4));
    return [primary, ...swatchOptions]
      .filter(Boolean)
      .filter((name, swatchIndex, list) => list.indexOf(name) === swatchIndex)
      .slice(0, maxColors);
  };

  const createSwatches = (product, index, withLabels = false) => getProductColors(product, index).map((name) => {
    const label = colorLabels[name] || name;
    return withLabels
      ? `<button class="detail-swatch-option" type="button" data-detail-option="color" data-option-value="${escapeHtml(label)}" aria-pressed="false"><span class="swatch ${name}" aria-hidden="true"></span>${escapeHtml(label)}</button>`
      : `<span class="swatch ${name}" title="${escapeHtml(label)}"></span>`;
  }).join("");

  const createPriceMarkup = (product) => {
    const hasDiscount = product.comparePrice > product.price;
    const discount = hasDiscount
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : 0;

    return {
      hasDiscount,
      markup: hasDiscount
        ? `<span>${formatPrice(product.comparePrice)}</span><strong>${formatPrice(product.price)}</strong><em>${discount}% off</em>`
        : `<strong>${formatPrice(product.price)}</strong>`,
    };
  };

  const createCard = (product, index) => {
    const price = createPriceMarkup(product);

    return `
      <article class="product-card catalog-card" data-product-id="${escapeHtml(product.id)}" data-product-index="${index}" role="button" tabindex="0" aria-label="View details for ${escapeHtml(product.name)}">
        <div class="product-media">
          ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <div class="product-price-line${price.hasDiscount ? " is-sale" : ""}">${price.markup}</div>
          <p>Extra 20% off $100+</p>
          <div class="swatches" aria-label="Available colors">${createSwatches(product, index)}</div>
          <small>+ ${product.colorCount} colors</small>
          <div class="product-rating"><span>★★★★★</span><small>(${product.reviews})</small></div>
          <button class="add-button" type="button">Add to bag</button>
        </div>
      </article>
    `;
  };

  const createPromoTile = () => `
    <article class="catalog-promo-card">
      <img src="https://images.unsplash.com/photo-1506629905607-d7e0881763f4?auto=format&fit=crop&w=900&q=85" alt="Summer menswear editorial">
      <div><h2>New Arrivals</h2><p>Lightweight knits, shorts, and layers for summer heat.</p><a href="products.html">Shop New</a></div>
    </article>
  `;

  const setLoader = (visible) => {
    document.querySelector("[data-catalog-loader]").hidden = !visible;
  };

  const appendNextProducts = () => {
    const grid = document.querySelector("#products-grid");
    if (!grid || renderedCount >= visibleProducts.length || isLoading) {
      setLoader(false);
      return;
    }
    isLoading = true;
    setLoader(true);
    window.setTimeout(() => {
      const nextProducts = visibleProducts.slice(renderedCount, renderedCount + pageSize);
      const cards = nextProducts.map((product, offset) => createCard(product, renderedCount + offset));
      if (renderedCount === pageSize && visibleProducts.length > pageSize + 3) {
        cards.splice(3, 0, createPromoTile());
      }
      grid.insertAdjacentHTML("beforeend", cards.join(""));
      renderedCount += nextProducts.length;
      isLoading = false;
      setLoader(renderedCount < visibleProducts.length);
    }, 180);
  };

  const render = () => {
    document.querySelector("#products-grid").innerHTML = "";
    renderedCount = 0;
    updateCount();
    document.querySelector("[data-catalog-empty]").hidden = visibleProducts.length > 0;
    appendNextProducts();
  };

  const sortProducts = (type) => {
    currentSort = type;
    updateCatalog();
  };

  const updateFilter = (field, value) => {
    filters[field] = value;
    document.querySelectorAll(`[data-catalog-filter="${field}"]`).forEach((input) => {
      if (input.value !== value) {
        input.value = value;
      }
    });
    updateCatalog();
  };

  const clearFilters = () => {
    Object.keys(filters).forEach((key) => {
      filters[key] = "";
    });

    document.querySelectorAll("[data-catalog-filter]").forEach((field) => {
      field.value = "";
    });

    updateCatalog();
  };

  const openFilter = () => {
    document.body.classList.add("filter-drawer-open");
    document.querySelector("#filter-drawer").setAttribute("aria-hidden", "false");
  };

  const closeFilter = () => {
    document.body.classList.remove("filter-drawer-open");
    document.querySelector("#filter-drawer").setAttribute("aria-hidden", "true");
  };

  const openProductDetail = (product) => {
    const drawer = document.querySelector("#product-detail-drawer");
    const content = document.querySelector("#product-detail-content");

    if (!drawer || !content || !product) {
      return;
    }

    const price = createPriceMarkup(product);
    const index = Number(product.index) || 0;
    const category = product.category || product.categoryKey || "Core";
    const sizes = (product.sizeKeys || []).map((size) => `<button type="button" data-detail-option="size" data-option-value="${escapeHtml(size)}" aria-pressed="false">${escapeHtml(size)}</button>`).join("");
    const stockText = Number(product.stock) > 0 ? `${Number(product.stock)} in stock` : product.badge || "Available";

    content.innerHTML = `
      <div class="product-detail-media">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="product-detail-content">
        <div class="product-detail-header">
          <div>
            <p>${escapeHtml(category)}</p>
            <h2 id="product-detail-title">${escapeHtml(product.name)}</h2>
          </div>
          <button class="product-detail-close" type="button" data-detail-close aria-label="Close product details">x</button>
        </div>
        <div class="product-price-line${price.hasDiscount ? " is-sale" : ""}">${price.markup}</div>
        <p class="product-detail-description">${escapeHtml(product.description || product.variant || "Clean everyday shape with an easy MONOFORM fit.")}</p>
        <div class="product-detail-rating" aria-label="Rating ${formatRating(product.rating)} out of 5">
          <span aria-hidden="true">★★★★★</span>
          <strong>${formatRating(product.rating)} / 5</strong>
          <small>${Number(product.reviews) || 0} reviews</small>
        </div>
        <section class="product-detail-section" aria-label="Available colors">
          <h3>Color</h3>
          <div class="detail-swatches">${createSwatches(product, index, true)}</div>
        </section>
        <section class="product-detail-section" aria-label="Available sizes">
          <h3>Size</h3>
          <div class="detail-size-list">${sizes || "<button type=\"button\" data-detail-option=\"size\" data-option-value=\"One Size\" aria-pressed=\"false\">One Size</button>"}</div>
        </section>
        <p class="product-detail-choice-message" data-detail-choice-message>Please choose color and size before adding.</p>
        <div class="product-detail-meta">
          <p><span>Availability</span>${escapeHtml(stockText)}</p>
          <p><span>Collection</span>${escapeHtml(product.collectionKey || "core")}</p>
        </div>
        <button class="product-detail-add" type="button" data-detail-add disabled>Add to bag</button>
        <button class="product-detail-save" type="button" data-detail-save>Save as favorite item</button>
      </div>
    `;

    drawer.dataset.productId = product.id;
    document.body.classList.add("product-detail-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.focus();
  };

  const closeProductDetail = () => {
    const drawer = document.querySelector("#product-detail-drawer");
    document.body.classList.remove("product-detail-open");

    if (drawer) {
      drawer.setAttribute("aria-hidden", "true");
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

  const getSelectedDetailOptions = () => {
    const color = document.querySelector('[data-detail-option="color"].is-selected')?.dataset.optionValue || "";
    const size = document.querySelector('[data-detail-option="size"].is-selected')?.dataset.optionValue || "";

    return { color, size };
  };

  const getCurrentUser = () => window.api?.getAuthUser ? window.api.getAuthUser() : null;

  const saveFavoriteProduct = async (product) => {
    if (!window.cartService?.isSignedIn?.()) {
      window.cartService?.showToast?.("Please sign in or create an account before saving favorites.", "!");
      return false;
    }

    const user = getCurrentUser();

    if (!user?.id || !window.api?.saveUserItem) {
      window.cartService?.showToast?.("Please sign in or create an account before saving favorites.", "!");
      return false;
    }

    const selected = getSelectedDetailOptions();
    const variantParts = [selected.color, selected.size].filter(Boolean);
    const savedItem = {
      productId: String(product.id),
      name: product.name,
      price: product.price,
      image: product.image,
      variant: variantParts.length ? variantParts.join(" / ") : product.variant || product.category || "Favorite item",
    };

    try {
      await window.api.saveUserItem(user.id, savedItem);
      window.cartService?.showToast?.(`${product.name} saved to favorites.`, "♡");
      return true;
    } catch (error) {
      window.cartService?.showToast?.(error.message || "Could not save favorite item.", "!");
      return false;
    }
  };

  const updateDetailAddState = () => {
    const selected = getSelectedDetailOptions();
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

  const createSelectedProduct = (product) => {
    const selected = getSelectedDetailOptions();
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

  const addProductToBag = (button) => {
    const card = button.closest(".product-card");
    const product = visibleProducts[Number(card.dataset.productIndex)];
    if (!window.cartService.addItem(product)) {
      return;
    }

    window.cartService.openBagDrawer();
    button.textContent = "Added";
    window.setTimeout(() => {
      button.textContent = "Add to bag";
    }, 900);
  };

  const init = async () => {
    products = await loadProductsFromApi();
    visibleProducts = [...products];
    render();
    const loadMoreIfNearBottom = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 900) {
        appendNextProducts();
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) appendNextProducts();
    }, { rootMargin: "700px" });
    observer.observe(document.querySelector("[data-catalog-loader]"));
    window.addEventListener("scroll", loadMoreIfNearBottom, { passive: true });
    window.addEventListener("wheel", loadMoreIfNearBottom, { passive: true });
    window.setInterval(loadMoreIfNearBottom, 600);
    document.querySelector("[data-product-sort]").addEventListener("change", (event) => sortProducts(event.target.value));
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-filter-open]")) openFilter();
      if (event.target.closest("[data-filter-clear]")) clearFilters();
      if (event.target.closest("[data-filter-close]")) closeFilter();
      if (event.target.closest("[data-detail-close]")) closeProductDetail();
      const detailOption = event.target.closest("[data-detail-option]");
      if (detailOption) {
        selectDetailOption(detailOption);
        return;
      }
      if (event.target.closest("[data-detail-add]")) {
        const detailDrawer = document.querySelector("#product-detail-drawer");
        const product = products.find((item) => item.id === detailDrawer?.dataset.productId);
        if (product) {
          if (!window.cartService.addItem(createSelectedProduct(product))) {
            return;
          }

          closeProductDetail();
          window.cartService.openBagDrawer();
        }
        return;
      }
      if (event.target.closest("[data-detail-save]")) {
        const detailDrawer = document.querySelector("#product-detail-drawer");
        const product = products.find((item) => item.id === detailDrawer?.dataset.productId);

        if (product) {
          saveFavoriteProduct(product);
        }

        return;
      }
      const addButton = event.target.closest(".add-button");
      if (addButton) {
        if (!window.cartService.requireAccountBeforeAdd()) {
          return;
        }

        const card = addButton.closest(".product-card");
        openProductDetail(visibleProducts[Number(card.dataset.productIndex)]);
        return;
      }
      const productCard = event.target.closest(".product-card");
      if (productCard) {
        openProductDetail(visibleProducts[Number(productCard.dataset.productIndex)]);
      }
    });
    document.addEventListener("keydown", (event) => {
      const productCard = event.target.closest(".product-card");
      if (!productCard || (event.key !== "Enter" && event.key !== " ")) {
        return;
      }

      event.preventDefault();
      openProductDetail(visibleProducts[Number(productCard.dataset.productIndex)]);
    });
    document.addEventListener("input", (event) => {
      const field = event.target.closest("[data-catalog-filter]");

      if (!field) {
        return;
      }

      if (field.dataset.catalogFilter === "keyword") {
        debounce(() => updateFilter(field.dataset.catalogFilter, field.value));
        return;
      }

      updateFilter(field.dataset.catalogFilter, field.value);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeFilter();
        closeProductDetail();
      }
    });
    window.cartService.updateBagCount();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
