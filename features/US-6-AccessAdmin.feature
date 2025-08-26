Feature: Access admin page
  As a User, I want to access the admin so that I can access admin settings.

  Scenario: Access admin page workflow
    Given I am logged in and on the dashboard page
    When I click on Admin button on the sidebar
    Then admin page is accessed