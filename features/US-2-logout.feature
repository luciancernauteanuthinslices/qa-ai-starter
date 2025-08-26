Feature: Logout user

  As a User
  I want to logout from the website
  So that I can securely end my session

  Scenario: User logs out from dashboard
    Given I am logged in and on the dashboard
    When I click on my profile picture
    And I click the logout button
    Then I should be logged out and redirected to login page