-- ========== NGUOIDUNG ==========
INSERT INTO NguoiDung (HoTen, Email, SoDienThoai, MatKhau, VaiTro, CCCD, BangLai)
VALUES
('Nguyen Van A', 'a@example.com', '0900000001', '123456', 'KH', '012345678901', 'B1'),
('Tran Thi B', 'b@example.com', '0900000002', '123456', 'KH', '012345678902', 'A1'),
('Le Van C', 'c@example.com', '0900000003', '123456', 'KH', '012345678903', 'B2'),
('Pham Thi D', 'd@example.com', '0900000004', '123456', 'KH', '012345678904', 'A2'),
('Hoang Van E', 'e@example.com', '0900000005', '123456', 'KH', '012345678905', 'C'),
('Nguyen Van F', 'f@example.com', '0900000006', '123456', 'Admin', '012345678906', 'B1'),
('Tran Thi G', 'g@example.com', '0900000007', '123456', 'KH', '012345678907', 'B1'),
('Le Van H', 'h@example.com', '0900000008', '123456', 'KH', '012345678908', 'A1'),
('Pham Thi I', 'i@example.com', '0900000009', '123456', 'KH', '012345678909', 'B2'),
('Hoang Van J', 'j@example.com', '0900000010', '123456', 'KH', '012345678910', 'A2'),
('Nguyen Van K', 'k@example.com', '0900000011', '123456', 'KH', '012345678911', 'C'),
('Tran Thi L', 'l@example.com', '0900000012', '123456', 'KH', '012345678912', 'B1'),
('Le Van M', 'm@example.com', '0900000013', '123456', 'KH', '012345678913', 'B2'),
('Pham Thi N', 'n@example.com', '0900000014', '123456', 'KH', '012345678914', 'A2'),
('Hoang Van O', 'o@example.com', '0900000015', '123456', 'KH', '012345678915', 'C'),
('Nguyen Van P', 'p@example.com', '0900000016', '123456', 'KH', '012345678916', 'B1'),
('Tran Thi Q', 'q@example.com', '0900000017', '123456', 'KH', '012345678917', 'A1'),
('Le Van R', 'r@example.com', '0900000018', '123456', 'KH', '012345678918', 'B2'),
('Pham Thi S', 's@example.com', '0900000019', '123456', 'KH', '012345678919', 'A2'),
('Hoang Van T', 't@example.com', '0900000020', '123456', 'KH', '012345678920', 'C');

-- ========== CHINHANH ==========
INSERT INTO ChiNhanh (TenChiNhanh, DiaChi, SoDienThoai) VALUES
('Chi nhanh Ha Noi', '123 Pho Hue, Ha Noi', '0241234567'),
('Chi nhanh Sai Gon', '456 Nguyen Trai, HCM', '0281234567'),
('Chi nhanh Da Nang', '789 Le Duan, Da Nang', '0511234567'),
('Chi nhanh Hai Phong', '321 Cat Bi, Hai Phong', '0311234567'),
('Chi nhanh Can Tho', '654 Ninh Kieu, Can Tho', '0711234567'),
('Chi nhanh Hue', '111 Hung Vuong, Hue', '0541234567'),
('Chi nhanh Quang Ninh', '222 Ha Long, Quang Ninh', '0331234567'),
('Chi nhanh Nha Trang', '333 Tran Phu, Nha Trang', '0581234567'),
('Chi nhanh Vinh', '444 Quang Trung, Vinh', '0381234567'),
('Chi nhanh Binh Duong', '555 Thu Dau Mot, Binh Duong', '0651234567'),
('Chi nhanh Bien Hoa', '666 Tan Bien, Bien Hoa', '0611234567'),
('Chi nhanh Thanh Hoa', '777 Le Loi, Thanh Hoa', '0371234567'),
('Chi nhanh Thai Nguyen', '888 Phan Dinh Phung, Thai Nguyen', '02811234567'),
('Chi nhanh Nam Dinh', '999 Tran Hung Dao, Nam Dinh', '0351234567'),
('Chi nhanh Bac Ninh', '101 Nguyen Gia Tu, Bac Ninh', '0221234567'),
('Chi nhanh Lao Cai', '202 Pho Moi, Lao Cai', '0201234567'),
('Chi nhanh Thai Binh', '303 Ly Bon, Thai Binh', '0361234567'),
('Chi nhanh Hai Duong', '404 Nguyen Trai, Hai Duong', '0321234567'),
('Chi nhanh Ha Nam', '505 Le Hoan, Ha Nam', '02261234567'),
('Chi nhanh Quang Binh', '606 Ly Thuong Kiet, Quang Binh', '0521234567');

