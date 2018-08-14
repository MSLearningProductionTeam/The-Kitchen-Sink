<script>
window.onload = function(){

//the following must be done for every tab that will use a hyperlink

//target the specific tab and unbind all events from it
$("a[aria-label='Tab ID goes here']").unbind();
$("a[aria-label='Tab ID goes here']").click(function(){
//replace the below string with the url of the page the tab will open
window.open('url-of-the-page-the-link-will-open');
});

}
</script>
