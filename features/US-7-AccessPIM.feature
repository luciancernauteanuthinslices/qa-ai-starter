Feature: Access PIM page
  As a User, I want to access the PIM page so that I can access PIM settings.

  Scenario: Access PIM page workflow
    Given I am logged in and on the dashboard page
    When I click on PIM button on the sidebar
    Then PIM page is accessed