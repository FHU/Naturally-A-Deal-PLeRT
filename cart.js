const itemsEl = document.querySelector('.cart-items');
const itemTemplate = document.querySelector('#cart-item-template');
const statusEl = document.querySelector('#cart-status');
const subtotalEl = document.querySelector('#cart-subtotal');
const totalEl = document.querySelector('#cart-total');
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

let cartItems = [];

async function loadCart() {
  statusEl.hidden = true;
  itemsEl.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'cart-loading';
  loading.textContent = 'Loading your cart…';
  itemsEl.append(loading);

  try {
    const response = await fetch('NAD.json');
    if (!response.ok) {
      throw new Error(`The server responded ${response.status} ${response.statusText}.`);
    }

    const products = await response.json();
    if (!Array.isArray(products)) {
      throw new Error('The product data was not a list.');
    }

    cartItems = products
      .map((product) => ({
        ...product,
        price: Number.parseFloat(product.price),
      }))
      .filter((product) => product.product_name?.trim() && Number.isFinite(product.price))
      .slice(0, 4)
      .map((product) => ({ product, quantity: 1 }));

    if (cartItems.length !== 4) {
      throw new Error('Four valid products could not be loaded.');
    }

    renderCart();
  } catch (error) {
    console.error(error);
    itemsEl.replaceChildren();
    statusEl.querySelector('.status-detail').textContent = error.message;
    statusEl.hidden = false;
  }
}

function renderCart() {
  if (!cartItems.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'cart-empty';
    emptyMessage.textContent = 'Your cart is empty.';
    itemsEl.replaceChildren(emptyMessage);
    updateTotals();
    return;
  }

  const itemElements = cartItems.map(({ product, quantity }, index) => {
    const item = itemTemplate.content.firstElementChild.cloneNode(true);
    const image = item.querySelector('.cart-item-image');
    image.alt = product.product_name;
    if (product.image_url) {
      image.src = product.image_url;
      image.addEventListener('error', () => image.classList.add('image-unavailable'), { once: true });
    } else {
      image.classList.add('image-unavailable');
    }

    item.querySelector('.cart-item-category').textContent = product.categories || 'Product';
    item.querySelector('.cart-item-name').textContent = product.product_name;
    const packageSize = product.package_size?.trim();
    const packageElement = item.querySelector('.cart-item-package');
    packageElement.textContent = packageSize ? `Case of ${packageSize}` : '';
    packageElement.hidden = !packageSize;
    item.querySelector('.cart-item-price').textContent = `${currency.format(product.price)} each`;

    const quantityInput = item.querySelector('.quantity-input');
    quantityInput.value = String(quantity);
    quantityInput.setAttribute('aria-label', `Quantity of ${product.product_name}`);
    quantityInput.addEventListener('change', () => {
      const requestedQuantity = Number.parseInt(quantityInput.value, 10);
      cartItems[index].quantity = Number.isFinite(requestedQuantity) && requestedQuantity > 0
        ? requestedQuantity
        : 1;
      renderCart();
    });

    item.querySelector('.remove-item').addEventListener('click', () => {
      cartItems.splice(index, 1);
      renderCart();
    });

    item.querySelector('.cart-item-total').textContent = currency.format(
      Math.round(product.price * 100) * quantity / 100,
    );
    return item;
  });

  itemsEl.replaceChildren(...itemElements);
  updateTotals();
}

function updateTotals() {
  const totalCents = cartItems.reduce(
    (sum, { product, quantity }) => sum + Math.round(product.price * 100) * quantity,
    0,
  );
  const total = currency.format(totalCents / 100);
  subtotalEl.textContent = total;
  totalEl.textContent = total;
}

statusEl.querySelector('.retry').addEventListener('click', loadCart);
loadCart();
