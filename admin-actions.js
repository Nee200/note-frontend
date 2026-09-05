function paymentStatusLabel(status) {
    return ({ paid: 'Bezahlt', unpaid: 'Zahlung ausstehend', failed: 'Zahlung fehlgeschlagen', refunded: 'Erstattet', partially_refunded: 'Teilweise erstattet', cancelled: 'Storniert' })[status] || 'Zahlung noch nicht geprüft';
}
function renderOrderPagination(page, hasMore) {
    let root = document.getElementById('order-pagination');
    if (!root) { root = document.createElement('nav'); root.id = 'order-pagination'; root.setAttribute('aria-label', 'Bestellseiten'); document.getElementById('admin-order-list').closest('table').after(root); }
    root.replaceChildren();
    for (const [label, target, disabled] of [['Zurück', page - 1, page <= 1], ['Weiter', page + 1, !hasMore]]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = disabled;
        button.addEventListener('click', () => loadOrders(target)); root.append(button);
    }
    const label = document.createElement('span'); label.textContent = ' Seite ' + page; root.append(label);
}
function confirmCash(orderId) {
    const order = allOrders.find(item => String(item._id) === String(orderId));
    if (!order) return;
    const dialog = document.createElement('dialog'); dialog.style.cssText = 'margin:auto;padding:2rem;max-width:30rem;border:1px solid #ccc;border-radius:12px';
    const title = document.createElement('h2'); title.textContent = 'Erhaltene Barzahlung'; dialog.append(title);
    const info = document.createElement('p'); info.textContent = 'Bestellung ' + order.orderNumber + ': ' + window.NoteMoney.format(order.amount); dialog.append(info);
    const form = document.createElement('form');
    const amountLabel = document.createElement('label'); amountLabel.textContent = 'Tatsächlich erhalten (EUR)';
    const amount = document.createElement('input'); amount.type = 'number'; amount.step = '0.01'; amount.min = '0'; amount.required = true; amountLabel.append(amount); form.append(amountLabel);
    const receiptLabel = document.createElement('label'); receiptLabel.textContent = 'Kassenbelegnummer';
    const receipt = document.createElement('input'); receipt.required = true; receipt.maxLength = 120; receiptLabel.append(receipt); form.append(receiptLabel);
    const message = document.createElement('p'); message.setAttribute('role', 'status'); form.append(message);
    const save = document.createElement('button'); save.textContent = 'Zahlung bestätigen'; form.append(save);
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Abbrechen'; cancel.addEventListener('click', () => dialog.close()); form.append(cancel);
    form.addEventListener('submit', async event => {
        event.preventDefault(); save.disabled = true;
        try {
            const response = await adminFetch('/api/admin/orders/' + encodeURIComponent(orderId) + '/confirm-cash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receivedAmountCents: Math.round(Number(amount.value) * 100), receiptReference: receipt.value.trim() }) });
            const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
            dialog.close(); await loadOrders(ordersPage);
        } catch (error) { message.textContent = error.message || 'Zahlung konnte nicht gespeichert werden.'; }
        finally { save.disabled = false; }
    });
    dialog.append(form); dialog.addEventListener('close', () => dialog.remove()); document.body.append(dialog); dialog.showModal();
}

function renderInvoicePagination(payload) {
    for (const [tableId, kind, page, more] of [['admin-invoice-list', 'issued', payload.page, payload.hasMore], ['admin-invoice-pending-list', 'pending', payload.pendingPage, payload.pendingHasMore]]) {
        let nav = document.getElementById('invoice-pagination-' + kind);
        if (!nav) { nav = document.createElement('nav'); nav.id = 'invoice-pagination-' + kind; document.getElementById(tableId).closest('table').after(nav); }
        nav.replaceChildren();
        for (const [label, target, disabled] of [['Zurück', page - 1, page <= 1], ['Weiter', page + 1, !more]]) {
            const button = document.createElement('button'); button.textContent = label; button.disabled = disabled;
            button.addEventListener('click', () => loadInvoices(true, kind === 'issued' ? target : invoicePage, kind === 'pending' ? target : invoicePendingPage)); nav.append(button);
        }
        const caption = document.createElement('span'); caption.textContent = ' Seite ' + page + ' · Kennzahlen beziehen sich auf die angezeigten Seiten'; nav.append(caption);
    }
}
let invoiceSearchTimer;
function searchInvoices() { clearTimeout(invoiceSearchTimer); invoiceSearchTimer = setTimeout(() => loadInvoices(true, 1, 1), 300); }
async function recordFinancialResolution(orderId) {
    const reference = prompt('Referenz des tatsächlich erstellten Erstattungs-/Korrekturbelegs:');
    if (!reference?.trim()) return;
    const response = await adminFetch('/api/admin/orders/' + encodeURIComponent(orderId) + '/financial-record', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference }) });
    const payload = await response.json();
    if (!response.ok) return alert(payload.error || 'Beleg konnte nicht dokumentiert werden.');
    await loadOrders(ordersPage);
}
