Feature: Access My Info page
  As a User, I want to access the My info Page so that I can access My info settings.

  Scenario: Access My Info page workflow
    Given I am logged in and on the dashboard page
    When I click on My info button on the sidebar
    Then My info page is accessed
    And I can see Personal Details heading