-- ========== LOAIXE ==========
INSERT INTO LoaiXe (TenLoaiXe) VALUES
('Xe May'),
('O To 4 cho'),
('O To 7 cho'),
('Xe Tai nho'),
('Xe Khach 16 cho'),
('Xe Dap'),
('Xe Dap Dien'),
('Xe May dien'),
('O To dien'),
('O To SUV'),
('Pickup'),
('Xe Bus mini'),
('Xe Ban Tai'),
('Xe Van'),
('Xe Container'),
('Xe Ducati'),
('Xe Scooter'),
('Xe Sedan'),
('Xe Hatchback'),
('Xe Coupe');

-- ========== PHUONGTIEN ==========
INSERT INTO PhuongTien (MaLoaiXe, MaChiNhanh, TenXe, HangXe, NamSX, BienSo, GiaThueNgay, SoKm, TrangThai)
VALUES
(1,1,'Honda Wave','Honda',2020,'29A-00001',100000,10000,'SanSang'),
(2,1,'Toyota Vios','Toyota',2021,'29A-00002',500000,20000,'SanSang'),
(3,2,'Innova','Toyota',2022,'51A-00003',700000,30000,'SanSang'),
(4,2,'Kia Frontier','Kia',2020,'51C-00004',800000,40000,'BaoDuong'),
(5,3,'Ford Transit','Ford',2019,'43B-00005',900000,50000,'SanSang'),
(6,3,'Martin MTB','Martin',2021,'VN-00006',50000,600,'SanSang'),
(7,4,'Yadea G5','Yadea',2022,'VN-00007',80000,700,'SanSang'),
(8,4,'Vinfast Feliz','Vinfast',2021,'VN-00008',100000,800,'SanSang'),
(9,5,'Tesla Model 3','Tesla',2022,'65A-00009',1500000,5000,'SanSang'),
(10,5,'Mazda CX5','Mazda',2020,'65A-00010',1000000,25000,'DangThue'),
(11,6,'Ford Ranger','Ford',2021,'75C-00011',1200000,15000,'SanSang'),
(12,7,'Hyundai County','Hyundai',2019,'14B-00012',1300000,35000,'SanSang'),
(13,8,'Suzuki Carry','Suzuki',2018,'79C-00013',600000,40000,'SanSang'),
(14,9,'Kia Sedona','Kia',2021,'37A-00014',900000,10000,'SanSang'),
(15,10,'Container Dongfeng','Dongfeng',2017,'61C-00015',3000000,90000,'BaoDuong'),
(16,11,'Ducati Monster','Ducati',2022,'VN-00016',200000,3000,'SanSang'),
(17,12,'Honda SH','Honda',2023,'VN-00017',150000,2000,'SanSang'),
(18,13,'Hyundai Elantra','Hyundai',2020,'36A-00018',800000,15000,'SanSang'),
(19,14,'Toyota Yaris','Toyota',2021,'30A-00019',750000,14000,'SanSang'),
(20,15,'Mercedes C200','Mercedes',2022,'29A-00020',2000000,5000,'SanSang');

