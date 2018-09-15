//common variables and functions shared across all form pages

//global variables
//absolute site collection url
var siteUrl = typeof _spPageContextInfo !== 'undefined' ? _spPageContextInfo.webAbsoluteUrl : "page content not defined";
//array of days in the week
var daysOfTheWeek = daysOfTheWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
//array of the months in the year
var monthsOfTheYear = monthsOfTheYear = ["January","February","March","April","May","June","July","August","September","October","November","December"];
//array of possible values for the footer banner
var footerValues;

//gets the current user's sharepoint profile info
function getUser(){
  return $.ajax({
        url: siteUrl + "/_api/web/currentUser",
        Type:'GET',
        headers: {
          accept: "application/json;odata=verbose"
        }
    });
  }

//get a new digest value for the Form
//the digest value prevents the same form submission from being applied multiple times
function getFormDigest() {
    return $.ajax({
        url: siteUrl + "/_api/contextinfo",
        method: "POST",
        headers: { "Accept": "application/json; odata=verbose" },
        success: function(data){
          console.log("Obtained new form digest " +data.d.GetContextWebInformation.FormDigestValue);
        }
    });
}

//gets the SP list type
//used when making an api request
function getListType(){
  return $.ajax({
    url: siteUrl + "/_api/web/lists/getbytitle('WDGIntakeForm')/items",
    Type:'GET',
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data){
      console.log("Obtained list type: "+data);
    }
  });
}

//sets the date and time string that is appended to the top banner
function setDateAndTime(userName){
  //make a new date object
  var date = new Date();
  //get the day of the week
  var weekDay = daysOfTheWeek[date.getDay()];
  //get the month
  var month = monthsOfTheYear[date.getMonth()];
  //get the day
  var day = date.getDate();
  //get the year
  var year = date.getFullYear();
  //get the minute
  //if the minute returned is less then 10 add a 0 to it so that it maintains the double digit format
  var minute = date.getMinutes() < 10 ? "0"+date.getMinutes() : date.getMinutes();
  //get the second
  var second = date.getSeconds() < 10 ? "0"+date.getSeconds() : date.getSeconds();
  //get the hour
  //since the hour is returned in 24 format, reformat the time
  var time = date.getHours() >= 0 && date.getHours() <= 11 ?
   ((date.getHours() + 11) % 12 + 1 )+":"+minute+":"+second+" AM" : ((date.getHours() + 11) % 12 + 1 )+":"+minute+":"+second+" PM" ;
   //combine all variables into a single string
  var dateTimeString = weekDay + ", " + month + " " + day + ", " + year + " | " + time + " " +  userName;
  //add the string to the banner
  $("#formDateTime").html(dateTimeString);
}
