Feature: Add new employee
  As a User, I want to access the PIM page so that I can add an employee named "Brown".

  Scenario: Add new employee workflow
    Given I am logged in and on the dashboard page
    When I click on PIM button on the sidebar
    Then PIM page is accessed
    And I can add and save a new employee using random mock data for each input field
    Then I should see Personal Details page
    And I can see the employee name in the PIM -> Employee List tab