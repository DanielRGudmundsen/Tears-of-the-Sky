const API_KEY = '66e7f108454dedaaf041fe29273aa7ee';
const searchForm = document.querySelector('#search-form');
const currentWeather = document.querySelector('#current-weather');
const forecast = document.querySelector('#forecast');

const getCoordinates = async (cityName) => {
  const response = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
  const data = await response.json();

  // Log the data to the console
  console.log(`Coordinates for ${cityName}:`, data);

  return data[0];
};

const getWeatherData = async (lat, lon) => {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`);
  const data = await response.json();

  // Log the data to the console
  console.log(`Weather data for lat=${lat}, lon=${lon}:`, data);

  return data;
};

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Get city name and state code from the form
  const cityName = event.target.elements['city-input'].value;
  const stateCode = event.target.elements['state-select'].value;

  console.log(`Form submitted with city name: ${cityName} and state: ${stateCode}`);
    
  try {
    const coordinates = await getCoordinates(cityName + ',' + stateCode);

    if (!coordinates) {
      console.error('No coordinates found for city:', cityName);
      return;
    }

    const weatherData = await getWeatherData(coordinates.lat, coordinates.lon);
      
    // Clear the previous data
    currentWeather.textContent = '';
    forecast.textContent = '';
  
    // TODO: Display the weather data in your HTML
      
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
});

// TODO: Find an alternative way to get citys longitude and latitude if OpenWeatherMap API is not working. I want to be able to find Oakhurst, CA and its coordinates. Maybe an additional api?

  