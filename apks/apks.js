document.addEventListener("DOMContentLoaded", () => {
  const listDiv = document.getElementById('apkList');
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/'; return; }

  fetch('/api/apks', { headers: { 'Authorization': 'Bearer ' + token }})
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        listDiv.innerHTML = '<p style="color:red">No APKs or unauthorized</p>';
        return;
      }
      if (!data.apks || data.apks.length === 0) {
        listDiv.innerHTML = '<p>No APKs found.</p>';
        return;
      }

      data.apks.forEach(app => {
        const card = document.createElement('div');
        card.className = 'apk-card';

        if (app.icon) {
          const img = document.createElement('img');
          img.src = '/apks/files/' + app.icon; // icons served under /apks/files/
          img.alt = app.name;
          card.appendChild(img);
        }

        const p = document.createElement('p');
        p.innerText = app.name;
        card.appendChild(p);

        const btn = document.createElement('button');
        btn.innerText = 'Download';
        btn.addEventListener('click', () => {
          // Use token in query string for download authorization
          window.location.href = `/download/${encodeURIComponent(app.apk)}?token=${encodeURIComponent(token)}`;
        });
        card.appendChild(btn);

        listDiv.appendChild(card);
      });
    })
    .catch(err => {
      console.error(err);
      listDiv.innerHTML = '<p style="color:red">Error fetching APKs</p>';
    });
});
