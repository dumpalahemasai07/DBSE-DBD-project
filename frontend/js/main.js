let allServices = [];
let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupSearchInput();
});

async function initApp() {
  await fetchCategories();
  await fetchServices();
  updateCartUI();
}

async function fetchCategories() {
  const heroCatContainer = document.querySelector('.hero-categories');
  try {
    const res = await apiFetch('/categories');
    if (res.success && res.data && res.data.length > 0) {
      allCategories = res.data;
      if (heroCatContainer) {
        heroCatContainer.innerHTML = allCategories.slice(0, 8).map(c => `
          <a href="services.html?category=${encodeURIComponent(c.name)}" class="cat-item">
            <div class="cat-icon-circle" style="font-size: 1.5rem; display: flex; align-items: center; justify-content: center; background: var(--bg-light); border-radius: 50%; width: 54px; height: 54px;">
              ${c.icon || '🛠️'}
            </div>
            <span style="font-size:0.8rem; font-weight:600; margin-top:0.3rem;">${c.name}</span>
          </a>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to fetch categories:', err);
  }
}

async function fetchServices() {
  const container = document.getElementById('dynamic-sections-container');
  try {
    const res = await apiFetch('/services');
    if (res.success && res.data.length > 0) {
      allServices = res.data;
      renderLayout(allServices);
    } else {
      container.innerHTML = `<div style="text-align:center; padding:3rem;">No services available at the moment.</div>`;
    }
  } catch (error) {
    container.innerHTML = `<div style="text-align:center; padding:3rem; color:red;">Failed to load services. Please check server.</div>`;
  }
}

async function renderLayout(services) {
  const container = document.getElementById('dynamic-sections-container');
  container.innerHTML = '';

  // 1. BOOK AGAIN Section (If user has past bookings)
  if (currentUser) {
    try {
      const bRes = await apiFetch('/bookings/recent');
      if (bRes.success && bRes.data && bRes.data.length > 0) {
        container.appendChild(createBookAgainStrip(bRes.data));
      }
    } catch (e) {}
  }

  // 2. RECENTLY VIEWED Section (From localStorage)
  const recentItems = getRecentlyViewed();
  if (recentItems.length > 0) {
    container.appendChild(createRecentlyViewedStrip(recentItems));
  }

  // 3. TOP PROFESSIONALS / BEST MATCH Section
  try {
    const proRes = await apiFetch('/providers/recommend');
    if (proRes.success && proRes.data && proRes.data.topProfessionals && proRes.data.topProfessionals.length > 0) {
      container.appendChild(createTopProfessionalsStrip(proRes.data));
    }
  } catch (e) {}

  // 4. RECOMMENDED FOR YOU
  const recommended = services.filter(s => (s.rating || 4.8) >= 4.7).slice(0, 6);
  if (recommended.length > 0) {
    container.appendChild(createStrip('Recommended For You', recommended, 'Recommended'));
  }

  // Standard Service Strips
  const trending = services.slice(0, 6);
  const mostBooked = services.slice(6, 12);
  
  const cleaning = services.filter(s => (s.category || '').toLowerCase().includes('clean'));
  const appliance = services.filter(s => {
    const cat = (s.category || '').toLowerCase();
    return cat.includes('ac') || cat.includes('appliance') || cat.includes('fridge') || cat.includes('wash') || cat.includes('purifier');
  });
  const beauty = services.filter(s => {
    const cat = (s.category || '').toLowerCase();
    return cat.includes('beauty') || cat.includes('grooming') || cat.includes('salon');
  });
  const repairs = services.filter(s => {
    const cat = (s.category || '').toLowerCase();
    return cat.includes('electrician') || cat.includes('plumb') || cat.includes('carpent') || cat.includes('paint') || cat.includes('pest');
  });

  if (trending.length > 0) container.appendChild(createStrip('Trending & Top Rated', trending));
  if (mostBooked.length > 0) container.appendChild(createStrip('Most Booked Services', mostBooked));
  if (beauty.length > 0) container.appendChild(createStrip('Salon & Beauty at Home', beauty, 'Beauty'));
  if (cleaning.length > 0) container.appendChild(createStrip('Cleaning & Sanitation', cleaning, 'Cleaning'));
  if (appliance.length > 0) container.appendChild(createStrip('AC & Appliance Repair', appliance, 'Appliance'));
  if (repairs.length > 0) container.appendChild(createStrip('Home Maintenance & Repairs', repairs, 'Repairs'));
}

function createBookAgainStrip(recentBookings) {
  const wrapper = document.createElement('div');
  wrapper.className = 'horizontal-strip-wrapper';
  wrapper.style.background = '#f4f4ff';

  const container = document.createElement('div');
  container.className = 'container';

  const header = document.createElement('div');
  header.className = 'strip-header';
  header.innerHTML = `
    <h3>🔁 Book Again (Recent Services)</h3>
    <a href="bookings.html">View History →</a>
  `;
  container.appendChild(header);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'horizontal-scroll-container';

  recentBookings.forEach(b => {
    const item = (b.items && b.items[0]) ? b.items[0] : null;

    let sId = b.serviceId || '';
    if (!sId && item && item.service) {
      if (typeof item.service === 'object' && item.service._id) {
        sId = item.service._id.toString();
      } else if (typeof item.service === 'string') {
        sId = item.service;
      }
    }

    if (!sId || sId === '[object Object]') return;

    const serviceName = b.serviceName || (item && item.service && typeof item.service === 'object' && item.service.name ? item.service.name : (item ? item.name : 'Home Service'));
    const packageName = b.packageName || (item ? item.packageName : '');
    const proName = b.professional ? b.professional.name : 'Verified Professional';

    const card = document.createElement('div');
    card.className = 'strip-card';
    card.style.minWidth = '260px';
    const pkgAttr = packageName ? packageName.replace(/'/g, "\\'") : '';
    card.innerHTML = `
      <div style="padding: 1.25rem;">
        <span class="status-badge status-Confirmed" style="font-size:0.75rem;">Last Booked: ${b.date}</span>
        <h4 style="font-size:1.05rem; font-weight:800; margin:0.5rem 0 0.25rem 0;">${serviceName}</h4>
        <p style="font-size:0.85rem; color:var(--text-medium);">${packageName || ''}</p>
        <p style="font-size:0.8rem; color:var(--text-light); margin-top:0.25rem;">🧑‍🔧 ${proName}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
          <strong style="color:var(--accent-color); font-size:1.1rem;">₹${b.grandTotal}</strong>
          <button class="btn btn-primary-sm" onclick="handleBookAgain('${sId}', '${pkgAttr}')">Book Again →</button>
        </div>
      </div>
    `;
    scrollContainer.appendChild(card);
  });

  container.appendChild(scrollContainer);
  wrapper.appendChild(container);
  return wrapper;
}

function handleBookAgain(serviceId, packageName) {
  if (serviceId && serviceId !== '[object Object]' && serviceId !== 'undefined' && serviceId !== 'null') {
    let url = `service-details.html?id=${serviceId}`;
    if (packageName) {
      url += `&package=${encodeURIComponent(packageName)}`;
    }
    window.location.href = url;
  } else {
    window.location.href = 'services.html';
  }
}

function createRecentlyViewedStrip(items) {
  const wrapper = document.createElement('div');
  wrapper.className = 'horizontal-strip-wrapper';

  const container = document.createElement('div');
  container.className = 'container';

  const header = document.createElement('div');
  header.className = 'strip-header';
  header.innerHTML = `<h3>👁 Recently Viewed Services</h3>`;
  container.appendChild(header);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'horizontal-scroll-container';

  items.forEach(s => {
    const card = document.createElement('div');
    card.className = 'strip-card';
    card.style.minWidth = '220px';
    card.innerHTML = `
      <div class="strip-card-img" onclick="window.location.href='service-details.html?id=${s._id}'">
        <img src="${s.imageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80'}" alt="${s.name}" onerror="handleImgError(this)">
        <div class="strip-rating">★ ${s.rating || '4.8'}</div>
      </div>
      <div class="strip-card-content">
        <h4 class="strip-card-title" onclick="window.location.href='service-details.html?id=${s._id}'">${s.name}</h4>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem;">
          <strong style="color:var(--accent-color);">₹${s.startingPrice || 499}</strong>
          <button class="btn btn-outline-sm" onclick="window.location.href='service-details.html?id=${s._id}'">View</button>
        </div>
      </div>
    `;
    scrollContainer.appendChild(card);
  });

  container.appendChild(scrollContainer);
  wrapper.appendChild(container);
  return wrapper;
}

function createTopProfessionalsStrip(proData) {
  const wrapper = document.createElement('div');
  wrapper.className = 'horizontal-strip-wrapper';
  wrapper.style.background = '#fafafa';

  const container = document.createElement('div');
  container.className = 'container';

  const header = document.createElement('div');
  header.className = 'strip-header';
  header.innerHTML = `
    <h3>🏆 Top Professionals & Best Match</h3>
    <span style="font-size:0.85rem; color:var(--text-medium);">Background verified home service experts near you</span>
  `;
  container.appendChild(header);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'horizontal-scroll-container';

  const pros = proData.topProfessionals || [];
  pros.slice(0, 8).forEach((p, idx) => {
    const isBest = (idx === 0);
    const card = document.createElement('div');
    card.className = 'strip-card';
    card.style.minWidth = '270px';
    card.style.border = isBest ? '2px solid var(--accent-color)' : '1px solid var(--border-color)';
    card.style.background = 'white';

    card.innerHTML = `
      <div style="padding: 1.25rem; text-align: center;">
        ${isBest ? `<span style="background:var(--accent-color); color:white; font-weight:800; font-size:0.7rem; padding:0.2rem 0.6rem; border-radius:12px; text-transform:uppercase;">⭐ Best Match</span>` : ''}
        <img src="${p.profileImage || (p.user ? p.user.profileImage : '') || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&q=80'}" style="width:70px; height:70px; border-radius:50%; object-fit:cover; margin:0.75rem auto 0.5rem auto; display:block;" onerror="handleImgError(this)">
        <h4 style="font-size:1.05rem; font-weight:800;">${p.name}</h4>
        <p style="font-size:0.85rem; color:var(--text-medium); margin-top:0.2rem;">${(p.skills && p.skills.length > 0) ? p.skills.join(', ') : 'Home Service Specialist'}</p>
        
        <div style="display:flex; justify-content:center; gap:0.75rem; margin:0.75rem 0; font-size:0.85rem;">
          <span>⭐ <strong>${p.rating || 4.9}</strong></span>
          <span>💼 <strong>${p.completedJobs || 50}+ jobs</strong></span>
        </div>

        <div style="font-size:0.75rem; color:var(--success-color); font-weight:700; margin-bottom:0.75rem;">
          ✓ Verified Expert • ${p.isAvailableForSlot ? 'Available' : 'Popular'}
        </div>

        <button class="btn btn-outline-sm btn-full" onclick="showProviderProfileModal('${p._id}')">View Profile & Reviews</button>
      </div>
    `;
    scrollContainer.appendChild(card);
  });

  container.appendChild(scrollContainer);
  wrapper.appendChild(container);
  return wrapper;
}

async function showProviderProfileModal(providerId) {
  try {
    const res = await apiFetch(`/providers/${providerId}`);
    if (!res.success || !res.data) {
      showToast('Could not load provider profile', 'error');
      return;
    }

    const p = res.data;
    let modal = document.getElementById('provider-profile-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'provider-profile-modal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    const reviewsHtml = (p.reviews && p.reviews.length > 0)
      ? p.reviews.map(r => `
          <div style="border-bottom:1px solid #eee; padding:0.6rem 0; font-size:0.85rem;">
            <div style="display:flex; justify-content:space-between;">
              <strong>${r.user ? r.user.name : 'Customer'}</strong>
              <span style="color:#eab308;">⭐ ${r.rating}/5</span>
            </div>
            <p style="color:var(--text-medium); margin-top:0.2rem;">"${r.comment}"</p>
          </div>
        `).join('')
      : `<p style="font-size:0.85rem; color:var(--text-medium);">No reviews posted yet.</p>`;

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 550px;">
        <div class="modal-header">
          <h3>Professional Profile</h3>
          <button class="close-modal-btn" onclick="document.getElementById('provider-profile-modal').classList.remove('active')">&times;</button>
        </div>
        <div style="text-align:center; padding-bottom:1rem; border-bottom:1px solid #eee;">
          <img src="${p.profileImage || (p.user ? p.user.profileImage : '') || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&q=80'}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin:0 auto 0.5rem auto;" onerror="handleImgError(this)">
          <h3 style="font-size:1.3rem; font-weight:800;">${p.name}</h3>
          <p style="color:var(--text-medium); font-size:0.9rem;">${p.bio || 'Verified Home Service Professional'}</p>
          <div style="display:flex; justify-content:center; gap:1.5rem; margin-top:0.75rem; font-size:0.9rem;">
            <span>⭐ <strong>${p.rating || 4.9}</strong> Rating</span>
            <span>💼 <strong>${p.completedJobs || 50}+</strong> Jobs</span>
            <span>⏳ <strong>${p.experience || 5} Years</strong> Exp</span>
          </div>
        </div>

        <div style="margin: 1rem 0;">
          <strong style="font-size:0.95rem; display:block; margin-bottom:0.4rem;">Skills & Specialties:</strong>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            ${(p.skills && p.skills.length > 0) ? p.skills.map(s => `<span class="pill">${s}</span>`).join('') : '<span class="pill">Home Repair</span>'}
          </div>
        </div>

        <div style="margin: 1rem 0;">
          <strong style="font-size:0.95rem; display:block; margin-bottom:0.4rem;">Service Areas Covered:</strong>
          <p style="font-size:0.85rem; color:var(--text-medium);">${(p.serviceAreas && p.serviceAreas.length > 0) ? p.serviceAreas.join(', ') : 'Hyderabad Metro Region'}</p>
        </div>

        <div style="margin: 1rem 0;">
          <strong style="font-size:0.95rem; display:block; margin-bottom:0.4rem;">Recent Customer Reviews:</strong>
          <div style="max-height:160px; overflow-y:auto;">
            ${reviewsHtml}
          </div>
        </div>

        <button class="btn btn-primary btn-full" onclick="document.getElementById('provider-profile-modal').classList.remove('active'); window.location.href='services.html';">Select Service & Book Professional</button>
      </div>
    `;

    modal.classList.add('active');
  } catch (e) {
    showToast('Error loading provider details', 'error');
  }
}

function createStrip(title, services, categoryId = '') {
  const wrapper = document.createElement('div');
  wrapper.className = 'horizontal-strip-wrapper';
  if(categoryId) wrapper.id = `section-${categoryId}`;

  const container = document.createElement('div');
  container.className = 'container';
  
  const header = document.createElement('div');
  header.className = 'strip-header';
  const categoryLink = categoryId ? `services.html?category=${encodeURIComponent(categoryId)}` : 'services.html';
  header.innerHTML = `
    <h3>${title}</h3>
    <a href="${categoryLink}">View All →</a>
  `;
  container.appendChild(header);

  const scrollContainer = document.createElement('div');
  scrollContainer.className = 'horizontal-scroll-container';

  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'strip-card';
    
    let variantsHtml = '';
    if (service.variants && service.variants.length > 0) {
      service.variants.forEach((v, index) => {
        const variantId = `${service._id}_${index}`;
        const qty = cart[variantId] ? cart[variantId].quantity : 0;
        
        let actionBtnHtml = qty === 0 
          ? `<button class="add-btn" onclick="addToCartById('${service._id}', ${index})">Add</button>`
          : `<div class="qty-control">
              <button class="qty-btn" onclick="updateQty('${service._id}', ${index}, -1)">-</button>
              <span class="qty-val">${qty}</span>
              <button class="qty-btn" onclick="updateQty('${service._id}', ${index}, 1)">+</button>
             </div>`;

        variantsHtml += `
          <div class="variant-row" id="variant-row-${variantId}">
            <div class="variant-info">
              <span class="variant-title">${v.title}</span>
              <span class="variant-price">₹${v.price}</span>
              <span class="variant-time">⏳ ${v.duration}</span>
            </div>
            <div class="variant-action" id="action-${variantId}">
              ${actionBtnHtml}
            </div>
          </div>
        `;
      });
    }

    card.innerHTML = `
      <div class="strip-card-img" onclick="trackRecentlyViewed({_id: '${service._id}', name: '${service.name.replace(/'/g, "\\'")}', startingPrice: ${service.startingPrice || 499}, imageUrl: '${service.imageUrl}'}); window.location.href='service-details.html?id=${service._id}'">
        <img src="${service.imageUrl}" alt="${service.name}" onerror="handleImgError(this)">
        <div class="strip-rating">★ ${service.rating || '4.8'} (${service.reviewCount || '150+'})</div>
      </div>
      <div class="strip-card-content">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <h4 class="strip-card-title" onclick="trackRecentlyViewed({_id: '${service._id}', name: '${service.name.replace(/'/g, "\\'")}', startingPrice: ${service.startingPrice || 499}, imageUrl: '${service.imageUrl}'}); window.location.href='service-details.html?id=${service._id}'">${service.name}</h4>
          <button class="fav-btn" style="background:none; border:none; cursor:pointer; font-size:1.1rem;" onclick="toggleFavorite('${service._id}', this)" title="Save to Favorites">♡ Favorite</button>
        </div>
        <p class="strip-card-desc">${service.description}</p>
        <div class="variants-container">
          ${variantsHtml}
        </div>
      </div>
    `;
    scrollContainer.appendChild(card);
  });

  container.appendChild(scrollContainer);
  wrapper.appendChild(container);
  return wrapper;
}

window.addToCartById = function(serviceId, variantIndex) {
  const service = allServices.find(s => s._id === serviceId);
  if (service) {
    addToCart(service, variantIndex);
  }
};

window.reRenderVariantAction = function(variantId) {
  const actionContainers = document.querySelectorAll(`#action-${variantId}`);
  const qty = cart[variantId] ? cart[variantId].quantity : 0;
  
  const parts = variantId.split('_');
  const serviceId = parts[0];
  const vIndex = parts[1];

  let actionBtnHtml = qty === 0 
    ? `<button class="add-btn" onclick="addToCartById('${serviceId}', ${vIndex})">Add</button>`
    : `<div class="qty-control">
        <button class="qty-btn" onclick="updateQty('${serviceId}', ${vIndex}, -1)">-</button>
        <span class="qty-val">${qty}</span>
        <button class="qty-btn" onclick="updateQty('${serviceId}', ${vIndex}, 1)">+</button>
       </div>`;

  actionContainers.forEach(container => {
    container.innerHTML = actionBtnHtml;
  });
};

window.updateCartUI = function() {
  const totals = getCartTotals();
  const badge = document.getElementById('cart-badge');
  const bottomBanner = document.getElementById('bottom-cart-banner');
  const priceEl = document.getElementById('cart-total-price');
  const itemsEl = document.getElementById('cart-total-items');

  if (badge) badge.innerText = totals.totalItems;
  
  if (bottomBanner && priceEl && itemsEl) {
    if (totals.totalItems > 0) {
      priceEl.innerText = formatCurrency(totals.grandTotal);
      itemsEl.innerText = `${totals.totalItems} item${totals.totalItems > 1 ? 's' : ''} in cart`;
      bottomBanner.classList.add('active');
    } else {
      bottomBanner.classList.remove('active');
    }
  }
};

function setupSearchInput() {
  const searchInput = document.getElementById('search-input');
  const dropdown = document.getElementById('search-suggestions-dropdown');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val || !dropdown) {
        if (dropdown) dropdown.style.display = 'none';
        return;
      }

      const matches = allServices.filter(s => 
        s.name.toLowerCase().includes(val) || 
        (s.category && (s.category.name || s.category).toLowerCase().includes(val)) ||
        (s.description && s.description.toLowerCase().includes(val))
      ).slice(0, 6);

      if (matches.length > 0) {
        dropdown.innerHTML = matches.map(s => `
          <div style="padding:0.6rem 1rem; cursor:pointer; font-size:0.875rem; border-bottom:1px solid #eee; display:flex; align-items:center; gap:0.75rem;" onclick="window.location.href='service-details.html?id=${s._id}'">
            <img src="${s.imageUrl}" style="width:36px; height:36px; border-radius:var(--radius-sm); object-fit:cover;">
            <div>
              <strong>${s.name}</strong>
              <small style="display:block; color:var(--text-medium);">₹${s.startingPrice || 499} • ${s.category ? (s.category.name || s.category) : 'Service'}</small>
            </div>
          </div>
        `).join('');
        dropdown.style.display = 'block';
      } else {
        dropdown.innerHTML = `<div style="padding:0.6rem 1rem; font-size:0.85rem; color:var(--text-medium);">No matching services found for "${val}"</div>`;
        dropdown.style.display = 'block';
      }
    });

    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && e.target !== searchInput) {
        dropdown.style.display = 'none';
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        window.location.href = `services.html?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });
  }
}
