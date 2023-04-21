const puppeteer = require('puppeteer');
const fs = require("fs");
require('dotenv').config();
const querystring = require('querystring');
const express = require('express');
const axios = require('axios');
const app = express();
const port = 8888;

const delay = ms => new Promise(res => setTimeout(res, ms))

const PLAYLIST_ID = process.env.PLAYLIST_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.get('/', (req, res) => {
  const data = {
    name: 'michael',
    isAwesome: true,
  };
  res.json(data);
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

const stateKey = 'spotify_auth_state';
  
app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    res.cookie(stateKey, state);
    const scope = 'user-read-private user-read-email playlist-modify-private playlist-modify-public';
    const queryParams = querystring.stringify({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      state: state,
      scope: scope,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', (req, res) => {
    const code = req.query.code || null;
        axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
            },
    })
        .then(response => {
            if (response.status === 200) {
                const { access_token , refresh_token} = response.data;
                res.json(response.data);
                fs.writeFileSync("tokens.txt", access_token, (err) => {
                    if (err) console.log(err);
                });
                fs.writeFileSync("refresh.txt", refresh_token, (err) => {
                if (err) console.log(err);
            });
            } else {
            res.send(response);
            }
        })
        .catch(error => {
            res.send(error);
        });
});

var server =  app.listen(port, () => {
  console.log(`Express app listening at http://localhost:${port}`);
  });

var handler = function() {
  server.close();
};

const refresh = async () => {
  let buffer = fs.readFileSync("refresh.txt");
  let ref_file_token = buffer.toString();
  refresh_token = ref_file_token;
      axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
        }),
        headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${new Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
    }).then(response => {
      if (response.status === 200) {
          let { access_token } = response.data;
          fs.writeFileSync("tokens.txt", access_token, (err) => {
              if (err) console.log(err);
          });
      } else {  
        console.log("Line 119: Refresh token request error!")
      }
    })  
};

const getTrackIds = async (ac_token) => {
  const test_array = [];
  const url = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`;
  const method = "GET"
    fetch(url, {
        method,
        headers: {
            "Authorization": `Bearer ${ac_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
            }
        }).then( response => response.json())
        .then(response => {
            totalSong = response.tracks.total;
            for(let i = 0; i < totalSong; i ++ ) {
                songId = JSON.stringify(response.tracks.items[i].track.id);
                songId = songId.split('"').join('');
                test_array.unshift(songId);
                };
            });
      return test_array
};

const scrape = async () => {
    // This is the area to be web scraped.
    // The value it will return after editing will be called in the main function.
    // Return value is Song - Artist complications.
};

const spoti_login = async () => {
    const url = `http://localhost:8888/login`
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto( url );
    await delay(20000);
    browser.close();
    return
};

async function main() {
  
    var outputs = "";
    var latestSong = "";
    // var counter = 0; // while counter if you need!
    var outputsSpotiId = "";
    let auth_token = "";
    let flag = true;
    let array = [];
    let removeSongId = "";

    await spoti_login();

    const buffer = fs.readFileSync("tokens.txt");
    const file_token = buffer.toString();
    auth_token = file_token;
    await delay(7000);
    array = await getTrackIds(auth_token);
    await delay(5000);
       
    while (flag) {
        
        await delay(600000);
        outputs = await scrape() 
        
        if(latestSong == outputs) {
            console.log("[-] song is still same :(")
        } else {
                console.log("[!] heyy!! song is changed")
                console.log("[-] last song = " + " " + latestSong)
                console.log("[+] new song = " + " " + outputs)
                fs.appendFileSync("outputs.txt", outputs + "\r\n" , (err) => {
                    if (err) console.log(err);
                    console.log(outputs);
                });

                let spotiUrl = `https://api.spotify.com/v1/search?q=${outputs}&type=track&limit=1`;
                let method = "GET";
  
                 try{
                  fetch(spotiUrl, {
                  method,
                  headers: {
                      "Authorization": `Bearer ${auth_token}`,
                      Accept: 'application/json',
                      'Content-Type': 'application/json'
                      }
                  }).then(response => response.json())
                  .then(async response => { 
                      try {                                      
                        outputsSpotiId = JSON.stringify(response.tracks.items[0].id);
                        outputsSpotiId = outputsSpotiId.split('"').join('');
                        array.push(outputsSpotiId);
                      } catch(err) {
                          console.log("Line 217: HTTP GET request error => " + "" + err)
                          if(err == {"error":{"status":401,"message":"The access token expired"}} || "TypeError: Cannot read properties of undefined (reading 'items')") {
                            await refresh();
                            await delay(5000);
                            const buffer = fs.readFileSync("tokens.txt");
                            const file_token = buffer.toString();
                            auth_token = file_token;
                            
                             fetch(spotiUrl, {
                                method,
                                headers: {
                                    "Authorization": `Bearer ${auth_token}`,
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json'
                                    }
                                }).then(response => response.json())
                                .then(response => {                                        
                                      outputsSpotiId = JSON.stringify(response.tracks.items[0].id);
                                      outputsSpotiId = outputsSpotiId.split('"').join('');
                                      array.push(outputsSpotiId);
                                    })     
                          } else {        
                          }
                        } finally {    
                        };
                       await delay(7000);
                      let spotiUrl = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`;
                      let method = "POST";
                      
                      fetch(spotiUrl, {
                      method,
                      headers: {
                          "Authorization": `Bearer ${auth_token}`,
                          Accept: 'application/json',
                          'Content-Type': 'application/json'
                          },
                      body: JSON.stringify({"uris": [`spotify:track:${outputsSpotiId}`],"position": 0})
                      }).then(response => response.json())
                      .then(response => console.log("added to playlist!! => " + "" + JSON.stringify(response)))
                  })
                } catch(err) {
                  console.log("Line 258: HTTP POST request error => " + "" + err);
               } finally {
                    removeSongId = array[0];
                    array.shift();
                    await delay(10000);
                
                let spotiUrl = `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`;
                let method = "DELETE";
 
                try {
                 fetch(spotiUrl, {
                     method,
                     headers: {
                         "Authorization": `Bearer ${auth_token}`,
                         Accept: 'application/json',
                         'Content-Type': 'application/json'
                         },
                     body: JSON.stringify({"uris": [`spotify:track:${removeSongId}`],"position": 99})
                     }).then(response => response.json())
                     .then(response => console.log("deleted from the playlist => " + "" + JSON.stringify(response)))   
                } catch(err){
                     console.log("Line 279: HTTP DELETE request error " + "" + err)
                } finally {
                };
               };
            latestSong = outputs
            // counter ++ // if you need counter -> you can go to line 167
            await delay(5000);
        };
    };
    handler();
    return;
};
main();