Feature: User can access Support section
  As a User, I want to view Support page so that I can understand how to use the application.

  Scenario: User can access Support section workflow
    Given I am logged in and on the dashboard page
    When I click on my profile picture
    And I click the Support button
    Then I should see Support page