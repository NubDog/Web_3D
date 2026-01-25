import 'dotenv/config'; // Thay cho require('dotenv').config()
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// Cấu hình
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

const rawData = JSON.parse(fs.readFileSync('./source_data.json', 'utf-8'));

async function generateEmbeddings() {
  console.log(`Đang xử lý ${rawData.length} dòng dữ liệu...`);

  const vectorData = [];

  for (const item of rawData) {
    try {
      // Gọi API Gemini
      const result = await model.embedContent(item.ai_training_text);
      const embedding = result.embedding;

      vectorData.push({
        id: item.id.toString(),
        values: embedding.values,
        metadata: {
          text: item.ai_training_text,
          image: item.image_url,
          model3d: item.model_3d_url,
          // name: item.ai_training_text.split('.')[0] // Tùy chọn
        }
      });

      console.log(`Đã xong xe ID: ${item.id}`);

      // Nghỉ xíu tránh spam API
      await new Promise(r => setTimeout(r, 500));

    } catch (error) {
      console.error(`Lỗi tại xe ID ${item.id}:`, error.message);
    }
  }

  // Xuất file
  const ndjson = vectorData.map(item => JSON.stringify(item)).join('\n');
  fs.writeFileSync('ready_for_vectorize.json', ndjson);

  console.log("Hoàn tất! File 'ready_for_vectorize.json' (chuẩn NDJSON) đã sẵn sàng.");
}

generateEmbeddings();