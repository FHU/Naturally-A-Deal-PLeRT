/* ---------- Configuration ---------- */
// Serve the page and JSON file from the same local server
// (e.g. `python3 -m http.server`), or replace this with an API URL.
const API_URL = 'NAD.json';

const productsEl = document.querySelector('#products');
const statusEl  = document.querySelector('#status');
const cardTemplate   = document.querySelector('#card-template');

/* ---------- Fetching ---------- */
async function fetchProducts() {
  const result = await fetch(API_URL);
  if (!result.ok) throw new Error(`The server responded ${result.status} ${result.statusText}.`);

  const data = await result.json();
  if (!Array.isArray(data)) throw new Error('The response was not a list of products.');
  
  // Clean up each product, keeping only ones with a name and a valid price.
  const products = [];
  for (const raw of data) {
    const product = normalize(raw);
    if (product.product_name && Number.isFinite(product.price)) {
      products.push(product);
    }
  }
  return products;

}

// The API sends every value as a string ("price": "22.87"), so turn the
// price into a number and trim the text fields we match or display.
function normalize(raw) {
  return {
    ...raw,
    product_name: raw.product_name?.trim(),
    categories: raw.categories?.trim(),
    price: Number.parseFloat(raw.price),
  };
}

/* ---------- Building cards ---------- */
// innerHTML is used here (instead of textContent) so the cents can be wrapped
// in a <sup> tag. That's safe because the string is built from a number we
// formatted ourselves. Never use innerHTML with text that came from the API
// or a user: it would run any HTML or script inside it.
function formatPrice(price) {
  const [dollars, cents] = price.toFixed(2).split('.');
  return `$${dollars}<sup>${cents}</sup>`;
}

function dateText(product) {
  if (product.best_by_date) return `Best by ${product.best_by_date}`;
  const label = product.date_label ?? '';
  // The source data uses these placeholder values to mean "no date".
  // This is a cleanup for this particular dataset, not a JavaScript idiom.
  return ['', '-', '- -', '0'].includes(label) ? '' : label;
}

function makeCard(product) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  card.dataset.productId = product.product_id;

  const media = card.querySelector('.media');
  const img = card.querySelector('img');
  media.dataset.initial = product.product_name.charAt(0);
  img.addEventListener('error', () => media.classList.add('no-img'));
  if (product.image_url) {
    img.src = product.image_url;
    img.alt = product.product_name;
  } else {
    media.classList.add('no-img');
  }

  const storage = card.querySelector('.storage');
  storage.textContent = product.storage_type;
  storage.dataset.type = product.storage_type;
  storage.hidden = !product.storage_type;

  const pack = card.querySelector('.pack');
  pack.textContent = product.package_size ? `Case · ${product.package_size}` : '';
  pack.hidden = !product.package_size;

  card.querySelector('.name').textContent = product.product_name;

  card.querySelector('.amount').innerHTML = formatPrice(product.price);
  const unit = card.querySelector('.unit');
  unit.textContent = product.unit_price ? `$${product.unit_price}` : '';
  unit.hidden = !product.unit_price;

  const date = card.querySelector('.date');
  date.textContent = dateText(product);
  date.hidden = !date.textContent;

  card.querySelector('.add').setAttribute('aria-label', `Add ${product.product_name} to cart`);
  return card;
}

/* ---------- Loading and error states ---------- */
function showLoading() {
  statusEl.hidden = true;
  const message = document.createElement('p');
  message.className = 'loading';
  message.textContent = 'Loading products…';
  productsEl.replaceChildren(message);
}

function showError(error) {
  productsEl.replaceChildren();
  statusEl.querySelector('.status-detail').textContent = error.message;
  statusEl.hidden = false;
}

/* ---------- Putting it together ---------- */
async function loadProducts() {
  showLoading();
  try {
    const products = await fetchProducts();
    if (!products.length) throw new Error('No products were found.');
    productsEl.replaceChildren(...products.map(makeCard));
  } catch (error) {
    console.error(error);   // full details for the developer in DevTools
    showError(error);       // a readable message for the visitor
  }
}

// The "Try again" button just runs the whole process again.
statusEl.querySelector('.retry').addEventListener('click', loadProducts);

// Start loading as soon as the script runs.
loadProducts();