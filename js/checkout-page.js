(function (window, document) {
  "use strict";

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const thbCurrency = new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  });

  const fallbackItem = {
    id: "demo-logo-tee",
    name: "1990 Logo Graphic Relaxed T-Shirt",
    variant: "Grey Heather / L",
    price: 44.25,
    priceText: "$44.25",
    image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=500&q=85",
    quantity: 1,
  };

  let selectedPaymentMethod = "Credit / Debit Card";
  let activePromptPayCharge = null;
  let promptPayStatusTimer = null;
  let promptPayCompletionTimer = null;
  let orderCompleteRedirectTimer = null;

  const cardPaymentMethod = "Credit / Debit Card";

  const alternatePaymentContent = {
    "Apple Pay": {
      logo: "Apple Pay",
      message: "Apple Pay will open after your order details are confirmed.",
    },
    "Google Pay": {
      logo: "G Pay",
      message: "Google Pay will open after your order details are confirmed.",
    },
    "Weixin Pay": {
      logo: "Weixin Pay",
      message: "Weixin Pay will open after your order details are confirmed.",
    },
    PromptPay: {
      logo: "PromptPay",
      message: "Place your order to generate a PromptPay QR code.",
    },
  };

  const isCardPaymentSelected = () => selectedPaymentMethod === cardPaymentMethod;

  const isPromptPaySelected = () => selectedPaymentMethod === "PromptPay";

  const getCartItems = () => {
    const items = window.cartState && Array.isArray(window.cartState.items) ? window.cartState.items : [];
    const savedCart = window.localStorage.getItem("shopping_cart");
    return items.length ? items : savedCart ? [] : [fallbackItem];
  };

  const formatMoney = (value) => currency.format(Number(value) || 0);

  const formatThaiBaht = (value) => thbCurrency.format(Number(value) || 0);

  const getPromptPayAmount = (items) => Math.round(getSubtotal(items) * 100);

  const getSubtotal = (items) =>
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  const getItemCount = (items) =>
    items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const setCheckoutStatus = (message, type = "success") => {
    const status = document.querySelector("#checkout-action-status");

    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
  };

  const getCheckoutForm = () => document.querySelector("#checkout-payment-form");

  const getField = (name) => getCheckoutForm()?.elements[name];

  const getDigits = (value) => String(value || "").replace(/\D/g, "");

  const countryNameFormatter = typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

  const dialCodes = {
    AD: "+376", AE: "+971", AF: "+93", AG: "+1", AI: "+1", AL: "+355", AM: "+374", AO: "+244", AQ: "+672", AR: "+54",
    AS: "+1", AT: "+43", AU: "+61", AW: "+297", AX: "+358", AZ: "+994", BA: "+387", BB: "+1", BD: "+880", BE: "+32",
    BF: "+226", BG: "+359", BH: "+973", BI: "+257", BJ: "+229", BL: "+590", BM: "+1", BN: "+673", BO: "+591", BQ: "+599",
    BR: "+55", BS: "+1", BT: "+975", BV: "+47", BW: "+267", BY: "+375", BZ: "+501", CA: "+1", CC: "+61", CD: "+243",
    CF: "+236", CG: "+242", CH: "+41", CI: "+225", CK: "+682", CL: "+56", CM: "+237", CN: "+86", CO: "+57", CR: "+506",
    CU: "+53", CV: "+238", CW: "+599", CX: "+61", CY: "+357", CZ: "+420", DE: "+49", DJ: "+253", DK: "+45", DM: "+1",
    DO: "+1", DZ: "+213", EC: "+593", EE: "+372", EG: "+20", EH: "+212", ER: "+291", ES: "+34", ET: "+251", FI: "+358",
    FJ: "+679", FK: "+500", FM: "+691", FO: "+298", FR: "+33", GA: "+241", GB: "+44", GD: "+1", GE: "+995", GF: "+594",
    GG: "+44", GH: "+233", GI: "+350", GL: "+299", GM: "+220", GN: "+224", GP: "+590", GQ: "+240", GR: "+30", GS: "+500",
    GT: "+502", GU: "+1", GW: "+245", GY: "+592", HK: "+852", HM: "+672", HN: "+504", HR: "+385", HT: "+509", HU: "+36",
    ID: "+62", IE: "+353", IL: "+972", IM: "+44", IN: "+91", IO: "+246", IQ: "+964", IR: "+98", IS: "+354", IT: "+39",
    JE: "+44", JM: "+1", JO: "+962", JP: "+81", KE: "+254", KG: "+996", KH: "+855", KI: "+686", KM: "+269", KN: "+1",
    KP: "+850", KR: "+82", KW: "+965", KY: "+1", KZ: "+7", LA: "+856", LB: "+961", LC: "+1", LI: "+423", LK: "+94",
    LR: "+231", LS: "+266", LT: "+370", LU: "+352", LV: "+371", LY: "+218", MA: "+212", MC: "+377", MD: "+373", ME: "+382",
    MF: "+590", MG: "+261", MH: "+692", MK: "+389", ML: "+223", MM: "+95", MN: "+976", MO: "+853", MP: "+1", MQ: "+596",
    MR: "+222", MS: "+1", MT: "+356", MU: "+230", MV: "+960", MW: "+265", MX: "+52", MY: "+60", MZ: "+258", NA: "+264",
    NC: "+687", NE: "+227", NF: "+672", NG: "+234", NI: "+505", NL: "+31", NO: "+47", NP: "+977", NR: "+674", NU: "+683",
    NZ: "+64", OM: "+968", PA: "+507", PE: "+51", PF: "+689", PG: "+675", PH: "+63", PK: "+92", PL: "+48", PM: "+508",
    PN: "+64", PR: "+1", PS: "+970", PT: "+351", PW: "+680", PY: "+595", QA: "+974", RE: "+262", RO: "+40", RS: "+381",
    RU: "+7", RW: "+250", SA: "+966", SB: "+677", SC: "+248", SD: "+249", SE: "+46", SG: "+65", SH: "+290", SI: "+386",
    SJ: "+47", SK: "+421", SL: "+232", SM: "+378", SN: "+221", SO: "+252", SR: "+597", SS: "+211", ST: "+239", SV: "+503",
    SX: "+1", SY: "+963", SZ: "+268", TC: "+1", TD: "+235", TF: "+262", TG: "+228", TH: "+66", TJ: "+992", TK: "+690",
    TL: "+670", TM: "+993", TN: "+216", TO: "+676", TR: "+90", TT: "+1", TV: "+688", TW: "+886", TZ: "+255", UA: "+380",
    UG: "+256", UM: "+1", US: "+1", UY: "+598", UZ: "+998", VA: "+39", VC: "+1", VE: "+58", VG: "+1", VI: "+1",
    VN: "+84", VU: "+678", WF: "+681", WS: "+685", YE: "+967", YT: "+262", ZA: "+27", ZM: "+260", ZW: "+263",
  };

  const primaryDialCountries = {
    "+1": "US",
    "+7": "RU",
    "+44": "GB",
  };

  const getCountryName = (iso) => countryNameFormatter?.of(iso) || iso;

  const getCountryFlag = (iso) =>
    iso
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

  const countryOptions = Object.entries(dialCodes)
    .map(([iso, dialCode]) => ({
      iso,
      dialCode,
      name: getCountryName(iso),
      flag: getCountryFlag(iso),
    }))
    .sort((first, second) => {
      if (first.iso === "US") return -1;
      if (second.iso === "US") return 1;
      if (first.iso === "TH") return -1;
      if (second.iso === "TH") return 1;
      return first.name.localeCompare(second.name, "en", { sensitivity: "base" });
    });

  const getCountryLabel = (country) => `${country.flag} ${country.dialCode} ${country.name}`;

  const findCountry = (iso) => countryOptions.find((country) => country.iso === iso);

  const getDetectedCountryIso = () => {
    const languageRegion = (navigator.languages || [navigator.language || ""])
      .map((language) => language.match(/[-_]([A-Z]{2})\b/i)?.[1]?.toUpperCase())
      .find((iso) => iso && dialCodes[iso]);

    return languageRegion || "TH";
  };

  const getPhoneFullNumber = () => {
    const dialCode = getField("phoneDialCode")?.value || "+66";
    const localNumber = getDigits(getField("phone")?.value).replace(/^0+/, "");
    return localNumber ? `${dialCode}${localNumber}` : "";
  };

  const updatePhoneFullNumber = () => {
    const fullNumberField = getField("phoneFullNumber");

    if (fullNumberField) {
      fullNumberField.value = getPhoneFullNumber();
    }
  };

  const formatCardNumber = (value) =>
    getDigits(value)
      .match(/.{1,4}/g)
      ?.join(" ") || "";

  const formatExpiry = (value) => {
    const digits = getDigits(value).slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const getCardNetwork = (digits) => {
    if (/^4/.test(digits)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
    if (/^3[47]/.test(digits)) return "Amex";
    if (/^62/.test(digits)) return "UnionPay";
    if (/^35/.test(digits)) return "JCB";
    if (/^(6011|65|64[4-9])/.test(digits)) return "Discover";
    return "";
  };

  const setFieldError = (name, message) => {
    const field = getField(name);
    const error = document.querySelector(`[data-error-for="${name}"]`);

    if (error) {
      error.textContent = message;
    }

    if (field) {
      field.classList.toggle("is-invalid", Boolean(message));
      field.setAttribute("aria-invalid", String(Boolean(message)));
    }

    if (name === "phoneCountryIso") {
      const countryButton = document.querySelector("[data-country-toggle]");

      if (countryButton) {
        countryButton.classList.toggle("is-invalid", Boolean(message));
        countryButton.setAttribute("aria-invalid", String(Boolean(message)));
      }
    }
  };

  const validateRequiredText = (name, label, showError) => {
    const field = getField(name);
    const isValid = Boolean(field && field.value.trim());

    if (showError) {
      setFieldError(name, isValid ? "" : `${label} is required.`);
    }

    return isValid;
  };

  const validateEmail = (showError) => {
    const field = getField("email");
    const value = field ? field.value.trim() : "";
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    if (showError) {
      setFieldError("email", isValid ? "" : "Enter a valid email address.");
    }

    return isValid;
  };

  const validatePhoneCountry = (showError) => {
    const field = getField("phoneCountryIso");
    const isValid = Boolean(field?.value && dialCodes[field.value]);

    if (showError) {
      setFieldError("phoneCountryIso", isValid ? "" : "Select a country code.");
    }

    return isValid;
  };

  const validatePhoneNumber = (showError) => {
    const field = getField("phone");
    const digits = getDigits(field?.value);
    const isValid = Boolean(digits);

    if (field && field.value !== digits) {
      field.value = digits;
    }

    updatePhoneFullNumber();

    if (showError) {
      setFieldError("phone", isValid ? "" : "Phone number is required.");
    }

    return isValid;
  };

  const validateCardNumber = (showError) => {
    const field = getField("cardNumber");
    const digits = getDigits(field?.value);
    const network = getCardNetwork(digits);
    const networkLine = document.querySelector("#card-network-line");
    const isValid = digits.length === 16;

    if (networkLine) {
      networkLine.textContent = network ? `${network} card detected` : "Visa, Mastercard, Amex, UnionPay, JCB, Discover";
    }

    if (showError) {
      let message = "";

      if (!digits.length) {
        message = "Card number is required.";
      } else if (!isValid) {
        message = "Card number must contain exactly 16 digits.";
      }

      setFieldError("cardNumber", message);
    }

    return isValid;
  };

  const validateExpiry = (showError) => {
    const field = getField("expiry");
    const value = field ? field.value : "";
    const [monthText, yearText] = value.split("/");
    const month = Number(monthText);
    const isValid = /^\d{2}\/\d{2}$/.test(value) && month >= 1 && month <= 12 && Boolean(yearText);

    if (showError) {
      let message = "";

      if (!value) {
        message = "Expiry date is required.";
      } else if (!isValid) {
        message = "Enter a valid expiry date in MM/YY format.";
      }

      setFieldError("expiry", message);
    }

    return isValid;
  };

  const validateCvv = (showError) => {
    const field = getField("cvv");
    const digits = getDigits(field?.value);
    const cardDigits = getDigits(getField("cardNumber")?.value);
    const isAmex = getCardNetwork(cardDigits) === "Amex";
    const requiredLength = isAmex ? 4 : 3;
    const isValid = digits.length === requiredLength;

    if (showError) {
      let message = "";

      if (!digits.length) {
        message = "CVV is required.";
      } else if (!isValid) {
        message = `CVV must be ${requiredLength} digits${isAmex ? " for Amex" : ""}.`;
      }

      setFieldError("cvv", message);
    }

    return isValid;
  };

  const validateCheckoutForm = (showErrors = false) => {
    const form = getCheckoutForm();

    if (!form) {
      return false;
    }

    const labels = {
      firstName: "First name",
      lastName: "Last name",
      address1: "Address line 1",
      city: "City",
      state: "State / Province",
      postalCode: "Postal code",
      country: "Country",
    };

    if (isCardPaymentSelected()) {
      labels.cardholderName = "Cardholder name";
    }

    const requiredTextResults = Object.entries(labels).map(([name, label]) =>
      validateRequiredText(name, label, showErrors || getField(name)?.dataset.touched === "true")
    );
    const requiredTextValid = requiredTextResults.every(Boolean);
    const emailValid = validateEmail(showErrors || getField("email")?.dataset.touched === "true");
    const phoneCountryValid = validatePhoneCountry(showErrors || getField("phoneCountryIso")?.dataset.touched === "true");
    const phoneValid = validatePhoneNumber(showErrors || getField("phone")?.dataset.touched === "true");
    const cardNumberValid = !isCardPaymentSelected() || validateCardNumber(showErrors || getField("cardNumber")?.dataset.touched === "true");
    const expiryValid = !isCardPaymentSelected() || validateExpiry(showErrors || getField("expiry")?.dataset.touched === "true");
    const cvvValid = !isCardPaymentSelected() || validateCvv(showErrors || getField("cvv")?.dataset.touched === "true");

    return requiredTextValid && emailValid && phoneCountryValid && phoneValid && cardNumberValid && expiryValid && cvvValid;
  };

  const updatePlaceOrderState = () => {
    const button = document.querySelector("[data-continue-checkout]");

    if (!button) {
      return;
    }

    button.disabled = !validateCheckoutForm(false);
  };

  const setPlaceOrderLoading = (isLoading) => {
    const button = document.querySelector("[data-continue-checkout]");

    if (!button) {
      return;
    }

    button.disabled = isLoading || !validateCheckoutForm(false);
    button.textContent = isLoading ? "Creating Payment..." : "Place Order";
  };

  const updatePromptPayPanel = (charge = activePromptPayCharge) => {
    const panel = document.querySelector("[data-promptpay-panel]");
    const qrImage = document.querySelector("[data-promptpay-qr]");
    const amount = document.querySelector("[data-promptpay-amount]");
    const status = document.querySelector("[data-promptpay-status]");
    const expires = document.querySelector("[data-promptpay-expires]");
    const note = document.querySelector("[data-promptpay-note]");

    if (!panel || !qrImage || !amount || !status || !expires || !note) {
      return;
    }

    panel.hidden = !isPromptPaySelected() || !charge;

    if (!charge) {
      qrImage.removeAttribute("src");
      amount.textContent = "";
      status.textContent = "";
      expires.textContent = "";
      note.textContent = "Scan the QR code with your banking app, then wait for payment confirmation.";
      return;
    }

    qrImage.src = charge.qr_image;
    amount.textContent = formatThaiBaht((Number(charge.amount) || 0) / 100);
    status.textContent = `Status: ${charge.status || "pending"}`;
    expires.textContent = charge.expires_at ? `Expires: ${new Date(charge.expires_at).toLocaleString()}` : "Expires within 24 hours";
    note.textContent = charge.demo
      ? "Demo QR shown for preview only. This QR is not connected to a live payment provider."
      : "Scan the QR code with your banking app to pay by PromptPay.";
  };

  const stopPromptPayStatusPolling = () => {
    if (promptPayStatusTimer) {
      window.clearInterval(promptPayStatusTimer);
      promptPayStatusTimer = null;
    }
  };

  const stopPromptPayCompletionCountdown = () => {
    if (promptPayCompletionTimer) {
      window.clearInterval(promptPayCompletionTimer);
      promptPayCompletionTimer = null;
    }
  };

  const redirectToHomeAfterOrderComplete = () => {
    if (orderCompleteRedirectTimer) {
      window.clearTimeout(orderCompleteRedirectTimer);
    }

    orderCompleteRedirectTimer = window.setTimeout(() => {
      window.location.href = "index.html";
    }, 1800);
  };

  const clearCompletedOrderCart = () => {
    if (window.cartService?.clearCart) {
      window.cartService.clearCart();
      return;
    }

    if (window.cartState && Array.isArray(window.cartState.items)) {
      window.cartState.items = [];
    }

    window.localStorage.setItem("shopping_cart", JSON.stringify({ items: [] }));
  };

  const completePromptPayPayment = () => {
    stopPromptPayCompletionCountdown();

    if (!activePromptPayCharge) {
      return;
    }

    activePromptPayCharge = {
      ...activePromptPayCharge,
      status: "completed",
    };

    updatePromptPayPanel(activePromptPayCharge);
    clearCompletedOrderCart();
    setCheckoutStatus("Order completed. Returning home...");
    showCheckoutDialog("Order completed", "Your PromptPay payment has been marked complete. Thank you for your order.", "success");
    redirectToHomeAfterOrderComplete();
  };

  const startPromptPayCompletionCountdown = () => {
    const status = document.querySelector("[data-promptpay-status]");
    let remainingSeconds = 10;

    stopPromptPayCompletionCountdown();

    if (!activePromptPayCharge || activePromptPayCharge.poll === true) {
      return;
    }

    if (status) {
      status.textContent = `Status: pending (${remainingSeconds}s)`;
    }

    promptPayCompletionTimer = window.setInterval(() => {
      remainingSeconds -= 1;

      if (remainingSeconds <= 0) {
        completePromptPayPayment();
        return;
      }

      if (status) {
        status.textContent = `Status: pending (${remainingSeconds}s)`;
      }
    }, 1000);
  };

  const refreshPromptPayStatus = async () => {
    if (!activePromptPayCharge?.id || activePromptPayCharge.poll !== true) {
      return;
    }

    const response = await fetch(`/api/payments/promptpay/${encodeURIComponent(activePromptPayCharge.id)}`);

    if (!response.ok) {
      return;
    }

    activePromptPayCharge = await response.json();
    updatePromptPayPanel(activePromptPayCharge);

    if (["successful", "failed", "expired"].includes(activePromptPayCharge.status)) {
      stopPromptPayStatusPolling();
      setCheckoutStatus(`PromptPay payment ${activePromptPayCharge.status}.`, activePromptPayCharge.status === "successful" ? "success" : "error");
    }
  };

  const startPromptPayStatusPolling = () => {
    stopPromptPayStatusPolling();

    if (!activePromptPayCharge?.id || activePromptPayCharge.poll !== true) {
      return;
    }

    promptPayStatusTimer = window.setInterval(refreshPromptPayStatus, 5000);
  };

  const createPromptPayPayment = async (items) => {
    const amount = getPromptPayAmount(items);

    if (amount < 2000 || amount > 15000000) {
      throw new Error("PromptPay total must be between THB20.00 and THB150,000.00.");
    }

    const response = await fetch("/api/payments/promptpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "THB",
      }),
    });

    const payment = await response.json();

    if (!response.ok) {
      throw new Error(payment.message || "Unable to create PromptPay payment.");
    }

    activePromptPayCharge = payment;
    updatePromptPayPanel(payment);
    if (payment.poll === true) {
      startPromptPayStatusPolling();
    } else {
      startPromptPayCompletionCountdown();
    }
    return payment;
  };

  const clearCardErrors = () => {
    ["cardNumber", "cardholderName", "expiry", "cvv"].forEach((name) => setFieldError(name, ""));
  };

  const updatePaymentPanels = () => {
    const cardPanel = document.querySelector('[data-payment-panel="Credit / Debit Card"]');
    const alternatePanel = document.querySelector("[data-alternate-payment-panel]");
    const alternateTitle = document.querySelector("[data-alternate-payment-title]");
    const alternateLogo = document.querySelector("[data-alternate-payment-logo]");
    const alternateMessage = document.querySelector("[data-alternate-payment-message]");
    const showCard = isCardPaymentSelected();
    const alternateContent = alternatePaymentContent[selectedPaymentMethod] || {
      logo: selectedPaymentMethod,
      message: `${selectedPaymentMethod} will open after your order details are confirmed.`,
    };

    if (cardPanel) {
      cardPanel.hidden = !showCard;
      cardPanel.querySelectorAll("input").forEach((input) => {
        input.disabled = !showCard;
      });
    }

    if (alternatePanel) {
      alternatePanel.hidden = showCard;
    }

    if (alternateTitle) {
      alternateTitle.textContent = selectedPaymentMethod;
    }

    if (alternateLogo) {
      alternateLogo.textContent = alternateContent.logo;
    }

    if (alternateMessage) {
      alternateMessage.textContent = alternateContent.message;
    }

    updatePromptPayPanel();

    if (!isPromptPaySelected()) {
      stopPromptPayCompletionCountdown();
    }

    if (!showCard) {
      clearCardErrors();
    }
  };

  const setupCountrySelector = () => {
    const selector = document.querySelector("[data-country-selector]");
    const toggle = document.querySelector("[data-country-toggle]");
    const selectedLabel = document.querySelector("[data-country-selected]");
    const menu = document.querySelector("[data-country-menu]");
    const search = document.querySelector("[data-country-search]");
    const list = document.querySelector("[data-country-list]");
    const isoField = getField("phoneCountryIso");
    const dialField = getField("phoneDialCode");

    if (!selector || !toggle || !selectedLabel || !menu || !search || !list || !isoField || !dialField) {
      return;
    }

    let filteredCountries = countryOptions;
    let activeIndex = 0;

    const setSelectedCountry = (country) => {
      if (!country) {
        return;
      }

      selectedLabel.textContent = getCountryLabel(country);
      isoField.value = country.iso;
      dialField.value = country.dialCode;
      isoField.dataset.touched = "true";
      updatePhoneFullNumber();
      setFieldError("phoneCountryIso", "");
      updatePlaceOrderState();
    };

    const renderOptions = () => {
      list.innerHTML = "";

      filteredCountries.forEach((country, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "country-selector-option";
        option.id = `country-option-${country.iso}`;
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(country.iso === isoField.value));
        option.tabIndex = -1;
        option.textContent = getCountryLabel(country);
        option.addEventListener("click", () => {
          setSelectedCountry(country);
          closeMenu();
          toggle.focus();
        });
        list.appendChild(option);

        if (index === activeIndex) {
          option.classList.add("is-active");
          toggle.setAttribute("aria-activedescendant", option.id);
        }
      });

      if (!filteredCountries.length) {
        const empty = document.createElement("div");
        empty.className = "country-selector-empty";
        empty.textContent = "No countries found";
        list.appendChild(empty);
        toggle.removeAttribute("aria-activedescendant");
      }
    };

    const filterCountries = () => {
      const query = search.value.trim().toLowerCase();
      const normalizedDialQuery = query.replace(/\s/g, "");

      filteredCountries = countryOptions.filter((country) => {
        const searchable = `${country.name} ${country.iso} ${country.dialCode}`.toLowerCase();
        return searchable.includes(query) || country.dialCode.includes(normalizedDialQuery);
      });

      if (normalizedDialQuery.startsWith("+") && primaryDialCountries[normalizedDialQuery]) {
        filteredCountries = [...filteredCountries].sort((first, second) => {
          if (first.iso === primaryDialCountries[normalizedDialQuery]) return -1;
          if (second.iso === primaryDialCountries[normalizedDialQuery]) return 1;
          return countryOptions.indexOf(first) - countryOptions.indexOf(second);
        });
      }

      activeIndex = 0;
      renderOptions();
    };

    const openMenu = () => {
      selector.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      search.value = "";
      filteredCountries = countryOptions;
      activeIndex = Math.max(0, filteredCountries.findIndex((country) => country.iso === isoField.value));
      renderOptions();
      window.requestAnimationFrame(() => search.focus());
    };

    function closeMenu() {
      selector.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.removeAttribute("aria-activedescendant");
    }

    const moveActiveOption = (direction) => {
      if (!filteredCountries.length) {
        return;
      }

      activeIndex = (activeIndex + direction + filteredCountries.length) % filteredCountries.length;
      renderOptions();
      document.querySelector(`#country-option-${filteredCountries[activeIndex].iso}`)?.scrollIntoView({ block: "nearest" });
    };

    const chooseActiveOption = () => {
      const country = filteredCountries[activeIndex];

      if (country) {
        setSelectedCountry(country);
        closeMenu();
        toggle.focus();
      }
    };

    toggle.addEventListener("click", () => {
      if (selector.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    search.addEventListener("input", filterCountries);

    search.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActiveOption(1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActiveOption(-1);
      }

      if (event.key === "Enter") {
        event.preventDefault();
        chooseActiveOption();
      }

      if (event.key === "Escape") {
        closeMenu();
        toggle.focus();
      }
    });

    toggle.addEventListener("keydown", (event) => {
      if (["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!selector.contains(event.target)) {
        closeMenu();
      }
    });

    setSelectedCountry(findCountry(getDetectedCountryIso()) || findCountry("TH"));
    closeMenu();
  };

  const setupCheckoutForm = () => {
    const form = getCheckoutForm();

    if (!form) {
      return;
    }

    const cardNumber = getField("cardNumber");
    const cardholderName = getField("cardholderName");
    const expiry = getField("expiry");
    const cvv = getField("cvv");
    const phone = getField("phone");

    setupCountrySelector();

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      continueCheckout();
    });

    form.addEventListener("input", (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement)) {
        return;
      }

      field.dataset.touched = "true";

      if (field.name === "cardNumber") {
        field.value = formatCardNumber(field.value);

        if (getDigits(field.value).length === 16) {
          cardholderName?.focus();
        }
      }

      if (field.name === "expiry") {
        field.value = formatExpiry(field.value);

        if (field.value.length === 5) {
          cvv?.focus();
        }
      }

      if (field.name === "cvv") {
        const network = getCardNetwork(getDigits(cardNumber?.value));
        const requiredLength = network === "Amex" ? 4 : 3;
        field.value = getDigits(field.value).slice(0, requiredLength);
      }

      if (field.name === "phone") {
        field.value = getDigits(field.value);
        updatePhoneFullNumber();
      }

      validateCheckoutForm(false);
      updatePlaceOrderState();
    });

    form.addEventListener("blur", (event) => {
      const field = event.target;

      if (!(field instanceof HTMLInputElement)) {
        return;
      }

      field.dataset.touched = "true";
      validateCheckoutForm(false);
      updatePlaceOrderState();
    }, true);

    expiry?.addEventListener("keydown", (event) => {
      if (event.key === "Backspace") {
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    });

    cardNumber?.addEventListener("keydown", (event) => {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    });

    cvv?.addEventListener("keydown", (event) => {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    });

    phone?.addEventListener("keydown", (event) => {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/\d/.test(event.key)) {
        event.preventDefault();
      }
    });

    updatePaymentPanels();
    updatePlaceOrderState();
  };

  const showCheckoutDialog = (title, message, type = "info") => {
    let dialog = document.querySelector("#checkout-info-dialog");

    if (!dialog) {
      dialog = document.createElement("div");
      dialog.className = "checkout-info-dialog";
      dialog.id = "checkout-info-dialog";
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "checkout-info-title");
      dialog.setAttribute("aria-hidden", "true");
      dialog.innerHTML = `
        <button class="checkout-info-backdrop" type="button" data-checkout-info-close aria-label="Close message"></button>
        <div class="checkout-info-panel" tabindex="-1">
          <span class="checkout-success-mark" aria-hidden="true"></span>
          <h2 id="checkout-info-title"></h2>
          <p id="checkout-info-message"></p>
          <button type="button" data-checkout-info-close>Done</button>
        </div>
      `;
      document.body.appendChild(dialog);
    }

    dialog.classList.toggle("is-success", type === "success");
    dialog.querySelector("#checkout-info-title").textContent = title;
    dialog.querySelector("#checkout-info-message").textContent = message;
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
    dialog.querySelector(".checkout-info-panel")?.focus();
  };

  const closeCheckoutDialog = () => {
    const dialog = document.querySelector("#checkout-info-dialog");

    if (!dialog) {
      return;
    }

    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
  };

  const saveRealCart = (items) => {
    if (!window.cartState || !Array.isArray(window.cartState.items)) {
      return;
    }

    window.cartState.items = items.filter((item) => item.id !== fallbackItem.id);
    window.cartService.saveCart();
    window.cartService.updateBagCount();
  };

  const renderSummary = (items) => {
    const count = getItemCount(items);
    const subtotal = getSubtotal(items);
    const shipping = subtotal > 0 ? 0 : 0;
    const total = subtotal + shipping;
    const rewards = Math.round(total * 3);

    const setText = (selector, value) => {
      const element = document.querySelector(selector);

      if (element) {
        element.textContent = value;
      }
    };

    setText("#checkout-item-count", `(${count} ${count === 1 ? "item" : "items"})`);
    setText("#summary-count", `(${count} ${count === 1 ? "item" : "items"})`);
    setText("#bag-count", String(count));
    setText("#checkout-grand-total", formatMoney(total));
    setText("#summary-subtotal", formatMoney(subtotal));
    setText("#summary-shipping", formatMoney(shipping));
    setText("#summary-total", formatMoney(total));
    setText("#installment-total", formatMoney(total / 4));
    setText("#reward-points", `${rewards} points`);
  };

  const renderItems = () => {
    const items = getCartItems();
    const container = document.querySelector("#checkout-items");

    if (!container) {
      return;
    }

    if (!items.length) {
      container.innerHTML = `
        <div class="bag-empty-state">
          <h2>Your shopping bag is empty.</h2>
          <p>Items added to your bag will appear here.</p>
          <a href="products.html">Continue Shopping</a>
        </div>
      `;
      renderSummary(items);
      return;
    }

    container.innerHTML = items.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const lineTotal = price * quantity;
      const comparePrice = price > 0 ? price * 1.3 : 0;

      return `
        <article class="bag-line-item" data-cart-id="${escapeHtml(item.id)}">
          <a class="bag-item-image" href="products.html">
            <img src="${escapeHtml(item.image || fallbackItem.image)}" alt="${escapeHtml(item.name)}">
          </a>
          <div class="bag-item-details">
            <div class="bag-item-heading">
              <h2>${escapeHtml(item.name)}</h2>
              <strong>${formatMoney(lineTotal)}</strong>
            </div>
            <p class="bag-item-price"><span>${formatMoney(comparePrice)}</span> ${formatMoney(price)}</p>
            <p>${escapeHtml(item.variant || "Core / Regular")}</p>
            <p>${quantity} style selected</p>
            <p class="bag-item-discount">30% Off New Arrivals <button type="button" data-promo-details>Details</button></p>
            <p class="stock-line">In Stock: Ships in 1-2 business days</p>
          </div>
          <div class="quantity-control" aria-label="Quantity for ${escapeHtml(item.name)}">
            <button type="button" data-quantity="decrease" aria-label="Decrease quantity">−</button>
            <span>${quantity}</span>
            <button type="button" data-quantity="increase" aria-label="Increase quantity">+</button>
          </div>
          <div class="bag-item-actions">
            <button type="button" data-edit-item>Edit</button>
            <button type="button" data-save-later>Save for Later</button>
            <button type="button" data-remove-item>Remove</button>
          </div>
        </article>
      `;
    }).join("");

    renderSummary(items);
  };

  const updateQuantity = (id, direction) => {
    if (id === fallbackItem.id) {
      return;
    }

    const currentItem = window.cartState.items.find((item) => item.id === id);

    if (!currentItem) {
      return;
    }

    if (direction === "decrease" && Number(currentItem.quantity || 1) <= 1) {
      requestRemoveItem(id);
      return;
    }

    const items = window.cartState.items.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const nextQuantity = direction === "increase"
        ? Number(item.quantity || 1) + 1
        : Math.max(Number(item.quantity || 1) - 1, 1);

      return {
        ...item,
        quantity: nextQuantity,
      };
    });

    saveRealCart(items);
    renderItems();
  };

  const removeItem = (id) => {
    if (id === fallbackItem.id) {
      return;
    }

    const removedItem = window.cartState.items.find((item) => item.id === id);

    saveRealCart(window.cartState.items.filter((item) => item.id !== id));
    renderItems();

    if (removedItem && window.cartService.showToast) {
      window.cartService.showToast(`${removedItem.name} removed from bag.`, "🗑️");
    }
  };

  const requestRemoveItem = async (id) => {
    if (id === fallbackItem.id) {
      return;
    }

    const item = window.cartState.items.find((cartItem) => cartItem.id === id);

    if (!item) {
      return;
    }

    const shouldRemove = window.cartConfirm && window.cartConfirm.confirmRemove
      ? await window.cartConfirm.confirmRemove(item)
      : false;

    if (shouldRemove) {
      removeItem(id);
    }
  };

  const selectPaymentMethod = (button) => {
    selectedPaymentMethod = button.dataset.paymentMethod || selectedPaymentMethod;

    document.querySelectorAll("[data-payment-method]").forEach((paymentButton) => {
      const isSelected = paymentButton === button;
      paymentButton.classList.toggle("is-selected", isSelected);
      paymentButton.setAttribute("aria-pressed", String(isSelected));
    });

    updatePaymentPanels();
    updatePlaceOrderState();
    setCheckoutStatus(`${selectedPaymentMethod} selected.`);
  };

  const continueCheckout = async () => {
    const items = window.cartState && Array.isArray(window.cartState.items) ? window.cartState.items : [];

    if (!validateCheckoutForm(true)) {
      updatePlaceOrderState();
      setCheckoutStatus("Complete billing and payment information before placing your order.", "error");
      return;
    }

    if (!items.length) {
      setCheckoutStatus("Add an item to your bag before checkout.", "error");
      showCheckoutDialog("Your bag is empty", "Add an item to your bag before continuing to checkout.");
      return;
    }

    if (isPromptPaySelected()) {
      try {
        setPlaceOrderLoading(true);
        await createPromptPayPayment(items);
        setCheckoutStatus("PromptPay QR code is ready.");
      } catch (error) {
        setCheckoutStatus(error.message || "Unable to create PromptPay payment.", "error");
      } finally {
        setPlaceOrderLoading(false);
      }

      return;
    }

    showCheckoutDialog(
      "Order ready",
      isCardPaymentSelected()
        ? "Your card payment details are valid. Payment processing is not connected yet."
        : `${selectedPaymentMethod} is selected. Payment processing is not connected yet.`
    );
  };

  const addRecommendationToBag = (card) => {
    const product = {
      id: `recommendation-${String(card.dataset.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name: card.dataset.name || card.querySelector("h3")?.textContent.trim() || "Recommended item",
      variant: card.dataset.variant || "Core / Regular",
      price: Number(card.dataset.price) || 0,
      priceText: `$${Number(card.dataset.price || 0).toFixed(2)}`,
      image: card.dataset.image || card.querySelector("img")?.currentSrc || card.querySelector("img")?.src || "",
      quantity: 1,
    };

    window.cartService.addItem(product);
    renderItems();
    setCheckoutStatus(`${product.name} added to your bag.`);
  };

  const scrollRecommendations = (direction) => {
    const track = document.querySelector(".recommendation-track");

    if (!track) {
      return;
    }

    const distance = Math.max(track.clientWidth * 0.72, 180);
    track.scrollBy({ left: direction === "next" ? distance : -distance, behavior: "smooth" });
  };

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-checkout-info-close]")) {
      event.preventDefault();
      closeCheckoutDialog();
      return;
    }

    const paymentButton = event.target.closest("[data-payment-method]");

    if (paymentButton) {
      event.preventDefault();
      selectPaymentMethod(paymentButton);
      return;
    }

    if (event.target.closest("[data-continue-checkout]")) {
      event.preventDefault();
      continueCheckout();
      return;
    }

    if (event.target.closest("[data-promo-details]")) {
      event.preventDefault();
      showCheckoutDialog("30% Off New Arrivals", "Discount is reflected in the current item price. Final eligibility is confirmed at checkout.");
      return;
    }

    if (event.target.closest("[data-promo-code]")) {
      event.preventDefault();
      showCheckoutDialog("Promo code", "Promo code entry is not connected yet. The current sale pricing is already reflected in your bag.");
      return;
    }

    if (event.target.closest("[data-recommendation-prev]")) {
      event.preventDefault();
      scrollRecommendations("previous");
      return;
    }

    if (event.target.closest("[data-recommendation-next]")) {
      event.preventDefault();
      scrollRecommendations("next");
      return;
    }

    const recommendation = event.target.closest("[data-recommendation-item]");

    if (recommendation) {
      event.preventDefault();
      addRecommendationToBag(recommendation);
      return;
    }

    const item = event.target.closest(".bag-line-item");

    if (!item) {
      return;
    }

    const id = item.dataset.cartId;
    const quantityButton = event.target.closest("[data-quantity]");

    if (quantityButton) {
      updateQuantity(id, quantityButton.dataset.quantity);
      return;
    }

    if (event.target.closest("[data-edit-item]")) {
      event.preventDefault();
      showCheckoutDialog("Edit item", "Size, color, and style editing is not connected yet. You can adjust quantity or remove the item from your bag.");
      return;
    }

    if (event.target.closest("[data-save-later]")) {
      event.preventDefault();
      setCheckoutStatus("Item saved for later. Saved item storage is not connected yet.");
      showCheckoutDialog("Saved for later", "This item has been marked as saved for later in this preview.");
      return;
    }

    if (event.target.closest("[data-remove-item]")) {
      requestRemoveItem(id);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCheckoutDialog();
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-recommendation-item]")) {
      event.preventDefault();
      addRecommendationToBag(event.target.closest("[data-recommendation-item]"));
    }
  });

  setupCheckoutForm();
  renderItems();
})(window, document);
