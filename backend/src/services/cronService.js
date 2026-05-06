const { DailyMenu } = require('../models');

const autoApproveMenus = async () => {
    try {
        const now = new Date();
        const submittedMenus = await DailyMenu.findAll({ where: { Status: 'Submitted' } });

        let approvedCount = 0;
        for (const menu of submittedMenus) {
            const menuDate = new Date(menu.MenuDate);
            const day = menuDate.getDay();
            
            // Find Monday of the week containing this menu
            const diffToMonday = menuDate.getDate() - day + (day === 0 ? -6 : 1);
            const mondayOfMenuWeek = new Date(menuDate.setDate(diffToMonday));
            mondayOfMenuWeek.setHours(0, 0, 0, 0);

            // If current date has reached Monday of that week (past the Sunday deadline)
            if (now >= mondayOfMenuWeek) {
                await menu.update({ Status: 'Approved' });
                approvedCount++;
                console.log(`[CRON] Auto-approved menu ${menu.MenuID} for date ${menu.MenuDate}`);
            }
        }

        if (approvedCount > 0) {
            console.log(`[CRON] Auto-approved ${approvedCount} overdue menus.`);
        }
    } catch (error) {
        console.error('[CRON] Error auto-approving menus:', error);
    }
};

const startCronJobs = () => {
    console.log('[CRON] Starting the menu auto-approval and check system...');
    
    // Run initially when server starts
    autoApproveMenus();
    
    // Repeat every hour
    setInterval(autoApproveMenus, 60 * 60 * 1000); 
};

module.exports = { startCronJobs, autoApproveMenus };
