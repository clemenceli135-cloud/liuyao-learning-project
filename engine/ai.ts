import { requestUrl } from 'obsidian';
import { LiuYaoPluginSettings } from '../settings';

export async function callAiApi(settings: LiuYaoPluginSettings, userMessage: string): Promise<string> {
  const { provider, apiKey, apiUrl, modelName, systemPrompt } = settings;

  if (!apiKey) {
    throw new Error('未配置 API Key，请先前往插件设置中填入！');
  }

  // 1. Google Gemini 接口
  if (provider === 'gemini') {
    let url = apiUrl;
    if (!url.includes('generateContent')) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-1.5-pro'}:generateContent`;
    }
    url += `?key=${apiKey}`;

    const response = await requestUrl({
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }]
      })
    });

    const data = response.json;
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Gemini API 未能返回有效文本：' + JSON.stringify(data));
    }
  }

  // 2. OpenAI / DeepSeek / Custom (OpenAI 兼容格式) 接口
  const response = await requestUrl({
    url: apiUrl || 'https://api.openai.com/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });

  const data = response.json;
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  } else {
    throw new Error('API 返回异常：' + JSON.stringify(data));
  }
}
