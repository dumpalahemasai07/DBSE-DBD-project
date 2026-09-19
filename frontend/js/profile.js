document.addEventListener('DOMContentLoaded', () => {
  requireRole('customer');
  
  // Tabs logic
  document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      link.classList.add('active');
      document.getElementById(link.dataset.tab).classList.add('active');
    });
  });

  loadUserProfile();
  fetchMyBookings();
});

function loadUserProfile() {
  if (currentUser) {
    document.getElementById('user-details').innerHTML = `
      <p><strong>Name:</strong> ${currentUser.name}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
    `;
  }
}

async function fetchMyBookings() {
  const container = document.getElementById('bookings-list');
  try {
    const res = await apiFetch('/bookings');
    if (res.success && res.data.length > 0) {
      container.innerHTML = '';
      res.data.forEach(booking => {
        let itemsHtml = booking.items.map(i => `<li>${i.quantity}x ${i.variantTitle}</li>`).join('');
        const proHtml = booking.professional ? `<p><strong>Pro Assigned:</strong> ${booking.professional.name} (${booking.professional.phone || 'No phone'})</p>` : '';
        
        container.innerHTML += `
          <div class="booking-card" style="background:var(--bg-light); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
              <h4>Date: ${booking.date} | ${booking.timeSlot}</h4>
              <span class="status-badge status-${booking.status}">${booking.status}</span>
            </div>
            <ul>${itemsHtml}</ul>
            <p style="margin-top:0.5rem;"><strong>Total:</strong> ₹${booking.grandTotal}</p>
            <p><strong>Address:</strong> ${booking.address}</p>
            ${proHtml}
          </div>
        `;
      });
    } else {
      container.innerHTML = '<p>No bookings found.</p>';
    }
  } catch (error) {
    container.innerHTML = '<p style="color:red">Error loading bookings</p>';
  }
}
