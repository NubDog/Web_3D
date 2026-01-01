import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// @ts-ignore
import fontkit from '@pdf-lib/fontkit';

const formatMoney = (amount: any) => {
    if (!amount) return "0 ₫"; 
    const num = Number(amount);
    if (isNaN(num)) return "0 ₫";
    return num.toLocaleString('vi-VN') + " ₫";
};

const formatDate = (dateString: any) => {
    if (!dateString) return "...";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "...";
        return date.toLocaleDateString('vi-VN');
    } catch (e) {
        return "...";
    }
};

const embedImageFromUrl = async (pdfDoc: PDFDocument, imageUrl: string) => {
    try {
        if (!imageUrl) return null;
        const response = await fetch(imageUrl + "?t=" + new Date().getTime());
        if (!response.ok) return null;
        const imageBytes = await response.arrayBuffer();
        const lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.endsWith('.png')) return await pdfDoc.embedPng(imageBytes);
        else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) return await pdfDoc.embedJpg(imageBytes);
        return null;
    } catch (e) {
        return null;
    }
};

export const generateContractPDF = async (data: any) => {
    try {
        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);

        const fontUrlRegular = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const fontUrlMedium = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

        const [fontBytesReg, fontBytesMed] = await Promise.all([
            fetch(fontUrlRegular).then(res => res.arrayBuffer()),
            fetch(fontUrlMedium).then(res => res.arrayBuffer())
        ]);

        const fontReg = await pdfDoc.embedFont(fontBytesReg);
        const fontBold = await pdfDoc.embedFont(fontBytesMed);

        let page = pdfDoc.addPage([595.28, 841.89]); 
        const { width, height } = page.getSize();
        
        const primaryColor = rgb(0.1, 0.35, 0.65); 
        const grayColor = rgb(0.4, 0.4, 0.4);      
        const margin = 40;
        let y = height - 50;

        
        const drawField = (label: string, value: string, x: number, yPos: number, widthLimit: number = 200) => {
            page.drawText(label, { x, y: yPos, size: 10, font: fontReg, color: grayColor });
            page.drawText(value, { x, y: yPos - 14, size: 11, font: fontBold, color: rgb(0,0,0) });
        };

        const drawSectionHeader = (title: string, yPos: number) => {
            page.drawRectangle({
                x: margin,
                y: yPos - 5,
                width: width - (margin * 2),
                height: 24,
                color: rgb(0.95, 0.97, 1), 
                borderColor: primaryColor,
                borderWidth: 0.5,
            });
            page.drawText(title.toUpperCase(), {
                x: margin + 10,
                y: yPos + 2,
                size: 11,
                font: fontBold,
                color: primaryColor
            });
            return yPos - 35;
        };


        page.drawText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { x: width/2 - 110, y, size: 11, font: fontBold });
        y -= 15;
        page.drawText('Độc lập - Tự do - Hạnh phúc', { x: width/2 - 75, y, size: 11, font: fontReg });
        y -= 10;
        page.drawLine({ start: { x: width/2 - 40, y }, end: { x: width/2 + 40, y }, thickness: 1, color: rgb(0,0,0) });

        y -= 40;
       const titleText = 'HỢP ĐỒNG THUÊ XE';
        const titleWidth = fontBold.widthOfTextAtSize(titleText, 18);
        page.drawText(titleText, { 
            x: (width - titleWidth) / 2, 
            y, 
            size: 18, 
            font: fontBold, 
            color: primaryColor 
        });
        
        y -= 25;
       const soHDFull = `Số: ${data.so_hop_dong || data.id || '...'}`;
        const soHDWidth = fontReg.widthOfTextAtSize(soHDFull, 10);
        page.drawText(soHDFull, { 
            x: (width - soHDWidth) / 2, 
            y, 
            size: 10, 
            font: fontReg, 
            color: grayColor 
        });

        y -= 15;

        const dateFull = `Ngày lập: ${formatDate(new Date())}`;
        const dateWidth = fontReg.widthOfTextAtSize(dateFull, 10);
        page.drawText(dateFull, { 
            x: (width - dateWidth) / 2, 
            y, 
            size: 10, 
            font: fontReg, 
            color: grayColor 
        });

        y -= 40; 
        y = drawSectionHeader('I. THÔNG TIN KHÁCH HÀNG (BÊN A)', y);
        
        drawField('Họ và tên:', data.khach_hang_ten || data.ho_ten || '...', margin + 10, y);
        drawField('Số điện thoại:', data.sdt || data.so_dien_thoai || '...', margin + 270, y);
        y -= 35;
        
        drawField('Số CCCD/CMND:', data.cccd_so || data.cccd || '...', margin + 10, y);
        drawField('Địa chỉ:', data.dia_chi || '...', margin + 270, y);
        y -= 40; 

        y = drawSectionHeader('II. THÔNG TIN XE & THỜI GIAN THUÊ', y);

        drawField('Loại xe:', data.ten_phuong_tien || data.ten_xe || '...', margin + 10, y);
        drawField('Biển kiểm soát:', data.bien_so || '...', margin + 270, y);
        y -= 35;

        drawField('Thời gian nhận:', formatDate(data.ngay_bat_dau || data.ngay_nhan), margin + 10, y);
        drawField('Thời gian trả:', formatDate(data.ngay_ket_thuc || data.ngay_tra), margin + 270, y);
        y -= 35;
        
        const odo = data.km_luc_giao || data.odo_hien_tai || 0;
        drawField('Số ODO hiện tại:', `${odo} km`, margin + 10, y);
        y -= 40;

        y = drawSectionHeader('III. CHI PHÍ & THANH TOÁN', y);

        const tableY = y;
        const col1 = margin + 10;
        const col2 = width - margin - 100; 

        const drawRow = (label: string, value: string, currentY: number, isTotal = false) => {
            page.drawText(label, { 
                x: col1, y: currentY, size: 11, 
                font: isTotal ? fontBold : fontReg, 
                color: isTotal ? primaryColor : rgb(0,0,0) 
            });
            
            const textWidth = fontBold.widthOfTextAtSize(value, 11);
            page.drawText(value, { 
                x: col2 + 100 - textWidth, y: currentY, size: 11, 
                font: isTotal ? fontBold : fontReg, 
                color: isTotal ? rgb(0.8, 0, 0) : rgb(0,0,0) 
            });
            
            page.drawLine({
                start: { x: col1, y: currentY - 5 },
                end: { x: width - margin - 10, y: currentY - 5 },
                thickness: 0.5,
                color: rgb(0.9, 0.9, 0.9),
                opacity: 0.5
            });
            return currentY - 25;
        };

        const donGia = data.don_gia || 0;
        const tongTien = data.tong_tien || 0;
        const datCoc = data.tien_coc || data.tien_coc_yeu_cau || 0;

        y = drawRow('Đơn giá thuê / ngày:', formatMoney(donGia), y);
        y = drawRow('Tiền đặt cọc:', formatMoney(datCoc), y);
        y -= 5; 
        y = drawRow('TỔNG TIỀN THANH TOÁN:', formatMoney(tongTien), y, true);

        y -= 20;


        
        if (y < 200) {
            page = pdfDoc.addPage([595.28, 841.89]); 
            y = height - 50;
        }

        const imageY = y - 110; 
       const [frontImg, backImg] = await Promise.all([
            embedImageFromUrl(pdfDoc, data.cccd_anh_truoc),
            embedImageFromUrl(pdfDoc, data.cccd_anh_sau)
        ]);

        if (frontImg || backImg) {
            // Kiểm tra nếu không đủ chỗ vẽ ảnh thì sang trang
            if (y < 150) { 
                page = pdfDoc.addPage([595.28, 841.89]);
                y = height - 50; // Reset y lên đầu trang mới
            }

            page.drawText('HỒ SƠ ĐÍNH KÈM (CCCD):', { x: margin, y, size: 10, font: fontBold, color: grayColor });
            y -= 10;

            const imageY = y - 110; 
            if (frontImg) {
                page.drawImage(frontImg, { x: margin + 20, y: imageY, width: 180, height: 110 });
                page.drawText('Mặt trước', { x: margin + 80, y: imageY - 15, size: 9, font: fontReg });
            }
            if (backImg) {
                // Nếu chỉ có ảnh sau thì vẽ nó vào vị trí ảnh trước cho đẹp
                const imgX = frontImg ? margin + 250 : margin + 20;
                const textX = frontImg ? margin + 310 : margin + 80;
                page.drawImage(backImg, { x: imgX, y: imageY, width: 180, height: 110 });
                page.drawText('Mặt sau', { x: textX, y: imageY - 15, size: 9, font: fontReg });
            }
            // Cập nhật lại y sau khi vẽ ảnh xong
            y = imageY - 30;
        }

        const signatureBlockHeight = 150; // Chiều cao cần thiết cho cụm chữ ký
        const bottomMargin = 50;          // Lề dưới tối thiểu

        // Kiểm tra: Nếu vị trí hiện tại (y) trừ đi chiều cao chữ ký mà thấp hơn lề dưới
        // Nghĩa là không đủ chỗ -> Sang trang mới
        if (y - signatureBlockHeight < bottomMargin) {
            page = pdfDoc.addPage([595.28, 841.89]);
            y = height - 50; // Reset y về ĐẦU trang mới
        } else {
            y -= 40; // Nếu còn chỗ thì cách ảnh ra một đoạn cho thoáng
        }

        // Vẽ cụm chữ ký (Vẽ tại y hiện tại - dù là cuối trang cũ hay đầu trang mới)
        page.drawText('ĐẠI DIỆN BÊN A', { x: margin + 40, y, size: 11, font: fontBold });
        page.drawText('ĐẠI DIỆN BÊN B', { x: width - margin - 130, y, size: 11, font: fontBold });
        
        y -= 15; // Xuống dòng
        page.drawText('(Ký, ghi rõ họ tên)', { x: margin + 50, y, size: 9, font: fontReg, color: grayColor });
        page.drawText('(Ký, ghi rõ họ tên)', { x: width - margin - 120, y, size: 9, font: fontReg, color: grayColor });

        // --- KẾT THÚC ---
        return await pdfDoc.save();

    } catch (error) {
        console.error("Lỗi tạo PDF:", error);
        throw error;
    }
};