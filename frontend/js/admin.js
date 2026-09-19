let allPros = [];
let allAdminServices = [];

document.addEventListener('DOMContentLoaded', async () => {
  requireRole('admin');
  
  await fetchAdminStats();
  await fetchUsers(); // Need pros list for booking assignment
  fetchAdminBookings();
  fetchAdminServices();
});

function switchAdminTab(tabId, el) {
  document.querySelectorAll('.admin-sidebar li').forEach(li => li.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
  
  if (el) el.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

async function fetchAdminStats() {
  try {
    const res = await apiFetch('/admin/stats');
    if (res.success && res.data) {
      const d = res.data;
      document.getElementById('kpi-revenue').innerText = formatCurrency(d.totalRevenue);
      document.getElementById('kpi-bookings').innerText = d.totalBookings;
      document.getElementById('kpi-customers').innerText = d.totalCustomers;
      document.getElementById('kpi-pros').innerText = d.totalPros;
      document.getElementById('kpi-services').innerText = d.totalServices;
    }
  } catch (err) {
    console.error(err);
  }
}

async function fetchUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  try {
    const res = await apiFetch('/auth/users');
    if (res.success && res.data) {
      const users = res.data;
      allPros = users.filter(u => u.role === 'professional');

      tbody.innerHTML = users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${u.phone || 'N/A'}</td>
          <td><span class="status-badge ${u.role === 'admin' ? 'status-Cancelled' : (u.role === 'professional' ? 'status-CONFIRMED' : 'status-Pending')}">${u.role.toUpperCase()}</span></td>
          <td>
            <select onchange="handleRoleChange('${u._id}', this.value)" style="padding:0.3rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
              <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
              <option value="professional" ${u.role === 'professional' ? 'selected' : ''}>Service Professional</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Error loading users</td></tr>';
  }
}

async function handleRoleChange(userId, newRole) {
  try {
    const res = await apiFetch(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    if (res.success) {
      showToast('User role updated successfully!');
      await fetchUsers();
      await fetchAdminStats();
    } else {
      showToast(res.error || 'Failed to update role', 'error');
    }
  } catch (err) {
    showToast('Error updating user role', 'error');
  }
}

async function fetchAdminBookings() {
  const tbody = document.getElementById('admin-bookings-tbody');
  try {
    const res = await apiFetch('/bookings');
    if (res.success && res.data) {
      tbody.innerHTML = res.data.map(b => {
        let proOptions = `<option value="">Unassigned</option>`;
        allPros.forEach(pro => {
          const isSelected = b.professional && (b.professional._id === pro._id || b.professional === pro._id);
          proOptions += `<option value="${pro._id}" ${isSelected ? 'selected' : ''}>${pro.name}</option>`;
        });

        const payStatus = b.paymentStatus || 'PENDING';
        const payBadgeClass = payStatus === 'PAID' ? 'status-CONFIRMED' : (payStatus === 'REFUNDED' ? 'status-Cancelled' : 'status-Pending');
        const payMethod = b.paymentMethod || 'RAZORPAY';

        return `
          <tr>
            <td><small>#${b.bookingNumber || b._id.slice(-6)}</small></td>
            <td><strong>${b.user ? b.user.name : 'Customer'}</strong><br><small>${b.user ? b.user.email : ''}</small></td>
            <td>${b.date}<br><small>${b.timeSlot}</small></td>
            <td><small style="max-width:150px; display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${b.address || 'Hyderabad'}</small></td>
            <td><strong>${formatCurrency(b.grandTotal)}</strong><br><span class="status-badge ${payBadgeClass}">${payStatus}</span><br><small style="color:var(--text-medium);">${payMethod}</small></td>
            <td><span class="status-badge status-${b.status}">${b.status.replace(/_/g, ' ')}</span></td>
            <td>
              <select onchange="assignPro('${b._id}', this.value)" style="padding:0.3rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                ${proOptions}
              </select>
            </td>
          </tr>
        `;
      }).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Error loading bookings</td></tr>';
  }
}

async function assignPro(bookingId, proId) {
  try {
    const res = await apiFetch(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        professionalId: proId || null,
        status: proId ? 'PROFESSIONAL_ASSIGNED' : 'PENDING'
      })
    });
    if (res.success) {
      showToast('Professional assigned successfully!');
      fetchAdminBookings();
    } else {
      showToast(res.error || 'Failed to assign professional', 'error');
    }
  } catch (err) {
    showToast('Error assigning professional', 'error');
  }
}

async function fetchAdminServices() {
  const tbody = document.getElementById('admin-services-tbody');
  try {
    const res = await apiFetch('/services');
    if (res.success && res.data) {
      allAdminServices = res.data;
      tbody.innerHTML = allAdminServices.map(s => `
        <tr>
          <td><img src="${s.imageUrl}" style="width:40px; height:40px; border-radius:var(--radius-sm); object-fit:cover;"></td>
          <td><strong>${s.name}</strong></td>
          <td>${s.category}</td>
          <td>${s.tag || '-'}</td>
          <td>★ ${s.rating}</td>
          <td>${s.variants ? s.variants.length : 0}</td>
          <td>
            <button class="btn btn-outline-sm" style="color:var(--danger-color);" onclick="handleDeleteService('${s._id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:red;">Error loading services</td></tr>';
  }
}

function openAddServiceModal() {
  document.getElementById('add-service-modal').classList.add('active');
}

function closeAddServiceModal() {
  document.getElementById('add-service-modal').classList.remove('active');
}

async function handleCreateService(e) {
  e.preventDefault();
  const name = document.getElementById('srv-name').value;
  const category = document.getElementById('srv-cat').value;
  const tag = document.getElementById('srv-tag').value;
  const description = document.getElementById('srv-desc').value;
  const imageUrl = document.getElementById('srv-img').value;
  const varTitle = document.getElementById('srv-var-title').value;
  const varPrice = Number(document.getElementById('srv-var-price').value);

  const payload = {
    name,
    category,
    tag,
    description,
    imageUrl,
    variants: [{ title: varTitle, price: varPrice, duration: '45 mins' }]
  };

  try {
    const res = await apiFetch('/services', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.success) {
      showToast('New service added to catalog!', 'success');
      closeAddServiceModal();
      await fetchAdminServices();
      await fetchAdminStats();
    } else {
      showToast(res.error || 'Failed to add service', 'error');
    }
  } catch (err) {
    showToast('Error creating service', 'error');
  }
}

async function handleDeleteService(serviceId) {
  if (!confirm('Are you sure you want to delete this service from catalog?')) return;
  try {
    const res = await apiFetch(`/services/${serviceId}`, { method: 'DELETE' });
    if (res.success) {
      showToast('Service deleted');
      await fetchAdminServices();
      await fetchAdminStats();
    } else {
      showToast(res.error || 'Failed to delete service', 'error');
    }
  } catch (err) {
    showToast('Error deleting service', 'error');
  }
}
