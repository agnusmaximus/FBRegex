//Hyperlink for facebook fql queries
hyperlink = "https://graph.facebook.com/fql?q=";

/* 
   function makeFBCall
   -----------------------------------------------
   Makes a facebook call given a query and a
   method to handle the response
   
   @call - the query to perform
   @method - the method to handl the response data
*/
window.makeFBCall = function(call, method) {
    accessTokenVal = Meteor.user().services.facebook.accessToken;
    accessToken = "&access_token=" + accessTokenVal;
    query = "";
    
    for (i = 0; i < call.length; i++) {
	if (call[i] == ' ')
	    query = query.concat('+');
	else
	    query = query.concat(call[i]);
    }
    
    query = hyperlink + query + accessToken;

    Meteor.http.get(query, function(err, resp) {
	    method(resp.data);
	});
}

/*
  function getFeedStream
  -----------------------------------------------
  Gets a user's feed stream content and recursively
  calls the response callback to handle paginations of
  stream content

  @id - user's id for home feed
  @method - call back to handle reponse data
 */
window.getFeedStream = function(id, method) {
    url = "https://graph.facebook.com/" + id + 
          "/home?access_token=";
    url += Meteor.user().services.facebook.accessToken;

    Meteor.http.get(url, function(err, resp) {
	    method(resp.data);
	    nextUrl = resp.data.paging.next;
	    window.feedStreamContinue(nextUrl, method);
	});
}


/* 
   function feedStreamContinue
   -----------------------------------------------
   Recursive function that continually calls method
   on further feed stream content

   @url - url of the next pagination of feed stream content
   @method - callback method to handle feed stream data
*/
window.feedStreamContinue = function(url, method) {
    Meteor.http.get(url, function(err, resp) {
	    method(resp.data);

	    if (resp.data.paging != null) {
		nextUrl = resp.data.paging.next;
		feedStreamContinue(nextUrl, method);
	    }
	});
}