// Use a relative API URL in development so Vite's dev server proxy forwards
// requests to the backend and avoids CORS issues. In production, set
// `VITE_API_URL` or replace this value with your deployed backend URL.
export const API_URL = '';

export const apiCall = async (
  endpoint: string,
  options: RequestInit & { token?: string } = {}
) => {
  const { token, ...fetchOptions } = options;
  // If token not explicitly provided, try to read from localStorage
  const resolvedToken = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (resolvedToken) {
    // Debug: log that we're attaching an Authorization header (masked)
    try {
      const masked = typeof resolvedToken === 'string' && resolvedToken.length > 12 ? resolvedToken.slice(0,8) + '...' + resolvedToken.slice(-8) : resolvedToken;
      console.debug('apiCall: attaching Authorization header, token=', masked);
    } catch {}
    headers['Authorization'] = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });
  // Read body text once (avoid "body stream already read" errors)
  const bodyText = await response.text();
  const contentType = response.headers.get('content-type') || '';

  // Try to parse JSON from the text body when possible
  let parsedBody: any = bodyText;
  if (bodyText) {
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (_) {
      // leave as raw text
      parsedBody = bodyText;
    }
  }

  if (!response.ok) {
    // Build a helpful message from common error shapes (FastAPI/Pydantic etc.)
    let message = `API error: ${response.status}`;
    const errorBody = parsedBody;
    if (errorBody) {
      if (typeof errorBody === 'string') {
        message = errorBody;
      } else if (errorBody.detail) {
        const d = errorBody.detail;
        if (typeof d === 'string') {
          message = d;
        } else if (Array.isArray(d)) {
          message = d.map((it: any) => (it.msg || JSON.stringify(it))).join('; ');
        } else {
          message = JSON.stringify(d);
        }
      } else {
        message = JSON.stringify(errorBody);
      }
    } else if (response.statusText) {
      message = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Not authenticated');
    }

    throw new Error(message);
  }

  // If the parsed body is an object (JSON), return it; otherwise return text
  return parsedBody;
};

// Auth API
export const authAPI = {
  signup: (email: string, password: string, name: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) =>
    apiCall('/auth/me', { token }),
};

// Files API
export const filesAPI = {
  presignUpload: (filename: string, userId: number) => {
    const formData = new FormData();
    formData.append('filename', filename);
    formData.append('user_id', userId.toString());

    // Attach Authorization header from localStorage if available
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined;
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_URL}/files/presign`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async r => {
      const text = await r.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        if (!r.ok) throw new Error(parsed?.detail || parsed || r.statusText || `Upload presign failed: ${r.status}`);
        return parsed;
      } catch (e) {
        if (!r.ok) throw new Error(text || r.statusText || `Upload presign failed: ${r.status}`);
        try { return JSON.parse(text); } catch { return text; }
      }
    });
  },

  // Direct upload with file binary and Authorization header
  uploadFile: (file: File, token?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const resolvedToken = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') || undefined : undefined);
    const headers: any = {};
    if (resolvedToken) headers['Authorization'] = `Bearer ${resolvedToken}`;
    return fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async r => {
      const text = await r.text();
      try {
        const parsed = text ? JSON.parse(text) : null;
        if (!r.ok) throw new Error(parsed?.detail || parsed || r.statusText || `Upload failed: ${r.status}`);
        return parsed;
      } catch (e) {
        if (!r.ok) throw new Error(text || r.statusText || `Upload failed: ${r.status}`);
        try { return JSON.parse(text); } catch { return text; }
      }
    });
  },

  processFile: (fileId: number, token: string) =>
    apiCall(`/files/${fileId}/process`, {
      method: 'POST',
      token,
    }),

  listFiles: (token: string) =>
    apiCall('/files/', { token }),

  getFile: (fileId: number, token: string) =>
    apiCall(`/files/${fileId}`, { token }),
};

// Notes API
export const notesAPI = {
  list: (token?: string) => apiCall('/notes/', { token }),
  create: (title: string, content: string, token?: string) =>
    apiCall('/notes/', { method: 'POST', token, body: JSON.stringify({ title, content }) }),
  update: (id: number, title: string, content: string, token?: string) =>
    apiCall(`/notes/${id}`, { method: 'PUT', token, body: JSON.stringify({ title, content }) }),
  delete: (id: number, token?: string) => apiCall(`/notes/${id}`, { method: 'DELETE', token }),
};

// Flashcards API
export const flashcardsAPI = {
  list: (token?: string) => apiCall('/flashcards/', { token }),
  generate: (fileId: number, count: number, token?: string) =>
    apiCall('/flashcards/generate', { method: 'POST', token, body: JSON.stringify({ file_id: fileId, count }) }),
  create: (question: string, answer: string, difficulty?: string, token?: string) =>
    apiCall('/flashcards/', {
      method: 'POST',
      token,
      body: JSON.stringify({ question, answer, difficulty: difficulty || 'medium' }),
    }),
  update: (id: number, question: string, answer: string, difficulty?: string, token?: string) =>
    apiCall(`/flashcards/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ question, answer, difficulty: difficulty || 'medium' }),
    }),
  delete: (id: number, token?: string) => apiCall(`/flashcards/${id}`, { method: 'DELETE', token }),
  due: (limit?: number, token?: string) =>
    apiCall(`/flashcards/due${limit ? `?limit=${limit}` : ''}`, { token }),
  review: (id: number, quality: number, token?: string, confidence?: number, responseTimeMs?: number) =>
    apiCall(`/flashcards/${id}/review`, {
      method: 'POST',
      token,
      body: JSON.stringify({
        quality,
        confidence: confidence ?? null,
        response_time_ms: responseTimeMs ?? null,
      }),
    }),
};

