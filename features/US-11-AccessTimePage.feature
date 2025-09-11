Feature: Access Time page
  As a User, I want to access the Time Page so that I can access Time settings.

  Scenario: Access Time page workflow
    Given I am logged in and on the dashboard page
    When I click on Time button on the sidebar
    Then Time page is accessed
    And I can see Timesheets Pending Action section