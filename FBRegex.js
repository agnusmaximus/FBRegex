if (Meteor.isClient) {
    POST_BATCH_NUM = 25;

    Meteor.logout();
    posts = new Array();
    shouldUpdate = true;

    function makeNotification(msg) {
	$("#notification").html(msg);
    }

    function updateMasonry() {
	$("#TextsTab").masonry({isAnimated:false}).masonry("reload");
    }

    /*
     * function createPostTemplate
     * --------------------------------
     * Creates a post template given html and
     * appends it to the texts tab section
     *
     * @html - html
     * @force - should force create post template
    */
    function createPostTemplate(html, force) {
	
	if (force || shouldUpdate) {
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
    }

    /*
     * function appendToPosts
     * --------------------------------
     * Appends home stream data to the fb_posts variable.
     * (This is a callback function)
     *
     * @data - home stream data
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
     * function handleGroupIds
     * ---------------------------------
     * A callback function which handles 
     * a list of group ids. It will then
     * fetch group stream posts.
     *
     *  @data - list of groups
     */
    function handleGroupIds(data) {
	for (i = 0; i < data.data.length; i++) {
	    getGroupStream(data.data[i].gid, appendToPosts);
	}
    }
      
    /*
     * function removeTextFromContext
     * ---------------------------------
     * Removes given text from context
     *
     * @text - text to remove
     * @context - context in which text occurs
     */
    function removeTextFromContext(text, context) {
	context = context.replace(text, "");
	return context;
    }

    /*
     * function insertTextAtIndex
     * ---------------------------------
     * Inserts text into index of context
     *
     * @text - text to insert
     * @context - context in which to insert
     * @index - index at which to insert
     */
    function insertTextAtIndex(text, context, index) {
	context = context.substr(0, index) + text + 
	    context.substr(index, context.length);
	return context;
    }

    /*
     * function highlightTextWithinContext
     * ---------------------------------
     * Given a pattern, inserts html that
     * highlights the pattern within context
     *
     * @text - pattern to highlight within context
     * @context - context in which text occurs
     */
    function highlightTextWithinContext(text, context) {

	startTag = '<span class="highlight">';
	endTag = '</span>';		

	first = context.indexOf(text);
	context = insertTextAtIndex(startTag, context, first);

	second = context.indexOf(text) + text.length;
	context = insertTextAtIndex(endTag, context, second);
	
	return context;
    }

    /*
     * function performRegex
     * ----------------------------------
     * Performs regex matching on all posts
     * and adds these posts to the textstab
     * section
     *
     * @pattern - regex pattern to match in posts
     */
      
    function performRegex(pattern) {

	//Clear texts tab
	$("#TextsTab").empty();

	//Create a new regex pattern
	regex = new RegExp(pattern, "mi");

	//Keep track of # of matched posts and the
	//html of these posts
	n_results = 0;
	total_html = "";

	makeNotification("Regexing Facebook Data...");

	//Loop through all posts, using regex to search
	//different parts of the post (such as name, description,
	//story, message, etc)
	for (i = 0; i < posts.length; i++) {	   
	    
	    match = "";
	    didMatch = false;
	    
	    if ((match = regex.exec(posts[i].from.name)) != null) {
		didMatch = true;
		posts[i].from.name = 
		    highlightTextWithinContext(match[0], posts[i].from.name);
	    }
	    else if ((match = regex.exec(posts[i].description)) != null) {
		didMatch = true;
		posts[i].description = 
		    highlightTextWithinContext(match[0], posts[i].description);
	    }
	    else if ((match = regex.exec(posts[i].story)) != null) {
		didMatch = true;

		posts[i].story = 
		    highlightTextWithinContext(match[0], posts[i].story);
	    }
	    else if ((match = regex.exec(posts[i].message)) != null) {
		didMatch = true;
		posts[i].message =
		    highlightTextWithinContext(match[0], posts[i].message);
	    }
	    else if (posts[i].to && 
		     (match = regex.exec(posts[i].to.data[0].name)) != null) {
		didMatch = true;
		posts[i].to.data[0].name = 
		    highlightTextWithinContext(match[0], posts[i].to.data[0].name);
	    }
	    
	    if (didMatch) {
		fragment = Template.Post(posts[i]);
		total_html += fragment;
		n_results++;
	    }
	    
	    //Group the posts together and add them all
	    //at once to the textstab section
	    if (n_results % POST_BATCH_NUM == 0) {
		createPostTemplate(total_html, true);
		total_html = "";
	    }
	}
	
	createPostTemplate(total_html, true);
	makeNotification("Found " + n_results + " results");
    }

    /*
     * function cleanTextsOfHighlight
     * ------------------------------------
     * Loops through all post elements and
     * removes highlight tags from the 
     * category texts.
     */
    function cleanTextsOfHighlight() {
	startTag = '<span class="highlight">';
	endTag = '</span>';	
	
	for (i = 0; i < posts.length; i++) {
	    if (posts[i].description != null) {
		posts[i].description = removeTextFromContext(startTag, posts[i].description);
		posts[i].description = removeTextFromContext(endTag, posts[i].description);
	    }
	    
	    if (posts[i].from.name != null) {
		posts[i].from.name = removeTextFromContext(startTag, posts[i].from.name);
		posts[i].from.name = removeTextFromContext(endTag, posts[i].from.name);
	    }

	    if (posts[i].to != null) {
		posts[i].to.data[0].name = removeTextFromContext(startTag, posts[i].to.data[0].name);
		posts[i].to.data[0].name = removeTextFromContext(endTag, posts[i].to.data[0].name);
	    }
	    
	    if (posts[i].message != null) {
		posts[i].message = removeTextFromContext(startTag, posts[i].message);
		posts[i].message = removeTextFromContext(endTag, posts[i].message);
	    }

	    if (posts[i].story != null) {
		posts[i].story = removeTextFromContext(startTag, posts[i].story);
		posts[i].story = removeTextFromContext(endTag, posts[i].story);
	    }
	}
    }

    function cleanPattern(patt) {
	return patt;
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

		    makeNotification("Loading Facebook Data...");
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
		shouldUpdate = false;
		cleanTextsOfHighlight();
		pattern = cleanPattern($(event.target).val());
		performRegex(pattern);
	    }
	}
    }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
