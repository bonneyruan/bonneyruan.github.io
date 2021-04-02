var url = window.location.href;
console.log(url);
var id = url.substring(url.lastIndexOf('#') + 1);






window.onload = function() {
  	console.log(id);
	var visibleTicket = document.getElementById(id);
	console.log(visibleTicket);
	console.log("hello");
	visibleTicket.classList.remove("invisible");
	visibleTicket.classList.add("visible");
};