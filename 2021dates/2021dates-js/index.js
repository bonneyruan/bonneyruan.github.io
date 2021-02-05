
//remove hash from url
// history.pushState("", document.title, window.location.pathname + window.location.search);



var giftsNames = ['Mystery', 'Dolo', 'Brick', 'Wonderland', 'Trapped', 'Cronch', 'Bean', 'Dino', 'Fresh'];

var i;
var giftsNumber = giftsNames.length;
var test = ['mysterybubbles'];

var animationContainers = [];
for (var i = 0; i < giftsNumber; ++i) {
	//animationContainers holds IDs to all the divs I wan't the animation in
	animationContainers[i] = "lottie" + i;

	//change to giftsNames[i] + '.svg' 
	//maybe put them in a folder
	createGift(giftsNames[i], animationContainers[i], test[0] + '.svg');

	let tempLottie = document.getElementById(animationContainers[i]);

	let tempAnimation = bodymovin.loadAnimation({
			container: tempLottie,
			renderer: 'svg',
			loop: false,
			autoplay: false,
			path: '2021dates/2021dates-js/giftboxanimation.json'
	});
	  tempLottie.addEventListener('mouseenter', (e) => {
	  tempAnimation.goToAndPlay(0);
	});

	//make home animations clickable
	let gifts = document.getElementsByClassName("gift-container");
	gifts[i].addEventListener("click", hints.bind(null, i));


	//   tempLottie.addEventListener('mouseleave', (e) => {
	//   tempAnimation.stop();
	// });
}


function goHome() {
	location.href = "2021dates.html";
}

function goToGiftPage(giftName) {
	// location.href = giftName + ".html#mystery" ;
	location.href = "memories.html";
}

function hints (chosenGift) {
	// location.href = pageName + ".html";
	// location.href = "giftCarousel.html";
	$("body").empty();
	$("body").addClass("giftCarouselBody");
	let carouselBackground = document.getElementsByClassName("giftCarouselBody");
	$(carouselBackground).toggleClass("carouselBackgroundTransition");

	loadCarousel(carouselBackground, chosenGift);
	
}

