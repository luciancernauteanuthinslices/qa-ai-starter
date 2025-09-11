Feature: Create a Buzz
  As a User, I want to create a buzz message in the newsfeed so that message can be seen by everyone in Dashboard -> Buzz latest Posts.

  Scenario: Create a Buzz workflow
    Given I am logged in and on the dashboard page
    When I click on Buzz button on the sidebar
    Then Buzz page is accessed
    And I write a message in the "What's on your mind?" field
    And then click to Post to send the message