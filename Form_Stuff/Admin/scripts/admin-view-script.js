//call the initalize function
window.onload = initAdminView();

//initialization function
function initAdminView(){
  footerValues = [
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (add new content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (update existing content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (remove content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (request multiple items) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (do something not listed here) (Change Request)"
  ];
  //start the program by getting the current user
  getUser().done(function(data){
    //set the date and time in the top banner
    setDateAndTime(data.d.Title);
    //get user list items
    //the query string to specify what items are returned for the user's list items
    var query = "?$select=ID,RequestType1,Title,Created,TimeStamp,RequestDetails,Attachments,SourceFileLocation,ShortDescription,Confidentiality,ProductGroup,Comments,Details,DocumentTitle,FileName,PageTitle,RequestTypeTitle,Owner,CoOwner,PublishDate,PageURL,Request_x0020_State,deleteContent,VSO_ID,Author/Title&$expand=Author/Title&$orderby=ID%20desc";
    getUserListItems(query).done(function(data){
      console.log(data);
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
          //calculate which page class the list item should get
          //the number of list items that should be displayed on each page
          var numPerPage = 10;
          var pageNum = Math.floor(1+(i * (1/numPerPage)));
          //add each list item to the screen
          var htmlString = "<div class='ticket hidden' data-pageNum='"+pageNum+"' data-ticketNum='"+i+"' data-requestType='"+this.RequestType1+"' data-listId='"+this.ID+"'><div><div class='editBtn'>...</div></div><div>"+this.ID+"</div><div>"+this.VSO_ID+"</div><div>"+this.RequestType1+"</div><div>"+this.Created.substring(0,10)+"</div><div>"+this.Author.Title+"</div><div>"+this.Request_x0020_State+"</div><div>"+this.Comments+"</div>";
          $("#adminTicketList").append(htmlString);
        });
        //show the first page of results
        $(".ticket[data-pageNum='1']").removeClass('hidden');
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
    window.location = "https://microsoft.sharepoint.com/sites/Infopedia_G02/Pages/WDG-Intake-Form-POC.aspx";
  });

  $("#nextPageBtn").on("click",function(){
    //get the current page being displayed
    var currPageNum = parseInt( $(".ticket:visible").attr("data-pageNum"));
    //if the next page of results is not empty, show that page
    if($(".ticket[data-pageNum='"+(currPageNum+1)+"'").length !== 0){
      $(".ticket").addClass("hidden");
      $(".ticket[data-pageNum='"+(currPageNum+1)+"'").removeClass("hidden");
    }
  });

  $("#prevPageBtn").on("click",function(){
    //get the current page being displayed
    var currPageNum = parseInt( $(".ticket:visible").attr("data-pageNum"));
    //if the current page is not the first, show the previous page
    if(currPageNum !== 1){
      $(".ticket").addClass("hidden");
      $(".ticket[data-pageNum='"+(currPageNum-1)+"'").removeClass("hidden");
    }
  });
}
