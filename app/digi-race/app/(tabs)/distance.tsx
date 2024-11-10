// taken from https://docs.expo.dev/versions/latest/sdk/location/
// also, react native/expo is evil.

import { useState, useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import * as Location from 'expo-location';

export default function App() {
    // all the state necessary
    const [location, setLocation] = useState<any | null>(null);
    const [distance, setDistance] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const [changed, setChanged] = useState(false);
    const [matchID, setMatchID] = useState(-1);
    const [userID, setUserID] = useState(-1);
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
        return Math.abs(d);
    }

    const registration = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
            // should do more than return
        }

        console.log("fetching...");
        const data = await fetch('http://192.168.151.25:12990/register', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        });

        const json = await data.json();
        console.log("Registered " + json["UserID"]);
        setUserID(json["UserID"]);
    }

    // poll for match assignment
    const matchPoll = async () => {
        console.log("polling...");
        if(matchID == -1 && userID != -1) {
            const data = await fetch('http://192.168.151.25:12990/request', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    UserID: userID
                }),
            });
            if(data.status == 400) {
                console.log("oops!");
                return;
            }
            const json = await data.json();
            console.log(json);

            if(json["message"] === "Match started") {
                setMatchID(json["MatchID"]);
                setSeeking(false);
            }
        }
    }

    // poll for location data from phone sensor
    const locationPoll = async () => {
        if(matchID != -1) {
            setSeconds(prevSeconds => {
                let retVal = prevSeconds + 1;
                if(retVal >= 50) {
                    setMatchID(-1);
                    setDistance(prevDist => {
                        submitDist(prevDist);
                        return 0;
                    });
                    retVal = 0;
                }
                return retVal;
            });

            let newLocation = await Location.getCurrentPositionAsync({timeInterval: 1000});
            let lat = newLocation["coords"]["latitude"];
            let long = newLocation["coords"]["longitude"];
            if(location != null) {
                setDistance(haversine(location["coords"]["latitude"], location["coords"]["longitude"], lat, long))
            }
            setLocation(newLocation);
            console.log("Recorded position data.");
        }
    }

    const submitDist = async (distance:number) => {
        const data = await fetch('http://192.168.151.25:12990/submit', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                UserID: userID,
                MatchID: matchID,
                dist: distance
            }),
        });
        if(data.status == 400) {
            console.log("oops!");
            return;
        }
        const json = await data.json();
        console.log(json);
    }

    // register phone with backend and set up timer
    useEffect(() => {
        registration();

        const timer = setInterval(() => {
            setChanged(prevChanged => !prevChanged);
        }, 1000);

        return () => {
            clearInterval(timer);
        }
    }, [])

    useEffect(() => {
        if(seeking) {
            matchPoll();
        }
        locationPoll();
    }, [changed]);

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
            <ThemedText style={styles.userID}>{(userID == -1 ? "Not registered" : "ID: " + userID)}</ThemedText>
            <ThemedText style={styles.paragraph}>{text}</ThemedText>
            <ThemedText style={styles.paragraph}>Latitude: {lat}</ThemedText>
            <ThemedText style={styles.paragraph}>Latitude: {long}</ThemedText>
            <ThemedText style={styles.paragraph}>Distance: {distance * 1000} m</ThemedText>
            <ThemedText style={styles.paragraph}>Seconds: {seconds}</ThemedText>
            <Pressable style={styles.button} onPress={() => {setSeeking(true);}}>
                <ThemedText style={styles.paragraph}>Join game</ThemedText>
            </Pressable>
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
  userID: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
  },
  button: {
    width: 150,
    height: 75,
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginTop: 50,
  }
});