// File: /api/generate.js (Reverted to Stable 1.0)

// 使用最穩定、兼容性最好的 CommonJS 語法
module.exports = async (request, response) => {
  // 規則1: 只允許 POST 請求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // Vercel 會自動幫我們解析好請求的內容
    const { targetApi, payload } = request.body;

    // 規則2: 確認前端傳來了必要的資訊
    if (!targetApi || !payload) {
      return response.status(400).json({ message: 'Missing targetApi or payload in request body.' });
    }
    
    // 從 Vercel 的“保險箱”裡安全地讀取 API 金鑰
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return response.status(500).json({ message: 'API key is not configured on the server.' });
    }

    // 我們的通訊錄，現在同時有文字AI和圖片AI的地址
    const API_URLS = {
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      imagen: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${API_KEY}`
    };

    const targetUrl = API_URLS[targetApi];

    if (!targetUrl) {
      return response.status(400).json({ message: `Invalid target API specified: ${targetApi}` });
    }

    // 代替前端，去向 Google 發送請求
    const apiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 如果 Google 那邊返回了錯誤，我們也把錯誤傳回給前端
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Google API Error:', errorText);
      return response.status(apiResponse.status).json({ message: 'Google API Error', details: errorText });
    }

    const data = await apiResponse.json();
    
    // 任務成功！把從 Google 獲得的結果一次性傳回給前端
    return response.status(200).json(data);

  } catch (error) {
    // 捕捉所有未預料的錯誤
    console.error("Fatal Error in API Proxy:", error);
    if (!response.headersSent) {
        response.status(500).json({ message: 'An unexpected error occurred within the API proxy.', details: error.message });
    } else {
        response.end();
    }
  }
};
