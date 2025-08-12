// File: /api/generate.js (The Correct and Final Version)

// 使用最稳定、兼容性最好的 CommonJS 语法
module.exports = async (request, response) => {
  // 规则1: 只允许 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    // Vercel 会自动帮我们解析好请求的内容
    const { payload } = request.body;

    // 规则2: 确认前端把必要的“包裹” (payload) 传过来了
    if (!payload) {
      return response.status(400).json({ message: 'Missing payload in request body.' });
    }
    
    // 从 Vercel 的“保险箱”里安全地读取 API 金钥
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return response.status(500).json({ message: 'API key is not configured on the server.' });
    }

    // 我们只跟一个AI对话，所以通讯录非常简单
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    // 代替前端，去向 Google 发送请求
    const apiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload) // 把前端的“包裹”原封不动地转寄出去
    });

    // 如果 Google 那边返回了错误，我们也把错误传回给前端
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Google API Error:', errorText);
      return response.status(apiResponse.status).json({ message: 'Google API Error', details: errorText });
    }

    const data = await apiResponse.json();
    
    // 任务成功！把从 Google 获得的结果传回给前端
    return response.status(200).json(data);

  } catch (error) {
    // 捕捉所有未预料的错误
    console.error("Fatal Error in API Proxy:", error);
    return response.status(500).json({ message: 'An unexpected error occurred within the API proxy.', details: error.message });
  }
};