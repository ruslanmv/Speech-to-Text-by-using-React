# How to run speech to text application in React by using Google Cloud.

To run  React application in your web browser, follow these steps:

1. Make sure you have Node.js installed on your computer. If you don't, download and install it from the [official Node.js website](https://nodejs.org/).

2. Open a terminal or command prompt.

3. Execute the following commands to create a new React application and navigate to the project folder:
   ```
   npx create-react-app speech-to-text
   cd speech-to-text
   ```

4. Install Axios by running the following command:
   ```
   npm install axios
   ```

5. To read the API key from a `.env` file,  in the root directory of your project (where `package.json` is located), create a new file named `.env`.

6. Add your API key to the `.env` file in the following format:

   ```
   REACT_APP_GOOGLE_API_KEY=your_api_key   
   ```

   

   Replace `your_api_key` with your actual Google Cloud Speech-to-Text API key. 3. Save and close the `.env` file.

   

7. Replace the contents of the `src/App.js` file with the following code:

   

   ```javascript
   import axios from 'axios';
   import React, { useState, useEffect } from 'react';
   
   // Function to convert audio blob to base64 encoded string
   const audioBlobToBase64 = (blob) => {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onloadend = () => {
         const arrayBuffer = reader.result;
         const base64Audio = btoa(
           new Uint8Array(arrayBuffer).reduce(
             (data, byte) => data + String.fromCharCode(byte),
             ''
           )
         );
         resolve(base64Audio);
       };
       reader.onerror = reject;
       reader.readAsArrayBuffer(blob);
     });
   };
   
   const App = () => {
     const [recording, setRecording] = useState(false);
     const [mediaRecorder, setMediaRecorder] = useState(null);
     const [transcription, setTranscription] = useState('');
   
     // Cleanup function to stop recording and release media resources
     useEffect(() => {
       return () => {
         if (mediaRecorder) {
           mediaRecorder.stream.getTracks().forEach(track => track.stop());
         }
       };
     }, [mediaRecorder]);
   
     if (!process.env.REACT_APP_GOOGLE_API_KEY) {
       throw new Error("REACT_APP_GOOGLE_API_KEY not found in the environment");
     }
   
     const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
     console.log("apiKey loaded successfully:", apiKey);
   
     const startRecording = async () => {
       try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const recorder = new MediaRecorder(stream);
         recorder.start();
         console.log('Recording started');
   
         // Event listener to handle data availability
         recorder.addEventListener('dataavailable', async (event) => {
           console.log('Data available event triggered');
           const audioBlob = event.data;
           const base64Audio = await audioBlobToBase64(audioBlob);
           console.log('Base64 audio:', base64Audio);
   
           try {
             const startTime = performance.now();
   
             const response = await axios.post(
               `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
               {
                 config: {
                   encoding: 'LINEAR16',
                   sampleRateHertz: 48000,
                   languageCode: 'en-US',
                 },
                 audio: {
                   content: base64Audio,
                 },
               }
             );
   
             const endTime = performance.now();
             const elapsedTime = endTime - startTime;
   
             console.log('API response:', response);
             console.log('Time taken (ms):', elapsedTime);
             console.log('Response object properties:', response.data);
   
             if (response.data.results && response.data.results.length > 0) {
               setTranscription(response.data.results[0].alternatives[0].transcript);
             } else {
               console.log('No transcription results in the API response:', response.data);
               setTranscription('No transcription available');
             }
           } catch (error) {
             console.error('Error with Google Speech-to-Text API:', error.response.data);
           }
         });
   
         setRecording(true);
         setMediaRecorder(recorder);
       } catch (error) {
         console.error('Error getting user media:', error);
       }
     };
   
     const stopRecording = () => {
       if (mediaRecorder) {
         mediaRecorder.stop();
         console.log('Recording stopped');
         setRecording(false);
       }
     };
   
     return (
       <div>
         <h1>Speech to Text</h1>
         {!recording ? (
           <button onClick={startRecording}>Start Recording</button>
         ) : (
           <button onClick={stopRecording}>Stop Recording</button>
         )}
         <p>Transcription: {transcription}</p>
       </div>
     );
   };
   
   export default App;



The provided code snippet is part of a React application that allows users to start and stop voice recording. When the "Start Recording" button is clicked, the code initiates the recording process by calling the "startRecording" function. 

It requests permission from the user to access the audio device using "navigator.mediaDevices.getUserMedia". Inside the function, a MediaRecorder object is created, which captures the audio stream from the microphone. 

The recording starts, and an event listener is added to handle "dataavailable" events. These events are triggered whenever there is new audio data available from the microphone. 

When a "dataavailable" event occurs, the code converts the captured audio data into a "base64" encoded string and sends it to the Google Speech-to-Text API using the "axios" library. The API request includes audio content, language configuration, and an API key.

 The response from the API is received, and the transcription results are processed. If the API returns a transcription, it is displayed on the screen using a "p" element. 

The recording stops when the "Stop Recording" button is clicked. In the code, the "setRecording" and "setMediaRecorder" states are used to track the recording state. The transcription state is also stored in the "transcription" state variable. Overall, this code provides a simple interface for voice recording, sends the audio data to the Google Speech-to-Text API, and displays the resulting transcription on the screen



8. Make sure to replace `YOUR_API_KEY` with your actual Google Cloud Speech-to-Text API key.

9. Save the changes to `src/App.js`.

10. Start the development server by running the following command in the terminal or command prompt:

   ```
   npm start
   ```
11. The application should automatically open in your default web browser. If it doesn't, open your browser and navigate to `http://localhost:3000`.

Now you should see the application running in your browser, with a button to start and stop recording and a section to display the transcribed text.

