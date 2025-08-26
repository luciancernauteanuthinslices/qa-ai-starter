Feature: Info About System
  As a User
  I want to view information about the system
  So that I can understand the application details

  Scenario: Access system information through profile menu
    Given I am logged in and on the dashboard page
    When I click on my profile picture
    And I click the About button
    Then I should see info About application