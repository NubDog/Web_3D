export async function getAppConfig(env: any) {
    try {
        const result = await env.DB.prepare(`
            SELECT 
                *
            FROM app_config 
            WHERE id = 1
        `).first();

        if (!result) {
            return {
                CONTACT: {
                    HOTLINE: '0123 456 789',
                    SUPPORT_EMAIL: 'onboarding@resend.dev',
                },
                PAYMENT: {
                    BANK_NAME: 'MB Bank',
                    ACCOUNT_NUMBER: '0385750387',
                    ACCOUNT_NAME: 'NGUYEN TRAN VIET KHOA',
                    QR_BASE_URL: `https://img.vietqr.io/image/MB-0385750387-compact2.png`,
                    BANK_CODE: 'MB',
                },
                Locations: {
                    DIACHISHOP: '99 Tô Hiến Thành',
                    CHINHANHTP: 'Đà Nẵng',
                },
            };
        }

        const qrBaseUrl = `https://img.vietqr.io/image/${result.bank_code}-${result.account_number}-compact2.png`;

        return {
            CONTACT: {
                HOTLINE: result.hotline as string,
                SUPPORT_EMAIL: result.support_email as string,
            },
            PAYMENT: {
                BANK_NAME: result.bank_name as string,
                BANK_CODE: result.bank_code as string,  
                ACCOUNT_NUMBER: result.account_number as string,
                ACCOUNT_NAME: result.account_name as string,
                QR_BASE_URL: qrBaseUrl,
            },
            Locations: {
                DIACHISHOP: result.shop_address as string,
                CHINHANHTP: result.city as string,
            },
             EMAIL: {
                FROM_NAME: result.email_from_name as string,
                FROM_EMAIL: result.email_from_address as string,
            },
        };
    } catch (err) {
        console.error('Error loading config:', err);
        return {
            CONTACT: {
                HOTLINE: '0123 456 789',
                SUPPORT_EMAIL: 'onboarding@resend.dev',
            },
            PAYMENT: {
                BANK_NAME: 'MB Bank',
                BANK_CODE: 'MB',   
                ACCOUNT_NUMBER: '0385750387',
                ACCOUNT_NAME: 'NGUYEN TRAN VIET KHOA',
                QR_BASE_URL: `https://img.vietqr.io/image/MB-0385750387-compact2.png`,
            },
            Locations: {
                DIACHISHOP: '99 Tô Hiến Thành',
                CHINHANHTP: 'Đà Nẵng',
            },

        };
    }
}