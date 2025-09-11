Feature: Sign-in attempt with incorrect password
  As a User, I want to log in to the website with invalid credentials so that I can access my account.

  Scenario: Sign-in attempt with incorrect password workflow
    Given I am on the login page
    When I enter an invalid email and invalid password
    And I press the login button
    Then I should see an error saying “Invalid credentials”