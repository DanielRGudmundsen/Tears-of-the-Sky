// API keys for weather data and Google geocoding
const API_KEY = '66e7f108454dedaaf041fe29273aa7ee';
const GOOGLE_API_KEY = 'AIzaSyAEp8dF9zMb8G4HQ44kNTAgRiCuXmMv2XU'; 

// Hide body initially
$('body').hide();

// Load fonts and show body once they're active
WebFont.load({
  custom: {
    families: ['Triforce', 'BotW Sheikah'],
    urls: ['style.css']
  },
  active: function() {
    // This function will run once the fonts have loaded
    $('body').show();
  }
});

// Initialize search history
let searchHistory = [];

// Wait for the document to fully load before running the code
$(document).ready(function() {
  // Load search history from local storage on page load
  loadSearchHistory();

  // Set up event listeners for the search form
  $('#search-form').on('submit', handleSearchFormSubmit);

  // Attach click event listener to the clear history button
  $(document).on('click', '#clear-history-button', clearSearchHistory);

  // If there's no current weather and forecast data, load most recent city or default to Irvine, CA
  if ($('#current-weather').is(':empty') && $('#forecast').is(':empty')) {
    if (searchHistory.length > 0) {
      // If there is a previous search, load the weather for that city
      searchCity(searchHistory[0]);
    } else {
      // Default city is Irvine, CA
      searchCity({ name: 'Irvine', state: 'CA' });
    }
  }
});

// Function for loading search history from local storage
function loadSearchHistory() {
  const storedHistory = localStorage.getItem('searchHistory');
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
    updateSearchHistoryButtons();
  }
}

// Function for saving search history to local storage
function saveSearchHistory() {
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
}

// Function for updating the buttons that display the search history
function updateSearchHistoryButtons() {
  const searchHistoryContainer = $('#search-history');
  searchHistoryContainer.empty();

  let row;
  for(let i=0; i<searchHistory.length; i++){
    // Create a new row after every third button or for the first button
    if(i % 3 == 0) {
      row = $('<div>').addClass('row');
      searchHistoryContainer.append(row);
    }

    // Create a button for each city in the search history
    const button = $('<button>').addClass('btn btn-block searchHbtn').text(`${searchHistory[i].name}, ${searchHistory[i].state}`);
    button.click(() => searchCity(searchHistory[i]));

    const div = $('<div>').addClass('col-4'); 
    div.append(button);
    row.append(div); 
  }

  // Add the 'Clear Search History' button if we've displayed all buttons and we're at the start of a new row
  if(searchHistory.length < 9 || searchHistory.length % 3 == 0) {
    const div = $('<div>').addClass('col-4'); 
    const clearButton = $('<button>').attr('id', 'clear-history-button').addClass('btn btn-block').text('Clear Search History');
    div.append(clearButton);
    row.append(div);
  }
}

// Add new city to the search history and update the history buttons
function updateSearchHistory(city) {
  searchHistory = searchHistory.filter(c => !(c.name === city.name && c.state === city.state));
  searchHistory.unshift(city);
  searchHistory = searchHistory.slice(0, 30); // Increase maximum search history to 30
  saveSearchHistory();
  updateSearchHistoryButtons();
}

// Clear the search history
function clearSearchHistory() {
  searchHistory = [];
  localStorage.removeItem('searchHistory');
  $('#search-history').empty();
}

// Function to convert temperature from Kelvin to Fahrenheit
function kelvinToFahrenheit(kelvin) {
  return Math.round((kelvin - 273.15) * 9/5 + 32);
}

// Function to format Unix timestamps into human-readable date strings
function getDateString(timestamp) {
  const date = new Date(timestamp * 1000);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const day = date.getDate();
  let suffix = 'th';
  if (day % 10 === 1 && day !== 11) {
    suffix = 'st';
  } else if (day % 10 === 2 && day !== 12) {
    suffix = 'nd';
  } else if (day % 10 === 3 && day !== 13) {
    suffix = 'rd';
  }
  const month = monthNames[date.getMonth()];
  return `${month} ${day}${suffix}`;
}

// Function to fetch coordinates for a given city using Google Geocoding API.
// If the city is already in the search history, it uses the stored coordinates.
// If not, it makes a new request to the API.
async function getCoordinates(city) {
  const existingCity = searchHistory.find(c => c.name === city.name && c.state === city.state);
  if (existingCity) {
    return existingCity.coordinates;
  }
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${city.name}+${city.state}&key=${GOOGLE_API_KEY}`);
  const data = await response.json();
  const coordinates = data.results[0].geometry.location;
  if (coordinates.lng < -180 || coordinates.lng > 180) {
    console.error(`Invalid longitude: ${coordinates.lng}`);
    return;
  }
  return { lat: coordinates.lat, lng: coordinates.lng };  
}

// Function to capitalize every word in a string.
function capitalizeWords(str) {
  return str.replace(/\w\S*/g, function(txt){
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Function to verify if a city and state entered by the user exists and are spelled correctly.
// Uses the Google Geocoding API to validate the user's input.
async function verifyCityState(city, state) {
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${city}+${state}&key=${GOOGLE_API_KEY}`);
    const data = await response.json();
    const googleCityState = data.results[0].formatted_address;

    // Extract city and state from the formatted address
    const googleCity = googleCityState.split(',')[0];
    const googleState = googleCityState.split(',')[1].trim().split(' ')[0];

    // Compare user's input with Google's data (case insensitive)
    if (googleCity.toLowerCase() !== city.toLowerCase() || googleState.toLowerCase() !== state.toLowerCase()) {
      const userConfirmation = confirm(`Did you mean ${googleCity}, ${googleState}?`);
      if (userConfirmation) {
        return { city: googleCity, state: googleState };
      } else {
        alert('Sorry, your city was not found. Please check your spelling and try again.');
        return null;
      }
    } else {
      return { city, state };
    }
  } catch (error) {
    console.error('Error fetching city/state data:', error);
    return null;
  }
}

