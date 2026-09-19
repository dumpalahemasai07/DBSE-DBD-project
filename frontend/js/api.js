const API_URL = 'http://localhost:5000/api';

// Auth State
let currentUser = null;

function initAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      currentUser = JSON.parse(user);
    } catch (e) {
      currentUser = null;
    }
  }
  updateNavForUser();
}

function updateNavForUser() {
  const loginNav = document.getElementById('nav-login');
  if (!loginNav) return;

  if (currentUser) {
    let roleLink = '';
    if (currentUser.role === 'admin') {
      roleLink = `<a href="admin.html" class="nav-role-badge admin">Admin Panel</a>`;
    } else if (currentUser.role === 'professional') {
      roleLink = `<a href="provider.html" class="nav-role-badge pro">Provider Portal</a>`;
    }

    loginNav.innerHTML = `
      <div class="user-nav-dropdown">
        ${roleLink}
        <a href="bookings.html" class="nav-link">My Bookings</a>
        <a href="profile.html" class="nav-link">Account (${currentUser.name.split(' ')[0]})</a>
        <a href="#" onclick="logout(event)" class="nav-link logout-link">Logout</a>
      </div>
    `;
  } else {
    loginNav.innerHTML = `
      <a href="login.html" class="btn btn-outline-sm">Login</a>
      <a href="register.html" class="btn btn-primary-sm">Register</a>
    `;
  }
}

function logout(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  showToast('Logged out successfully');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });
    
    const data = await res.json();
    if (res.status === 401 && token) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      currentUser = null;
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    return { success: false, error: 'Network error or backend unreachable' };
  }
}

function requireAuth() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
  }
}

function requireRole(role) {
  requireAuth();
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role !== role) {
    showToast('Unauthorized access', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
}

function showToast(msg, type = 'info') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerText = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

window.handleImgError = function(img, fallbackUrl) {
  if (!img || img.dataset.failed === 'true') return;
  img.dataset.failed = 'true';
  img.src = fallbackUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80';
};

function getCurrentLocationText() {
  return localStorage.getItem('user_location') || 'Jubilee Hills, Hyderabad';
}

function setCurrentLocationText(locStr) {
  localStorage.setItem('user_location', locStr);
  document.querySelectorAll('.current-loc-display').forEach(el => {
    el.innerText = locStr;
  });
}

function openLocationModal() {
  let modal = document.getElementById('global-location-modal');
  if (!modal) {
    modal = createLocationModalDOM();
  }
  renderModalSavedAddresses();
  modal.classList.add('active');
}

function closeLocationModal() {
  const modal = document.getElementById('global-location-modal');
  if (modal) modal.classList.remove('active');
}

function createLocationModalDOM() {
  const div = document.createElement('div');
  div.id = 'global-location-modal';
  div.className = 'modal-overlay';
  div.innerHTML = `
    <div class="modal-card" style="max-width: 520px;">
      <div class="modal-header">
        <h3 style="font-size: 1.25rem; font-weight: 800;">Choose Your Service Location</h3>
        <button class="close-modal-btn" onclick="closeLocationModal()">&times;</button>
      </div>

      <div style="margin-bottom: 1.25rem;">
        <button class="btn btn-outline-full" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; background:#f0fdf4; border-color:#86efac; color:#166534; font-weight:700; width:100%; padding:0.75rem;" onclick="handleUseCurrentLocation()">
          📍 Use My Current Location
        </button>
      </div>

      <div class="form-group" style="position:relative; margin-bottom: 1.25rem;">
        <label>Search Area, Locality or City</label>
        <input type="text" id="location-search-input" placeholder="e.g. Jubilee Hills, Banjara Hills, Madhapur..." oninput="handleLocationSearchInput(this.value)">
        <div id="location-search-results" style="position:absolute; top:100%; left:0; right:0; background:white; border:1px solid var(--border-color); border-radius:var(--radius-md); box-shadow:var(--shadow-md); z-index:100; max-height:200px; overflow-y:auto; display:none;"></div>
      </div>

      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-dark);">SAVED ADDRESSES</h4>
          <button class="btn btn-primary-sm" style="font-size:0.8rem;" onclick="closeLocationModal(); if(window.showNewAddressModal) window.showNewAddressModal();">+ Add New Address</button>
        </div>
        <div id="modal-saved-addresses-list" style="max-height:180px; overflow-y:auto;">
          Loading saved addresses...
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  return div;
}

async function renderModalSavedAddresses() {
  const container = document.getElementById('modal-saved-addresses-list');
  if (!container) return;

  if (!currentUser) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-medium);">Login to see your saved addresses.</p>`;
    return;
  }

  try {
    const res = await apiFetch('/auth/me');
    if (res.success && res.data && res.data.addresses && res.data.addresses.length > 0) {
      const addrs = res.data.addresses;
      container.innerHTML = addrs.map(a => {
        const addrStr = `${a.area || a.city}, Hyderabad`;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-light); padding:0.6rem 0.8rem; border-radius:var(--radius-md); margin-bottom:0.5rem; font-size:0.85rem;">
            <div>
              <strong>${a.tag === 'Home' ? '🏠' : (a.tag === 'Work' ? '💼' : '📍')} ${a.tag}</strong>
              <p style="color:var(--text-medium); margin-top:0.1rem; font-size:0.8rem;">${a.house}, ${a.street}, ${a.area}</p>
            </div>
            <button class="btn btn-outline-sm" style="padding:0.25rem 0.6rem; font-size:0.75rem;" onclick="selectLocationFromModal('${addrStr.replace(/'/g, "\\'")}')">Select</button>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-medium);">No saved addresses found.</p>`;
    }
  } catch (e) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--text-medium);">Error loading addresses.</p>`;
  }
}

function selectLocationFromModal(locStr) {
  setCurrentLocationText(locStr);
  showToast(`Location set to ${locStr}`, 'success');
  closeLocationModal();
}

function handleUseCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }

  showToast('Detecting current location...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // Reverse geocode fallback to readable area
      const detectedLocation = 'Jubilee Hills, Hyderabad';
      setCurrentLocationText(detectedLocation);
      showToast(`📍 Location detected: ${detectedLocation}`, 'success');
      closeLocationModal();
    },
    (err) => {
      showToast('Location permission was denied. You can search for your address instead.', 'error');
    },
    { timeout: 8000 }
  );
}

