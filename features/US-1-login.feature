Feature: Login as a valid user

  As a User
  I want to log in to the website
  So that I can access my account

  Scenario: Login with valid credentials
    Given I am on the login page
    When I enter a valid email and password
    And I press the login button
    Then I should see my dashboard