if (Meteor.isClient) {

    Meteor.logout();
    posts = new Array();    

    function updateMasonry() {
	$("#TextsTab").masonry({isAnimated:false}).masonry("reload");
    }

    /*
      function createPostTemplate
      --------------------------------
      Creates a post template given html and
      appends it to the texts tab section

      @html - html
    */
    function createPostTemplate(html) {
	//turn html into jquery object
	var $element = $(html);
	
	//set some initial css so that the group of 
	//posts will animate from offscreen to onscreen
	$element.css({"z-index":"0",
   		      "visibility":"hidden",
		      "top" : $(document).height()});

	//append the elements to the dom
	$("#TextsTab").append($element);
	
	//set a timeout callback which actually
	//updates the view (to prevent lag)
	setTimeout(updateMasonry, 1000);	
    }

    /*
      function appendToPosts
      --------------------------------
      Appends home stream data to the fb_posts variable.
      (This is a callback function)

      @data - home stream data
     */
    function appendToPosts(data) {
	//Add to the posts array
	posts = posts.concat(data.data);

	//Total html
	total = "";

	//Get html to append to the existing post content
	for (i = 0; i < data.data.length; i++) {
	    fragment = Template.Post(data.data[i]);
	    total += fragment;
	}

	//Create and append the posts
	createPostTemplate(total);
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

    function performRegex(pattern) {
	$("#TextsTab").empty();
	regex = new RegExp(pattern);

	for (i = 0; i < posts.length; i++) {
	    if (regex.test(posts[i].from.name) ||
		regex.test(posts[i].description) ||
		regex.test(posts[i].story) ||
		regex.test(posts[i].message)) {
		fragment = Template.Post(posts[i]);
		createPostTemplate(fragment);
	    }
	    if (posts[i].to &&
		regex.test(posts[i].to.data[0].name)) {
		fragment = Template.Post(posts[i]);
		createPostTemplate(fragment);
	    }
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

    Template.Post.validPost = function(obj) {
	return (obj.message || 
		obj.description || 
		obj.story);
    }
    
    Template.Post.recipient = function(obj) {
	return obj.to.data[0].name;
    }

    Template.SearchTab.events = {
	'keydown #Search' : function(event) {
	    if (event.which == 13) {
		performRegex($(event.target).val());
	    }
	}
    }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
