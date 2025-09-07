INSERT INTO NguoiDung 
(ten_dang_nhap, mat_khau, vai_tro, trang_thai, ho_ten, email, so_dien_thoai, ngay_tao, ngay_cap_nhat) 
VALUES
('khach01', '123456', 'KhachHang', 'active', 'Nguyen Van A', 'khach01@example.com', '0900000001', datetime('now'), datetime('now')),
('khach02', '123456', 'KhachHang', 'active', 'Tran Thi B', 'khach02@example.com', '0900000002', datetime('now'), datetime('now')),
('khach03', '123456', 'KhachHang', 'active', 'Le Van C', 'khach03@example.com', '0900000003', datetime('now'), datetime('now')),
('khach04', '123456', 'KhachHang', 'active', 'Pham Thi D', 'khach04@example.com', '0900000004', datetime('now'), datetime('now')),
('khach05', '123456', 'KhachHang', 'active', 'Hoang Van E', 'khach05@example.com', '0900000005', datetime('now'), datetime('now')),
('khach06', '123456', 'KhachHang', 'active', 'Do Thi F', 'khach06@example.com', '0900000006', datetime('now'), datetime('now')),
('khach07', '123456', 'KhachHang', 'active', 'Nguyen Van G', 'khach07@example.com', '0900000007', datetime('now'), datetime('now')),
('khach08', '123456', 'KhachHang', 'active', 'Tran Thi H', 'khach08@example.com', '0900000008', datetime('now'), datetime('now')),
('khach09', '123456', 'KhachHang', 'active', 'Le Van I', 'khach09@example.com', '0900000009', datetime('now'), datetime('now')),
('khach10', '123456', 'KhachHang', 'active', 'Pham Thi J', 'khach10@example.com', '0900000010', datetime('now'), datetime('now')),
('khach11', '123456', 'KhachHang', 'active', 'Hoang Van K', 'khach11@example.com', '0900000011', datetime('now'), datetime('now')),
('khach12', '123456', 'KhachHang', 'active', 'Do Thi L', 'khach12@example.com', '0900000012', datetime('now'), datetime('now')),
('khach13', '123456', 'KhachHang', 'active', 'Nguyen Van M', 'khach13@example.com', '0900000013', datetime('now'), datetime('now')),
('khach14', '123456', 'KhachHang', 'active', 'Tran Thi N', 'khach14@example.com', '0900000014', datetime('now'), datetime('now')),
('khach15', '123456', 'KhachHang', 'active', 'Le Van O', 'khach15@example.com', '0900000015', datetime('now'), datetime('now')),
('khach16', '123456', 'KhachHang', 'active', 'Pham Thi P', 'khach16@example.com', '0900000016', datetime('now'), datetime('now')),
('khach17', '123456', 'KhachHang', 'active', 'Hoang Van Q', 'khach17@example.com', '0900000017', datetime('now'), datetime('now')),
('khach18', '123456', 'KhachHang', 'active', 'Do Thi R', 'khach18@example.com', '0900000018', datetime('now'), datetime('now')),
('khach19', '123456', 'KhachHang', 'active', 'Nguyen Van S', 'khach19@example.com', '0900000019', datetime('now'), datetime('now')),
('khach20', '123456', 'KhachHang', 'active', 'Tran Thi T', 'khach20@example.com', '0900000020', datetime('now'), datetime('now'));


INSERT INTO KhachHang
(nguoi_dung_id, ho_ten, ngay_sinh, dia_chi, thanh_pho, tinh, ma_buu_chinh, quoc_gia, ngay_tao, ngay_cap_nhat)
VALUES
(1, 'Nguyen Van A', '1990-05-12', '123 Le Loi', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(2, 'Tran Thi B', '1985-09-20', '45 Nguyen Trai', 'Ha Noi', 'Ha Noi', '100000', 'VN', datetime('now'), datetime('now')),
(3, 'Le Van C', '1992-03-15', '67 Le Duan', 'Ho Chi Minh', 'HCM', '700000', 'VN', datetime('now'), datetime('now')),
(4, 'Pham Thi D', '1995-07-07', '89 Tran Phu', 'Hai Phong', 'Hai Phong', '180000', 'VN', datetime('now'), datetime('now')),
(5, 'Hoang Van E', '1998-12-25', '12 Quang Trung', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(6, 'Do Thi F', '1993-01-18', '34 Phan Chu Trinh', 'Hue', 'Thua Thien Hue', '490000', 'VN', datetime('now'), datetime('now')),
(7, 'Nguyen Van G', '1980-04-05', '56 Tran Hung Dao', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(8, 'Tran Thi H', '1989-06-30', '78 Bach Dang', 'Ha Noi', 'Ha Noi', '100000', 'VN', datetime('now'), datetime('now')),
(9, 'Le Van I', '1991-11-11', '90 Ly Thuong Kiet', 'Ho Chi Minh', 'HCM', '700000', 'VN', datetime('now'), datetime('now')),
(10, 'Pham Thi J', '1994-08-22', '22 Nguyen Van Linh', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(11, 'Hoang Van K', '1996-02-10', '11 Dien Bien Phu', 'Can Tho', 'Can Tho', '900000', 'VN', datetime('now'), datetime('now')),
(12, 'Do Thi L', '1997-07-17', '33 Nguyen Hue', 'Quy Nhon', 'Binh Dinh', '820000', 'VN', datetime('now'), datetime('now')),
(13, 'Nguyen Van M', '1982-10-01', '44 Hung Vuong', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(14, 'Tran Thi N', '1987-03-28', '55 Tran Cao Van', 'Hoi An', 'Quang Nam', '560000', 'VN', datetime('now'), datetime('now')),
(15, 'Le Van O', '1990-09-09', '66 Ly Nam De', 'Ha Noi', 'Ha Noi', '100000', 'VN', datetime('now'), datetime('now')),
(16, 'Pham Thi P', '1992-12-12', '77 Nguyen Dinh Chieu', 'Ho Chi Minh', 'HCM', '700000', 'VN', datetime('now'), datetime('now')),
(17, 'Hoang Van Q', '1995-05-05', '88 Le Hong Phong', 'Nha Trang', 'Khanh Hoa', '650000', 'VN', datetime('now'), datetime('now')),
(18, 'Do Thi R', '1998-01-30', '99 Hai Ba Trung', 'Vinh', 'Nghe An', '460000', 'VN', datetime('now'), datetime('now')),
(19, 'Nguyen Van S', '1983-06-06', '101 Tran Hung Dao', 'Da Nang', 'Da Nang', '550000', 'VN', datetime('now'), datetime('now')),
(20, 'Tran Thi T', '1986-11-25', '202 Phan Boi Chau', 'Buon Ma Thuot', 'Dak Lak', '630000', 'VN', datetime('now'), datetime('now'));
