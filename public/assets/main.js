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

  function setStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("status-success", "status-error");
    if (kind === "success") el.classList.add("status-success");
    if (kind === "error") el.classList.add("status-error");
  }

  function attachSellerForm() {
    const form = document.getElementById("sellerForm");
    if (!form) return;

    const url = window.KM_WEBAPP_URL;
    const submitBtn = document.getElementById("submitBtn");
    const tsField = document.getElementById("submitted_at_local");
    const statusEl = document.getElementById("formStatus");
    const dealIdDisplay = document.getElementById("dealIdDisplay");

    if (!url) {
      setStatus(statusEl, "Form configuration missing. Add the Apps Script Web App URL.", "error");
      return;
    }

    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    form.setAttribute("target", "hidden_iframe");

    let pending = false;
    let timeoutId = null;

    function clearPending() {
      pending = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (submitBtn) submitBtn.disabled = false;
    }

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        setStatus(statusEl, "Please complete required fields.", "error");
        form.reportValidity();
        return;
      }

      if (tsField) tsField.value = nowLocalISO();
      pending = true;
      if (submitBtn) submitBtn.disabled = true;
      setStatus(statusEl, "Submitting...", null);

      timeoutId = setTimeout(function () {
        if (!pending) return;
        clearPending();
        setStatus(statusEl, "Submission could not be confirmed. Check the Apps Script deployment and try again.", "error");
      }, 15000);
    });

    window.addEventListener("message", function (event) {
      const data = event.data;
      if (!data || data.ns !== "keystone_matrix" || data.formType !== "seller") return;
      if (!pending) return;

      clearPending();

      if (data.ok) {
        setStatus(statusEl, "Submitted successfully. The deal was written into the sheet.", "success");
        setText("dealIdDisplay", data.deal_id || "Created");
        form.reset();
        if (tsField) tsField.value = "";
      } else {
        setStatus(statusEl, data.error || "Submission failed.", "error");
      }
    });
  }

  function attachBuyerForm() {
    const form = document.getElementById("buyerForm");
    if (!form) return;

    const url = window.KM_WEBAPP_URL;
    const submitBtn = document.getElementById("buyerSubmitBtn");
    const tsField = document.getElementById("buyer_submitted_at_local");
    const statusEl = document.getElementById("buyerFormStatus");
    const buyerIdDisplay = document.getElementById("buyerIdDisplay");

    if (!url) {
      setStatus(statusEl, "Form configuration missing. Add the Apps Script Web App URL.", "error");
      return;
    }

    form.setAttribute("action", url);
    form.setAttribute("method", "POST");
    form.setAttribute("target", "buyer_hidden_iframe");

    let pending = false;
    let timeoutId = null;

    function clearPending() {
      pending = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (submitBtn) submitBtn.disabled = false;
    }

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        setStatus(statusEl, "Please complete required fields.", "error");
        form.reportValidity();
        return;
      }

      if (tsField) tsField.value = nowLocalISO();
      pending = true;
      if (submitBtn) submitBtn.disabled = true;
      setStatus(statusEl, "Submitting...", null);

      timeoutId = setTimeout(function () {
        if (!pending) return;
        clearPending();
        setStatus(statusEl, "Submission could not be confirmed. Check the Apps Script deployment and try again.", "error");
      }, 15000);
    });

    window.addEventListener("message", function (event) {
      const data = event.data;
      if (!data || data.ns !== "keystone_matrix" || data.formType !== "buyer") return;
      if (!pending) return;

      clearPending();

      if (data.ok) {
        setStatus(statusEl, "Buyer criteria submitted successfully.", "success");
        setText("buyerIdDisplay", data.buyer_id || "Created");
        form.reset();
        if (tsField) tsField.value = "";
      } else {
        setStatus(statusEl, data.error || "Submission failed.", "error");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    attachSellerForm();
    attachBuyerForm();
  });
})();
