import { Locator, Page, expect } from '@playwright/test';


export class Sidebar {
    hideSideBar: Locator;
    showSidebar: Locator;
    adminButton: Locator;
    adminHeading: Locator;
    PIMButton: Locator;
    PIMHeading: Locator;
    timeButton:Locator;
    timeHeading: Locator;


    constructor(private page: Page) { 
        this.adminButton = this.page.getByRole('link', { name: 'Admin' });
        this.PIMButton = this.page.getByRole('link', { name: 'PIM' });
        this.adminHeading = this.page.getByRole('heading', { name: 'System Users' });
        this.PIMHeading = this.page.getByRole('heading', { name: 'PIM' });
        this.timeButton = this.page.getByRole('link', { name: 'Time' });
        this.adminHeading = this.page.getByRole('heading', { name: 'System Users' });
        this.timeHeading = this.page.locator('h6:has-text("Timesheets Pending Action")');
    }

    async goToAdmin(){
        await this.adminButton.click();
    }
    async expectAdminpage(){
        await expect(this.adminHeading).toBeVisible();
          
    }
    async goToPIM(){
        await this.PIMButton.click();
    }
    
    async expectPIMHeading(){
        await expect(this.PIMHeading).toBeVisible()
    }

    async goToTimePage(){
        await this.timeButton.click()
    }

    async expectTimeHeading(){
        await expect(this.timeHeading).toBeVisible()
    }

}