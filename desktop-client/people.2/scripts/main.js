require(["$api/relations#Relations","scripts/people"],function(c,d){var a=new d.PeopleApp,b=c.forCurrentUser();a.addCount("followers","SubscribersLabel",b.subscribers);a.addCount("following","SubscriptionsLabel",b.combinedSubscriptions);a.addSuggestions("facebook","FriendsLabel","FriendsEmpty",["FACEBOOK"],6,!0);a.addSuggestions("recommendations","RecommendationsLabel","RecommendationsEmpty",["EDITORIAL","SUBSCRIPTION_OF_SUBSCRIPTION","MY_SUBSCRIBER","SIMILAR_TASTE"],12);document.body.appendChild(a.getNode())});