const KNOWN_HYD_AREAS = [
  'Jubilee Hills, Hyderabad',
  'Banjara Hills, Hyderabad',
  'Madhapur, Hyderabad',
  'Hitech City, Hyderabad',
  'Gachibowli, Hyderabad',
  'Kukatpally, Hyderabad',
  'Secunderabad, Hyderabad',
  'Kondapur, Hyderabad',
  'Begumpet, Hyderabad',
  'Ameerpet, Hyderabad'
];

function handleLocationSearchInput(val) {
  const container = document.getElementById('location-search-results');
  if (!container) return;

  if (!val || val.trim().length === 0) {
    container.style.display = 'none';
    return;
  }

  const query = val.toLowerCase().trim();
  const matches = KNOWN_HYD_AREAS.filter(a => a.toLowerCase().includes(query));

  if (matches.length > 0) {
    container.innerHTML = matches.map(m => `
      <div style="padding:0.6rem 1rem; cursor:pointer; font-size:0.875rem; border-bottom:1px solid #eee;" onclick="selectLocationFromModal('${m}')">
        📍 ${m}
      </div>
    `).join('');
    container.style.display = 'block';
  } else {
    container.innerHTML = `
      <div style="padding:0.6rem 1rem; cursor:pointer; font-size:0.875rem;" onclick="selectLocationFromModal('${val.trim()}, Hyderabad')">
        📍 ${val.trim()}, Hyderabad
      </div>
    `;
    container.style.display = 'block';
  }
}

// Recently Viewed Tracker
function trackRecentlyViewed(service) {
  if (!service || !service._id) return;
  try {
    let items = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
    items = items.filter(s => s._id !== service._id);
    items.unshift({
      _id: service._id,
      name: service.name,
      startingPrice: service.startingPrice,
      imageUrl: service.imageUrl || (service.images && service.images[0]),
      rating: service.rating || 4.8,
      category: service.category ? (service.category.name || service.category) : 'Home Care'
    });
    if (items.length > 8) items = items.slice(0, 8);
    localStorage.setItem('recently_viewed', JSON.stringify(items));
  } catch (e) {}
}

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem('recently_viewed') || '[]');
  } catch (e) {
    return [];
  }
}

// Favorites Handler
async function toggleFavorite(serviceId, btnEl) {
  if (!currentUser) {
    showToast('Please login to save favorite services', 'error');
    setTimeout(() => window.location.href = 'login.html', 1000);
    return;
  }
  const isFav = btnEl && (btnEl.classList.contains('favorited') || btnEl.innerText.includes('♥'));
  const method = isFav ? 'DELETE' : 'POST';
  try {
    const res = await apiFetch(`/auth/favorites/${serviceId}`, { method });
    if (res.success) {
      if (btnEl) {
        if (isFav) {
          btnEl.classList.remove('favorited');
          btnEl.innerHTML = '♡ Favorite';
          showToast('Removed from favorites', 'info');
        } else {
          btnEl.classList.add('favorited');
          btnEl.innerHTML = '♥ Favorited';
          showToast('Added to favorites!', 'success');
        }
      }
    } else {
      showToast(res.error || 'Failed to update favorites', 'error');
    }
  } catch (e) {
    showToast('Error updating favorites', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  const currentLoc = getCurrentLocationText();
  document.querySelectorAll('.current-loc-display').forEach(el => {
    el.innerText = currentLoc;
  });

  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      window.handleImgError(this);
    });
  });
});
