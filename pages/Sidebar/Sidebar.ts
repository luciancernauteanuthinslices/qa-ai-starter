import { Locator, Page, expect } from '@playwright/test';


export default class Sidebar {
    hideSideBar: Locator;
    showSidebar: Locator;
    adminButton: Locator;
    adminHeading: Locator;
    PIMButton: Locator;


    constructor(private page: Page) { 
        this.adminButton = this.page.getByRole('link', { name: 'Admin' });
        this.PIMButton = this.page.getByRole('link', { name: 'PIM' });
        this.adminHeading = this.page.getByRole('heading', { name: 'System Users' });
    }

    async goToAdmin(){
        await this.adminButton.click();
    }
    async expectAdminpage(){
        await expect(this.adminHeading).toBeVisible();
          
    }
}