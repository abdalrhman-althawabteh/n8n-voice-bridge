import { TranscriptionResponse } from '../types';

export const sendAudioToWebhook = async (
  audioBlob: Blob,
  webhookUrl: string
): Promise<string> => {
  if (!webhookUrl) {
    throw new Error('الرجاء إدخال رابط الويب هوك في الإعدادات');
  }

  const formData = new FormData();
  // We append the file as 'file' so the n8n Webhook (configured for Binary Data) can read it.
  // We use a .webm extension as that is the standard browser recording format.
  formData.append('file', audioBlob, 'recording.webm');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`فشل الاتصال: ${response.statusText}`);
    }

    // Read response as text first to handle both JSON and plain text responses
    const responseText = await response.text();

    try {
      // Try to parse as JSON first
      const data: TranscriptionResponse = JSON.parse(responseText);
      
      // If it is JSON, look for common fields
      if (typeof data === 'object' && data !== null) {
         return data.text || data.output || data.result || JSON.stringify(data);
      }
      
      // If parsed data is a string/number/boolean, return it
      return String(data);

    } catch (e) {
      // If parsing fails, it means the response is plain text (like "مرحبا بكم جميعاً")
      // So we just return the raw text
      if (responseText && responseText.trim().length > 0) {
          return responseText;
      }
      // If text is empty
      return "تمت العملية بنجاح (بدون رد نصي)";
    }

  } catch (error: any) {
    console.error('Webhook Error:', error);
    throw new Error(error.message || 'حدث خطأ أثناء إرسال الصوت');
  }
};