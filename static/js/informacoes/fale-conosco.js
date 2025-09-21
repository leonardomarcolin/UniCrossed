document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contato');
  const status = document.getElementById('status-envio');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Aqui você poderia integrar com uma API real
    status.style.display = 'block';
    form.reset();

    setTimeout(() => {
      status.style.display = 'none';
    }, 6000);
  });
});
