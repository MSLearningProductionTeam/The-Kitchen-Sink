//call the initalize function
window.onload = initEditListView;

//initialization function
function initEditListView(){
  footerValues = [
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (add new content)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (update existing content)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (remove content)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (request multiple items)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (do something not listed here)"
  ];
  //start the program by getting the current user
  getUser().done(function(data){
    //set the date and time in the top banner
    setDateAndTime(data.d.Title);
    //get user list items
    //the query string to specify what items are returned for the user's list items
    var query = "?$select=ID,RequestType1,Title,Created,TimeStamp,RequestDetails,Attachments,SourceFileLocation,ShortDescription,Confidentiality,ProductGroup,Comments,Details,DocumentTitle,FileName,PageTitle,RequestTypeTitle,Owner,CoOwner,PublishDate,PageURL,deleteContent,Request_x0020_State&$orderby=ID%20desc&$filter=RequestType1 ne 'Update Existing Ticket' and Request_x0020_State ne 'Completed' and Request_x0020_State ne 'Rejected'and AuthorId eq "+data.d.Id+"";
    getUserListItems(query).done(function(data){
      //if no items were returned add text to the list that says the user has no items
      if(data.d.results.length <= 0){
        var htmlString = "<div style='text-align:center;'>You have no open tickets</div>";
        $("#ticketList").append(htmlString);
      }
      else{
        //otherwise loop through the returned results and add each to the listItems array
        $.each(data.d.results,function(i,val){
          //add each list item to the global object
          listItems.push(this);
          //add each list item to the screen
          var htmlString = "<div class='ticket' data-ticketNum='"+i+"' data-requestType='"+this.RequestType1+"' data-listId='"+this.ID+"'><div class='ticketCell'><div class='editBtn'>"+this.ID+"</div></div><div class='ticketCell'><div>"+this.Request_x0020_State+"</div></div><div class='ticketCell'><div>"+this.RequestType1+"</div></div><div class='ticketCell'><div>"+this.Title+"</div></div><div class='ticketCell'><div>"+this.Created.substring(0,10)+"</div></div>";
          $("#ticketList").append(htmlString);
        });
        //attach the needed events
        attachEvents();
      }
    });
  });
}

//attachs all the events the program needs to function
function attachEvents(){
  //the click even on each list item edit button
  $(".editBtn").on("click",function(){
    //the id of the list item on sharepoint
    currentEditItemId = $(this).parent().parent().attr("data-listId");
    //the number of the ticket clicked on, specified in the html
    //this number cooresponds to the tickets position in the listItems array
    var ticketNum = $(this).parent().parent().attr("data-ticketNum");
    //show the edit item view
      showEditView(ticketNum,listItems);
  });
  //submit button click event
  $("#addBtn").on("click",function(){
    //submit the information provied to the sharepoint list
    submitChangeRequest(currentEditItemId);
  });
  //go back button click event
  $("#cancelBtn").on("click",function(){
    //cloes the edit view
    closeForm();
  });
  //new request click event
  $("#newRequestBtn").on("click",function(){
    //redirects back to the intake form page
    window.location = "https://microsoft.sharepoint.com/sites/Infopedia_G02Pages/WDG-Intake-Form-POC.aspx";
  });
}
