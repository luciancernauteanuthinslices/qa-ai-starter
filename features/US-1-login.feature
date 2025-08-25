Feature: Login as a valid user
  As a User
  I want to log in to the website
  So that I can access my account

  @smoke @login
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter a valid username and password
    And I press the login button
    Then I should see my dashboard

  @smoke @login @negative
  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter invalid username and password
    And I press the login button
    Then I should see an error message
