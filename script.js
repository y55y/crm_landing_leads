const LEAD_WEBHOOK_URL =
  "https://crm2.middar.com/webhooks/workflows/18790c34-ee2c-4055-8c8f-548a77adaaf2/02a1d62c-3523-4ec0-9fcb-01787675cbe8";
const DEFAULT_USER_UUID = "ced3485c-7830-40de-8183-81b1b11bbefa";

const form = document.querySelector("#leadForm");
const message = document.querySelector("#formMessage");
const submitButton = form.querySelector(".submit-button");

const labels = {
  idle: "سجل اهتمامك الآن",
  submitting: "جاري الإرسال...",
  success: "تم استلام طلبك. سيتواصل معك فريق مدار قريبًا.",
  networkError: "تعذر إرسال الطلب الآن. حاول مرة أخرى.",
  validation: {
    companyName: "اسم الشركة مطلوب.",
    activity: "النشاط مطلوب.",
    contactName: "اسم الشخص المسؤول مطلوب.",
    phone: "أدخل رقم جوال صحيح.",
    email: "أدخل بريدًا إلكترونيًا صحيحًا.",
  },
};

function showMessage(type, text) {
  message.className = `form-message is-${type}`;
  message.textContent = text;
}

function clearMessage() {
  message.className = "form-message";
  message.textContent = "";
}

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function getUserUuid() {
  const params = new URLSearchParams(window.location.search);
  return params.get("uuid") || params.get("user_uuid") || DEFAULT_USER_UUID;
}

function validate(data) {
  if (!String(data.companyName || "").trim()) return labels.validation.companyName;
  if (!String(data.activity || "").trim()) return labels.validation.activity;
  if (!String(data.contactName || "").trim()) return labels.validation.contactName;

  const normalizedPhone = String(data.phone || "").replace(/\D/g, "");
  if (normalizedPhone.length < 7 || normalizedPhone.length > 15) return labels.validation.phone;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(data.email || "").trim())) return labels.validation.email;

  return null;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? labels.submitting : labels.idle;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();

  const data = getFormData();

  if (data.website) {
    showMessage("success", labels.success);
    form.reset();
    return;
  }

  const error = validate(data);
  if (error) {
    showMessage("error", error);
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: {
          uuid: getUserUuid(),
        },
        company: {
          name: data.companyName,
          notes: data.notes,
          address: data.address,
          activity: data.activity,
          current_system: data.currentSystem,
        },
        contact: {
          name: data.contactName,
          email: data.email,
          mobile: data.phone,
          job_title: data.jobTitle,
        },
      }),
    });

    const responseData = await response.json().catch(() => ({}));

    if (response.ok) {
      showMessage("success", labels.success);
      form.reset();
    } else {
      showMessage("error", responseData.message || responseData.detail || responseData.messages?.[0] || labels.networkError);
    }
  } catch {
    showMessage("error", labels.networkError);
  } finally {
    setLoading(false);
  }
});
