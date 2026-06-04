import axios from "axios";
import { API_URL } from '@/services/api';

export async function uploadPdfLocal(file: File, getAuthHeader: () => Record<string, string>) {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${API_URL}/files/upload`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...getAuthHeader()
    },
  });
  // res.data: { file_id, path }
  return res.data;
}
