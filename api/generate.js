// File: /api/generate.js (Most Stable Version)

// 使用最兼容的CommonJS语法
module.exports = async (request, response) => {
  // 只允许POST请求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // Vercel会自动解析JSON body
    const { targetApi, payload } = request.body;

    // 确认前端传来了必要的资讯
    if (!targetApi || !payload) {
      return response.status(400).json({ message: 'Missing targetApi or payload in request body.' });
    }
    
    // 从Vercel的环境变量中安全地读取API金钥
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return response.status(500).json({ message: 'API key is not configured on the server.' });
    }

    // 我们现在只需要Gemini文字AI，所以通讯录大大简化
    const API_URLS = {
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`
    };

    const targetUrl = API_URLS[targetApi];

    if (!targetUrl) {
      return response.status(400).json({ message: `Invalid target API specified: ${targetApi}` });
    }

    // 代替前端，去向Google发送请求
    const apiResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // 如果Google返回错误，也把错误传回给前端
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return response.status(apiResponse.status).json({ message: 'Google API Error', details: errorText });
    }

    const data = await apiResponse.json();
    
    // 成功！把从Google获得的结果传回给前端
    return response.status(200).json(data);

  } catch (error) {
    // 捕捉所有未预料的错误
    console.error("Error in API Proxy:", error);
    return response.status(500).json({ message: 'An unexpected error occurred within the API proxy.', details: error.message });
  }
};