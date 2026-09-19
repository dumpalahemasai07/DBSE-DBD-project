document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if(form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data));
          
          if (res.data.role === 'admin') window.location.href = 'admin.html';
          else if (res.data.role === 'professional') window.location.href = 'provider.html';
          else window.location.href = 'index.html';
        } else {
          alert(res.error || 'Login failed');
        }
      } catch (err) {
        alert('Network error');
      }
    });
  }

  const regForm = document.getElementById('register-form');
  if(regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, password })
        });

        if (res.success) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('user', JSON.stringify(res.data));
          window.location.href = 'index.html';
        } else {
          alert(res.error || 'Registration failed');
        }
      } catch (err) {
        alert('Network error');
      }
    });
  }
});
