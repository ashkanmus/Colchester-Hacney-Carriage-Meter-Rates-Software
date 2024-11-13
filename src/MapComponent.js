import React, { useState, useRef, useMemo } from 'react';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import mapStyle from './styles/mapStyle';
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

//Map
const MapComponent = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [key, setKey] = useState(Date.now());
  const [rates, setRates] = useState({ rate1: 0, rate2: 0, rate3: 0 });

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const containerStyle = {
    width: '100%',
    height: '100vh',
  };

  const center = useMemo(() => ({
    lat: 51.8893, // Colchester Latitude
    lng: 0.9042,  // Colchester Longitude
  }), []);

  const zoom = 12;

  const handleDirectionsCallback = (response) => {
    if (response.status === 'OK') {
      setDirectionsResponse(response);
      const leg = response.routes[0].legs[0];
      setDistance(leg.distance.text);
      setDuration(leg.duration.text);

      const distanceInMeters = leg.distance.value;
      const durationInMinutes = leg.duration.value / 60;

      setRates({
        rate1: calculateRate1(distanceInMeters, durationInMinutes),
        rate2: calculateRate2(distanceInMeters, durationInMinutes),
        rate3: calculateRate3(distanceInMeters, durationInMinutes),
      });
    } else {
      console.error("Error fetching directions: ", response.status);
      alert("There was an error fetching directions. Please try again.");
    }
    setIsProcessing(false);
  };

  const handleProcessJourney = () => {
    if (origin && destination) {
      setIsProcessing(true);
      setDirectionsResponse(null);
      setDistance('');
      setDuration('');
      setKey(Date.now()); // Reset the map
    } else {
      alert("Please enter both origin and destination.");
    }
  };

  // Set predefined pick-up points
  const setPredefinedAddress = (address) => {
    setOrigin(address);
  };

  // Get the user's current location and set it as the origin
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const geocoder = new window.google.maps.Geocoder();
          const latLng = new window.google.maps.LatLng(latitude, longitude);
          geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setOrigin(results[0].formatted_address);
            } else {
              alert('Unable to retrieve your location.');
            }
          });
        },
        () => {
          alert('Geolocation failed. Please enable location access.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']}>
      <div style={{ position: 'relative' }}>
        <GoogleMap
          key={key}
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={{
            styles: mapStyle,
            disableDefaultUI: true,
          }}
        >
          {isProcessing && origin && destination && (
            <DirectionsService
              options={{
                origin,
                destination,
                travelMode: 'DRIVING',
              }}
              callback={handleDirectionsCallback}
            />
          )}

          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{ suppressMarkers: true }}
            />
          )}
        </GoogleMap>

        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '25px',
            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            width: '80%',
            maxWidth: '700px',
            zIndex: 10,
          }}
        >
          {/* <h1 className='title'>Colchester Hackney Meter Rates</h1> */}
          <div>
            {/* Origin Input with Autocomplete */}
            <Autocomplete
              fields={['address_components', 'geometry', 'name']}
              componentRestrictions={{ country: 'GB' }}
            >
              <input
                type="text"
                placeholder="Enter pick-up point"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                ref={originRef}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '10px 0',
                  borderRadius: '5px',
                  boxSizing: 'border-box',
                }}
              />
              
            </Autocomplete>
            
            {/* Predefined Pick-Up Buttons */}
            <div style={{ margin: '10px 0', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button className='btn' onClick={() => setPredefinedAddress('35/37 High St, Colchester CO1 1DH')}>
                Town
              </button>
              <button className='btn' onClick={() => setPredefinedAddress('Station Wy, Colchester CO1 1UZ')}>
                Station
              </button>
              <button className='btn' onClick={getCurrentLocation}>
              <svg xmlns="http://www.w3.org/2000/svg"   viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokelinecap="round" strokelinejoin="round" width={20} height={20}  strokeWidth={2}> <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path> <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path> </svg> 
              </button>
            </div>

            {/* Destination Input with Autocomplete */}
            <Autocomplete
              fields={['address_components', 'geometry', 'name']}
              componentRestrictions={{ country: 'GB' }}
            >
              <input
                type="text"
                placeholder="Enter drop-off point"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                ref={destinationRef}
                style={{
                  width: '100%',
                  padding: '8px',
                  margin: '10px 0',
                  borderRadius: '5px',
                  boxSizing: 'border-box',
                }}
              />
            </Autocomplete>

            {/* Process Journey Button */}
            
            <button
              onClick={handleProcessJourney}
              disabled={isProcessing}
              style={{
                padding: '10px 20px',
                margin: '10px 0',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                width: '100%',
                borderRadius: '5px',
                color: 'white',
                backgroundColor : '#232531',
                boxSizing: 'border-box',
              }}
            >
              {isProcessing ? "Processing..." : "Calculate Fare"}
            </button>
          </div>

          {/* Display Distance, Duration, and Rates */}
          {distance && duration && (
            <div>
              <ul className='res-l'
              style={{
                listStyleType:'none',
                display: 'flex',
                gap: "10px",
                justifyContent: 'flex-end'
              }}>
                <li> 
                  <svg xmlns="http://www.w3.org/2000/svg"   viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokelinecap="round" strokelinejoin="round" width={24} height={24}  strokeWidth={2}> <path d="M3 11a1 1 0 1 1 -1 1.013a1 1 0 0 1 1 -1v-.013z"></path> <path d="M21 11a1 1 0 1 1 -1 1.013a1 1 0 0 1 1 -1v-.013z"></path> <path d="M8 12h8"></path> <path d="M13 9l3 3l-3 3"></path> </svg> 
                  : 
                  <strong>{distance}</strong> 
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg"   viewBox="0 0 24 24" fill="none" stroke="currentColor"  strokelinecap="round" strokelinejoin="round" width={24} height={24}  strokeWidth={2}> <path d="M12 13m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path> <path d="M12 10l0 3l2 0"></path> <path d="M7 4l-2.75 2"></path> <path d="M17 4l2.75 2"></path> </svg> 
                  : 
                  <strong>{duration}</strong>
                </li>
              </ul>
              <hr></hr>
              <div style={{display: 'flex', justifyContent:'space-evenly'}}>
                <p className='res-p'>Rate 1: <strong>£{rates.rate1.toFixed(2)}</strong></p>
                <p className='res-p'>Rate 2: <strong>£{rates.rate2.toFixed(2)}</strong></p>
                <p className='res-p'>Rate 3: <strong>£{rates.rate3.toFixed(2)}</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{
        color:'gray',
        fontSize: '12px',
        zIndex:'1',
        position: 'absolute',
        right: '2%',
        //transform: 'translateX(-50%)',
        bottom: '1%',
        //left: '50%'
        }}>
          <p>Colchester HC Meter Rates - Developed by Ash M Haghighi</p>
          </div>
    </LoadScript>
  );
};

// Calculate rates
const calculateRate1 = (distanceInMeters, durationInMinutes) => {
  // Distance tiers and costs
  const initialChargeDistance = 183;
  const secondTierDistance = 1597;
  const thirdTierDistance = 3202;

  const initialChargeCost = 4.00;
  const tierCostPerUnit = 0.40;

  // Distances for each tier
  const secondTierUnitDistance = 202;
  const thirdTierUnitDistance = 535;
  const beyondThirdTierUnitDistance = 320;

/*   // Waiting time charge settings
  const waitingTimeChargePerPeriod = 0.40;
  const waitingTimePeriodInSeconds = 65; */

  // Start with the initial charge
  let totalCharge = initialChargeCost;

  if (distanceInMeters > initialChargeDistance) {
      if (distanceInMeters <= secondTierDistance) {
          // Second tier calculation for distances from 183m to 1597m
          const remainingDistance = distanceInMeters - initialChargeDistance;
          const additionalUnits = Math.ceil(remainingDistance / secondTierUnitDistance);
          totalCharge += additionalUnits * tierCostPerUnit;
      } else if (distanceInMeters <= thirdTierDistance) {
          // Third tier calculation for distances from 1597m to 3202m
          const distanceInSecondTier = secondTierDistance - initialChargeDistance;
          const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

          const remainingDistance = distanceInMeters - secondTierDistance;
          const additionalUnitsThirdTier = Math.ceil(remainingDistance / thirdTierUnitDistance);

          totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                      (additionalUnitsThirdTier * tierCostPerUnit);
      } else {
          // Beyond third tier for distances beyond 3202 meters
          const distanceInSecondTier = secondTierDistance - initialChargeDistance;
          const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

          const distanceInThirdTier = thirdTierDistance - secondTierDistance;
          const additionalUnitsThirdTier = Math.ceil(distanceInThirdTier / thirdTierUnitDistance);

          const remainingDistance = distanceInMeters - thirdTierDistance;
          const additionalUnitsBeyondThirdTier = Math.ceil(remainingDistance / beyondThirdTierUnitDistance);

          totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                      (additionalUnitsThirdTier * tierCostPerUnit) +
                      (additionalUnitsBeyondThirdTier * tierCostPerUnit);
      }
  }

  /* // Calculate waiting time charge based on 65-second intervals
  const totalWaitingPeriods = Math.ceil((durationInMinutes * 60) / waitingTimePeriodInSeconds);
  const waitingTimeCharge = totalWaitingPeriods * waitingTimeChargePerPeriod;
  totalCharge += waitingTimeCharge; */

  return totalCharge;
}

const calculateRate2 = (distanceInMeters, durationInMinutes) => {
// Distance tiers and costs
const initialChargeDistance = 183;
const secondTierDistance = 1549;
const thirdTierDistance = 3154;

const initialChargeCost = 5.40;
const tierCostPerUnit = 0.40;

// Distances for each tier
const secondTierUnitDistance = 152;
const thirdTierUnitDistance = 401;
const beyondThirdTierUnitDistance = 240;

/* // Waiting time charge settings
const waitingTimeChargePerPeriod = 0.40;
const waitingTimePeriodInSeconds = 49; */

// Start with the initial charge
let totalCharge = initialChargeCost;

if (distanceInMeters > initialChargeDistance) {
    if (distanceInMeters <= secondTierDistance) {
        // Second tier calculation for distances from 183m to 1597m
        const remainingDistance = distanceInMeters - initialChargeDistance;
        const additionalUnits = Math.ceil(remainingDistance / secondTierUnitDistance);
        totalCharge += additionalUnits * tierCostPerUnit;
    } else if (distanceInMeters <= thirdTierDistance) {
        // Third tier calculation for distances from 1597m to 3202m
        const distanceInSecondTier = secondTierDistance - initialChargeDistance;
        const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

        const remainingDistance = distanceInMeters - secondTierDistance;
        const additionalUnitsThirdTier = Math.ceil(remainingDistance / thirdTierUnitDistance);

        totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                    (additionalUnitsThirdTier * tierCostPerUnit);
    } else {
        // Beyond third tier for distances beyond 3202 meters
        const distanceInSecondTier = secondTierDistance - initialChargeDistance;
        const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

        const distanceInThirdTier = thirdTierDistance - secondTierDistance;
        const additionalUnitsThirdTier = Math.ceil(distanceInThirdTier / thirdTierUnitDistance);

        const remainingDistance = distanceInMeters - thirdTierDistance;
        const additionalUnitsBeyondThirdTier = Math.ceil(remainingDistance / beyondThirdTierUnitDistance);

        totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                    (additionalUnitsThirdTier * tierCostPerUnit) +
                    (additionalUnitsBeyondThirdTier * tierCostPerUnit);
    }
}

/* // Calculate waiting time charge based on 65-second intervals
const totalWaitingPeriods = Math.ceil((durationInMinutes * 60) / waitingTimePeriodInSeconds);
const waitingTimeCharge = totalWaitingPeriods * waitingTimeChargePerPeriod;
totalCharge += waitingTimeCharge; */

return totalCharge;
}

const calculateRate3 = (distanceInMeters, durationInMinutes) => {
   // Distance tiers and costs
  const initialChargeDistance = 183;
  const secondTierDistance = 1591;
  const thirdTierDistance = 3094;

  const initialChargeCost = 7.00;
  const tierCostPerUnit = 0.50;

   // Distances for each tier
  const secondTierUnitDistance = 141;
  const thirdTierUnitDistance = 376;
  const beyondThirdTierUnitDistance = 224;

/*    // Waiting time charge settings
  const waitingTimeChargePerPeriod = 0.50;
  const waitingTimePeriodInSeconds = 46; */

   // Start with the initial charge
  let totalCharge = initialChargeCost;

  if (distanceInMeters > initialChargeDistance) {
      if (distanceInMeters <= secondTierDistance) {
           // Second tier calculation for distances from 183m to 1597m
          const remainingDistance = distanceInMeters - initialChargeDistance;
          const additionalUnits = Math.ceil(remainingDistance / secondTierUnitDistance);
           totalCharge += additionalUnits * tierCostPerUnit;
      } else if (distanceInMeters <= thirdTierDistance) {
           // Third tier calculation for distances from 1597m to 3202m
          const distanceInSecondTier = secondTierDistance - initialChargeDistance;
          const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

          const remainingDistance = distanceInMeters - secondTierDistance;
          const additionalUnitsThirdTier = Math.ceil(remainingDistance / thirdTierUnitDistance);

           totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                       (additionalUnitsThirdTier * tierCostPerUnit);
      } else {
           // Beyond third tier for distances beyond 3202 meters
          const distanceInSecondTier = secondTierDistance - initialChargeDistance;
          const additionalUnitsSecondTier = Math.ceil(distanceInSecondTier / secondTierUnitDistance);

          const distanceInThirdTier = thirdTierDistance - secondTierDistance;
          const additionalUnitsThirdTier = Math.ceil(distanceInThirdTier / thirdTierUnitDistance);

          const remainingDistance = distanceInMeters - thirdTierDistance;
          const additionalUnitsBeyondThirdTier = Math.ceil(remainingDistance / beyondThirdTierUnitDistance);

           totalCharge += (additionalUnitsSecondTier * tierCostPerUnit) +
                       (additionalUnitsThirdTier * tierCostPerUnit) +
                       (additionalUnitsBeyondThirdTier * tierCostPerUnit);
      }
  }

   /* // Calculate waiting time charge based on 65-second intervals
   const totalWaitingPeriods = Math.ceil((durationInMinutes * 60) / waitingTimePeriodInSeconds);
   const waitingTimeCharge = totalWaitingPeriods * waitingTimeChargePerPeriod;
   totalCharge += waitingTimeCharge; */

  return totalCharge;
};

export default MapComponent;
