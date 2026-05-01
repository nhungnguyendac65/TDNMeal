const { DailyMenu } = require('../models');

const autoApproveMenus = async () => {
    try {
        const now = new Date();
        const submittedMenus = await DailyMenu.findAll({ where: { Status: 'Submitted' } });

        let approvedCount = 0;
        for (const menu of submittedMenus) {
            const menuDate = new Date(menu.MenuDate);
            const day = menuDate.getDay();
            
            // Tìm ngày Thứ 2 của tuần chứa thực đơn này
            const diffToMonday = menuDate.getDate() - day + (day === 0 ? -6 : 1);
            const mondayOfMenuWeek = new Date(menuDate.setDate(diffToMonday));
            mondayOfMenuWeek.setHours(0, 0, 0, 0);

            // Nếu ngày hiện tại đã bước sang Thứ 2 của tuần đó (tức là đã qua hạn chót Chủ nhật tuần trước)
            if (now >= mondayOfMenuWeek) {
                await menu.update({ Status: 'Approved' });
                approvedCount++;
                console.log(`[CRON] Auto-approved menu ${menu.MenuID} for date ${menu.MenuDate}`);
            }
        }

        if (approvedCount > 0) {
            console.log(`[CRON] Đã tự động duyệt ${approvedCount} thực đơn quá hạn.`);
        }
    } catch (error) {
        console.error('[CRON] Error auto-approving menus:', error);
    }
};

const startCronJobs = () => {
    console.log('[CRON] Khởi động hệ thống kiểm tra và tự động duyệt thực đơn...');
    
    // Chạy lần đầu ngay khi khởi động server
    autoApproveMenus();
    
    // Sau đó lặp lại mỗi 1 giờ
    setInterval(autoApproveMenus, 60 * 60 * 1000); 
};

module.exports = { startCronJobs, autoApproveMenus };
