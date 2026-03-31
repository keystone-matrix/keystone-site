(function () {
  function nowLocalISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const tz = -d.getTimezoneOffset();
    const sign = tz >= 0 ? "+" : "-";
    const hh = pad(Math.floor(Math.abs(tz) / 60));
    const mm = pad(Math.abs(tz) % 60);

    return (
      d.getFullYear() +
      "-" + pad(d.getMonth() + 1) +
      "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) +
      ":" + pad(d.getMinutes()) +
      ":" + pad(d.getSeconds()) +
      sign + hh + ":" + mm
    );
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setupSellerForm() {
    const form = document.getElementById("sellerForm");
    if (!form) return;

    const url = window.KM_WEBAPP_URL;
    const iframe = document.getElementById("hidden_iframe");
    const submitBtn = document.getElementById("submitBtn");
    const tsField = document.getElementById("submitted_at_local");
    const statusEl = document.getElementById("formStatus");
    const dealIdDisplay = document.getElementById("dealIdDisplay");

    if (!url) {
      if (statusEl) {
        statusEl.textContent = "Form configuration missing. Add the Apps Script Web App URL.";
        statusEl.style.color = "#8b0000";
      }
      return;
    }

    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    form.setAttribute("target", "hidden_iframe");

    let pending = false;

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#8b0000" : "";
    }

    if (iframe) {
      iframe.addEventListener("load", function () {
        if (!pending) return;
        pending = false;
        setStatus("Submitted successfully. We’ll review and follow up with next steps.", false);
        setText("dealIdDisplay", "Created");
        if (submitBtn) submitBtn.disabled = false;
        form.reset();
        if (tsField) tsField.value = "";
      });
    }

    form.addEventListener("submit", function () {
      if (!form.checkValidity()) {
        setStatus("Please complete required fields.", true);
        form.reportValidity();
        return;
      }

      if (tsField) tsField.value = nowLocalISO();
      pending = true;
      setStatus("Submitting...", false);
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  function setupBuyerForm() {
    const form = document.getElementById("buyerForm");
    if (!form) return;

    const url = window.KM_WEBAPP_URL;
    const iframe = document.getElementById("buyer_hidden_iframe");
    const submitBtn = document.getElementById("buyerSubmitBtn");
    const tsField = document.getElementById("buyer_submitted_at_local");
    const statusEl = document.getElementById("buyerFormStatus");
    const buyerIdDisplay = document.getElementById("buyerIdDisplay");

    if (!url) {
      if (statusEl) {
        statusEl.textContent = "Form configuration missing. Add the Apps Script Web App URL.";
        statusEl.style.color = "#8b0000";
      }
      return;
    }

    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    form.setAttribute("target", "buyer_hidden_iframe");

    let pending = false;

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#8b0000" : "";
    }

    if (iframe) {
      iframe.addEventListener("load", function () {
        if (!pending) return;
        pending = false;
        setStatus("Buyer criteria submitted successfully.", false);
        setText("buyerIdDisplay", "Created");
        if (submitBtn) submitBtn.disabled = false;
        form.reset();
        if (tsField) tsField.value = "";
      });
    }

    form.addEventListener("submit", function () {
      if (!form.checkValidity()) {
        setStatus("Please complete required fields.", true);
        form.reportValidity();
        return;
      }

      if (tsField) tsField.value = nowLocalISO();
      pending = true;
      setStatus("Submitting...", false);
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    setupSellerForm();
    setupBuyerForm();
  });
})();
