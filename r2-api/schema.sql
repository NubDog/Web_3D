-- ===========================
-- Bảng NGUOIDUNG
-- ===========================
CREATE TABLE IF NOT EXISTS NguoiDung (
    MaNguoiDung INTEGER PRIMARY KEY AUTOINCREMENT,
    HoTen TEXT NOT NULL,
    Email TEXT NOT NULL UNIQUE,
    SoDienThoai TEXT NOT NULL UNIQUE,
    MatKhau TEXT NOT NULL,
    VaiTro TEXT CHECK (VaiTro IN ('KH', 'Admin', 'NhanVien')) NOT NULL DEFAULT 'KH',
    CCCD TEXT UNIQUE,
    BangLai TEXT,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- Bảng CHINHANH
-- ===========================
CREATE TABLE IF NOT EXISTS ChiNhanh (
    MaChiNhanh INTEGER PRIMARY KEY AUTOINCREMENT,
    TenChiNhanh TEXT NOT NULL,
    DiaChi TEXT NOT NULL,
    SoDienThoai TEXT
);

-- ===========================
-- Bảng LOAIXE
-- ===========================
CREATE TABLE IF NOT EXISTS LoaiXe (
    MaLoaiXe INTEGER PRIMARY KEY AUTOINCREMENT,
    TenLoaiXe TEXT NOT NULL
);

-- ===========================
-- Bảng PHUONGTIEN
-- ===========================
CREATE TABLE IF NOT EXISTS PhuongTien (
    MaXe INTEGER PRIMARY KEY AUTOINCREMENT,
    MaLoaiXe INTEGER NOT NULL,
    MaChiNhanh INTEGER NOT NULL,
    TenXe TEXT NOT NULL,
    HangXe TEXT,
    NamSX INTEGER,
    BienSo TEXT NOT NULL UNIQUE,
    GiaThueNgay REAL NOT NULL,
    SoKm INTEGER DEFAULT 0,
    TrangThai TEXT CHECK (TrangThai IN ('SanSang','DangThue','BaoDuong')) NOT NULL DEFAULT 'SanSang',
    FOREIGN KEY (MaLoaiXe) REFERENCES LoaiXe(MaLoaiXe),
    FOREIGN KEY (MaChiNhanh) REFERENCES ChiNhanh(MaChiNhanh)
);

-- ===========================
-- Bảng DONTHUE
-- ===========================
CREATE TABLE IF NOT EXISTS DonThue (
    MaDon INTEGER PRIMARY KEY AUTOINCREMENT,
    MaNguoiDung INTEGER NOT NULL,
    MaXe INTEGER NOT NULL,
    MaChiNhanhNhan INTEGER NOT NULL,
    MaChiNhanhTra INTEGER NOT NULL,
    NgayNhan TIMESTAMP NOT NULL,
    NgayTra TIMESTAMP NOT NULL,
    TongTien REAL NOT NULL,
    ThueTaiXe BOOLEAN DEFAULT 0,
    TrangThai TEXT CHECK (TrangThai IN ('ChoXacNhan','DangThue','HoanTat','Huy')) NOT NULL DEFAULT 'ChoXacNhan',
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaXe) REFERENCES PhuongTien(MaXe),
    FOREIGN KEY (MaChiNhanhNhan) REFERENCES ChiNhanh(MaChiNhanh),
    FOREIGN KEY (MaChiNhanhTra) REFERENCES ChiNhanh(MaChiNhanh)
);

-- ===========================
-- Bảng THANHTOAN
-- ===========================
CREATE TABLE IF NOT EXISTS ThanhToan (
    MaTT INTEGER PRIMARY KEY AUTOINCREMENT,
    MaDon INTEGER NOT NULL,
    SoTien REAL NOT NULL,
    PhuongThuc TEXT CHECK (PhuongThuc IN ('TienMat','ChuyenKhoan','VNPAY')) NOT NULL,
    NgayTT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TrangThai TEXT CHECK (TrangThai IN ('ThanhCong','ThatBai')) NOT NULL,
    FOREIGN KEY (MaDon) REFERENCES DonThue(MaDon)
);

-- ===========================
-- Bảng BIENBANBANGIAO
-- ===========================
CREATE TABLE IF NOT EXISTS BienBanBanGiao (
    MaBienBan INTEGER PRIMARY KEY AUTOINCREMENT,
    MaDon INTEGER NOT NULL,
    Loai TEXT CHECK (Loai IN ('BanGiao','NhanLai')) NOT NULL,
    SoKm INTEGER,
    MucXang REAL,
    MoTaTinhTrang TEXT,
    AnhChup TEXT,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaDon) REFERENCES DonThue(MaDon)
);

-- ===========================
-- Bảng BAODUONGXE
-- ===========================
CREATE TABLE IF NOT EXISTS BaoDuongXe (
    MaBD INTEGER PRIMARY KEY AUTOINCREMENT,
    MaXe INTEGER NOT NULL,
    NgayBD TIMESTAMP NOT NULL,
    NoiDung TEXT,
    ChiPhi REAL,
    FOREIGN KEY (MaXe) REFERENCES PhuongTien(MaXe)
);

-- ===========================
-- Bảng DANHGIA
-- ===========================
CREATE TABLE IF NOT EXISTS DanhGia (
    MaDG INTEGER PRIMARY KEY AUTOINCREMENT,
    MaNguoiDung INTEGER NOT NULL,
    MaXe INTEGER NOT NULL,
    SoSao INTEGER CHECK (SoSao BETWEEN 1 AND 5) NOT NULL,
    BinhLuan TEXT,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (MaNguoiDung) REFERENCES NguoiDung(MaNguoiDung),
    FOREIGN KEY (MaXe) REFERENCES PhuongTien(MaXe)
);

-- ===========================
-- Bảng KHUYENMAI
-- ===========================
CREATE TABLE IF NOT EXISTS KhuyenMai (
    MaKM INTEGER PRIMARY KEY AUTOINCREMENT,
    MaCode TEXT NOT NULL UNIQUE,
    TyLeGiam REAL CHECK (TyLeGiam >= 0 AND TyLeGiam <= 100),
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL
);

-- ===========================
-- Bảng DON_KHUYENMAI (N-N)
-- ===========================
CREATE TABLE IF NOT EXISTS Don_KhuyenMai (
    MaDon INTEGER NOT NULL,
    MaKM INTEGER NOT NULL,
    PRIMARY KEY (MaDon, MaKM),
    FOREIGN KEY (MaDon) REFERENCES DonThue(MaDon),
    FOREIGN KEY (MaKM) REFERENCES KhuyenMai(MaKM)
);
