Feature: Add New Candidate

Background: 
  Given I am logged in and on the dashboard page

Scenario: Add a new candidate through Recruitment page
  When I click on Recruitment button on the sidebar
  Then Recruitment page is accessed
  And I can see add and complete fields for a new candidate and save