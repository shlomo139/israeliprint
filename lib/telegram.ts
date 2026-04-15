/**
 * Service to send notifications to Telegram
 */

export function escapeHTML(str: string | any) {
  if (!str) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdsStr = process.env.TELEGRAM_CHAT_IDS;

  if (!token || !chatIdsStr) {
    console.error("Telegram credentials missing in environment variables.");
    return;
  }

  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);

  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          console.error(`Telegram API error for chat ${chatId}:`, data);
          return { chatId, success: false, error: data };
        }
        return { chatId, success: true };
      } catch (error) {
        console.error(`Fetch error for Telegram chat ${chatId}:`, error);
        return { chatId, success: false, error };
      }
    })
  );

  return results;
}
