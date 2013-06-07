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
	console.log(Session.get("fb_posts"));
	Meteor.flush();
	$("#TextsTab").masonry({isAnimated : false});
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
					  'read_requests'],
		},
		function() {
		    id = Meteor.user().services.facebook.id;
		    getFeedStream(id, appendToPosts);
		    getStatusStream(id, appendToPosts);
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
