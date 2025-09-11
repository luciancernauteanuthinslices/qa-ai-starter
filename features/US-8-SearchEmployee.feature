Feature: Search employee
  As a User, I want to access the PIM page so that I can search an employee named "Brown".

  Scenario: Search employee workflow
    Given I am logged in and on the dashboard page
    When I click on PIM button on the sidebar
    Then PIM page is accessed
    And I can search for an employee named "Brown"