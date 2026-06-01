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
  const products = productSource.map(([name, variant, price, comparePrice, badge, reviews], index) => ({
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
    index,
    quantity: 1,
  }));

  let visibleProducts = [...products];
  let renderedCount = 0;
  let isLoading = false;

  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const formatPrice = (value) => `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;

  const updateCount = () => {
    const label = `${products.length.toLocaleString("en-US")} Items`;
    document.querySelector("#products-count").textContent = label;
    document.querySelector("[data-filter-count]").textContent = label;
  };

  const createSwatches = (index) => ["white", "gray", "stone", "denim", "black"].slice(0, Math.min(5, 2 + (index % 4))).map((name) => `<span class="swatch ${name}"></span>`).join("");

  const createCard = (product, index) => {
    const discount = Math.round((1 - product.price / product.comparePrice) * 100);
    return `
      <article class="product-card catalog-card" data-product-id="${escapeHtml(product.id)}" data-product-index="${index}">
        <div class="product-media">
          ${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ""}
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
        <div class="product-info">
          <h3>${escapeHtml(product.name)}</h3>
          <div class="product-price-line"><span>${formatPrice(product.comparePrice)}</span><strong>${formatPrice(product.price)}</strong><em>${discount}% off</em></div>
          <p>Extra 20% off $100+</p>
          <div class="swatches" aria-label="Available colors">${createSwatches(index)}</div>
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
    appendNextProducts();
  };

  const sortProducts = (type) => {
    visibleProducts = [...products];
    if (type === "newest") visibleProducts.sort((a, b) => b.index - a.index);
    if (type === "price-low") visibleProducts.sort((a, b) => a.price - b.price);
    if (type === "price-high") visibleProducts.sort((a, b) => b.price - a.price);
    if (type === "top-rated") visibleProducts.sort((a, b) => b.rating - a.rating);
    render();
  };

  const openFilter = () => {
    document.body.classList.add("filter-drawer-open");
    document.querySelector("#filter-drawer").setAttribute("aria-hidden", "false");
  };

  const closeFilter = () => {
    document.body.classList.remove("filter-drawer-open");
    document.querySelector("#filter-drawer").setAttribute("aria-hidden", "true");
  };

  const addProductToBag = (button) => {
    const card = button.closest(".product-card");
    const product = products[Number(card.dataset.productIndex)];
    window.cartService.addItem(product);
    window.cartService.openBagDrawer();
    button.textContent = "Added";
    window.setTimeout(() => {
      button.textContent = "Add to bag";
    }, 900);
  };

  const init = () => {
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
      if (event.target.closest("[data-filter-close]")) closeFilter();
      const addButton = event.target.closest(".add-button");
      if (addButton) addProductToBag(addButton);
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeFilter();
    });
    window.cartService.updateBagCount();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window, document);