// Function to fetch weather data for a given city using OpenWeatherMap API.
// It gets the coordinates for the city and then fetches the weather data.
async function getWeather(city) {
  try {
    const coordinates = await getCoordinates(city);
    city.coordinates = coordinates;
    updateSearchHistory(city);
    const apiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${API_KEY}`;
    console.log(`Fetching weather data from: ${apiUrl}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`OpenWeather API request failed: ${response.statusText}`);
      const errorData = await response.json(); // attempt to parse error message from response
      console.error('Error data:', errorData);
      return;
    }
    const data = await response.json();
    console.log(`Received weather data:`, data);
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// Function to display weather information on the page.
// It updates the current weather section and the forecast section.
function displayWeather(weatherData, city) {
  if (!weatherData) {
    console.error('Failed to display weather: weatherData is undefined');
    return;
  }
  
  // Display the current weather
  const currentWeather = weatherData.current;
  const temp = kelvinToFahrenheit(currentWeather.temp);
  const feels_like = kelvinToFahrenheit(currentWeather.feels_like);
  const windSpeedMph = Math.round(currentWeather.wind_speed * 2.237);
  const icon = currentWeather.weather[0].icon;

  $('#current-weather').html(`
    <div>
       <h2 class="cWeather"> <span><img src="http://openweathermap.org/img/w/${icon}.png" alt="Weather icon"></span> Current Weather for ${city.name}, ${city.state} <span><img src="http://openweathermap.org/img/w/${icon}.png" alt="Weather icon"></span></h2>
    </div>
    <p class="cWeather-data">Temperature: ${temp}°F</p>
    <p class="cWeather-data">Feels Like: ${feels_like}°F</p>
    <p class="cWeather-data">Humidity: ${currentWeather.humidity}</p>
    <p class="cWeather-data">Wind Speed: ${windSpeedMph} mph</p>
  `);
  
  // Display the forecast for the next 5 days
  const forecast = weatherData.daily.slice(1, 6);
  const forecastContainer = $('#forecast');
  forecastContainer.empty();
  forecast.forEach(day => {
    const temp = kelvinToFahrenheit(day.temp.day);
    const feels_like = kelvinToFahrenheit(day.temp.day);
    const windSpeedMph = Math.round(day.wind_speed * 2.237);
    const icon = day.weather[0].icon;

    forecastContainer.append(`
      <div class="day col-lg col-md col-sm mb-3">
        <div class="day-item p-3">
          <div>
            <h3 class="pWeather">${getDateString(day.dt)} <span><img src="http://openweathermap.org/img/w/${icon}.png" alt="Weather icon"></span></h3>
          </div>
          <p class="pWeatherdetails">Temperature: ${temp}°F</p>
          <p class="pWeatherdetails">Feels Like: ${feels_like}°F</p>
          <p class="pWeatherdetails">Humidity: ${day.humidity}</p>
          <p class="pWeatherdetails">Wind Speed: ${windSpeedMph} mph</p>
        </div>
      </div>
    `);
  });
}

// Function to handle the form submission.
// It fetches the city and state entered by the user, validates them, gets the weather, and displays it.
async function handleSearchFormSubmit(event) {
  event.preventDefault();
  let cityName = $('#city-input').val().trim();
  const stateName = $('#state-select').val();
  if (!cityName || !stateName || stateName === 'Choose state...') return;
  cityName = capitalizeWords(cityName);

  const verifiedCityState = await verifyCityState(cityName, stateName);
  if (!verifiedCityState) return;  // Don't proceed if city/state verification failed

  const city = { name: verifiedCityState.city, state: verifiedCityState.state };
  const weatherData = await getWeather(city);
  displayWeather(weatherData, city); // pass city object
}

// Function to search weather for a given city.
// It validates the city, gets the weather, and displays it.
async function searchCity(city) {
  const verifiedCityState = await verifyCityState(city.name, city.state);
  if (!verifiedCityState) return;  // Don't proceed if city/state verification failed

  city = { name: verifiedCityState.city, state: verifiedCityState.state };
  const weatherData = await getWeather(city);
  displayWeather(weatherData, city); // pass city object
}