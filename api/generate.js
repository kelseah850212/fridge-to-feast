// File: /api/generate.js

export default async function handler(request, response) {
  // 步骤 1: 确认请求方法是 POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  // 步骤 2: 从前端的请求中，安全地拿出它想呼叫的API和要发送的资料
  const { targetApi, payload } = request.body;
  
  // 步骤 3: 从服务器的环境变数中，安全地读取我们的秘密 API 金钥
  // (这个金钥之后会在 Vercel 网站上设定，所以不会暴露)
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
  try {
    const apiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 如果 Google 那边出错了，也告诉前端
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ message: 'Google API Error', details: errorText });
    }

    const data = await apiResponse.json();
    
    // 步骤 6: 成功拿到资料！现在把这份资料传回给前端
    return response.status(200).json(data);

  } catch (error) {
    // 如果中途网路不通，也告诉前端
    return response.status(500).json({ message: 'An error occurred while fetching from Google API.', details: error.message });
  }
}