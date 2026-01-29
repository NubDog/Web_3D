export interface AppConfig {
  CONTACT: {
    HOTLINE: string;
    SUPPORT_EMAIL: string;
  };

  PAYMENT: {
    BANK_CODE: string;
    BANK_NAME: string;
    ACCOUNT_NUMBER: string;
    ACCOUNT_NAME: string;
    QR_BASE_URL: string;
  };

  VIOLATIONS: {
    BLOCK_THRESHOLDS: {
      MIN_DEBT: number;
      MIN_COUNT: number;
    };
    EMAIL: {
      // Email khóa tài khoản
      SUBJECT_BLOCKED: string;
      REASON_DEBT: string;
      REASON_COUNT: string;
      AFTER_PAYMENT_NOTE: string;

      //  Email vi phạm thông thường
      SUBJECT_VIOLATION: string;

      // mail xác nhận thanh toán
      SUBJECT_PAYMENT_CONFIRMED: string;

      //  Email hủy vi phạm
      SUBJECT_VIOLATION_CANCELLED: string;
    };
  };

  MAINTENANCE: {
    HAN_BAO_TRI_PHUONG_TIEN: number,
  },

  FRONTEND: {
    BASE_URL: string;
    VIOLATION_PATH: string;
  };

  EMAIL: {
    FROM_NAME: string;
    FROM_EMAIL: string;
  };


  DB: {
    USER_STATUS: {
      ACTIVE: 'active';
      BLOCKED: 'inactive';
    };
    VIOLATION_STATUS: {
      UNPAID: 'chua_xu_ly';
      PAID: 'da_thanh_toan';
      CANCELLED: 'huy_bo';
    };
  };

  Locations: {
    DIACHISHOP: string,
    CHINHANHTP: string,
  };
}

const DEFAULT_CONFIG: AppConfig = {
  CONTACT: {
    HOTLINE: '0123 456 789',
    SUPPORT_EMAIL: 'onboarding@resend.dev',
  },

  PAYMENT: {
    BANK_CODE: 'MB',
    BANK_NAME: 'MB Bank',
    ACCOUNT_NUMBER: '0385750387',
    ACCOUNT_NAME: 'NGUYEN TRAN VIET KHOA',
    QR_BASE_URL: 'https://img.vietqr.io/image/MB-0385750387-compact2.png',
  },

  VIOLATIONS: {
    BLOCK_THRESHOLDS: {
      MIN_DEBT: 2_000_000,
      MIN_COUNT: 3,
    },
    EMAIL: {
      // Email khóa tài khoản
      SUBJECT_BLOCKED: '⛔ TÀI KHOẢN BỊ KHÓA DO VI PHẠM',
      REASON_DEBT: 'Tổng số tiền vi phạm vượt quá 2.000.000đ',
      REASON_COUNT: 'Số lần vi phạm vượt quá 3 lần',
      AFTER_PAYMENT_NOTE: 'Sau khi chuyển khoản, vui lòng gọi hotline 0123 456 789 để xác nhận thanh toán và mở khóa tài khoản.',
      // Email vi phạm thông thường
      SUBJECT_VIOLATION: '⚠️ Thông báo vi phạm giao thông',
      // Email xác nhận thanh toán
      SUBJECT_PAYMENT_CONFIRMED: '✅ Xác nhận thanh toán vi phạm',
      // Email hủy vi phạm
      SUBJECT_VIOLATION_CANCELLED: '🔄 Thông báo hủy vi phạm',
    },
  },

  FRONTEND: {
    BASE_URL: 'http://localhost:5173',
    VIOLATION_PATH: '/user/violations',
  },

  EMAIL: {
    FROM_NAME: 'Hệ thống cho thuê',
    FROM_EMAIL: 'onboarding@resend.dev',
  },

  DB: {
    USER_STATUS: {
      ACTIVE: 'active',
      BLOCKED: 'inactive',
    },
    VIOLATION_STATUS: {
      UNPAID: 'chua_xu_ly',
      PAID: 'da_thanh_toan',
      CANCELLED: 'huy_bo',
    },
  },
  Locations: {
    DIACHISHOP: '99 Tô Hiến Thành',
    CHINHANHTP: 'Đà Nẵng',
  },
  MAINTENANCE: {
    HAN_BAO_TRI_PHUONG_TIEN: 0,
  },
};

export function getAppConfig(env: any): AppConfig {
  return {
    ...DEFAULT_CONFIG,
    FRONTEND: {
      ...DEFAULT_CONFIG.FRONTEND,
      BASE_URL: env.FRONTEND_URL || DEFAULT_CONFIG.FRONTEND.BASE_URL,
    },
    CONTACT: {
      ...DEFAULT_CONFIG.CONTACT,
      HOTLINE: env.HOTLINE || DEFAULT_CONFIG.CONTACT.HOTLINE,
    },
  };
}

export function getConfig(): AppConfig {
  return DEFAULT_CONFIG;
}

export function buildQRUrl(config: AppConfig, amount: number, note: string): string {
  const params = new URLSearchParams({
    amount: amount.toString(),
    addInfo: note,
    accountName: config.PAYMENT.ACCOUNT_NAME,
  });
  return `${config.PAYMENT.QR_BASE_URL}?${params.toString()}`;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
}

export function getViolationUrl(config: AppConfig): string {
  return `${config.FRONTEND.BASE_URL}${config.FRONTEND.VIOLATION_PATH}`;
}

export function getShopAddress(): string {
  return DEFAULT_CONFIG.Locations.DIACHISHOP
}

export function getCityShop(): string {
  return DEFAULT_CONFIG.Locations.CHINHANHTP
}

export function getHotLine(): string {
  return DEFAULT_CONFIG.CONTACT.HOTLINE
}

export interface ConfigRequest {
  CONTACT: {
    HOTLINE: string;
    SUPPORT_EMAIL: string;
  };
  PAYMENT: {

    BANK_NAME: string;
    ACCOUNT_NUMBER: string;
    ACCOUNT_NAME: string;
    QR_BASE_URL?: string;
    BANK_CODE: string;
  };
  VIOLATIONS: {
    BLOCK_THRESHOLDS: {
      MIN_DEBT: number;
      MIN_COUNT: number;
    };
    EMAIL: {
      SUBJECT_BLOCKED: string;
      REASON_DEBT: string;
      REASON_COUNT: string;
      AFTER_PAYMENT_NOTE: string;
      SUBJECT_VIOLATION: string;
      SUBJECT_PAYMENT_CONFIRMED: string;
      SUBJECT_VIOLATION_CANCELLED: string;
    };
  };
  Locations: {
    DIACHISHOP: string;
    CHINHANHTP: string;
  };
  EMAIL: {
    FROM_NAME: string;
    FROM_EMAIL: string;
  };
  MAINTENANCE: {
    HAN_BAO_TRI_PHUONG_TIEN: Number,
  },
}

export interface ConfigResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  updated_at?: string;
}
