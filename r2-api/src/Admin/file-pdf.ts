import { PDFDocument, rgb } from 'pdf-lib';
// @ts-ignore
import fontkit from '@pdf-lib/fontkit';

const formatMoney = (amount: any) => {
    if (amount === null || amount === undefined) return "0 ₫";
    const num = Number(amount);
    return isNaN(num) ? "0 ₫" : num.toLocaleString('vi-VN') + " ₫";
};

const formatDate = (dateString: any) => {
    if (!dateString) return "...";
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? "..." : date.toLocaleDateString('vi-VN');
    } catch (e) { return "..."; }
};

const calculateDays = (start: string, end: string) => {
    try {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays > 0 ? diffDays : 1;
    } catch (e) { return 1; }
};

const embedImageFromUrl = async (pdfDoc: PDFDocument, imageUrl: string) => {
    try {
        if (!imageUrl) return null;
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        const imageBytes = await response.arrayBuffer();
        const lower = imageUrl.toLowerCase();
        if (lower.endsWith('.png')) return await pdfDoc.embedPng(imageBytes);
        if (lower.match(/\.(jpg|jpeg)$/)) return await pdfDoc.embedJpg(imageBytes);
        return null;
    } catch (e) { return null; }
};

export const generateContractPDF = async (data: any) => {
    try {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const [fontBytesReg, fontBytesMed] = await Promise.all([
            fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf').then(res => res.arrayBuffer()),
            fetch('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf').then(res => res.arrayBuffer())
        ]);
        const fontReg = await pdfDoc.embedFont(fontBytesReg);
        const fontBold = await pdfDoc.embedFont(fontBytesMed);

        let page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        
        const primaryColor = rgb(0.1, 0.35, 0.65);
        const blueColor = rgb(0, 0.47, 1);
        const greenColor = rgb(0.16, 0.65, 0.27);
        const grayColor = rgb(0.4, 0.4, 0.4);
        const margin = 40;
        let y = height - 50;

        const drawSectionHeader = (title: string, yPos: number) => {
            page.drawRectangle({
                x: margin, y: yPos - 5, width: width - (margin * 2), height: 24,
                color: rgb(0.95, 0.97, 1), borderColor: primaryColor, borderWidth: 0.5,
            });
            page.drawText(title ? String(title).toUpperCase() : "", {
                x: margin + 10, y: yPos + 2, size: 11, font: fontBold, color: primaryColor
            });
            return yPos - 35;
        };

        const drawField = (label: string, value: any, x: number, yPos: number) => {
            page.drawText(label, { x, y: yPos, size: 10, font: fontReg, color: grayColor });
            
            const safeValue = (value === null || value === undefined) ? "" : String(value);
            
            page.drawText(safeValue, { x, y: yPos - 14, size: 11, font: fontBold, color: rgb(0,0,0) });
        };
 
        page.drawText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { x: width/2 - 110, y, size: 11, font: fontBold });
        y -= 15;
        page.drawText('Độc lập - Tự do - Hạnh phúc', { x: width/2 - 75, y, size: 11, font: fontReg });
        y -= 10;
        page.drawLine({ start: { x: width/2 - 40, y }, end: { x: width/2 + 40, y }, thickness: 1 });
        
        y -= 40;
        const titleText = 'HỢP ĐỒNG THUÊ XE';
        page.drawText(titleText, { x: (width - fontBold.widthOfTextAtSize(titleText, 18))/2, y, size: 18, font: fontBold, color: primaryColor });
        
        y -= 25;
        const soHD = `Số: ${data.so_hop_dong || '...'}`;
        page.drawText(soHD, { x: (width - fontReg.widthOfTextAtSize(soHD, 10))/2, y, size: 10, font: fontReg, color: grayColor });
        
        y -= 15;
        const dateStr = `Ngày lập: ${data.ngay_tao || '...'}`;
        page.drawText(dateStr, { x: (width - fontReg.widthOfTextAtSize(dateStr, 10))/2, y, size: 10, font: fontReg, color: grayColor });

        y -= 40;
        y = drawSectionHeader('I. THÔNG TIN KHÁCH HÀNG (BÊN A)', y);
        drawField('Họ và tên:', data.khach_hang_ten, margin + 10, y);
        drawField('Số điện thoại:', data.sdt, margin + 270, y);
        y -= 35;
        drawField('Số CCCD/CMND:', data.cccd_so, margin + 10, y);
        drawField('Địa chỉ:', data.dia_chi, margin + 270, y);

        y -= 40;
        y = drawSectionHeader('II. THÔNG TIN XE & THỜI GIAN THUÊ', y);
        drawField('Loại xe:', data.ten_phuong_tien, margin + 10, y);
        drawField('Biển kiểm soát:', data.bien_so, margin + 270, y);
        y -= 35;
        drawField('Thời gian nhận:', formatDate(data.ngay_bat_dau), margin + 10, y);
        drawField('Thời gian trả:', formatDate(data.ngay_ket_thuc), margin + 270, y);
        y -= 35;
        drawField('Số ODO hiện tại:', `${data.km_luc_giao || 0} km`, margin + 10, y);

        y -= 40;
        y = drawSectionHeader('III. CHI PHÍ & THANH TOÁN', y);

        const soNgay = calculateDays(data.ngay_bat_dau, data.ngay_ket_thuc);
        const donGia = Number(data.don_gia || 0);
        const tamTinh = donGia * soNgay;
        const giamGia = Number(data.giam_gia || 0);
        const tongTien = Number(data.tong_tien || 0);
        const tienCoc = Number(data.tien_coc_yeu_cau || 0);

        const colLeft = margin + 10;
        const colRight = width - margin - 100;

        const drawRowMoney = (label: string, valueText: string, opts: { isBold?: boolean, color?: any, fontSize?: number } = {}) => {
            const f = opts.isBold ? fontBold : fontReg;
            const c = opts.color || rgb(0,0,0);
            const size = opts.fontSize || 11;
            
            const safeLabel = label ? String(label) : "";
            const safeValue = valueText ? String(valueText) : "0 ₫";

            page.drawText(safeLabel, { x: colLeft, y, size: 11, font: f, color: rgb(0.2, 0.2, 0.2) });
            
            const vWidth = f.widthOfTextAtSize(safeValue, size);
            page.drawText(safeValue, { x: colRight + 100 - vWidth, y, size: size, font: f, color: c });
            
            page.drawLine({ start: { x: colLeft, y: y - 8 }, end: { x: width - margin - 10, y: y - 8 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
            y -= 28;
        };

        drawRowMoney(`Giá thuê:`, `${formatMoney(donGia)} x ${soNgay} ngày`);
        drawRowMoney('Tạm tính:', formatMoney(tamTinh));

        if (giamGia > 0) {
            drawRowMoney('Khuyến mãi:', `-${formatMoney(giamGia)}`, { isBold: true, color: greenColor });
        }

        y -= 5; 
        drawRowMoney('Tổng tiền thuê:', formatMoney(tongTien), { isBold: true, color: blueColor, fontSize: 13 });
        drawRowMoney('Tiền cọc yêu cầu:', formatMoney(tienCoc), { color: grayColor });

        if (y < 250) { page = pdfDoc.addPage([595.28, 841.89]); y = height - 50; }
        
        const [frontImg, backImg] = await Promise.all([
            embedImageFromUrl(pdfDoc, data.cccd_anh_truoc),
            embedImageFromUrl(pdfDoc, data.cccd_anh_sau)
        ]);

        if (frontImg || backImg) {
             page.drawText('HỒ SƠ ĐÍNH KÈM (CCCD):', { x: margin, y, size: 10, font: fontBold, color: grayColor });
             y -= 10;
             const imgY = y - 110;
             if (frontImg) {
                 page.drawImage(frontImg, { x: margin + 20, y: imgY, width: 180, height: 110 });
                 page.drawText('Mặt trước', { x: margin + 80, y: imgY - 15, size: 9, font: fontReg });
             }
             if (backImg) {
                 const xPos = frontImg ? margin + 250 : margin + 20;
                 page.drawImage(backImg, { x: xPos, y: imgY, width: 180, height: 110 });
                 page.drawText('Mặt sau', { x: xPos + 60, y: imgY - 15, size: 9, font: fontReg });
             }
             y = imgY - 40;
        }

        // --- V. CHỮ KÝ ---
        if (y < 120) { page = pdfDoc.addPage([595.28, 841.89]); y = height - 50; }
        
        page.drawText('ĐẠI DIỆN BÊN A', { x: margin + 40, y, size: 11, font: fontBold });
        page.drawText('ĐẠI DIỆN BÊN B', { x: width - margin - 130, y, size: 11, font: fontBold });
        y -= 15;
        page.drawText('(Ký, ghi rõ họ tên)', { x: margin + 50, y, size: 9, font: fontReg, color: grayColor });
        page.drawText('(Ký, ghi rõ họ tên)', { x: width - margin - 120, y, size: 9, font: fontReg, color: grayColor });

        return await pdfDoc.save();

    } catch (error) {
        console.error("Lỗi tạo PDF:", error);
        throw error;
    }
};