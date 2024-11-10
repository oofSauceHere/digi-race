// taken from https://docs.expo.dev/versions/latest/sdk/location/
// also, react native/expo is evil.

import { useState, useEffect } from 'react';
import { Platform, Text, View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import * as Location from 'expo-location';

export default function App() {
    // all the state necessary
    const [location, setLocation] = useState<any | null>(null);
    const [distance, setDistance] = useState(0);
    const [seconds, setSeconds] = useState(0);
    // const [start, setStart] = useState(false);
    const [on, setOn] = useState(false);
    const [id, setId] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<any | null>(null);

    // https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    function convToRad(deg: number) {
        return deg * (Math.PI/180);
    }

    // https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
    function haversine(lat1: number, long1: number, lat2:number, long2:number) {
        var R = 6371;
        var lat_diff = convToRad(lat2-lat1);
        var long_diff = convToRad(long2-long1); 
        var a = Math.sin(lat_diff/2) * Math.sin(lat_diff/2) + Math.cos(convToRad(lat1)) * Math.cos(convToRad(lat2)) * Math.sin(long_diff/2) * Math.sin(long_diff/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;
        return d;
    }

    // handles [primitive] user registration, continuous match/location polling
    useEffect(() => {
        // debugging purposes
        setOn(true);

        // gain location permissions + get asssigned user id
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
                // should do more than return
            }

            console.log("fetching...");
            const data = await fetch('http://localhost:12979/register/', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const json = await data.json();
            setId(json["UserID"]);
            console.log(id);
        })();

        // poll for match data
        const poll = setInterval(() => {
            (async () => {
                // setOn(true);
                if(id != null){
                    const data = await fetch('http://localhost:12979/request/', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            UserID: id
                        }),
                    });
                    const json = data.json();
                    console.log(JSON.stringify(json));
                }
            })();
        }, 1000);

        // poll for location data (latitude/longitude)
        const findLocation = setInterval(() => {
            (async () => {
                // request backend api and determine if in match
                if(on) {
                    let newLocation = await Location.getCurrentPositionAsync({timeInterval: 1000});
                    let lat = newLocation["coords"]["latitude"];
                    let long = newLocation["coords"]["longitude"];
                    if(location != null) {
                        setDistance(haversine(location["coords"]["latitude"], location["coords"]["longitude"], lat, long))
                    }
                    setLocation(newLocation);
                    setSeconds(prevSeconds => prevSeconds + 1);
                    console.log("Recorded position data.");

                    if(seconds == 100) {
                        setOn(false);
                        setSeconds(0);
                        console.log("Complete!");
                        // send request to backend
                    }
                }
            })();
        }, 1000);

        return () => {
            clearInterval(poll);
            clearInterval(findLocation);
        }
    }, []);

    let text = 'Waiting...';
    let lat = '...';
    let long = '...';
    if (errorMsg) {
        text = errorMsg;
    } else if (location) {
        text = 'Ready!';
        lat = location["coords"]["latitude"];
        long = location["coords"]["longitude"];
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText style={styles.paragraph}>{text}</ThemedText>
            <ThemedText style={styles.paragraph}>Latitude: {lat}</ThemedText>
            <ThemedText style={styles.paragraph}>Latitude: {long}</ThemedText>
            <ThemedText style={styles.paragraph}>Distance: {distance}</ThemedText>
            <ThemedText style={styles.paragraph}>Seconds: {seconds}</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
  },
});