// Define API keys for OpenWeatherMap and Google
const API_KEY = '66e7f108454dedaaf041fe29273aa7ee';
const GOOGLE_API_KEY = 'AIzaSyAEp8dF9zMb8G4HQ44kNTAgRiCuXmMv2XU'; 

// Identify key elements in the DOM
const searchForm = document.querySelector('#search-form');
const currentWeather = document.querySelector('#current-weather');
const forecast = document.querySelector('#forecast');

// Function to get coordinates using OpenWeatherMap API
const getCoordinates = async (cityName) => {
  const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
  const data = await response.json();

  console.log(`Coordinates for ${cityName}:`, data);

  return data[0];
};

// Function to get coordinates using Google Maps API as a fallback
const getCoordinatesFromGoogle = async (cityName, stateCode) => {
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${cityName},${stateCode}&key=${GOOGLE_API_KEY}`);
  const data = await response.json();

  console.log(`Coordinates for ${cityName}, ${stateCode} from Google:`, data);

  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lon: location.lng
    };
  }

  return null;
};

// Function to get weather data using OpenWeatherMap API
const getWeatherData = async (lat, lon) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  const data = await response.json();

  console.log(`Weather data for lat=${lat}, lon=${lon}:`, data);

  return data;
};

// Event listener for form submission
searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get city name and state code from the form
  const cityName = event.target.elements['city-input'].value;
  const stateCode = event.target.elements['state-select'].value;

  console.log(`Form submitted with city name: ${cityName} and state: ${stateCode}`);
    
  try {
    // Try to get coordinates using OpenWeatherMap API
    let coordinates = await getCoordinates(cityName + ',' + stateCode);

    // If OpenWeatherMap API fails, fall back to Google Maps API
    if (!coordinates) {
      console.log('OpenWeather API failed. Falling back to Google Maps API.');
      coordinates = await getCoordinatesFromGoogle(cityName, stateCode);
    }

    // If both attempts fail, log an error and return
    if (!coordinates) {
      console.error('No coordinates found for city:', cityName);
      return;
    }

    // Get weather data using OpenWeatherMap API
    const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
      
    // Clear the previous data
    currentWeather.textContent = '';
    forecast.textContent = '';
  
    // TODO: Display the weather data in your HTML
      
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
});


  