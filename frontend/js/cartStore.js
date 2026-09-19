let cart = JSON.parse(localStorage.getItem('cart')) || {};

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

window.addToCart = function(service, variantIndex) {
  if (!service || !service.variants || !service.variants[variantIndex]) return;

  const variant = service.variants[variantIndex];
  const variantId = `${service._id}_${variantIndex}`;

  if (!cart[variantId]) {
    cart[variantId] = {
      service: {
        _id: service._id,
        name: service.name,
        category: service.category,
        imageUrl: service.imageUrl,
        consultationFee: service.consultationFee || 0
      },
      variant: {
        title: variant.title,
        price: variant.price,
        duration: variant.duration
      },
      quantity: 1
    };
  } else {
    cart[variantId].quantity += 1;
  }

  saveCart();
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof reRenderVariantAction === 'function') reRenderVariantAction(variantId);
  if (typeof showToast === 'function') showToast(`Added "${variant.title}" to cart`);
};

window.updateQty = function(serviceId, variantIndex, change) {
  const variantId = `${serviceId}_${variantIndex}`;
  if (cart[variantId]) {
    cart[variantId].quantity += change;
    if (cart[variantId].quantity <= 0) {
      delete cart[variantId];
    }
  }
  saveCart();
  if (typeof updateCartUI === 'function') updateCartUI();
  if (typeof reRenderVariantAction === 'function') reRenderVariantAction(variantId);
  if (typeof renderCartPage === 'function') renderCartPage();
};

window.removeFromCart = function(variantId) {
  if (cart[variantId]) {
    delete cart[variantId];
    saveCart();
    if (typeof updateCartUI === 'function') updateCartUI();
    if (typeof renderCartPage === 'function') renderCartPage();
  }
};

window.getCartTotals = function() {
  let itemTotal = 0;
  let totalItems = 0;
  let consultFee = 0;

  Object.values(cart).forEach(item => {
    totalItems += item.quantity;
    itemTotal += item.variant.price * item.quantity;
    if (item.service.consultationFee > consultFee) {
      consultFee = item.service.consultationFee;
    }
  });

  const taxes = totalItems > 0 ? 49 : 0;
  const grandTotal = totalItems > 0 ? (itemTotal + consultFee + taxes) : 0;

  return { itemTotal, totalItems, consultFee, taxes, grandTotal };
};

window.clearCart = function() {
  cart = {};
  saveCart();
  if (typeof updateCartUI === 'function') updateCartUI();
};

// Global cart badge update on DOM load
document.addEventListener('DOMContentLoaded', () => {
  const totals = getCartTotals();
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.innerText = totals.totalItems;
  }
});
