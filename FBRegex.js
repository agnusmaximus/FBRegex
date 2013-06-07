if (Meteor.isClient) {
    
    Session.set("fb_posts", new Array());

    /*
      function appendToPosts
      --------------------------------
      Appends home stream data to the fb_posts variable.
      (This is a callback function)

      @data - home stream data
     */
    function appendToPosts(data) {
	//fb_posts = fb_posts.concat(data.data);
	originalData = Session.get("fb_posts");
	Session.set("fb_posts", originalData.concat(data.data));
	//console.log(Session.get("fb_posts"));
	Meteor.flush();
	$("#TextsTab").masonry({isAnimated : false});
    }

    /*
      function handleGroupIds
      ---------------------------------
      A callback function which handles 
      a list of group ids. It will then
      fetch group stream posts.

      @data - list of groups
     */
    function handleGroupIds(data) {
	for (i = 0; i < data.data.length; i++) {

	    getGroupStream(data.data[i].gid, appendToPosts);
	}
    }

    //Returns whether or not the user is logged in
    Template.LoginTab.isLoggedIn = function() {
	return Meteor.userId() != null;
    }
        
    //Handles events for the loginTab template
    Template.LoginTab.events = {
	"click #Login" : function() {
	    Meteor.loginWithFacebook({
		    requestPermissions : ['read_stream',
					  'read_mailbox',
					  'read_requests',
					  'user_groups',
					  'friends_groups'],
		},
		function() {
		    //Id of user
		    id = Meteor.user().services.facebook.id;
		    //Get feed stream and statuses of user
		    getFeedStream(id, appendToPosts);
		    getStatusStream(id, appendToPosts);

		    //Get user's group ids and posts
		    query = "SELECT gid FROM group_member where uid=" + id;
		    makeFBCall(query, handleGroupIds);
		});
	}
    }

    //Returns the posts variable for the TextsTab template
    Template.TextsTab.posts = function() {
	if (Meteor.user() != null) {
	    return Session.get("fb_posts");
	}
    }

    Template.TextsTab.validPost = function(obj) {
	return (obj.message || 
		obj.description || 
		obj.story);
    }
    
    Template.TextsTab.recipient = function(obj) {
	return obj.to.data[0].name;
    }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
