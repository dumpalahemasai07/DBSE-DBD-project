document.addEventListener('DOMContentLoaded', () => {
  requireAuth(); // Must be logged in to book
  renderCheckoutSummary();

  document.getElementById('confirm-btn').addEventListener('click', handleConfirm);
});

function renderCheckoutSummary() {
  const listEl = document.getElementById('checkout-cart-items');
  listEl.innerHTML = '';
  
  if (Object.keys(cart).length === 0) {
    listEl.innerHTML = '<p>Your cart is empty.</p>';
    document.getElementById('confirm-btn').disabled = true;
    return;
  }

  const totals = getCartTotals();

  Object.values(cart).forEach(item => {
    listEl.innerHTML += `
      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem;">
        <span>${item.quantity}x ${item.service.name} (${item.variant.title})</span>
        <span>₹${item.variant.price * item.quantity}</span>
      </div>
    `;
  });

  document.getElementById('bill-item-total').innerText = `₹${totals.itemTotal}`;
  document.getElementById('bill-taxes').innerText = `₹${totals.taxes + totals.consultFee}`;
  document.getElementById('bill-grand-total').innerText = `₹${totals.grandTotal}`;
}

async function handleConfirm() {
  const date = document.getElementById('booking-date').value;
  const timeSlot = document.getElementById('booking-time').value;
  const address = document.getElementById('booking-address').value;

  if(!date || !timeSlot || !address) {
    showToast('Please fill all schedule and address details.');
    return;
  }

  const totals = getCartTotals();
  const itemsPayload = Object.values(cart).map(c => ({
    serviceId: c.service._id,
    variantTitle: c.variant.title,
    price: c.variant.price,
    quantity: c.quantity
  }));

  try {
    const res = await apiFetch(`/bookings`, {
      method: 'POST',
      body: JSON.stringify({ 
        items: itemsPayload, 
        cartTotal: totals.itemTotal, 
        grandTotal: totals.grandTotal, 
        date, 
        timeSlot, 
        address 
      })
    });
    
    if(res.success) {
      clearCart();
      showToast('Booking confirmed successfully!');
      setTimeout(() => {
        window.location.href = 'profile.html';
      }, 1500);
    } else {
      showToast(res.error || 'Failed to confirm booking.');
    }
  } catch (error) {
    showToast('Network error while booking.');
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