// Quiz API
export const quizAPI = {
  list: (token?: string) => apiCall('/quiz/', { token }),
  generate: (fileId: number, count: number, token?: string) =>
    apiCall('/quiz/generate', { method: 'POST', token, body: JSON.stringify({ file_id: fileId, count }) }),
  get: (id: number, token?: string) => apiCall(`/quiz/${id}`, { token }),
  submit: (id: number, answers: any, token?: string) =>
    apiCall(`/quiz/${id}/submit`, { method: 'POST', token, body: JSON.stringify({ answers }) }),
};

// AI API
export const aiAPI = {
  summarize: (fileId: number, length: 'short' | 'medium' | 'long', token: string) =>
    apiCall('/api/ai/summarize', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, length }),
    }),

  generateFlashcards: (fileId: number, count: number, token: string) =>
    apiCall('/api/ai/flashcards/generate', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, count }),
    }),

  generateQuiz: (fileId: number, count: number, token: string) =>
    apiCall('/quiz/generate', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId, count }),
    }),

  generateNotes: (fileId: number, token: string) =>
    apiCall('/api/ai/notes', {
      method: 'POST',
      token,
      body: JSON.stringify({ file_id: fileId }),
    }),
  searchNotes: (query: string, token: string) =>
    apiCall('/search/notes', {
      method: 'POST',
      token,
      body: JSON.stringify({ query }),
    }),

  // Term definition via AI
  define: (term: string, token?: string) =>
    apiCall('/api/ai/define', {
      method: 'POST',
      token,
      body: JSON.stringify({ term }),
    }),
  defineMany: (term: string, count = 5, token?: string) =>
    apiCall('/api/ai/define_many', {
      method: 'POST',
      token,
      body: JSON.stringify({ term, count }),
    }),
};

// Knowledge Graph API (DB-based static graph)
export const knowledgeAPI = {
  getGraph: (token?: string) => apiCall('/knowledge/graph', { token }),
  completeNode: (nodeId: number, token?: string) => apiCall(`/knowledge/node/${nodeId}/complete`, { method: 'POST', token }),
  nextPath: (token?: string) => apiCall('/knowledge/path/next', { token }),
};

// AI-generated Knowledge Graph (per file)
export const knowledgeGraphAI = {
  getGraphForFile: (fileId: number, token?: string) =>
    apiCall(`/knowledge-graph/${fileId}`, { token }),
};

// AI-generated Learning Path (per user, all files)
export const learningPathAI = {
  getPath: (userId: number, token?: string) =>
    apiCall(`/learning-path/${userId}`, { token }),
};
