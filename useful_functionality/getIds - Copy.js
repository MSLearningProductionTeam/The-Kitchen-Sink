var queryString = document.querySelectorAll("[data-query]");
var allIds = [];
for(var i = 0; i < queryString.length; i++){
  var idArray = queryString[i].dataset.query.replace(/\s/g,'').split("ipsmsgdocid:");
  for(var z = 1; z < idArray.length; z++){
    var separator = idArray[z].lastIndexOf("-");
    var idNum =  idArray[z].substring(separator + 1);
    var idNumSeparator = idNum.search(/[^0-9]/g);
    var append = idNumSeparator <= -1 ? idNum : idNum.slice(0,idNumSeparator)
    console.log(append);
    var id = idArray[z].slice(0,separator) + "-" + append;
    allIds.push(id);
  }
}
var newEle = document.createElement("div");
newEle.setAttribute("id","idList");
for(var i = 0; i < allIds.length; i++){
  newEle.innerHTML += allIds[i] + "<br/>";
}
var eleBreak = document.createElement('br');

document.body.appendChild(eleBreak);
document.body.appendChild(newEle);

/*
compressed version of the script above

javascript:for(var queryString=document.querySelectorAll("[data-query]"),allIds=[],i=0;i<queryString.length;i++)for(var idArray=queryString[i].dataset.query.replace(/\s/g,"").split("ipsmsgdocid:"),z=1;z<idArray.length;z++){var separator=idArray[z].lastIndexOf("-"),idNum=idArray[z].substring(separator+1),idNumSeparator=idNum.search(/[^0-9]/g),append=idNumSeparator<=-1?idNum:idNum.slice(0,idNumSeparator);console.log(append);var id=idArray[z].slice(0,separator)+"-"+append;allIds.push(id)}var newEle=document.createElement("div");newEle.setAttribute("id","idList");for(i=0;i<allIds.length;i++)newEle.innerHTML+=allIds[i]+"<br/>";var eleBreak=document.createElement("br");document.body.appendChild(eleBreak),document.body.appendChild(newEle);

*/