-- ========== DONTHUE ==========
INSERT INTO DonThue (MaNguoiDung, MaXe, MaChiNhanhNhan, MaChiNhanhTra, NgayNhan, NgayTra, TongTien, ThueTaiXe, TrangThai)
VALUES
(1,1,1,1,'2025-08-01','2025-08-05',400000,0,'HoanTat'),
(2,2,1,2,'2025-08-03','2025-08-04',500000,1,'DangThue'),
(3,3,2,2,'2025-07-20','2025-07-22',1400000,0,'HoanTat'),
(4,4,2,2,'2025-07-25','2025-07-30',4000000,1,'HoanTat'),
(5,5,3,3,'2025-08-01','2025-08-02',900000,0,'HoanTat'),
(6,6,3,3,'2025-08-10','2025-08-12',100000,0,'ChoXacNhan'),
(7,7,4,4,'2025-08-11','2025-08-12',80000,0,'DangThue'),
(8,8,4,4,'2025-08-05','2025-08-08',300000,1,'HoanTat'),
(9,9,5,5,'2025-08-15','2025-08-20',7500000,1,'ChoXacNhan'),
(10,10,5,5,'2025-08-02','2025-08-03',1000000,0,'HoanTat'),
(11,11,6,6,'2025-08-07','2025-08-08',1200000,0,'DangThue'),
(12,12,7,7,'2025-07-15','2025-07-17',2600000,1,'HoanTat'),
(13,13,8,8,'2025-08-01','2025-08-05',2400000,0,'HoanTat'),
(14,14,9,9,'2025-08-05','2025-08-07',1800000,0,'ChoXacNhan'),
(15,15,10,10,'2025-08-02','2025-08-09',21000000,1,'HoanTat'),
(16,16,11,11,'2025-08-11','2025-08-15',800000,0,'HoanTat'),
(17,17,12,12,'2025-08-09','2025-08-10',150000,0,'HoanTat'),
(18,18,13,13,'2025-08-01','2025-08-04',2400000,0,'HoanTat'),
(19,19,14,14,'2025-08-06','2025-08-09',2250000,0,'DangThue'),
(20,20,15,15,'2025-08-12','2025-08-13',2000000,1,'ChoXacNhan');

-- ========== THANHTOAN ==========
INSERT INTO ThanhToan (MaDon, SoTien, PhuongThuc, TrangThai)
VALUES
(1,400000,'TienMat','ThanhCong'),
(2,500000,'ChuyenKhoan','ThanhCong'),
(3,1400000,'VNPAY','ThanhCong'),
(4,4000000,'TienMat','ThanhCong'),
(5,900000,'ChuyenKhoan','ThanhCong'),
(6,100000,'VNPAY','ThatBai'),
(7,80000,'TienMat','ThanhCong'),
(8,300000,'TienMat','ThanhCong'),
(9,7500000,'ChuyenKhoan','ThanhCong'),
(10,1000000,'TienMat','ThanhCong'),
(11,1200000,'TienMat','ThanhCong'),
(12,2600000,'ChuyenKhoan','ThanhCong'),
(13,2400000,'VNPAY','ThanhCong'),
(14,1800000,'TienMat','ThanhCong'),
(15,21000000,'ChuyenKhoan','ThanhCong'),
(16,800000,'TienMat','ThanhCong'),
(17,150000,'TienMat','ThanhCong'),
(18,2400000,'VNPAY','ThanhCong'),
(19,2250000,'TienMat','ThanhCong'),
(20,2000000,'TienMat','ThanhCong');

-- ========== BIENBANBANGIAO ==========
INSERT INTO BienBanBanGiao (MaDon, Loai, SoKm, MucXang, MoTaTinhTrang, AnhChup)
VALUES
(1,'BanGiao',10000,5.0,'Xe mới, sạch sẽ','url1'),
(1,'NhanLai',10400,3.0,'Xe ổn','url2'),
(2,'BanGiao',20000,6.0,'Xe ok','url3'),
(3,'BanGiao',30000,7.0,'Xe đẹp','url4'),
(3,'NhanLai',31000,6.0,'Trầy xước nhẹ','url5'),
(4,'BanGiao',40000,5.0,'Xe cũ','url6'),
(4,'NhanLai',40500,4.0,'Má phanh mòn','url7'),
(5,'BanGiao',50000,8.0,'Xe khách','url8'),
(5,'NhanLai',50200,7.0,'Ổn','url9'),
(6,'BanGiao',600,2.0,'Xe đạp','url10'),
(7,'BanGiao',700,3.0,'Xe điện','url11'),
(8,'BanGiao',800,4.0,'Xe điện mới','url12'),
(9,'BanGiao',5000,6.0,'Tesla','url13'),
(10,'BanGiao',25000,6.0,'SUV','url14'),
(11,'BanGiao',15000,5.0,'Ranger','url15'),
(12,'BanGiao',35000,8.0,'Bus','url16'),
(13,'BanGiao',40000,6.0,'Suzuki','url17'),
(14,'BanGiao',10000,7.0,'Sedona','url18'),
(15,'BanGiao',90000,5.0,'Container','url19'),
(16,'BanGiao',3000,5.0,'Ducati','url20');

