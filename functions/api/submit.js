const ROLE_LABELS = {
  manager: "Менеджер по блогерам",
  marketer: "Маркетолог",
  entrepreneur: "Предприниматель",
  other: "Другое",
};

const EXPERIENCE_LABELS = {
  yes: "Есть",
  no: "Нету",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMessage(data) {
  return [
    "📝 <b>Новая заявка на предзапись</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(data.name)}`,
    `<b>Email:</b> ${escapeHtml(data.email)}`,
    `<b>Телефон / Telegram:</b> ${escapeHtml(data.phone)}`,
    `<b>Возраст:</b> ${escapeHtml(data.age)}`,
    `<b>Город:</b> ${escapeHtml(data.city)}`,
    `<b>Деятельность:</b> ${escapeHtml(ROLE_LABELS[data.role] || data.role)}`,
    `<b>Опыт работы с блогерами:</b> ${escapeHtml(EXPERIENCE_LABELS[data.experience] || data.experience)}`,
    `<b>Цель:</b> ${escapeHtml(data.goal)}`,
  ].join("\n");
}

async function sendToTelegram(data, env) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Telegram не настроен на сервере. Добавьте переменные в Cloudflare.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatMessage(data),
      parse_mode: "HTML",
    }),
  });

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Ошибка Telegram API");
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    if (
      !data.name ||
      !data.email ||
      !data.phone ||
      !data.age ||
      !data.city ||
      !data.role ||
      !data.experience ||
      !data.goal ||
      data.consent !== "yes" ||
      data.privacy !== "yes"
    ) {
      return jsonResponse({ ok: false, error: "Заполните все обязательные поля" }, 400);
    }

    await sendToTelegram(data, context.env);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
