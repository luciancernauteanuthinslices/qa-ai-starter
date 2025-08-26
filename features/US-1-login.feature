Feature: Login as a valid user
  As a User, I want to log in to the website so that I can access my account.

  Scenario: Login as a valid user workflow
    Given I am on the login page
    When I enter a valid email and password
    And I press the login button
    Then I should see my dashboard