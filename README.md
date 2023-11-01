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

6.  Add your API key to the `.env` file in the following format:

   ```
   GOOGLE_API_KEY=your_api_key   
   ```

   

   Replace `your_api_key` with your actual Google Cloud Speech-to-Text API key. 3. Save and close the `.env` file.

   

7. Replace the contents of the `src/App.js` file with the following code. 

   ```
   import axios from 'axios';
   import React, { useState } from 'react';
   
   const App = () => {
     const [recording, setRecording] = useState(false);
     const [mediaRecorder, setMediaRecorder] = useState(null);
     const [transcription, setTranscription] = useState('');
   
     const startRecording = async () => {
       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       const recorder = new MediaRecorder(stream);
       recorder.start();
   
       recorder.addEventListener('dataavailable', async (event) => {
         const audioBlob = event.data;
         const audioUrl = URL.createObjectURL(audioBlob);
   
         if (!process.env.GOOGLE_API_KEY) {
           throw new Error("GOOGLE_API_KEY not found in the environment");
         }
         const apiKey = process.env.GOOGLE_API_KEY;
   
   
         try {
           const response = await axios.post(
             `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
             {
               config: {
                 encoding: 'LINEAR16',
                 sampleRateHertz: 16000,
                 languageCode: 'en-US',
               },
               audio: {
                 content: audioBlobToBase64(audioBlob),
               },
             }
           );
           setTranscription(response.data.results[0].alternatives[0].transcript);
         } catch (error) {
           console.error(error);
         }
       });
   
       setRecording(true);
       setMediaRecorder(recorder);
     };
   
     const stopRecording = () => {
       if (mediaRecorder) {
         mediaRecorder.stop();
         setRecording(false);
       }
     };
   
     const audioBlobToBase64 = (blob) => {
       return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
       });
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
   ```

   

8. Make sure to replace `YOUR_API_KEY` with your actual Google Cloud Speech-to-Text API key.

9. Save the changes to `src/App.js`.

10. Start the development server by running the following command in the terminal or command prompt:
   ```
   npm start
   ```

11. The application should automatically open in your default web browser. If it doesn't, open your browser and navigate to `http://localhost:3000`.

Now you should see the application running in your browser, with a button to start and stop recording and a section to display the transcribed text.