// File: /api/generate.js (Final Correction)

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const { targetApi, payload } = request.body;

    if (!targetApi || !payload) {
      return response.status(400).json({ message: 'Missing targetApi or payload in request body.' });
    }
    
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!API_KEY) {
      return response.status(500).json({ message: 'API key is not configured on the server.' });
    }

    const API_URLS = {
      gemini: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-preview-05-20:generateContent?key=${API_KEY}`,
      // --- 最终修正点：将 :predict 改为 :generateContent ---
      imagen: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateContent?key=${API_KEY}`
    };

    const targetUrl = API_URLS[targetApi];

    if (!targetUrl) {
      return response.status(400).json({ message: 'Invalid target API specified.' });
    }

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
    
    return response.status(200).json(data);

  } catch (error) {
    console.error("Error in API Proxy:", error);
    return response.status(500).json({ message: 'An unexpected error occurred within the API proxy.', details: error.message });
  }
}