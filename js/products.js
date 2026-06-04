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
    return getProductFromCard(card, cards.indexOf(card));
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
      updateProductCount(domProducts);
      return domProducts;
    }

    try {
      const products = await window.api.getProducts();

      if (Array.isArray(products) && products.length) {
        renderProducts(products);
        return products.map(normalizeProduct);
      }
    } catch (error) {
      renderProducts([]);
      return [];
    }

    renderProducts([]);
    return [];
  };

  window.productService = {
    findCardProduct,
    getProductsFromDom,
    loadProducts,
    renderProducts,
  };
})(window, document);
