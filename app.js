const STORAGE_KEY = "findit-campus-listings";

const SAMPLE_LISTINGS = [
  {
    id: "sample-charger",
    title: "Silver MacBook charger",
    status: "Lost",
    category: "Electronics",
    location: "Library, 2nd floor",
    date: "2026-10-14",
    description: "White USB-C charger with a small blue sticker near the plug."
  },
  {
    id: "sample-bottle",
    title: "Blue water bottle",
    status: "Found",
    category: "Personal items",
    location: "Student Center",
    date: "2026-10-13",
    description: "Matte navy bottle with a white “Breathe” logo and a dent on the base."
  },
  {
    id: "sample-notebook",
    title: "Calculus notebook",
    status: "Lost",
    category: "Study supplies",
    location: "Science Hall, Room 104",
    date: "2026-10-12",
    description: "Green spiral notebook with “MATH 201” written on the front cover."
  },
  {
    id: "sample-earbuds",
    title: "Black wireless earbuds",
    status: "Returned",
    category: "Electronics",
    location: "Arts Building lobby",
    date: "2026-10-11",
    description: "Black earbuds in a matching case, identified and returned to their owner."
  },
  {
    id: "sample-keys",
    title: "Set of silver keys",
    status: "Found",
    category: "Personal items",
    location: "North campus entrance",
    date: "2026-10-10",
    description: "Three keys on a red carabiner, found beside the north campus entrance."
  },
  {
    id: "sample-hoodie",
    title: "Grey university hoodie",
    status: "Lost",
    category: "Clothing",
    location: "West residence hall",
    date: "2026-10-09",
    description: "Size medium grey hoodie with a small university crest on the left chest."
  }
];

let listings = [];
let activeStatus = "All";
let searchTerm = "";
let activeCategory = "All categories";

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  listings = loadListings();
  bindEvents();
  render();
  document.documentElement.classList.add("app-ready");
});

function cacheElements() {
  elements.listingGrid = document.querySelector("#listing-grid");
  elements.emptyState = document.querySelector("#empty-state");
  elements.listingCount = document.querySelector("#listing-count");
  elements.searchInput = document.querySelector("#search-input");
  elements.categoryFilter = document.querySelector("#category-filter");
  elements.reportForm = document.querySelector("#report-form");
  elements.formMessage = document.querySelector("#form-message");
  elements.cancelButton = document.querySelector("#cancel-button");
  elements.headerReportButton = document.querySelector(".header-action");
  elements.pulseMessage = document.querySelector("#pulse-message");
  elements.statusButtons = document.querySelectorAll(".filter-button");
  elements.statCounts = {
    Lost: document.querySelector("#lost-count"),
    Found: document.querySelector("#found-count"),
    Returned: document.querySelector("#returned-count")
  };
}

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderListings();
  });

  elements.categoryFilter.addEventListener("change", (event) => {
    activeCategory = event.target.value;
    renderListings();
  });

  elements.statusButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeStatus = button.dataset.status;
      elements.statusButtons.forEach((statusButton) => {
        statusButton.classList.toggle("active", statusButton === button);
      });
      renderListings();
    });
  });

  elements.listingGrid.addEventListener("click", (event) => {
    const returnButton = event.target.closest("[data-return-id]");
    if (returnButton) {
      markAsReturned(returnButton.dataset.returnId);
    }
  });

  elements.reportForm.addEventListener("submit", handleFormSubmit);
  elements.reportForm.addEventListener("input", clearFieldError);
  elements.reportForm.addEventListener("change", clearFieldError);
  elements.cancelButton.addEventListener("click", resetForm);
  elements.headerReportButton.addEventListener("click", focusReportForm);
}

function loadListings() {
  try {
    const savedData = window.localStorage.getItem(STORAGE_KEY);
    if (savedData === null) {
      return cloneSamples();
    }
    const parsedData = JSON.parse(savedData);
    if (!Array.isArray(parsedData)) {
      return cloneSamples();
    }
    const validListings = parsedData.filter(isValidListing);
    return validListings.length === parsedData.length ? validListings : cloneSamples();
  } catch (error) {
    return cloneSamples();
  }
}

function cloneSamples() {
  return SAMPLE_LISTINGS.map((listing) => ({ ...listing }));
}

function isValidListing(listing) {
  const requiredFields = ["id", "title", "status", "category", "location", "date", "description"];
  return listing
    && requiredFields.every((field) => typeof listing[field] === "string" && listing[field].trim() !== "")
    && ["Lost", "Found", "Returned"].includes(listing.status);
}

function saveListings() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch (error) {
    showFormMessage("Changes are visible now but could not be saved on this device.", "error");
  }
}

function render() {
  renderStatistics();
  renderFilterCounts();
  renderListings();
}

function renderStatistics() {
  const counts = getStatusCounts();
  elements.statCounts.Lost.textContent = counts.Lost;
  elements.statCounts.Found.textContent = counts.Found;
  elements.statCounts.Returned.textContent = counts.Returned;
  elements.pulseMessage.textContent = `${listings.length} listing${listings.length === 1 ? "" : "s"} on the board`;
}

function getStatusCounts() {
  return listings.reduce((counts, listing) => {
    counts[listing.status] += 1;
    return counts;
  }, { Lost: 0, Found: 0, Returned: 0 });
}

