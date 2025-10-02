Feature: Login as a valid user

Scenario: Successful login with valid credentials
  Given I am on the login page
  When I enter a valid email and password
  And I press the login button
  Then I should see my dashboard