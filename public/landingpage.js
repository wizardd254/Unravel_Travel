let searchBtn = document.querySelector('#search-btn')
let searchBar = document.querySelector('#search-bar-container')
let formBtn = document.querySelector('#login-btn')
let loginForm = document.querySelector('.login-form-container')
let formClose = document.querySelector('#form-close')
let menu = document.querySelector('#menu-bar')
let navbar = document.querySelector('.navbar')

window.onscroll = () => {
  searchBtn.classList.remove('fa-times')
  searchBar.classList.remove('active')
  menu.classList.remove('fa-times')
  navbar.classList.remove('active')
  loginForm.classList.remove('active')
}
menu.addEventListener('click', () => {
  menu.classList.toggle('fa-times')
  navbar.classList.toggle('active')
})
searchBtn.addEventListener('click', () => {
  searchBtn.classList.toggle('fa-times')
  searchBar.classList.toggle('active')
})
formBtn.addEventListener('click', () => {
  loginForm.classList.add('active')
})
formClose.addEventListener('click', () => {
  loginForm.classList.remove('active')
})
let videoBtns = document.querySelectorAll('.vid-btn');

$(document).ready(function () {
  var currentVideoIndex = 0; // Start from the first video (index 0)
  var totalVideos = $(".vid-btn").length;
  var videoInterval;

  function playVideo(index) {
    $(".video-container video").each(function () {
      this.pause();
    });
    $(".video-container video").eq(index).get(0).play();
  }

  $(".vid-btn").click(function () {
    clearInterval(videoInterval);
    var clickedIndex = $(this).index();
    playVideo(clickedIndex);
    currentVideoIndex = clickedIndex;
    startVideoInterval();
  });

  function startVideoInterval() {
    videoInterval = setInterval(function () {
      currentVideoIndex = (currentVideoIndex + 1) % totalVideos; // Increment index, looping back to 0 when it reaches the last index
      playVideo(currentVideoIndex);
    }, 5000); // 5 seconds interval
  }

  startVideoInterval();
});




function openReviewPopup() {
    // Try opening the pop-up window with desired features
    var reviewWindow = window.open('', 'ReviewWindow', 'width=600,height=400,top=100,left=100,resizable=no');
  
    // Check if the window is blocked (modern browsers might not provide .closed property)
    if (!reviewWindow) {
      alert('Pop-ups are blocked. Please allow pop-ups to open the review form.');
      return; // Exit the function if pop-up is blocked
    }
  
    // Focus the new window to make it obvious to the user
    reviewWindow.focus();
  
    // Write the review form content to the pop-up window
    var reviewForm = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Review Form</title><style>body{font-family: Arial, sans-serif;margin: 20px;}</style></head><body>';
    reviewForm += '<h2>Leave a Review</h2>';
    // ... (rest of the review form content remains the same)
    reviewWindow.document.write(reviewForm);
  }
  