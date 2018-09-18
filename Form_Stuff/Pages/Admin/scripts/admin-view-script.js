//globals
var productGroupToggleValues;
var stateToggleValues;
var currentPage;


//call the initalize function
window.onload = initAdminView;

//initialization function
function initAdminView(){
  footerValues = [
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (add new content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (update existing content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (remove content) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (request multiple items) (Change Request)",
    "New /Learning Publishing Request: Windows Devices Group - Publishing Request (do something not listed here) (Change Request)"
  ];

  productGroupToggleValues =  ["Windows","Devices"];
  stateToggleValues = ["New","In-Progress","Completed"];
  currentPage = 1;
  //start the program by getting the current user
  getUser().done(function(data){
    //set the date and time in the top banner
    setDateAndTime(data.d.Title);
    //get user list items
    //the query string to specify what items are returned for the user's list items
    var query = "?$select=ID,RequestType1,Title,Created,TimeStamp,RequestDetails,Attachments,SourceFileLocation,ShortDescription,Confidentiality,ProductGroup,Comments,Details,DocumentTitle,FileName,PageTitle,RequestTypeTitle,Owner,CoOwner,PublishDate,PageURL,Request_x0020_State,deleteContent,field18,VSO_ID,Author/Title&$expand=Author/Title&$orderby=ID%20desc&$filter=Request_x0020_State ne 'Rejected' and Request_x0020_State ne 'Cancelled' and Request_x0020_State ne 'Waiting for Customer Info'";
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
          var numPerPage = 15;
          var pageNum = Math.floor(1+(i * (1/numPerPage)));
          //add each list item to the screen
          var htmlString = "<div class='ticket hidden filtered' data-group='"+this.ProductGroup+"' data-state='"+this.Request_x0020_State+"' data-ticketNum='"+i+"' data-requestType='"+this.RequestType1+"' data-listId='"+this.ID+"'><div class='ticketCell'><div class='editBtn'>"+this.ID+"</div></div><div class='ticketCell'>"+this.Request_x0020_State+"</div><div class='ticketCell'>"+this.VSO_ID+"</div><div class='ticketCell'>"+this.RequestType1+"</div><div class='ticketCell'>"+this.PublishDate+"</div><div class='ticketCell'>"+this.Created.substring(0,10)+"</div><div class='ticketCell'>"+this.Author.Title+"</div><div class='ticketCell'>"+this.field18+"</div>";
          $("#adminTicketList").append(htmlString);
        });
        //show the first page of results
        $(".ticket").slice(0,15).removeClass('hidden');

        getTotals();
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

  $("#productGroupToggle").on("click",function(){
      //update the toggle button with the value being shown
      $("#productGroupToggle").html(productGroupToggleValues[0]);
      $("#productGroupToggle").val(productGroupToggleValues[0]);
      rendertListView();
      //place the current product group value at the end of the array
      productGroupToggleValues.push(productGroupToggleValues.splice(0, 1)[0]);

  });

  $("#stateToggle").on("click",function(){
    //update the toggle button with the value being shown
    $("#stateToggle").html(stateToggleValues[0]);
    $("#stateToggle").val(stateToggleValues[0]);
    rendertListView();
    //place the current product group value at the end of the array
    stateToggleValues.push(stateToggleValues.splice(0, 1)[0]);
  });

  $("#nextPageBtn").on("click",function(){
      //if the next page has list items to view
      if($(".ticket.filtered").slice(((currentPage + 1) * 15) - 15,((currentPage + 1) * 15)).length != 0){
        //increase the current page by one
        currentPage += 1;
        //hide all items
        $(".ticket").addClass("hidden");
        //show the next 15 list items
        $(".ticket.filtered").slice((currentPage * 15) - 15,(currentPage * 15)).removeClass("hidden");
      }
  });

  $("#prevPageBtn").on("click",function(){
    //if not navigating beyond the first page, show the previous 15 list items
    if(currentPage - 1 != 0){
      currentPage -= 1;
      $(".ticket").addClass("hidden");
      $(".ticket.filtered").slice((currentPage * 15) - 15,(currentPage * 15)).removeClass("hidden");
    }
  });
}
//changes which list items are shown based on the state of the product group and state toggle buttons
function rendertListView(){
  //get the current value of the product group toggle and the state toggle buttons
  //if the value has not been set it shold be blank
  var groupSort = $("#productGroupToggle").val() !== "" ? "[data-group='"+$("#productGroupToggle").val() +"']" : "" ;
  var stateSort = $("#stateToggle").val() !== "" ? "[data-state='"+$("#stateToggle").val() +"']" : "" ;
  //add the filtered class to the tickets that meet the filtered criteria
  $(".ticket").removeClass('filtered');
  $(".ticket" + groupSort + stateSort).addClass('filtered');
  //show the first page of filtered tickets
  $(".ticket").addClass("hidden");
  $(".ticket.filtered").slice(0,15).removeClass("hidden");

  //reset the current page
  currentPage = 0;
}

function getTotals(){
  var totalItems = $(".ticket").length;
  var newItems = $(".ticket[data-state='New']").length;
  var progressItems = $(".ticket[data-state='In-Progress']").length;
  var completedItems = $(".ticket[data-state='Completed']").length;
  $("#totalItems").html("Total: "+ totalItems);
  $("#newItems").html("New: "+ newItems);
  $("#inProgressItems").html("In-Progress: "+ progressItems);
  $("#completedItems").html("Completed: "+ completedItems);
}
