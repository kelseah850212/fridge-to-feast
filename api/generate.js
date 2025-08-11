// File: /api/generate.js (Corrected Version)

export default async function handler(request, response) {
  // 步骤 1: 确认请求方法是 POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // --- 重点修正在这里！ ---
    // 我们现在告诉服务器，要先“拆开”包裹(await request.json())，再读取内容
    const { targetApi, payload } = await request.json();
    
    // 步骤 3: 从服务器的环境变数中，安全地读取我们的秘密 API 金钥
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return response.status(500).json({ message: 'API key is not configured on the server.' });
    }

    // 步骤 4: 决定要去敲哪一扇门 (Gemini 还是 Imagen)
    const API_URLS = {
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`,
      imagen: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`
    };

    const targetUrl = API_URLS[targetApi];

    if (!targetUrl) {
      return response.status(400).json({ message: 'Invalid target API specified.' });
    }

    // 步骤 5: 代替前端，去向 Google 发送请求
    const apiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ message: 'Google API Error', details: errorText });
    }

    const data = await apiResponse.json();
    
    // 步骤 6: 成功拿到资料！现在把这份资料传回给前端
    return response.status(200).json(data);

  } catch (error) {
    // 如果中途发生任何错误 (比如包裹格式不对)，也告诉前端
    console.error("Error in API Proxy:", error);
    return response.status(500).json({ message: 'An error occurred within the API proxy.', details: error.message });
  }
}