-- ========== BAODUONGXE ==========
INSERT INTO BaoDuongXe (MaXe, NgayBD, NoiDung, ChiPhi)
VALUES
(1,'2025-01-10','Thay nhớt',200000),
(2,'2025-01-11','Bảo dưỡng định kỳ',500000),
(3,'2025-02-15','Thay lốp',1500000),
(4,'2025-02-20','Sửa phanh',1200000),
(5,'2025-03-01','Bảo dưỡng động cơ',2000000),
(6,'2025-03-10','Sửa xích',100000),
(7,'2025-03-15','Thay pin',800000),
(8,'2025-04-01','Sửa điện',500000),
(9,'2025-04-15','Thay pin Tesla',10000000),
(10,'2025-05-01','Thay dầu máy',700000),
(11,'2025-05-15','Bảo dưỡng cầu',900000),
(12,'2025-06-01','Thay lốp',4000000),
(13,'2025-06-10','Sửa hộp số',2500000),
(14,'2025-07-01','Bảo dưỡng điều hòa',1500000),
(15,'2025-07-20','Đại tu máy',10000000),
(16,'2025-08-01','Sửa pô',300000),
(17,'2025-08-05','Bảo dưỡng định kỳ',700000),
(18,'2025-08-10','Thay bugi',150000),
(19,'2025-08-15','Thay kính',1200000),
(20,'2025-08-20','Thay ắc quy',2500000);

-- ========== DANHGIA ==========
INSERT INTO DanhGia (MaNguoiDung, MaXe, SoSao, BinhLuan)
VALUES
(1,1,5,'Xe chạy tốt'),
(2,2,4,'Ổn'),
(3,3,5,'Rộng rãi'),
(4,4,3,'Xe cũ'),
(5,5,5,'Chạy êm'),
(6,6,4,'Xe khỏe'),
(7,7,3,'Pin nhanh hết'),
(8,8,5,'Đi thích'),
(9,9,5,'Quá ngon'),
(10,10,4,'Ổn định'),
(11,11,5,'Mạnh mẽ'),
(12,12,3,'Xe hơi cũ'),
(13,13,4,'Xe tải tốt'),
(14,14,5,'Gia đình hài lòng'),
(15,15,2,'Xe hỏng nhiều'),
(16,16,5,'Phấn khích'),
(17,17,4,'Đẹp'),
(18,18,5,'Ổn áp'),
(19,19,3,'Bình thường'),
(20,20,5,'Sang trọng');

-- ========== KHUYENMAI ==========
INSERT INTO KhuyenMai (MaCode, TyLeGiam, NgayBatDau, NgayKetThuc)
VALUES
('KM1',10,'2025-08-01','2025-08-31'),
('KM2',15,'2025-08-05','2025-08-25'),
('KM3',20,'2025-07-01','2025-07-31'),
('KM4',5,'2025-09-01','2025-09-30'),
('KM5',25,'2025-08-10','2025-08-20'),
('KM6',30,'2025-08-15','2025-08-22'),
('KM7',12,'2025-07-20','2025-08-20'),
('KM8',18,'2025-08-01','2025-08-15'),
('KM9',22,'2025-08-05','2025-08-28'),
('KM10',35,'2025-08-10','2025-08-30'),
('KM11',40,'2025-09-01','2025-09-15'),
('KM12',8,'2025-08-02','2025-08-16'),
('KM13',17,'2025-08-03','2025-08-29'),
('KM14',28,'2025-08-07','2025-08-21'),
('KM15',50,'2025-08-01','2025-08-31'),
('KM16',7,'2025-08-12','2025-08-25'),
('KM17',14,'2025-08-06','2025-08-19'),
('KM18',20,'2025-08-08','2025-08-27'),
('KM19',33,'2025-08-09','2025-08-23'),
('KM20',45,'2025-08-11','2025-08-31');

-- ========== DON_KHUYENMAI ==========
INSERT INTO Don_KhuyenMai (MaDon, MaKM)
VALUES
(1,1),(2,2),(3,3),(4,4),(5,5),
(6,6),(7,7),(8,8),(9,9),(10,10),
(11,11),(12,12),(13,13),(14,14),(15,15),
(16,16),(17,17),(18,18),(19,19),(20,20);