function renderFilterCounts() {
  const counts = getStatusCounts();
  elements.statusButtons.forEach((button) => {
    const status = button.dataset.status;
    const count = status === "All" ? listings.length : counts[status];
    button.querySelector("span").textContent = count;
  });
}

function getVisibleListings() {
  return listings.filter((listing) => {
    const matchesStatus = activeStatus === "All" || listing.status === activeStatus;
    const matchesCategory = activeCategory === "All categories" || listing.category === activeCategory;
    const searchableText = [listing.title, listing.category, listing.location, listing.description]
      .join(" ")
      .toLowerCase();
    return matchesStatus && matchesCategory && searchableText.includes(searchTerm);
  });
}

function renderListings() {
  const visibleListings = getVisibleListings();
  elements.listingGrid.replaceChildren();
  visibleListings.forEach((listing) => {
    elements.listingGrid.appendChild(createListingCard(listing));
  });
  elements.listingCount.textContent = `Showing ${visibleListings.length} item${visibleListings.length === 1 ? "" : "s"}`;
  elements.emptyState.hidden = visibleListings.length !== 0;
}

function createListingCard(listing) {
  const card = document.createElement("article");
  card.className = "listing-card";

  const topline = document.createElement("div");
  topline.className = "card-topline";
  const icon = document.createElement("span");
  icon.className = `item-icon ${getIconClass(listing.category)}`;
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = getIcon(listing.category);
  const badge = document.createElement("span");
  badge.className = `badge badge-${listing.status.toLowerCase()}`;
  badge.textContent = listing.status;
  topline.append(icon, badge);

  const title = document.createElement("h3");
  title.textContent = listing.title;
  const category = document.createElement("p");
  category.className = "category-label";
  category.textContent = listing.category;
  const description = document.createElement("p");
  description.className = "description";
  description.textContent = listing.description;
  const meta = document.createElement("div");
  meta.className = "card-meta";
  const location = document.createElement("span");
  location.textContent = listing.location;
  const date = document.createElement("time");
  date.dateTime = listing.date;
  date.textContent = formatDate(listing.date);
  meta.append(location, date);

  card.append(topline, title, category, description, meta);
  if (listing.status === "Lost" || listing.status === "Found") {
    const returnButton = document.createElement("button");
    returnButton.className = "return-button";
    returnButton.type = "button";
    returnButton.dataset.returnId = listing.id;
    returnButton.textContent = "Mark as Returned";
    card.appendChild(returnButton);
  }
  return card;
}

function getIconClass(category) {
  const icons = {
    Electronics: "icon-electronics",
    "Personal items": "icon-personal",
    "Study supplies": "icon-study",
    Clothing: "icon-clothing"
  };
  return icons[category] || "icon-personal";
}

function getIcon(category) {
  const icons = { Electronics: "⌁", "Personal items": "✦", "Study supplies": "▤", Clothing: "◒" };
  return icons[category] || "•";
}

function formatDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  clearFormMessage();
  clearFieldErrors();
  const formData = new FormData(elements.reportForm);
  const values = {
    title: formData.get("item-title").trim(),
    status: formData.get("item-status"),
    category: formData.get("item-category"),
    location: formData.get("item-location").trim(),
    date: formData.get("item-date"),
    description: formData.get("item-description").trim()
  };
  const errors = validateForm(values);
  if (Object.keys(errors).length > 0) {
    showValidationErrors(errors);
    return;
  }

  listings.unshift({ ...values, id: createId() });
  saveListings();
  render();
  elements.reportForm.reset();
  showFormMessage("Your item was added to the campus listings.", "success");
}

function validateForm(values) {
  const errors = {};
  Object.entries(values).forEach(([field, value]) => {
    if (!value) {
      errors[field] = "This field is required.";
    }
  });
  return errors;
}

function showValidationErrors(errors) {
  const fieldMap = {
    title: "item-title",
    status: "item-status",
    category: "item-category",
    location: "item-location",
    date: "item-date",
    description: "item-description"
  };
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.querySelector(`#${fieldMap[field]}`);
    const group = input.closest(".form-group");
    const error = document.createElement("span");
    error.className = "field-error";
    error.textContent = message;
    error.id = `${input.id}-error`;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
    group.classList.add("has-error");
    group.appendChild(error);
  });
  showFormMessage("Please complete the highlighted fields.", "error");
}

function clearFieldError(event) {
  const input = event?.target;
  if (!input || !input.matches("input, select, textarea")) {
    return;
  }
  const group = input.closest(".form-group");
  group.classList.remove("has-error");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  group.querySelector(".field-error")?.remove();
}

function clearFieldErrors() {
  elements.reportForm.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("has-error");
    group.querySelector(".field-error")?.remove();
  });
  elements.reportForm.querySelectorAll("[aria-invalid], [aria-describedby]").forEach((input) => {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  });
}

function markAsReturned(id) {
  const listing = listings.find((item) => item.id === id);
  if (!listing || listing.status === "Returned") {
    return;
  }
  listing.status = "Returned";
  saveListings();
  render();
}

function resetForm() {
  elements.reportForm.reset();
  clearFieldErrors();
  clearFormMessage();
}

function focusReportForm() {
  document.querySelector(".report-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  document.querySelector("#item-title").focus({ preventScroll: true });
}

function showFormMessage(message, type) {
  elements.formMessage.className = `form-message ${type}`;
  elements.formMessage.textContent = message;
}

function clearFormMessage() {
  elements.formMessage.className = "form-message";
  elements.formMessage.textContent = "";
}

function createId() {
  return `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}