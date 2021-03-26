# Creative Design Project Coursework

[[_TOC_]]

## Music Database Application:
This project aimed to build a web-based database application which creates playlists of songs that can be created by searching or selecting themes based on a rating system. 


## Group 3
* Melanie Lucas
* Shariq Farooqui
* Liam Horrobin
* Bo Han Jhan
* Elijah Dare


## Installation
1. Clone this repository.
2. Create a `.env` file with the following key-value pairs:
   
    |Key| Instructions for Value|
    |---|-----------------------|
    |DB_CONNECT | Connection string from your MongoDB Cluster|
    |TOKEN_SECRET| Any random string of characters.|
    |SESSION_SECRET|Any random string of characters.|
    |GRID_USER| SendGrid account username|
    |GRID_PASS| SendGrid account password|
    |SENDGRID_API_KEY| SendGrid API Key received at time of app registration|
    |SPOTIFY_CLLIENT_ID| ID received when registering app on Spotify Developers account|
    |SPOTIFY_CLLIENT_SECRET| Secret received when registering app on Spotify Developers account|

3. Store the `.env` file in the root project folder.
4. On your terminal, navigate to project folder and run the following command:
    ```
    npm install 
    ```

## Usage
- ### Locally
    1. On your terminal, navigate to project folder and run the following command:
    ```
    npm start
    ```
    2. On your browser, go to: `localhost:3000`

- ### Online
    1. On your browser, go to our application's [website](http://f28cd-group3.herokuapp.com/).


## Known Issues
- Some adblocks prevent button clicks (e.g. _Sign Up_ button on Registration page). Disabling them fixes this issue.
- User might not be able to play some of the song demos in our application. The Spotify player will tell user the track is not available in their country _**even if it is actually available**_. User could open the same track on the Spotify Web Player, Desktop or mobile app and it will run just fine. Sometimes this error will not show up and the Play button will not respond. _**However**_, in both cases, the error ocasionally dissappears after sometime and the same unavailable track can be played. And then the error comes back again. Fixing this issue is out of scope for this project.
