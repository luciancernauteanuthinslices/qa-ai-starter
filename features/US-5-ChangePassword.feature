Feature: Change Password
  As a User, I want to Change Password of my account so that I can update my password.

  Scenario: Change Password workflow
    Given I am logged in and on the dashboard page
    When I click on my profile picture
    And I click the Change Password button
    Then I should see Update Password heading