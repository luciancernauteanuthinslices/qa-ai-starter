Feature: Info About System
  As a User, I want to view information about the system so that I can understand the application details.

  Scenario: Info About System workflow
    Given I am logged in and on the dashboard page
    When I click on my profile picture
    And I click the About button
    Then I should see info About application