function loadCarousel (carouselBackground, chosenGift) {
	
	//logo container section 
	let logoContainerSection = document.createElement("section");
		logoContainerSection.classList.add("logo-container");
		logoContainerSection.classList.add("carousel-logo");
	//logo div 
	let logoDiv = document.createElement("div");
		logoDiv.classList.add("logo");
	//logo div image
	let logoDivImg = document.createElement("img");
		logoDivImg.src = "2021dates/images/datesLogo.svg";

	logoDiv.appendChild(logoDivImg);
	logoContainerSection.appendChild(logoDiv);
	carouselBackground[0].appendChild(logoContainerSection);

	//carousel section 
	let carouselSection = document.createElement("section");
	let carouselDiv = document.createElement("div");
		carouselDiv.classList.add("carousel");
	carouselSection.appendChild(carouselDiv);
	carouselBackground[0].appendChild(carouselSection);

	for (var i = 0; i < giftsNumber; ++i) {
		let carouselCellDiv = document.createElement("div");
			carouselCellDiv.classList.add("carousel-cell");
		let carouselContentsContainerDiv = document.createElement("div");
			carouselContentsContainerDiv.classList.add("carousel-contents-container");
		let carouselContentsDiv = document.createElement("div");
			carouselContentsDiv.classList.add("carousel-contents");
		let carouselAnimation = document.createElement("img");
			carouselAnimation.src = "2021dates/images/giftbox.svg";
			carouselAnimation.classList.add("carousel-animation");
			carouselAnimation.classList.add("animate__animated");
			carouselAnimation.classList.add("animate__fadeInDown");
			carouselAnimation.classList.add("animate__fast");

		carouselContentsDiv.appendChild(carouselAnimation);
		carouselContentsContainerDiv.appendChild(carouselContentsDiv);
		carouselCellDiv.appendChild(carouselContentsContainerDiv);
		carouselDiv.appendChild(carouselCellDiv);

	}
	initializeFlickity();

	//carousel description section

	let carouselDescriptionSection = document.createElement("section");
	let carouselDescriptionDiv = document.createElement("div");
		carouselDescriptionDiv.classList.add("carousel-description");
		carouselDescriptionDiv.classList.add("animate__animated");
		carouselDescriptionDiv.classList.add("animate__fadeIn");
		carouselDescriptionDiv.classList.add("animate__delay-1s");
	let carouselDescriptionH2 = document.createElement("h2");
		carouselDescriptionH2.classList.add("carousel-text");
	let carouselDescriptionText = document.createTextNode(giftsNames[chosenGift]);
	let carouselDescriptionBubbles = document.createElement("img");
		carouselDescriptionBubbles.classList.add("carousel-bubbles");
		carouselDescriptionBubbles.src = "2021dates/images/mysterybubbles.svg";

	carouselDescriptionH2.appendChild(carouselDescriptionText);
	carouselDescriptionDiv.appendChild(carouselDescriptionH2);
	carouselDescriptionDiv.appendChild(carouselDescriptionBubbles);
	carouselDescriptionSection.appendChild(carouselDescriptionDiv);

	carouselBackground[0].appendChild(carouselDescriptionSection);
	var giftIndex = chosenGift;
	var carouselGiftPreviousButton = document.getElementsByClassName("previous");
	var carouselGiftNextButton = document.getElementsByClassName("next");

	// $(carouselGiftPreviousButton).addClass("animate__animated animate__slideInLeft animate__delay-0.5s");
	// $(carouselGiftNextButton).addClass("animate__animated animate__slideInRight animate__delay-0.5s");
	$(carouselGiftPreviousButton).addClass("animate__animated animate__fadeInLeft animate__delay-1s");
	$(carouselGiftNextButton).addClass("animate__animated animate__fadeInRight animate__delay-1s");
	carouselGiftPreviousButton[0].addEventListener("click", changeGift.bind(null, -1));
	carouselGiftNextButton[0].addEventListener("click", changeGift.bind(null, 1));

	//make all cell animations clickable to go to corresponding pages
	let carouselAnimationsArray = document.getElementsByClassName("carousel-animation");
	for (var i = 0; i < giftsNumber; ++i){
		carouselAnimationsArray[i].addEventListener("click", goToGiftPage.bind(null, giftsNames[(i+giftIndex)%giftsNames.length]));
	}

	//logo clickable
	let logo = document.getElementsByClassName("logo")[0];
	logo.addEventListener("click", function() {
		goHome();
	});

	function changeGift (direction) {
		let carouselGiftName = document.getElementsByClassName("carousel-text");
		let carouselGiftBubbles = document.getElementsByClassName("carousel-bubbles")
		// $(carouselGiftName).fadeOut(0);
		// $(carouselGiftBubbles).fadeOut(0);

		giftIndex += direction; 
		if (giftIndex == giftsNames.length) {
			giftIndex = 0;
		}
		else if (giftIndex == -1){
			giftIndex = giftsNames.length - 1;
		}
		let newCarouselGiftName = giftsNames[giftIndex];

		carouselGiftName[0].innerHTML = newCarouselGiftName;
		// $(carouselGiftName).fadeIn(200);
		// $(carouselGiftBubbles).fadeIn(200);
	}

}

function initializeFlickity () {
	$('.carousel').flickity ({
		wrapAround: true,
		selectedAttraction: 0.03,
		friction: 0.4
	});
}
function createGift (name, animationID, bubbleImage) {

	//gift-container div
	let giftContainerDiv = document.createElement("div");
		giftContainerDiv.classList.add("gift-container");
	//gift-name-container div
	let giftNameContainerDiv = document.createElement("div");
		giftNameContainerDiv.classList.add("gift-name-container");
	//h2
	let giftNameH2 = document.createElement("h2");
		giftNameH2.classList.add("gift-name");
	//text
	let giftNameText = document.createTextNode(name);
	//gift-image div 
	let giftImageDiv = document.createElement("div");
		giftImageDiv.classList.add("gift-image");
		giftImageDiv.setAttribute('id', animationID);
	//bubbles-container div 
	let bubblesContainerDiv = document.createElement("div");
		bubblesContainerDiv.classList.add("bubbles-container");
	//bubbles image
	let image = document.createElement("img");
		image.classList.add("bubbles-image");
		image.src = bubbleImage;


	// giftNameH2.appendChild(giftNameText);
	// giftNameContainerDiv.appendChild(giftNameH2);

	bubblesContainerDiv.appendChild(image);


	// giftContainerDiv.appendChild(giftNameContainerDiv);
	giftContainerDiv.appendChild(giftImageDiv);
	// giftContainerDiv.appendChild(bubblesContainerDiv);

	const giftsSection = document.getElementById("gifts-section");
	giftsSection.appendChild(giftContainerDiv);
}

// animation.addEventListener('complete', function(){   
//     window.location.href = 'https://www.dribbble.com/chrsalctra'; 
// });


