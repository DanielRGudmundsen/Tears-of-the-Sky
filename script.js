// API keys for OpenWeather and Google Geocoding
const API_KEY = '66e7f108454dedaaf041fe29273aa7ee';
const GOOGLE_API_KEY = 'AIzaSyAEp8dF9zMb8G4HQ44kNTAgRiCuXmMv2XU'; 

// Initialize search history
let searchHistory = [];

// Function to update search history
const updateSearchHistory = (cityName) => {
  // Check if city is already in search history and remove it if found
  const existingIndex = searchHistory.indexOf(cityName);
  if (existingIndex > -1) {
    searchHistory.splice(existingIndex, 1);
  }

  // Add the city at the front of search history
  searchHistory.unshift(cityName);

  // Limit search history to the last 6 items
  searchHistory = searchHistory.slice(0, 6);

  // Save the updated search history in local storage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));

  // Update Search History in UI
  $('#search-history').empty(); // Clear old search history buttons
  // Create and append new buttons for each city in search history
  for (let i = 0; i < searchHistory.length; i++) {
    const button = $('<button>');
    button.text(searchHistory[i]);
    button.click(() => {
      // Search again when search history button is clicked
      const cityName = button.text();
      searchCity(cityName);
    });
    $('#search-history').append(button);
  }
};

// Load search history from local storage when page is loaded
$(document).ready(() => {
  const savedSearchHistory = localStorage.getItem('searchHistory');
  if (savedSearchHistory) {
    searchHistory = JSON.parse(savedSearchHistory);
    // Update the search history in the UI
    for (let i = 0; i < searchHistory.length; i++) {
      const button = $('<button>');
      button.text(searchHistory[i]);
      button.click(() => {
        // Search again when search history button is clicked
        const cityName = button.text();
        searchCity(cityName);
      });
      $('#search-history').append(button);
    }
  }
});

// Function to convert temperature from Kelvin to Fahrenheit
const kelvinToFahrenheit = (kelvin) => {
  return ((kelvin - 273.15) * 9/5 + 32).toFixed(2);
}

// Function to convert Unix timestamp to human-readable date string
const getDateString = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Fetch city coordinates from Google Geocoding API
const getCoordinates = async (cityName, stateCode) => {
  const data = await $.getJSON(`https://maps.googleapis.com/maps/api/geocode/json?address=${cityName},${stateCode}&key=${GOOGLE_API_KEY}`);
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lon: location.lng
    };
  }
  return null;
};

// Fetch weather forecast data from OpenWeatherMap API
const getWeatherData = async (lat, lon) => {
  return await $.getJSON(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
}

// Search weather data for a given city
const searchCity = async (cityName, stateCode) => {
  // Get coordinates from Google Geocoding
  const coordinates = await getCoordinates(cityName, stateCode);

  // Get the weather data using the coordinates
  const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);

  // Update the search history
  updateSearchHistory(cityName);

  // Display the weather data in the UI
  displayCurrentWeather(weatherData);
  displayForecast(weatherData);
}

// Function to display the current weather data in the UI
const displayCurrentWeather = (weatherData) => {
  // Clear old data
  $('#current-weather').empty();
  
  // Convert temperatures from Kelvin to Fahrenheit
  const temp = kelvinToFahrenheit(weatherData.current.temp);
  const feels_like = kelvinToFahrenheit(weatherData.current.feels_like);

  // Convert Unix timestamp to date string
  const dateString = getDateString(weatherData.current.dt);

  // Append new data
  $('#current-weather').append(`
    <h2>Current Weather</h2>
    <p>Temperature: ${temp}°F</p>
    <p>Feels Like: ${feels_like}°F</p>
    <p>Humidity: ${weatherData.current.humidity}%</p>
    <p>Date: ${dateString}</p>
  `);
}

// Function to display the forecast data in the UI
const displayForecast = (weatherData) => {
  // Clear old data
  $('#forecast').empty();

  // Append new data
  for (let i = 1; i <= 5; i++) {
    // Convert temperatures from Kelvin to Fahrenheit
    const temp = kelvinToFahrenheit(weatherData.daily[i].temp.day);
    const feels_like = kelvinToFahrenheit(weatherData.daily[i].feels_like.day);

    // Convert Unix timestamp to date string
    const dateString = getDateString(weatherData.daily[i].dt);

    $('#forecast').append(`
      <div class="day">
        <h3>Day ${i}</h3>
        <p>Temperature: ${temp}°F</p>
        <p>Feels Like: ${feels_like}°F</p>
        <p>Humidity: ${weatherData.daily[i].humidity}%</p>
        <p>Date: ${dateString}</p>
      </div>
    `);
  }
}

// Set up event listener for the search form
$('#search-form').on('submit', (event) => {
  event.preventDefault();

  // Get city and state from the form
  const cityName = $('#city').val();
  const stateCode = $('#state').val();

  // Search for the weather data
  searchCity(cityName, stateCode);
});
