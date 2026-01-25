import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
    try {
        console.log("Đang kết nối tới Google...");
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("Lỗi API:", data.error.message);
            return;
        }

        console.log("\n✅ DANH SÁCH MODEL CỦA BẠN:");
        console.log("-----------------------------");
        // Lọc ra các model hỗ trợ chat (generateContent)
        const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        chatModels.forEach(m => {
            // In ra tên model (bỏ chữ models/ ở đầu cho gọn)
            console.log(`- ${m.name.replace('models/', '')}`);
        });
        console.log("-----------------------------");

    } catch (err) {
        console.error("Lỗi kết nối:", err);
    }
}

listModels();