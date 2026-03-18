function renderAssetsTable(assets) {
  const table = document.getElementById('assetsTable');
  if (!table) return;
  const rows = assets.map(a => `
    <tr>
      <td>${a.asset_id}</td><td>${a.asset_name}</td><td>${a.serial_number}</td><td>${a.assigned_to}</td><td>${a.assigned_date}</td><td>${a.status}</td>
    </tr>`).join('');
  table.innerHTML = `<thead><tr><th>ID</th><th>Name</th><th>Serial</th><th>Assigned To</th><th>Assigned Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`;
}

function loadAssets() {
  getAssets().then((resp) => renderAssetsTable(resp.data || [])).catch(err => showNotification(err.message,true));
}

const assetForm = document.getElementById('assetForm');
if (assetForm) {
  assetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      asset_id: document.getElementById('assetId').value || undefined,
      asset_name: document.getElementById('assetName').value.trim(),
      serial_number: document.getElementById('assetSerial').value.trim(),
      assigned_to: document.getElementById('assetAssignedTo').value.trim(),
      assigned_date: document.getElementById('assetAssignedDate').value || '',
      status: document.getElementById('assetStatus').value
    };
    addAsset(data).then(() => {
      showNotification('Asset saved');
      assetForm.reset();
      loadAssets();
    }).catch(err => showNotification(err.message,true));
  });
}
